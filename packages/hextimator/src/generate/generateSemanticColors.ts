import { convert } from '../convert';
import { parse } from '../parse';
import type { Color } from '../types';
import type { GenerateOptions, HextimatePalette, ThemeType } from './types';
import { expandColorToScale } from './utils';

const POSITIVE_RANGE: [number, number] = [120, 160]; // green range in hue values
const NEGATIVE_RANGE: [number, number] = [5, 30]; // red range in hue values
const WARNING_RANGE: [number, number] = [45, 70]; // yellow/amber range in hue values

export function generateSemanticColors(
	color: Color,
	themeType: ThemeType,
	options?: GenerateOptions,
): Pick<HextimatePalette, 'positive' | 'negative' | 'warning'> {
	const themeAdj = themeType === 'light' ? options?.light : options?.dark;

	const semanticColors = {
		positive:
			themeAdj?.semanticColors?.positive ?? options?.semanticColors?.positive,
		negative:
			themeAdj?.semanticColors?.negative ?? options?.semanticColors?.negative,
		warning:
			themeAdj?.semanticColors?.warning ?? options?.semanticColors?.warning,
	};

	const semanticColorRanges = {
		positive:
			themeAdj?.semanticColorRanges?.positive ??
			options?.semanticColorRanges?.positive ??
			POSITIVE_RANGE,
		negative:
			themeAdj?.semanticColorRanges?.negative ??
			options?.semanticColorRanges?.negative ??
			NEGATIVE_RANGE,
		warning:
			themeAdj?.semanticColorRanges?.warning ??
			options?.semanticColorRanges?.warning ??
			WARNING_RANGE,
	};

	const positiveBaseColor = parse(
		semanticColors.positive ??
			_determineBaseColorFromRange(color, semanticColorRanges.positive, {
				includeInputAsCandidate: true,
			}),
	);

	const negativeBaseColor = parse(
		semanticColors.negative ??
			_determineBaseColorFromRange(color, semanticColorRanges.negative),
	);

	const warningBaseColor = parse(
		semanticColors.warning ??
			_determineBaseColorFromRange(color, semanticColorRanges.warning),
	);

	const scaleOptions = {
		light: options?.light,
		dark: options?.dark,
		minContrastRatio: options?.minContrastRatio,
		hueShift: themeAdj?.hueShift ?? options?.hueShift,
		foregroundMaxChroma: options?.foregroundMaxChroma,
		inputLightness: options?.inputLightness,
		baseLightnessRange: options?.baseLightnessRange,
	};
	const positiveColorScale = expandColorToScale(
		positiveBaseColor,
		themeType,
		scaleOptions,
	);
	const negativeColorScale = expandColorToScale(
		negativeBaseColor,
		themeType,
		scaleOptions,
	);
	const warningColorScale = expandColorToScale(
		warningBaseColor,
		themeType,
		scaleOptions,
	);

	return {
		positive: positiveColorScale,
		negative: negativeColorScale,
		warning: warningColorScale,
	};
}

function _determineBaseColorFromRange(
	color: Color,
	range: [number, number],
	options?: { includeInputAsCandidate?: boolean },
): Color {
	const complementaryColor = _getComplementaryColor(color);
	const splitComplementaryColors =
		_getSplitComplementaryColors(complementaryColor);

	const targetColors = [
		...(options?.includeInputAsCandidate ? [color] : []),
		complementaryColor,
		...splitComplementaryColors,
	];

	for (const targetColor of targetColors) {
		const h = convert(targetColor, 'oklch').h;

		// When range[0] > range[1] the arc crosses 0°/360° (e.g. [350, 10]).
		// The arc formula handles all cases uniformly, including both bounds > 180°.
		const arc = (range[1] - range[0] + 360) % 360;
		const dist = (h - range[0] + 360) % 360;
		const inRange = dist <= arc;

		if (inRange) {
			return convert({ ...convert(color, 'oklch'), l: 0.5, h }, 'oklch');
		}
	}

	const candidate1 = convert(
		{ ...convert(color, 'oklch'), l: 0.5, h: range[0] },
		'oklch',
	);
	const candidate2 = convert(
		{ ...convert(color, 'oklch'), l: 0.5, h: range[1] },
		'oklch',
	);

	const dist1 = Math.min(
		...targetColors.map((t) => _hueDistance(range[0], convert(t, 'oklch').h)),
	);
	const dist2 = Math.min(
		...targetColors.map((t) => _hueDistance(range[1], convert(t, 'oklch').h)),
	);

	return dist1 < dist2 ? candidate1 : candidate2;
}

function _hueDistance(a: number, b: number): number {
	const diff = Math.abs(a - b);
	return Math.min(diff, 360 - diff);
}

function _getComplementaryColor(color: Color): Color {
	const colorOKLCH = convert(color, 'oklch');

	return convert({ ...colorOKLCH, h: (colorOKLCH.h + 180) % 360 }, 'srgb');
}

function _getSplitComplementaryColors(color: Color): [Color, Color] {
	const colorOKLCH = convert(color, 'oklch');

	return [
		convert({ ...colorOKLCH, h: (colorOKLCH.h + 150) % 360 }, 'srgb'),
		convert({ ...colorOKLCH, h: (colorOKLCH.h + 210) % 360 }, 'srgb'),
	];
}
