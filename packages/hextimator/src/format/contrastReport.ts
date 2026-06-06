import type { HextimatePalette } from '../generate/types';
import { calculateContrast } from '../generate/utils';
import { parse } from '../parse';

/** WCAG 2.x normal-text contrast thresholds. */
const WCAG_AA = 4.5;
const WCAG_AAA = 7;

/**
 * One measured pairing in a contrast report.
 *
 * `ratio` is the WCAG 2.x relative-luminance contrast ratio (the same metric
 * used during generation), not APCA or any other model. `passesAA` / `passesAAA`
 * compare it against the WCAG normal-text thresholds (4.5 and 7).
 *
 * Generation targets `minContrastRatio + 0.15` (a safety margin that absorbs
 * gamut-mapping drift), so reported ratios sit above the headline target.
 * A ratio of ~7.3 against an `AAA` (7) target is expected, not a bug.
 */
export interface ContrastReportEntry {
	/** Flat token name, e.g. `"accent-strong"` or `"surface"`. */
	token: string;
	/** Flat name of the token this ratio was measured against, e.g. `"accent-foreground"`. */
	pairedAgainst: string;
	/** WCAG 2.x relative-luminance contrast ratio. */
	ratio: number;
	/** `ratio >= 4.5`. */
	passesAA: boolean;
	/** `ratio >= 7`. */
	passesAAA: boolean;
}

function flatKey(role: string, variant: string): string {
	return variant === 'DEFAULT' ? role : `${role}-${variant}`;
}

/**
 * Walks every role+variant in a generated palette and reports its WCAG 2.x
 * contrast ratio against the pairing it was tuned for: fill variants
 * (DEFAULT/strong/weak/...) against their scale's `foreground`, and the
 * `foreground` variant against the scale's `DEFAULT` fill.
 */
export function buildContrastReport(
	palette: HextimatePalette,
): ContrastReportEntry[] {
	const report: ContrastReportEntry[] = [];

	for (const role of Object.keys(palette)) {
		const scale = palette[role];
		for (const variant of Object.keys(scale)) {
			const pairedVariant = variant === 'foreground' ? 'DEFAULT' : 'foreground';
			const ratio = calculateContrast(
				parse(scale[variant]),
				parse(scale[pairedVariant]),
			);
			report.push({
				token: flatKey(role, variant),
				pairedAgainst: flatKey(role, pairedVariant),
				ratio,
				passesAA: ratio >= WCAG_AA,
				passesAAA: ratio >= WCAG_AAA,
			});
		}
	}

	return report;
}
