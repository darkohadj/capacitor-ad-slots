import { ref } from '@vue/reactivity';
import type { AdSlotsInitOptions, BannerSize, BannerPosition } from './types';
import { getSlot, hasSlot } from './slot-registry';
import type { BannerSlotConfig, InterstitialSlotConfig, RewardedSlotConfig } from './types';

// Lazy imports to avoid loading AdMob when not on native
let AdMob: typeof import('@capacitor-community/admob').AdMob;
let BannerAdSize: typeof import('@capacitor-community/admob').BannerAdSize;
let BannerAdPosition: typeof import('@capacitor-community/admob').BannerAdPosition;
let AdmobConsentStatus: typeof import('@capacitor-community/admob').AdmobConsentStatus;
let AdmobConsentDebugGeography: typeof import('@capacitor-community/admob').AdmobConsentDebugGeography;
let BannerAdPluginEvents: typeof import('@capacitor-community/admob').BannerAdPluginEvents;
let InterstitialAdPluginEvents: typeof import('@capacitor-community/admob').InterstitialAdPluginEvents;

async function loadAdMob() {
  if (AdMob) return;
  const admob = await import('@capacitor-community/admob');
  AdMob = admob.AdMob;
  BannerAdSize = admob.BannerAdSize;
  BannerAdPosition = admob.BannerAdPosition;
  AdmobConsentStatus = admob.AdmobConsentStatus;
  AdmobConsentDebugGeography = admob.AdmobConsentDebugGeography;
  BannerAdPluginEvents = admob.BannerAdPluginEvents;
  InterstitialAdPluginEvents = admob.InterstitialAdPluginEvents;
}

/**
 * Maps our BannerSize keys to AdMob BannerAdSize enum values.
 *
 * @see https://developers.google.com/admob/android/banner#banner_sizes
 * @see https://developers.google.com/admob/ios/banner#banner_sizes
 */
const BANNER_SIZE_MAP: Record<BannerSize, keyof typeof import('@capacitor-community/admob').BannerAdSize> = {
  /** Full-width, auto height. Recommended for mobile. */
  adaptive: 'ADAPTIVE_BANNER',
  /** 320×50 dp – Standard mobile banner (MMA). */
  banner: 'BANNER',
  /** 468×60 dp – IAB full banner. Use on tablets. */
  full_banner: 'FULL_BANNER',
  /** 320×100 dp – Large mobile banner. */
  large_banner: 'LARGE_BANNER',
  /** 728×90 dp – IAB leaderboard. Use on tablets. */
  leaderboard: 'LEADERBOARD',
  /** 300×250 dp – IAB medium rectangle. */
  medium_rectangle: 'MEDIUM_RECTANGLE',
  /** @deprecated Screen width × 32|50|90. Use `adaptive` instead. */
  smart: 'SMART_BANNER',
};

function toBannerAdSize(size: BannerSize = 'adaptive') {
  const key = BANNER_SIZE_MAP[size] ?? 'ADAPTIVE_BANNER';
  return BannerAdSize[key] ?? BannerAdSize.ADAPTIVE_BANNER;
}

function toBannerAdPosition(position: BannerPosition) {
  return position === 'top'
    ? BannerAdPosition.TOP_CENTER
    : BannerAdPosition.BOTTOM_CENTER;
}

// Reactive state - works with Vue and other @vue/reactivity consumers
export const isInitialized = ref(false);
export const adsRemoved = ref(false);
export const currentBannerSlot = ref<string | null>(null);

async function isNative(): Promise<boolean> {
  const { Capacitor } = await import('@capacitor/core');
  return Capacitor.isNativePlatform();
}

export async function initialize(options: AdSlotsInitOptions = {}): Promise<void> {
  if (!(await isNative())) return;

  await loadAdMob();

  try {
    await AdMob!.initialize({
      testingDevices: options.testingDevices,
      initializeForTesting: options.initializeForTesting ?? (options.testingDevices?.length ? true : false),
    });

    // UMP Consent flow
    try {
      const consentOptions: Record<string, unknown> = {
        debugGeography: options.consentDebugGeography === 'EEA'
          ? AdmobConsentDebugGeography.EEA
          : options.consentDebugGeography === 'DISABLED'
            ? AdmobConsentDebugGeography.DISABLED
            : AdmobConsentDebugGeography.NOT_EEA,
      };
      if (options.consentTestDevices?.length) {
        consentOptions.testDeviceIdentifiers = options.consentTestDevices;
      }
      const consentInfo = await AdMob!.requestConsentInfo(consentOptions);
      if (
        consentInfo.isConsentFormAvailable &&
        (consentInfo.status === AdmobConsentStatus.REQUIRED || consentInfo.status === AdmobConsentStatus.UNKNOWN)
      ) {
        await AdMob!.showConsentForm();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('no form(s) configured') && !msg.includes('misconfiguration')) {
        console.warn('[capacitor-ad-slots] Consent flow:', e);
      }
    }

    AdMob!.addListener(BannerAdPluginEvents!.FailedToLoad, (err: { code?: number; message?: string }) => {
      console.error('[capacitor-ad-slots] Banner failed:', err?.code, err?.message);
    });
    AdMob!.addListener(InterstitialAdPluginEvents!.FailedToLoad, (err: { code?: number; message?: string }) => {
      console.error('[capacitor-ad-slots] Interstitial failed:', err?.code, err?.message);
    });

    isInitialized.value = true;
  } catch (error) {
    console.error('[capacitor-ad-slots] Initialize failed:', error);
  }
}

