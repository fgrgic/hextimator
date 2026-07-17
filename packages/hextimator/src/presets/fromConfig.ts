import { hextimate } from '../hextimate';
import type { ColorInput } from '../types';
import type { HextimatePreset } from './types';

/**
 * Accent color plus optional presets - plain, serializable theme input.
 *
 * Shared vocabulary between app code and tooling: the same object an app runs
 * is the object a design-tool plugin runs.
 */
export type HextimateConfig = {
	color: ColorInput;
	presets?: HextimatePreset[];
};

/** Apply a {@link HextimateConfig}: `hextimate(color)` then each preset in order. */
export function fromConfig(c: HextimateConfig) {
	let b = hextimate(c.color);
	for (const p of c.presets ?? []) b = b.preset(p);
	return b;
}
