import { useState } from 'react';

const FOREGROUND_SUFFIX = '-foreground';
const SEMANTIC_ROLES = new Set(['positive', 'negative', 'warning']);

function getRole(token: string) {
	return token.replace(/^--/, '').split('-')[0];
}

function getVariant(token: string) {
	const name = token.replace(/^--/, '');
	const dash = name.indexOf('-');
	return dash === -1 ? null : name.slice(dash + 1);
}

function getForegroundToken(token: string) {
	const prefix = token.startsWith('--') ? '--' : '';
	return `${prefix}${getRole(token)}${FOREGROUND_SUFFIX}`;
}

function stripToken(token: string) {
	return token.replace(/^--/, '');
}

type ScopedThemePreviewProps = {
	tokens: Record<string, string>;
	className?: string;
};

const ROLE_ORDER = ['accent', 'base', 'positive', 'negative', 'warning'];

export function ScopedThemePreview({
	tokens,
	className,
}: ScopedThemePreviewProps) {
	const [active, setActive] = useState<string | null>(null);

	const entries = Object.entries(tokens)
		.filter(([key]) => {
			if (key.endsWith(FOREGROUND_SUFFIX)) return false;
			if (key === '--brand-exact') return false;
			const role = getRole(key);
			const variant = getVariant(key);
			if (SEMANTIC_ROLES.has(role) && variant !== null) return false;
			return true;
		})
		.sort(([a], [b]) => {
			const ra = ROLE_ORDER.indexOf(getRole(a));
			const rb = ROLE_ORDER.indexOf(getRole(b));
			return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
		});

	const cssVars = Object.fromEntries(
		Object.entries(tokens).map(([k, v]) => [k, v]),
	) as React.CSSProperties;

	return (
		<div
			className={`flex flex-row h-12 rounded-lg overflow-hidden w-full border border-base-weak shadow-xs ${className ?? ''}`}
			style={cssVars}
		>
			{entries.map(([token, color]) => {
				const isActive = active === token;
				const fgToken = getForegroundToken(token);
				const fgColor = tokens[fgToken];

				return (
					<button
						type="button"
						key={token}
						className="relative border-none cursor-pointer p-0 overflow-hidden"
						style={{
							backgroundColor: color,
							flex: isActive ? 4 : 1,
							transition:
								'flex 300ms ease-out, background-color 0.3s ease-in-out, color 0.3s ease-in-out',
						}}
						onPointerEnter={() => setActive(token)}
						onPointerLeave={() => setActive(null)}
						onFocus={() => setActive(token)}
						onBlur={() => setActive(null)}
					>
						{isActive && (
							<div
								className="absolute inset-0 flex flex-col items-start justify-end gap-0.5 text-center px-2.5 pb-1"
								style={{ color: fgColor }}
							>
								<span className="text-xs leading-tight whitespace-nowrap">
									{stripToken(token)}
								</span>
								<span className="text-xs font-light leading-tight whitespace-nowrap">
									{color}
								</span>
							</div>
						)}
					</button>
				);
			})}
		</div>
	);
}
