import { createContext } from 'react';
import type {
	HextimatePaletteBuilder,
	HextimateResult,
} from '../HextimatePaletteBuilder';
import type { HextimatePreset } from '../presets/types';
import type { HextimateGenerationOptions } from '../types';
import type { ModePreference, ResolvedMode } from './types';

export interface HextimatorContextValue {
	color: string;
	setColor: (color: string) => void;
	mode: ResolvedMode;
	modePreference: ModePreference;
	setMode: (mode: ModePreference) => void;
	generation: HextimateGenerationOptions | undefined;
	setGeneration: (opts: HextimateGenerationOptions | undefined) => void;
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
