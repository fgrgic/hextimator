import { useSyncExternalStore } from 'react';
import type { DarkModeStrategy, ResolvedMode } from './types';

const darkQuery =
	typeof window !== 'undefined'
		? window.matchMedia('(prefers-color-scheme: dark)')
		: null;

export function useOsPrefersDark(): boolean {
	return useSyncExternalStore(
		(cb) => {
			if (!darkQuery) return () => {};
			darkQuery.addEventListener('change', cb);
			return () => darkQuery.removeEventListener('change', cb);
		},
		() => darkQuery?.matches ?? false,
		() => false,
	);
}

export function applyModeToDOM(
	mode: ResolvedMode | null,
	darkMode: DarkModeStrategy,
) {
	if (typeof document === 'undefined') return;
	if (darkMode === false || darkMode.type === 'media') return;

	const root = document.documentElement;

	if (darkMode.type === 'data') {
		const attr = darkMode.attribute ?? 'data-theme';
		if (mode) {
			root.setAttribute(attr, mode);
		} else {
			root.removeAttribute(attr);
		}
		return;
	}

	const cls = darkMode.className ?? 'dark';
	const lightCls = cls === 'dark' ? 'light' : `not-${cls}`;
	root.classList.remove(cls, lightCls);
	if (mode) {
		root.classList.add(mode === 'dark' ? cls : lightCls);
	}
}
