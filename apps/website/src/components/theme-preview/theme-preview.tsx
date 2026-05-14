import { useHextimatorTheme } from 'hextimator/react';
import { useEffect, useRef, useState } from 'react';
import type { ThemePreviewProps } from './theme-preview.types';

const FOREGROUND_SUFFIX = '-foreground';
const SEMANTIC_ROLES = new Set(['positive', 'negative', 'caution']);
const ROLE_ORDER = ['accent', 'surface', 'positive', 'negative', 'caution'];

function getRole(token: string) {
	return token.split('-')[0];
}

function getVariant(token: string) {
	const dash = token.indexOf('-');
	return dash === -1 ? null : token.slice(dash + 1);
}

function getForegroundToken(token: string) {
	return `${getRole(token)}${FOREGROUND_SUFFIX}`;
}

export function getThemePreviewEntries(
	tokens: Record<string, string>,
): [string, string][] {
	return Object.entries(tokens)
		.filter(([key]) => {
			if (key.endsWith(FOREGROUND_SUFFIX)) return false;
			if (key === 'brand-exact') return false;
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
}

export function ThemePreview({
	defaultActive = null,
	className,
	...props
}: ThemePreviewProps) {
	const { palette, mode } = useHextimatorTheme();
	const [active, setActive] = useState<string | null>(defaultActive);
	const [clicked, setClicked] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!clicked) return;
		function handleClickOutside(e: PointerEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setClicked(null);
				setActive(defaultActive);
			}
		}
		document.addEventListener('pointerdown', handleClickOutside);
		return () =>
			document.removeEventListener('pointerdown', handleClickOutside);
	}, [clicked, defaultActive]);

	const tokens = palette[mode] as Record<string, string>;
	const entries = getThemePreviewEntries(tokens);

	return (
		<div
			{...props}
			ref={containerRef}
			className={`flex h-12 w-full max-w-lg flex-row overflow-hidden rounded-lg border border-surface-weak shadow-xs ${className ?? ''}`}
		>
			{entries.map(([token, color]) => {
				const isActive = active === token;
				const fgToken = getForegroundToken(token);

				return (
					<button
						type="button"
						key={token}
						className="relative cursor-pointer overflow-hidden border-none p-0"
						style={{
							backgroundColor: `var(--${token})`,
							flex: isActive ? 4 : 1,
							transition:
								'flex 300ms ease-out, background-color 0.3s ease-in-out, color 0.3s ease-in-out',
						}}
						onPointerEnter={() => setActive(token)}
						onPointerLeave={() => setActive(clicked ?? defaultActive)}
						onClick={() => {
							if (clicked === token) {
								setClicked(null);
								setActive(defaultActive);
							} else {
								setClicked(token);
								setActive(token);
							}
						}}
						aria-label={`${token}: ${color}`}
					>
						{isActive && (
							<div
								className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end gap-0.5 px-2.5 pb-1 text-center"
								style={{ color: `var(--${fgToken})` }}
							>
								<span className="whitespace-nowrap text-xs leading-tight">
									{token}
								</span>
								<span className="whitespace-nowrap text-xs font-light leading-tight">
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
