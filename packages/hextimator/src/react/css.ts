import type { HextimateResult } from '../HextimatePaletteBuilder';
import type { DarkModeStrategy } from './types';

export function buildStyleContent(
  palette: HextimateResult,
  darkMode: DarkModeStrategy,
  cssPrefix: string,
  selector: string = ':root',
): string {
  const lightEntries = Object.entries(palette.light as Record<string, string>);
  const darkEntries = Object.entries(palette.dark as Record<string, string>);

  const toVars = (entries: [string, string][], lineIndent: string) =>
    entries
      .map(([key, value]) => `${lineIndent}${cssPrefix}${key}: ${value};`)
      .join('\n');

  const lightVars = toVars(lightEntries, '  ');
  const darkVars = toVars(darkEntries, '  ');
  const darkVarsInMediaInner = toVars(darkEntries, '    ');

  const isRoot = selector === ':root';

  if (darkMode === false) {
    return `${selector} {\n${lightVars}\n}`;
  }

  if (darkMode.type === 'media') {
    return [
      `${selector} {\n${lightVars}\n}`,
      `@media (prefers-color-scheme: dark) {\n  ${selector} {\n${darkVarsInMediaInner}\n  }\n}`,
    ].join('\n');
  }

  if (darkMode.type === 'media-or-class') {
    const cls = darkMode.className ?? 'dark';
    const lightCls = cls === 'dark' ? 'light' : `not-${cls}`;
    const darkClassSelector = isRoot
      ? `:root.${cls}`
      : `:root.${cls} ${selector}`;
    const mediaDarkSelector = isRoot
      ? `:root:not(.${lightCls})`
      : `:root:not(.${lightCls}) ${selector}`;
    return [
      `${selector} {\n${lightVars}\n}`,
      `@media (prefers-color-scheme: dark) {\n  ${mediaDarkSelector} {\n${darkVarsInMediaInner}\n  }\n}`,
      `${darkClassSelector} {\n${darkVars}\n}`,
    ].join('\n');
  }

  if (darkMode.type === 'class') {
    const cls = darkMode.className ?? 'dark';
    const darkSelector = isRoot ? `.${cls}` : `.${cls} ${selector}`;
    return [
      `${selector} {\n${lightVars}\n}`,
      `${darkSelector} {\n${darkVars}\n}`,
    ].join('\n');
  }

  const attr = darkMode.attribute ?? 'data-theme';
  const darkSelector = isRoot
    ? `[${attr}="dark"]`
    : `[${attr}="dark"] ${selector}`;
  return [
    `${selector} {\n${lightVars}\n}`,
    `${darkSelector} {\n${darkVars}\n}`,
  ].join('\n');
}

export function buildTargetedVars(
  palette: HextimateResult,
  darkMode: DarkModeStrategy,
  cssPrefix: string,
): { light: [string, string][]; dark: [string, string][] } {
  const prefixEntries = (entries: [string, string][]) =>
    entries.map(
      ([key, value]) => [`${cssPrefix}${key}`, value] as [string, string],
    );

  return {
    light: prefixEntries(
      Object.entries(palette.light as Record<string, string>),
    ),
    dark:
      darkMode !== false
        ? prefixEntries(Object.entries(palette.dark as Record<string, string>))
        : [],
  };
}
