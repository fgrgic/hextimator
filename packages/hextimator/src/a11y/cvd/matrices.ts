import { multiplyMatrix3 } from '../../convert/matrices';

type Matrix3 = readonly (readonly [number, number, number])[];

/**
 * Brettel (1997) simulation matrices for color vision deficiency.
 * Each deficiency has two half-planes; the correct one is chosen
 * based on which side of the neutral axis the input color falls.
 *
 * Matrices operate in linear sRGB space.
 */

// ── Protanopia ──────────────────────────────────────────────────────
const PROTAN_A: Matrix3 = [
	[0.152286, 1.052583, -0.204868],
	[0.114503, 0.786281, 0.099216],
	[-0.003882, -0.048116, 1.051998],
];

const PROTAN_B: Matrix3 = [
	[0.152286, 1.052583, -0.204868],
	[0.114503, 0.786281, 0.099216],
	[-0.003882, -0.048116, 1.051998],
];

// Separator vector for protanopia half-planes
const PROTAN_SEP: readonly [number, number, number] = [
	0.00048, 0.00393, -0.00441,
];

// ── Deuteranopia ────────────────────────────────────────────────────
const DEUTAN_A: Matrix3 = [
	[0.367322, 0.860646, -0.227968],
	[0.280085, 0.672501, 0.047413],
	[-0.01182, 0.04294, 0.968881],
];

const DEUTAN_B: Matrix3 = [
	[0.367322, 0.860646, -0.227968],
	[0.280085, 0.672501, 0.047413],
	[-0.01182, 0.04294, 0.968881],
];

const DEUTAN_SEP: readonly [number, number, number] = [
	-0.00281, -0.00611, 0.00892,
];

// ── Tritanopia ──────────────────────────────────────────────────────
const TRITAN_A: Matrix3 = [
	[1.255528, -0.076749, -0.178779],
	[-0.078411, 0.930809, 0.147602],
	[0.004733, 0.691367, 0.3039],
];

const TRITAN_B: Matrix3 = [
	[1.255528, -0.076749, -0.178779],
	[-0.078411, 0.930809, 0.147602],
	[0.004733, 0.691367, 0.3039],
];

const TRITAN_SEP: readonly [number, number, number] = [
	0.03901, -0.02788, -0.01113,
];

export type CVDType =
	| 'protanopia'
	| 'deuteranopia'
	| 'tritanopia'
	| 'protanomaly'
	| 'deuteranomaly'
	| 'tritanomaly'
	| 'achromatopsia';

interface BrettelParams {
	a: Matrix3;
	b: Matrix3;
	sep: readonly [number, number, number];
}

const BRETTEL: Record<string, BrettelParams> = {
	protanopia: { a: PROTAN_A, b: PROTAN_B, sep: PROTAN_SEP },
	deuteranopia: { a: DEUTAN_A, b: DEUTAN_B, sep: DEUTAN_SEP },
	tritanopia: { a: TRITAN_A, b: TRITAN_B, sep: TRITAN_SEP },
};

const ANOMALY_MAP: Record<string, string> = {
	protanomaly: 'protanopia',
	deuteranomaly: 'deuteranopia',
	tritanomaly: 'tritanopia',
};

export function resolveBaseType(type: CVDType): string {
	return ANOMALY_MAP[type] ?? type;
}

/**
 * Simulate a single CVD type on a linear RGB triplet.
 * Severity 0 = normal vision, 1 = full deficiency.
 */
export function simulateCVD(
	rgb: readonly [number, number, number],
	type: CVDType,
	severity: number,
): [number, number, number] {
	const s = Math.max(0, Math.min(1, severity));
	if (s === 0) return [rgb[0], rgb[1], rgb[2]];

	let simulated: [number, number, number];

	if (type === 'achromatopsia') {
		// Luminance-based monochromacy using Rec. 709 coefficients
		const y = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
		simulated = [y, y, y];
	} else {
		const baseType = resolveBaseType(type);
		const params = BRETTEL[baseType];

		// Pick half-plane based on separator
		const dotSep =
			rgb[0] * params.sep[0] + rgb[1] * params.sep[1] + rgb[2] * params.sep[2];
		const matrix = dotSep >= 0 ? params.a : params.b;

		simulated = multiplyMatrix3(matrix, rgb);
	}

	// Interpolate between original and simulated by severity
	if (s < 1) {
		return [
			rgb[0] + s * (simulated[0] - rgb[0]),
			rgb[1] + s * (simulated[1] - rgb[1]),
			rgb[2] + s * (simulated[2] - rgb[2]),
		];
	}

	return simulated;
}
