import { createContext } from 'react';
import type {
	HextimatePaletteBuilder,
	HextimateResult,
} from '../HextimatePaletteBuilder';
import type { HextimatePreset } from '../presets/types';
import type { HextimateStyleOptions } from '../types';
import type { ModePreference, ResolvedMode } from './types';

export interface HextimatorContextValue {
	/** The color active for the resolved mode. Equal to `lightColor` in light mode, `darkColor` in dark mode. */
	color: string;
	/** Sets both `lightColor` and `darkColor` at once. Matches the "one color in → whole theme out" model. */
	setColor: (color: string) => void;
	/** The color used to generate the light-mode palette. */
	lightColor: string;
	setLightColor: (color: string) => void;
	/** The color used to generate the dark-mode palette. */
	darkColor: string;
	setDarkColor: (color: string) => void;
	mode: ResolvedMode;
	modePreference: ModePreference;
	setMode: (mode: ModePreference) => void;
	style: HextimateStyleOptions | undefined;
	setStyle: (opts: HextimateStyleOptions | undefined) => void;
	presets: HextimatePreset[] | undefined;
	setPresets: (presets: HextimatePreset[] | undefined) => void;
	configure: ((builder: HextimatePaletteBuilder) => void) | undefined;
	setConfigure: (
		fn: ((builder: HextimatePaletteBuilder) => void) | undefined,
	) => void;
	palette: HextimateResult;
	/**
	 * The palette builder backing this provider or scope. Nested
	 * `HextimatorScope`s fork from this builder so they inherit any custom
	 * roles, variants, tokens, or presets without re-declaring them.
	 */
	builder: HextimatePaletteBuilder;
}

export const HextimatorContext = createContext<HextimatorContextValue | null>(
	null,
);
