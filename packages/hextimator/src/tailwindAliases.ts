import { hextimate } from './hextimate';
import type { ThemeDefinition } from './theme';

/** Builds Tailwind v4 aliases for the theme's runtime CSS variables. */
export function tailwindAliases(
	theme: ThemeDefinition,
	{ inverted = false }: { inverted?: boolean } = {},
): string {
	const as = theme.format?.as;
	const keyPrefix =
		as === undefined || as === 'object' || as === 'json'
			? (theme.format?.keyPrefix ?? '').replace(/^--/, '')
			: '';
	const { light, dark } = hextimate(
		theme.defaultAccent ?? '#737373',
		theme,
	).format({ as: 'object', keyPrefix: '', invertedVariants: false });
	const suffix = inverted ? `${theme.format?.separator ?? '-'}inverted` : '';
	const names = new Set([...Object.keys(light), ...Object.keys(dark)]);
	const aliases = Array.from(names, (name) => {
		const key = `${keyPrefix}${name}${suffix}`;
		return `\t--color-${key}: var(--${key});`;
	});
	return ['@theme inline {', ...aliases, '}', ''].join('\n');
}
