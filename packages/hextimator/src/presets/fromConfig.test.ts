import { describe, expect, test } from 'bun:test';
import { fromConfig, hextimate, presets } from '../index';
import type { HextimateFormatOptions } from '../types';
import type { HextimateConfig } from './fromConfig';
import type { HextimatePreset } from './types';

const FORMAT_AS = [
	'object',
	'css',
	'tailwind',
	'tailwind-css',
	'scss',
	'json',
] as const satisfies ReadonlyArray<NonNullable<HextimateFormatOptions['as']>>;

const BUILT_IN_PRESETS: Record<string, HextimatePreset> = {
	shadcn: presets.shadcn,
	mui: presets.mui,
	muted: presets.muted,
	vibrant: presets.vibrant,
	tinted: presets.tinted,
	bold: presets.bold,
};

describe('fromConfig', () => {
	test('color-only matches hextimate(color)', () => {
		const color = '#6366F1';
		expect(fromConfig({ color }).format({ as: 'object' })).toEqual(
			hextimate(color).format({ as: 'object' }),
		);
	});

	test('applies presets in order for every format as, both themes', () => {
		const color = '#6366F1';
		const a: HextimatePreset = {
			style: { surfaceMaxChroma: 0.03 },
			tokens: [{ name: 'canvas', value: { from: 'surface.weak' } }],
		};
		const b: HextimatePreset = {
			style: { surfaceMaxChroma: 0.08 },
			tokens: [{ name: 'ring', value: { from: 'accent' } }],
			format: { roleNames: { accent: 'brand' } },
		};

		for (const as of FORMAT_AS) {
			const viaConfig = fromConfig({ color, presets: [a, b] }).format({
				as,
			});
			const viaChain = hextimate(color).preset(a).preset(b).format({ as });
			expect(viaConfig).toEqual(viaChain);
		}
	});

	test('JSON round-trip of config produces identical output', () => {
		const config: HextimateConfig = {
			color: '#C0FFEE',
			presets: [presets.muted, presets.shadcn],
		};
		const revived = JSON.parse(JSON.stringify(config)) as HextimateConfig;

		for (const as of FORMAT_AS) {
			expect(fromConfig(revived).format({ as })).toEqual(
				fromConfig(config).format({ as }),
			);
		}
	});

	test('every built-in preset survives JSON.parse(JSON.stringify(x))', () => {
		for (const [name, preset] of Object.entries(BUILT_IN_PRESETS)) {
			expect(JSON.parse(JSON.stringify(preset))).toEqual(preset);
			expect(name).toBeTruthy();
		}
	});
});
