import { createContext } from 'react';
import type { FlatTokenMap } from '../format';
import type {
	HextimatePaletteBuilder,
	HextimateResult,
} from '../HextimatePaletteBuilder';
import type { HextimatePreset } from '../presets/types';
import type { HextimateStyleOptions } from '../types';
import type { ModePreference, ResolvedMode } from './types';

export interface HextimatorContextValue {
	/** Active brand color for the current mode. */
	color: string;
	/** Set the brand color for both modes at once. */
	setColor: (color: string) => void;
	/** Brand color used in light mode. */
	lightColor: string;
	setLightColor: (color: string) => void;
	/** Brand color used in dark mode. */
	darkColor: string;
	setDarkColor: (color: string) => void;
	/** Resolved mode (`'light'` or `'dark'`). */
	mode: ResolvedMode;
	/** Raw preference (`'light'`, `'dark'`, or `'system'`). */
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
	/** Generated `{ light, dark }` palette as flat token maps (e.g. `{ surface: '#...', 'surface-strong': '#...' }`). */
	palette: HextimateResult<FlatTokenMap>;
	/** Underlying palette builder. Nested scopes fork from it. */
	builder: HextimatePaletteBuilder;
}

export const HextimatorContext = createContext<HextimatorContextValue | null>(
	null,
);
