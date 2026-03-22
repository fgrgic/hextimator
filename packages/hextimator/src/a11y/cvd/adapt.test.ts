import { describe, expect, it } from 'bun:test';
import { parse } from '../../parse';
import { daltonize, daltonizeColor } from './adapt';
import { simulateCVD } from './matrices';

describe('daltonize', () => {
	it('returns the original color at severity 0', () => {
		const rgb: [number, number, number] = [0.5, 0.3, 0.1];
		const result = daltonize(rgb, 'deuteranopia', 0);
		expect(result).toEqual([0.5, 0.3, 0.1]);
	});

	it('corrected colors are more distinguishable under simulation', () => {
		const red: [number, number, number] = [0.8, 0.1, 0.1];
		const green: [number, number, number] = [0.1, 0.8, 0.1];

		// Simulate how a deuteranope sees the originals
		const simRed = simulateCVD(red, 'deuteranopia', 1);
		const simGreen = simulateCVD(green, 'deuteranopia', 1);
		const origSimDist = Math.hypot(
			simRed[0] - simGreen[0],
			simRed[1] - simGreen[1],
			simRed[2] - simGreen[2],
		);

		// Daltonize, then simulate — should be more distinguishable
		const corrRed = daltonize(red, 'deuteranopia', 1);
		const corrGreen = daltonize(green, 'deuteranopia', 1);
		const simCorrRed = simulateCVD(corrRed, 'deuteranopia', 1);
		const simCorrGreen = simulateCVD(corrGreen, 'deuteranopia', 1);
		const corrSimDist = Math.hypot(
			simCorrRed[0] - simCorrGreen[0],
			simCorrRed[1] - simCorrGreen[1],
			simCorrRed[2] - simCorrGreen[2],
		);

		expect(corrSimDist).toBeGreaterThan(origSimDist);
	});

	it('partial severity produces weaker correction', () => {
		const rgb: [number, number, number] = [0.8, 0.2, 0.1];
		const full = daltonize(rgb, 'protanopia', 1);
		const half = daltonize(rgb, 'protanopia', 0.5);

		// Half correction should be between original and full
		const fullDist = Math.hypot(
			full[0] - rgb[0],
			full[1] - rgb[1],
			full[2] - rgb[2],
		);
		const halfDist = Math.hypot(
			half[0] - rgb[0],
			half[1] - rgb[1],
			half[2] - rgb[2],
		);
		expect(halfDist).toBeLessThan(fullDist);
	});

	it('clamps output to valid range', () => {
		const rgb: [number, number, number] = [1, 0, 0];
		const result = daltonize(rgb, 'deuteranopia', 1);
		for (const c of result) {
			expect(c).toBeGreaterThanOrEqual(0);
			expect(c).toBeLessThanOrEqual(1);
		}
	});

	it('works with anomaly types', () => {
		const rgb: [number, number, number] = [0.8, 0.2, 0.1];
		expect(() => daltonize(rgb, 'protanomaly', 1)).not.toThrow();
		expect(() => daltonize(rgb, 'deuteranomaly', 1)).not.toThrow();
		expect(() => daltonize(rgb, 'tritanomaly', 1)).not.toThrow();
	});
});

describe('daltonizeColor', () => {
	it('returns OKLCH', () => {
		const result = daltonizeColor(parse('#ff6600'), 'deuteranopia');
		expect(result.space).toBe('oklch');
	});

	it('preserves alpha', () => {
		const color = {
			space: 'srgb' as const,
			r: 255,
			g: 100,
			b: 0,
			alpha: 0.5,
		};
		const result = daltonizeColor(color, 'protanopia');
		expect(result.alpha).toBe(0.5);
	});
});