export function setAdsRemoved(removed: boolean): void {
  adsRemoved.value = removed;
  if (removed && currentBannerSlot.value) {
    hide(currentBannerSlot.value);
  }
}

export function shouldShowAds(): boolean {
  return isInitialized.value && !adsRemoved.value;
}

function resolveTesting(slot: { isTesting?: boolean }, globalTesting?: boolean): boolean {
  if (globalTesting !== undefined) return globalTesting;
  return slot.isTesting ?? false;
}

export async function show(slotId: string, globalTesting?: boolean): Promise<void> {
  if (!isInitialized.value || adsRemoved.value || !(await isNative())) return;
  if (!hasSlot(slotId)) {
    console.warn(`[capacitor-ad-slots] Unknown slot: ${slotId}`);
    return;
  }

  const slot = getSlot(slotId)!;

  if (slot.type === 'banner') {
    await loadAdMob();
    const cfg = slot as BannerSlotConfig;
    const position = cfg.position ?? 'bottom';
    const size = cfg.size ?? 'adaptive';
    const isTesting = resolveTesting(cfg, globalTesting);

    try {
      if (currentBannerSlot.value && currentBannerSlot.value !== slotId) {
        await AdMob!.hideBanner();
      }
      await AdMob!.showBanner({
        adId: cfg.adId,
        adSize: toBannerAdSize(size),
        position: toBannerAdPosition(position),
        margin: cfg.margin ?? 0,
        isTesting,
      });
      currentBannerSlot.value = slotId;
    } catch (e) {
      console.error(`[capacitor-ad-slots] Failed to show banner ${slotId}:`, e);
    }
  } else if (slot.type === 'interstitial') {
    await triggerInterstitial(slotId, globalTesting);
  } else if (slot.type === 'rewarded') {
    await triggerRewarded(slotId, globalTesting);
  }
}

export async function hide(slotId: string): Promise<void> {
  if (!(await isNative())) return;
  if (currentBannerSlot.value !== slotId) return;

  await loadAdMob();
  try {
    await AdMob!.hideBanner();
    currentBannerSlot.value = null;
  } catch (e) {
    console.error(`[capacitor-ad-slots] Failed to hide banner ${slotId}:`, e);
  }
}

export async function remove(slotId: string): Promise<void> {
  if (!(await isNative())) return;
  if (currentBannerSlot.value !== slotId) return;

  await loadAdMob();
  try {
    await AdMob!.removeBanner();
    currentBannerSlot.value = null;
  } catch (e) {
    console.error(`[capacitor-ad-slots] Failed to remove banner ${slotId}:`, e);
  }
}

export async function trigger(slotId: string, globalTesting?: boolean): Promise<void> {
  if (!isInitialized.value || adsRemoved.value || !(await isNative())) return;
  if (!hasSlot(slotId)) {
    console.warn(`[capacitor-ad-slots] Unknown slot: ${slotId}`);
    return;
  }

  const slot = getSlot(slotId)!;
  if (slot.type === 'interstitial') {
    await triggerInterstitial(slotId, globalTesting);
  } else if (slot.type === 'rewarded') {
    await triggerRewarded(slotId, globalTesting);
  } else {
    console.warn(`[capacitor-ad-slots] trigger() is for interstitial/rewarded. Use show() for banners: ${slotId}`);
  }
}

async function triggerInterstitial(slotId: string, globalTesting?: boolean): Promise<void> {
  const slot = getSlot(slotId) as InterstitialSlotConfig | undefined;
  if (!slot || slot.type !== 'interstitial') return;

  await loadAdMob();
  const isTesting = resolveTesting(slot, globalTesting);

  try {
    await AdMob!.prepareInterstitial({ adId: slot.adId, isTesting });
    await AdMob!.showInterstitial();
    // Pre-load next
    setTimeout(() => prepareInterstitial(slotId, globalTesting), 1000);
  } catch (e) {
    console.error(`[capacitor-ad-slots] Failed to show interstitial ${slotId}:`, e);
  }
}

async function prepareInterstitial(slotId: string, globalTesting?: boolean): Promise<void> {
  if (!isInitialized.value || adsRemoved.value || !(await isNative())) return;
  const slot = getSlot(slotId) as InterstitialSlotConfig | undefined;
  if (!slot || slot.type !== 'interstitial') return;

  await loadAdMob();
  const isTesting = resolveTesting(slot, globalTesting);
  try {
    await AdMob!.prepareInterstitial({ adId: slot.adId, isTesting });
  } catch {
    // Ignore - will retry on next trigger
  }
}

export async function triggerRewarded(
  slotId: string,
  globalTesting?: boolean
): Promise<{ amount: number; type: string } | null> {
  if (!isInitialized.value || adsRemoved.value || !(await isNative())) return null;
  const slot = getSlot(slotId) as RewardedSlotConfig | undefined;
  if (!slot || slot.type !== 'rewarded') return null;

  await loadAdMob();
  const isTesting = resolveTesting(slot, globalTesting);

  try {
    await AdMob!.prepareRewardVideoAd({ adId: slot.adId, isTesting });
    const reward = await AdMob!.showRewardVideoAd();
    return { amount: reward.amount, type: reward.type };
  } catch (e) {
    console.error(`[capacitor-ad-slots] Failed to show rewarded ${slotId}:`, e);
    return null;
  }
}

export async function prepareInterstitialSlot(slotId: string, globalTesting?: boolean): Promise<void> {
  await prepareInterstitial(slotId, globalTesting);
}
