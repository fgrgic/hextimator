import type { TokenEntry } from './types';

export function propertyUtilities(entries: TokenEntry[], sep = '-'): string {
	const rules: string[] = [];
	for (const entry of entries) {
		if (!entry.propertyUtility) continue;
		const { kind, name } = entry.propertyUtility;
		const key =
			entry.isDefault && entry.variant === 'DEFAULT'
				? entry.role
				: `${entry.role}${sep}${entry.variant}`;
		const value = `var(--${key})`;
		if (kind === 'placeholder') {
			rules.push(
				`@utility placeholder-${name} {\n  &::placeholder {\n    color: ${value};\n    opacity: 1;\n  }\n}`,
			);
			continue;
		}
		const properties =
			kind === 'ink'
				? {
						text: 'color',
						fill: 'fill',
						stroke: 'stroke',
						caret: 'caret-color',
						decoration: 'text-decoration-color',
					}
				: {
						bg: 'background-color',
						border: 'border-color',
						'border-x': 'border-inline-color',
						'border-y': 'border-block-color',
						'border-t': 'border-top-color',
						'border-r': 'border-right-color',
						'border-b': 'border-bottom-color',
						'border-l': 'border-left-color',
						'border-s': 'border-inline-start-color',
						'border-e': 'border-inline-end-color',
						outline: 'outline-color',
						ring: '--tw-ring-color',
						'ring-offset': '--tw-ring-offset-color',
						shadow: '--tw-shadow-color',
						'inset-ring': '--tw-inset-ring-color',
						'inset-shadow': '--tw-inset-shadow-color',
					};
		for (const [utility, property] of Object.entries(properties)) {
			rules.push(`@utility ${utility}-${name} {\n  ${property}: ${value};\n}`);
		}
		if (kind === 'fill') {
			rules.push(
				`@utility divide-${name} {\n  :where(& > :not(:last-child)) {\n    border-color: ${value};\n  }\n}`,
			);
		}
	}
	return rules.join('\n\n');
}
