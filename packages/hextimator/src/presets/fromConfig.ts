import { hextimate } from '../hextimate';
import type { ColorInput } from '../types';
import type { HextimatePreset } from './types';

/**
 * Accent color plus optional presets - plain, serializable theme input.
 *
 * Shared vocabulary between app code and tooling: the same object an app runs
 * is the object a design-tool plugin runs.
 *
 * @deprecated Store a `ThemeDefinition` and call `hextimate(color, theme)`.
 * See the {@link https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md#014x--0150-themes | Migration guide}.
 */
export type HextimateConfig = {
	color: ColorInput;
	presets?: HextimatePreset[];
};

/**
 * Apply a {@link HextimateConfig}: `hextimate(color)` then each preset in order.
 *
 * @deprecated Use `hextimate(color, theme)` with a `ThemeDefinition`.
 * See the {@link https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md#014x--0150-themes | Migration guide}.
 */
export function fromConfig(c: HextimateConfig) {
	let b = hextimate(c.color);
	for (const p of c.presets ?? []) b = b.preset(p);
	return b;
}
