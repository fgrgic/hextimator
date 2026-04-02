import { useHextimatorTheme } from 'hextimator/react';
import { useState } from 'react';
import type { ThemePreviewProps } from './theme-preview.types';

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

export function ThemePreview({
	defaultActive = null,
	...props
}: ThemePreviewProps) {
	const { palette, mode } = useHextimatorTheme();
	const [active, setActive] = useState<string | null>(defaultActive);

	const tokens = palette[mode] as Record<string, string>;

	const entries = Object.entries(tokens).filter(([key]) => {
		if (key.endsWith(FOREGROUND_SUFFIX)) return false;
		const role = getRole(key);
		const variant = getVariant(key);
		// For semantic roles, only show the default variant
		if (SEMANTIC_ROLES.has(role) && variant !== null) return false;
		return true;
	});

	return (
		<div
			{...props}
			className={`flex flex-row h-12 rounded-lg overflow-hidden w-full max-w-lg border border-base-weak ${props.className ?? ''}`}
		>
			{entries.map(([token, color]) => {
				const role = getRole(token);
				const isSemantic = SEMANTIC_ROLES.has(role);
				const isActive = active === token;
				const fgToken = getForegroundToken(token);

				const variant = getVariant(token);
				const isDefault = variant === null;
				const baseFlex = isDefault && !isSemantic ? 1 : 0.6;

				return (
					<button
						type="button"
						key={token}
						className="relative border-none cursor-pointer p-0 overflow-hidden"
						style={{
							backgroundColor: `var(${token})`,
							flex: isActive ? 4 : baseFlex,
							transition:
								'flex 200ms ease-out, background-color 0.3s ease-in-out, color 0.3s ease-in-out',
						}}
						onPointerEnter={() => setActive(token)}
						onPointerLeave={() => setActive(defaultActive)}
						onFocus={() => setActive(token)}
						onBlur={() => setActive(defaultActive)}
					>
						{isActive && (
							<div
								className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center px-1"
								style={{ color: `var(${fgToken})` }}
							>
								<span className="text-xs font-medium leading-tight whitespace-nowrap">
									{token}
								</span>
								<span className="text-xs 0 leading-tight whitespace-nowrap">
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
