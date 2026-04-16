import { useHextimatorTheme } from 'hextimator/react';
import { useEffect } from 'react';

export function ThemeColorMeta() {
  const { palette, mode } = useHextimatorTheme();
  const tokens = palette[mode] as Record<string, string>;
  const base = tokens['--base'];

  useEffect(() => {
    if (!base) return;
    const existing = document.querySelector('meta[name="theme-color"]');
    if (existing) existing.remove();
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = base;
    document.head.appendChild(meta);
  }, [base]);

  return null;
}
