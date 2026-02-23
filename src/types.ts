/**
 * Slot types supported by capacitor-ad-slots
 */
export type AdSlotType = 'banner' | 'interstitial' | 'rewarded';

/**
 * Banner position
 */
export type BannerPosition = 'top' | 'bottom';

/**
 * Banner size preset
 */
export type BannerSize =
  | 'adaptive'
  | 'banner'
  | 'full_banner'
  | 'large_banner'
  | 'leaderboard'
  | 'medium_rectangle'
  | 'smart';

/**
 * Configuration for a banner slot
 */
export interface BannerSlotConfig {
  type: 'banner';
  adId: string;
  position?: BannerPosition;
  size?: BannerSize;
  margin?: number;
  /** Use test ads for this slot (overrides global) */
  isTesting?: boolean;
}

/**
 * Configuration for an interstitial slot
 */
export interface InterstitialSlotConfig {
  type: 'interstitial';
  adId: string;
  /** Use test ads for this slot (overrides global) */
  isTesting?: boolean;
}

/**
 * Configuration for a rewarded slot
 */
export interface RewardedSlotConfig {
  type: 'rewarded';
  adId: string;
  /** Use test ads for this slot (overrides global) */
  isTesting?: boolean;
}

/**
 * Union of all slot configurations
 */
export type AdSlotConfig =
  | BannerSlotConfig
  | InterstitialSlotConfig
  | RewardedSlotConfig;

/**
 * Registry of slot IDs to their configurations
 */
export type SlotRegistry = Record<string, AdSlotConfig>;

/**
 * Options for initializing the ad service
 */
export interface AdSlotsInitOptions {
  /** Test device IDs for receiving test ads */
  testingDevices?: string[];
  /** Enable test mode (uses testingDevices) */
  initializeForTesting?: boolean;
  /** UMP consent - debug geography for testing */
  consentDebugGeography?: 'EEA' | 'NOT_EEA' | 'DISABLED';
  /** UMP consent - test device identifiers */
  consentTestDevices?: string[];
  /** Global test mode - overrides slot-level isTesting when true */
  isTesting?: boolean;
}
