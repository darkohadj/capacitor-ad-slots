/**
 * capacitor-ad-slots
 * Slot-based AdMob for Capacitor apps — define ad slots once, trigger programmatically anywhere
 */

export {
  defineSlots,
  defineSlot,
  getSlot,
  getSlotIds,
  hasSlot,
} from './slot-registry';

export {
  initialize,
  setAdsRemoved,
  shouldShowAds,
  show,
  hide,
  remove,
  trigger,
  triggerRewarded,
  prepareInterstitialSlot,
  isInitialized,
  adsRemoved,
  currentBannerSlot,
} from './ad-service';

export type {
  AdSlotType,
  BannerPosition,
  BannerSize,
  BannerSlotConfig,
  InterstitialSlotConfig,
  RewardedSlotConfig,
  AdSlotConfig,
  SlotRegistry,
  AdSlotsInitOptions,
} from './types';
