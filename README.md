# capacitor-ad-slots

Slot-based AdMob for Capacitor apps — **define ad slots once, trigger programmatically anywhere**.

Instead of hardcoding ad unit IDs and positions throughout your app, define named slots in one place and trigger them by ID. Works with Vue, React, or vanilla JS.

## Installation

```bash
npm install capacitor-ad-slots @capacitor-community/admob @capacitor/core
# or
pnpm add capacitor-ad-slots @capacitor-community/admob @capacitor/core
```

**Requirements:** Capacitor 5+, @capacitor-community/admob 5+, and native Android/iOS (ads only run on native, not web).

## Quick Start

### 1. Define slots at app startup

In your main entry (e.g. `main.ts`):

```ts
import { defineSlots } from 'capacitor-ad-slots';

defineSlots({
  // Banner at bottom of game screen
  'game-banner-bottom': {
    type: 'banner',
    adId: 'ca-app-pub-XXXXX/YYYYY',
    position: 'bottom',
    size: 'adaptive',
  },
  // Interstitial after win
  'win-interstitial': {
    type: 'interstitial',
    adId: 'ca-app-pub-XXXXX/ZZZZZ',
  },
  // Rewarded ad for hints
  'hint-rewarded': {
    type: 'rewarded',
    adId: 'ca-app-pub-XXXXX/AAAAA',
  },
});
```

### 2. Initialize (with UMP consent)

```ts
import { initialize } from 'capacitor-ad-slots';

await initialize({
  testingDevices: ['YOUR_DEVICE_ID'],
  consentDebugGeography: 'NOT_EEA',
});
```

### 3. Trigger ads programmatically

**Vue (composable):**

```vue
<script setup>
import { useAdSlots } from 'capacitor-ad-slots/vue';

const ads = useAdSlots();

onMounted(() => {
  if (ads.shouldShowAds()) ads.show('game-banner-bottom');
});
onUnmounted(() => {
  ads.hide('game-banner-bottom');
});

function onWin() {
  ads.trigger('win-interstitial');
}
</script>
```

**Vanilla / framework-agnostic:**

```ts
import { show, hide, trigger, shouldShowAds } from 'capacitor-ad-slots';

if (shouldShowAds()) show('game-banner-bottom');
// later
hide('game-banner-bottom');
trigger('win-interstitial');
```

## Slot Types

| Type | Config | Methods |
|------|--------|---------|
| `banner` | `adId`, `position?` ('top'\|'bottom'), `size?`, `margin?` | `show()`, `hide()`, `remove()` |
| `interstitial` | `adId` | `trigger()` |
| `rewarded` | `adId` | `triggerRewarded()` → `Promise<{ amount, type } \| null>` |

## API Reference

### Slot definition

- **`defineSlots(slots)`** — Define multiple slots
- **`defineSlot(id, config)`** — Define a single slot
- **`getSlot(id)`** — Get slot config
- **`hasSlot(id)`** — Check if slot exists

### Core methods

- **`initialize(options?)`** — Init AdMob + UMP consent
- **`show(slotId, globalTesting?)`** — Show banner slot
- **`hide(slotId)`** — Hide banner
- **`remove(slotId)`** — Remove banner from DOM
- **`trigger(slotId, globalTesting?)`** — Show interstitial or rewarded (one-shot)
- **`triggerRewarded(slotId, globalTesting?)`** — Show rewarded, returns reward
- **`prepareInterstitialSlot(slotId)`** — Pre-load interstitial
- **`setAdsRemoved(removed)`** — Disable ads (e.g. after IAP)
- **`shouldShowAds()`** — Check if ads are enabled

### Reactive state (Vue / @vue/reactivity)

- **`isInitialized`** — AdMob ready
- **`adsRemoved`** — User purchased ad removal
- **`currentBannerSlot`** — Currently shown banner slot ID or `null`

## Init options

```ts
interface AdSlotsInitOptions {
  testingDevices?: string[];
  initializeForTesting?: boolean;
  consentDebugGeography?: 'EEA' | 'NOT_EEA' | 'DISABLED';
  consentTestDevices?: string[];
  isTesting?: boolean;  // Global test mode for all slots
}
```

## Publishing to npm

1. Update `package.json` with your name, repository, etc.
2. `npm login`
3. `npm publish` (or `pnpm publish`)

For scoped packages: `npm publish --access public`
