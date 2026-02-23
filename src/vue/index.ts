/**
 * Vue composable for capacitor-ad-slots
 */
import { computed } from '@vue/reactivity';
import {
  initialize as initAdSlots,
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
} from '../ad-service';

/**
 * Vue composable for ad slots. Use in any component after slots are defined.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useAdSlots } from 'capacitor-ad-slots/vue';
 *
 * const ads = useAdSlots();
 *
 * // Show banner when component mounts
 * onMounted(() => {
 *   ads.show('game-banner-bottom');
 * });
 * onUnmounted(() => {
 *   ads.hide('game-banner-bottom');
 * });
 *
 * // Trigger interstitial
 * function onWin() {
 *   ads.trigger('win-interstitial');
 * }
 * </script>
 * ```
 */
export function useAdSlots() {
  const bannerVisible = computed(() => currentBannerSlot.value !== null);

  const isSlotVisible = (slotId: string) =>
    computed(() => currentBannerSlot.value === slotId);

  return {
    // State
    isInitialized,
    adsRemoved,
    currentBannerSlot,
    bannerVisible,

    // Methods
    initialize: initAdSlots,
    setAdsRemoved,
    shouldShowAds,
    show,
    hide,
    remove,
    trigger,
    triggerRewarded,
    prepareInterstitialSlot,

    // Helpers
    isSlotVisible,
  };
}
