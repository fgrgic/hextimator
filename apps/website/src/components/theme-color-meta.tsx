import { useHextimatorTheme } from 'hextimator/react';
import { useEffect } from 'react';

export function ThemeColorMeta() {
	const { palette, mode } = useHextimatorTheme();
	const tokens = palette[mode] as Record<string, string>;
	const base = tokens['--base'];

	useEffect(() => {
		if (!base) return;
		let meta = document.querySelector<HTMLMetaElement>(
			'meta[name="theme-color"]',
		);
		if (!meta) {
			meta = document.createElement('meta');
			meta.name = 'theme-color';
			document.head.appendChild(meta);
		}
		meta.content = base;
	}, [base]);

	return null;
}
