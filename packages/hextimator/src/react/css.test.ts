import { describe, expect, it } from 'bun:test';
import { hextimate } from '../index';
import { buildStyleContent, buildTargetedVars } from './css';

const palette = hextimate('#6A5ACD').format({ as: 'css' });

describe('buildStyleContent', () => {
  it('darkMode false emits a single block with light tokens only', () => {
    const css = buildStyleContent(palette, false, '', ':root');
    expect(css).toBe(`:root {\n${lightVarsSnippet(palette)}\n}`);
    expect(css).not.toContain('prefers-color-scheme');
    expect(css).toContain('--accent:');
  });

  it('prepends cssPrefix to each declaration', () => {
    const css = buildStyleContent(palette, false, 'ht-', ':root');
    expect(css).toContain('ht---accent:');
    expect(css).not.toMatch(/\n {2}--accent:/);
  });

  it('media dark uses the same selector for light and @media dark', () => {
    const sel = '[data-scope="a"]';
    const css = buildStyleContent(palette, { type: 'media' }, '', sel);
    expect(css).toContain(`${sel} {\n${lightVarsSnippet(palette)}\n}`);
    expect(css).toContain(
      `@media (prefers-color-scheme: dark) {\n  ${sel} {\n${darkVarsSnippet(palette)}\n  }\n}`,
    );
  });

  it('class dark at :root uses .dark for dark variables', () => {
    const css = buildStyleContent(palette, { type: 'class' }, '', ':root');
    expect(css).toContain(':root {\n');
    expect(css).toContain('.dark {\n');
    expect(css).not.toContain('.dark :root');
  });

  it('class dark when scoped uses descendant .dark <selector>', () => {
    const css = buildStyleContent(
      palette,
      { type: 'class', className: 'theme-dark' },
      '',
      '.card',
    );
    expect(css).toContain('.card {\n');
    expect(css).toContain('.theme-dark .card {\n');
  });

  it('data dark when scoped uses [attr=dark] <selector>', () => {
    const css = buildStyleContent(
      palette,
      { type: 'data', attribute: 'data-mode' },
      '',
      '.card',
    );
    expect(css).toContain('.card {\n');
    expect(css).toContain('[data-mode="dark"] .card {\n');
  });

  it('media-or-class at :root uses :root.dark and :root:not(.light)', () => {
    const css = buildStyleContent(
      palette,
      { type: 'media-or-class' },
      '',
      ':root',
    );
    expect(css).toContain(':root.dark {\n');
    expect(css).toContain(':root:not(.light) {\n');
  });

  it('media-or-class when scoped combines root class with selector', () => {
    const css = buildStyleContent(
      palette,
      { type: 'media-or-class', className: 'dark' },
      '',
      '.card',
    );
    expect(css).toContain('.card {\n');
    expect(css).toContain(':root.dark .card {\n');
    expect(css).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not(.light) .card {\n',
    );
  });
});

describe('buildTargetedVars', () => {
  it('returns empty dark list when darkMode is false', () => {
    const { light, dark } = buildTargetedVars(palette, false, '');
    expect(light.length).toBeGreaterThan(0);
    expect(dark).toEqual([]);
  });

  it('prefixes property names for light and dark', () => {
    const { light, dark } = buildTargetedVars(palette, { type: 'media' }, 'p-');
    expect(light[0]?.[0].startsWith('p-')).toBe(true);
    expect(dark[0]?.[0].startsWith('p-')).toBe(true);
  });
});

function lightVarsSnippet(p: typeof palette): string {
  const entries = Object.entries(p.light as Record<string, string>);
  return entries.map(([k, v]) => `  ${k}: ${v};`).join('\n');
}

function darkVarsSnippet(p: typeof palette): string {
  const entries = Object.entries(p.dark as Record<string, string>);
  return entries.map(([k, v]) => `    ${k}: ${v};`).join('\n');
}
