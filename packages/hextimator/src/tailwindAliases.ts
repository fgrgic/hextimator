import { hextimate } from './hextimate';
import type { ThemeDefinition } from './theme';
import type { HextimateFormatOptions } from './types';

type TailwindAliasOptions = Pick<
	HextimateFormatOptions,
	| 'separator'
	| 'keyPrefix'
	| 'roleNames'
	| 'variantNames'
	| 'excludeRoles'
	| 'excludeVariants'
> & {
	as?: 'object' | 'css';
	inverted?: boolean;
};

/** Builds Tailwind v4 aliases for the theme's runtime CSS variables. */
export function tailwindAliases(
	theme: ThemeDefinition,
	{ as: runtimeFormat, inverted = false, ...names }: TailwindAliasOptions = {},
): string {
	const as = runtimeFormat ?? theme.format?.as ?? 'object';
	if (as !== 'object' && as !== 'css') {
		throw new Error('Tailwind aliases require object or css runtime output.');
	}
	const { light, dark } = hextimate(
		theme.defaultAccent ?? '#737373',
		theme,
	).format({
		...names,
		as: 'object',
		...(as === 'css' && { keyPrefix: '' }),
		invertedVariants: false,
	});
	const separator =
		{ separator: theme.format?.separator, ...names }.separator ?? '-';
	const suffix = inverted ? `${separator}inverted` : '';
	const keys = new Set([...Object.keys(light), ...Object.keys(dark)]);
	const aliases = Array.from(keys, (name) => {
		const key = `${as === 'object' ? name.replace(/^--/, '') : name}${suffix}`;
		return `\t--color-${key}: var(--${key});`;
	});
	return ['@theme inline {', ...aliases, '}', ''].join('\n');
}
