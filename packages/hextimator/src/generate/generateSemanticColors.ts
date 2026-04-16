import { convert } from '../convert';
import { parse } from '../parse';
import type { Color } from '../types';
import type { GenerateOptions, HextimatePalette, ThemeType } from './types';
import { expandColorToScale } from './utils';

const POSITIVE_RANGE: [number, number] = [135, 160]; // green range in hue values
const NEGATIVE_RANGE: [number, number] = [5, 25]; // red range in hue values
const WARNING_RANGE: [number, number] = [45, 65]; // yellow/amber range in hue values

export function generateSemanticColors(
	color: Color,
	themeType: ThemeType,
	options?: GenerateOptions,
): Pick<HextimatePalette, 'positive' | 'negative' | 'warning'> {
	const positiveBaseColor = parse(
		options?.semanticColors?.positive ??
			_determineBaseColorFromRange(
				color,
				options?.semanticColorRanges?.positive ?? POSITIVE_RANGE,
				{ includeInputAsCandidate: true },
			),
	);

	const negativeBaseColor = parse(
		options?.semanticColors?.negative ??
			_determineBaseColorFromRange(
				color,
				options?.semanticColorRanges?.negative ?? NEGATIVE_RANGE,
			),
	);

	const warningBaseColor = parse(
		options?.semanticColors?.warning ??
			_determineBaseColorFromRange(
				color,
				options?.semanticColorRanges?.warning ?? WARNING_RANGE,
			),
	);

	const scaleOptions = {
		light: options?.light,
		dark: options?.dark,
		minContrastRatio: options?.minContrastRatio,
		hueShift: options?.hueShift,
		foregroundMaxChroma: options?.foregroundMaxChroma,
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
