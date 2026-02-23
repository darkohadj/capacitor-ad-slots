import type { AdSlotConfig, SlotRegistry } from './types';

const registry: SlotRegistry = {};

/**
 * Define one or more ad slots. Call this at app startup (e.g. in main.ts).
 *
 * @example
 * ```ts
 * defineSlots({
 *   'game-banner-bottom': {
 *     type: 'banner',
 *     adId: 'ca-app-pub-xxx/yyy',
 *     position: 'bottom',
 *     size: 'adaptive',
 *   },
 *   'win-interstitial': {
 *     type: 'interstitial',
 *     adId: 'ca-app-pub-xxx/zzz',
 *   },
 * });
 * ```
 */
export function defineSlots(slots: SlotRegistry): void {
  for (const [id, config] of Object.entries(slots)) {
    registry[id] = config;
  }
}

/**
 * Define a single ad slot
 */
export function defineSlot(id: string, config: AdSlotConfig): void {
  registry[id] = config;
}

/**
 * Get a slot's configuration. Returns undefined if not defined.
 */
export function getSlot(id: string): AdSlotConfig | undefined {
  return registry[id];
}

/**
 * Get all registered slot IDs
 */
export function getSlotIds(): string[] {
  return Object.keys(registry);
}

/**
 * Check if a slot is registered
 */
export function hasSlot(id: string): boolean {
  return id in registry;
}
