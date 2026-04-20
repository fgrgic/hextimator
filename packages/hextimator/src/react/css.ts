import type { FlatTokenMap } from '../format';
import type { HextimateResult } from '../HextimatePaletteBuilder';
import type { DarkModeStrategy } from './types';

/**
 * React's internal serializer consumes the raw token map from
 * `format({ as: 'object' })` and prefixes each key with `--` to produce CSS
 * custom properties. This keeps React free to apply its own selector
 * strategies (`media-or-class`, custom class names, scoped selectors, etc.)
 * that the format layer's `darkMode` option doesn't expose.
 */
export function buildStyleContent(
	palette: HextimateResult<FlatTokenMap>,
	darkMode: DarkModeStrategy,
	cssPrefix: string,
	selector: string = ':root',
): string {
	const lightEntries = Object.entries(palette.light);
	const darkEntries = Object.entries(palette.dark);

	const toVars = (entries: [string, string][], lineIndent: string) =>
		entries
			.map(([key, value]) => `${lineIndent}${cssPrefix}--${key}: ${value};`)
			.join('\n');

	const lightVars = toVars(lightEntries, '\t');
	const darkVars = toVars(darkEntries, '\t');
	const darkVarsInMediaInner = toVars(darkEntries, '\t\t');

	const isRoot = selector === ':root';

	if (darkMode === false) {
		return `${selector} {\n${lightVars}\n}`;
	}

	if (darkMode.type === 'media') {
		return [
			`${selector} {\n${lightVars}\n}`,
			`@media (prefers-color-scheme: dark) {\n\t${selector} {\n${darkVarsInMediaInner}\n\t}\n}`,
		].join('\n');
	}

	if (darkMode.type === 'media-or-class') {
		const cls = darkMode.className ?? 'dark';
		const lightCls = cls === 'dark' ? 'light' : `not-${cls}`;
		const darkClassSelector = isRoot
			? `:root.${cls}`
			: `:root.${cls} ${selector}`;
		const mediaDarkSelector = isRoot
			? `:root:not(.${lightCls})`
			: `:root:not(.${lightCls}) ${selector}`;
		return [
			`${selector} {\n${lightVars}\n}`,
			`@media (prefers-color-scheme: dark) {\n\t${mediaDarkSelector} {\n${darkVarsInMediaInner}\n\t}\n}`,
			`${darkClassSelector} {\n${darkVars}\n}`,
		].join('\n');
	}

	if (darkMode.type === 'class') {
		const cls = darkMode.className ?? 'dark';
		const darkSelector = isRoot ? `.${cls}` : `.${cls} ${selector}`;
		return [
			`${selector} {\n${lightVars}\n}`,
			`${darkSelector} {\n${darkVars}\n}`,
		].join('\n');
	}

	const attr = darkMode.attribute ?? 'data-theme';
	const darkSelector = isRoot
		? `[${attr}="dark"]`
		: `[${attr}="dark"] ${selector}`;
	return [
		`${selector} {\n${lightVars}\n}`,
		`${darkSelector} {\n${darkVars}\n}`,
	].join('\n');
}

export function buildTargetedVars(
	palette: HextimateResult<FlatTokenMap>,
	darkMode: DarkModeStrategy,
	cssPrefix: string,
): { light: [string, string][]; dark: [string, string][] } {
	const prefixEntries = (entries: [string, string][]) =>
		entries.map(
			([key, value]) => [`${cssPrefix}--${key}`, value] as [string, string],
		);

	return {
		light: prefixEntries(Object.entries(palette.light)),
		dark: darkMode !== false ? prefixEntries(Object.entries(palette.dark)) : [],
	};
}
