import { useHextimatorTheme } from 'hextimator/react';
import { useEffect } from 'react';

export function ThemeColorMeta() {
	const { palette, mode } = useHextimatorTheme();
	const tokens = palette[mode] as Record<string, string>;
	const surface = tokens['--surface'];

	useEffect(() => {
		if (!surface) return;
		const existing = document.querySelector('meta[name="theme-color"]');
		if (existing) existing.remove();
		const meta = document.createElement('meta');
		meta.name = 'theme-color';
		meta.content = surface;
		document.head.appendChild(meta);
	}, [surface]);

	return null;
}
