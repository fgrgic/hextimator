import { describe, expect, it } from 'bun:test';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { baseTheme, hextimate, type ThemeDefinition } from '../index';
import { buildStyleContent } from './css';
import {
	HextimatorProvider,
	HextimatorScope,
	HextimatorStyle,
	useHextimator,
	useHextimatorTheme,
} from './index';
import { useStableOptions } from './use-stable-options';

function ThemeColor() {
	const { color } = useHextimatorTheme();
	return <span data-color={color} />;
}

function ThemeColors() {
	const { color, lightColor, darkColor } = useHextimatorTheme();
	return (
		<span data-color={color} data-light={lightColor} data-dark={darkColor} />
	);
}

describe('HextimatorStyle (renderToString)', () => {
	it('emits a style tag with hextimator marker and CSS variables', () => {
		const html = renderToString(
			<HextimatorStyle color="#6A5ACD" darkMode={false} />,
		);
		expect(html).toContain('data-hextimator');
		expect(html).toContain('--accent:');
		expect(html).toContain(':root {');
	});

	it('scopes variables to selector when provided', () => {
		const html = renderToString(
			<HextimatorStyle
				color="#6A5ACD"
				darkMode={{ type: 'class' }}
				selector=".widget"
			/>,
		);
		expect(html).toContain('.widget {');
		expect(html).toContain('.dark .widget {');
	});
});

describe('HextimatorProvider / Scope (renderToString)', () => {
	it('useHextimatorTheme reads provider color', () => {
		const html = renderToString(
			<HextimatorProvider defaultColor="#3366ff" darkMode={false}>
				<ThemeColor />
			</HextimatorProvider>,
		);
		expect(html).toContain('data-color="#3366ff"');
	});

	it('nested scope overrides color for useHextimatorTheme', () => {
		const html = renderToString(
			<HextimatorProvider defaultColor="#3366ff" darkMode={false}>
				<HextimatorScope defaultColor="#cc0044" darkMode={false}>
					<ThemeColor />
				</HextimatorScope>
			</HextimatorProvider>,
		);
		expect(html).toContain('data-color="#cc0044"');
		expect(html).not.toContain('data-color="#3366ff"');
	});

	it('HextimatorScope emits scope attribute and scoped style', () => {
		const html = renderToString(
			<HextimatorScope defaultColor="#ff6600" darkMode={false}>
				<span>hi</span>
			</HextimatorScope>,
		);
		expect(html).toContain('data-hextimator-scope=');
		expect(html).toContain('data-hextimator');
		expect(html).toContain('--accent:');
	});

	it('isolated scope does not inherit parent builder roles', () => {
		const html = renderToString(
			<HextimatorProvider
				defaultColor="#3366ff"
				darkMode={false}
				configure={(b) => b.addRole('peekrole', '#ff0000')}
			>
				<HextimatorScope isolated defaultColor="#3366ff" darkMode={false}>
					<span />
				</HextimatorScope>
			</HextimatorProvider>,
		);
		expect(html).not.toContain('--peekrole');
	});

	it('non-isolated nested scope inherits parent builder roles', () => {
		const html = renderToString(
			<HextimatorProvider
				defaultColor="#3366ff"
				darkMode={false}
				configure={(b) => b.addRole('peekrole', '#ff0000')}
			>
				<HextimatorScope defaultColor="#3366ff" darkMode={false}>
					<span />
				</HextimatorScope>
			</HextimatorProvider>,
		);
		expect(html).toContain('--peekrole');
	});

	it('useHextimatorTheme throws outside provider and scope', () => {
		expect(() => renderToString(<ThemeColor />)).toThrow(
			'useHextimatorTheme must be used within',
		);
	});

	it('string defaultColor seeds both lightColor and darkColor', () => {
		const html = renderToString(
			<HextimatorProvider defaultColor="#3366ff" darkMode={false}>
				<ThemeColors />
			</HextimatorProvider>,
		);
		expect(html).toContain('data-color="#3366ff"');
		expect(html).toContain('data-light="#3366ff"');
		expect(html).toContain('data-dark="#3366ff"');
	});

	it('object defaultColor seeds lightColor and darkColor independently', () => {
		const html = renderToString(
			<HextimatorProvider
				defaultColor={{ light: '#3366ff', dark: '#ff6600' }}
				darkMode={false}
			>
				<ThemeColors />
			</HextimatorProvider>,
		);
		expect(html).toContain('data-light="#3366ff"');
		expect(html).toContain('data-dark="#ff6600"');
	});

	it('provider exposes setColor / setLightColor / setDarkColor / setMode through context', () => {
		// Smoke test: verify context shape is wired without invoking setters
		// (setters require a real DOM event loop to observe state updates).
		function CheckSetters() {
			const ctx = useHextimatorTheme();
			const wired =
				typeof ctx.setColor === 'function' &&
				typeof ctx.setLightColor === 'function' &&
				typeof ctx.setDarkColor === 'function' &&
				typeof ctx.setMode === 'function';
			return <span data-wired={String(wired)} />;
		}
		const html = renderToString(
			<HextimatorProvider defaultColor="#3366ff" darkMode={false}>
				<CheckSetters />
			</HextimatorProvider>,
		);
		expect(html).toContain('data-wired="true"');
	});

	it('scope accepts object defaultColor for per-mode colors', () => {
		const html = renderToString(
			<HextimatorScope
				defaultColor={{ light: '#3366ff', dark: '#ff6600' }}
				darkMode={{ type: 'class' }}
			>
				<ThemeColors />
			</HextimatorScope>,
		);
		expect(html).toContain('data-light="#3366ff"');
		expect(html).toContain('data-dark="#ff6600"');
		// Both light and dark CSS blocks should be present in the scoped <style>
		expect(html).toContain('--accent:');
		expect(html).toContain('.dark');
	});

	it('scope with per-mode colors emits different accent values for light and dark blocks', () => {
		const html = renderToString(
			<HextimatorScope
				defaultColor={{ light: '#3366ff', dark: '#ff6600' }}
				darkMode={{ type: 'class' }}
			>
				<span />
			</HextimatorScope>,
		);
		// Extract the two CSS blocks. Light is in the scope selector, dark is in .dark prefix.
		const lightMatch = html.match(
			/data-hextimator-scope="[^"]+"\]\s*\{([^}]+)\}/,
		);
		const darkMatch = html.match(
			/\.dark\s+\[data-hextimator-scope="[^"]+"\]\s*\{([^}]+)\}/,
		);
		expect(lightMatch).not.toBeNull();
		expect(darkMatch).not.toBeNull();
		const lightAccent = lightMatch?.[1].match(/--accent:\s*([^;]+);/)?.[1];
		const darkAccent = darkMatch?.[1].match(/--accent:\s*([^;]+);/)?.[1];
		expect(lightAccent).toBeDefined();
		expect(darkAccent).toBeDefined();
		expect(lightAccent).not.toBe(darkAccent);
	});
});

describe('theme option', () => {
	const theme = {
		...baseTheme,
		roles: { ...baseTheme.roles, cta: { color: '#ee2244' } },
	} satisfies ThemeDefinition;

	function expectedCss(color: string, t?: ThemeDefinition, selector?: string) {
		const palette = hextimate(color, t).format({ as: 'object' });
		return buildStyleContent(palette, false, '', selector);
	}

	function cssOf(html: string) {
		const match = html.match(/<style data-hextimator="">([\s\S]*?)<\/style>/);
		return match?.[1].replaceAll('&quot;', '"').replaceAll('&gt;', '>');
	}

	function PaletteJson({ color, t }: { color: string; t?: ThemeDefinition }) {
		const palette = useHextimator(color, { theme: t, darkMode: false });
		return <pre>{JSON.stringify(palette)}</pre>;
	}

	function PaletteFromContext() {
		const { palette } = useHextimatorTheme();
		return <pre>{JSON.stringify(palette)}</pre>;
	}

	function decodeQuotes(html: string) {
		return html.replaceAll('&quot;', '"');
	}

	it('HextimatorStyle matches hextimate(color, theme)', () => {
		const html = renderToString(
			<HextimatorStyle color="#3366ff" theme={theme} darkMode={false} />,
		);
		expect(cssOf(html)).toBe(expectedCss('#3366ff', theme));
		expect(html).toContain('--cta:');
	});

	it('HextimatorStyle without theme matches baseTheme output', () => {
		const html = renderToString(
			<HextimatorStyle color="#3366ff" darkMode={false} />,
		);
		expect(cssOf(html)).toBe(expectedCss('#3366ff'));
	});

	it('useHextimator matches hextimate(color, theme)', () => {
		const html = decodeQuotes(
			renderToString(<PaletteJson color="#3366ff" t={theme} />),
		);
		expect(html).toContain(
			JSON.stringify(hextimate('#3366ff', theme).format({ as: 'object' })),
		);
	});

	it('useHextimator without theme matches hextimate(color)', () => {
		const html = decodeQuotes(renderToString(<PaletteJson color="#3366ff" />));
		expect(html).toContain(
			JSON.stringify(hextimate('#3366ff').format({ as: 'object' })),
		);
	});

	it('HextimatorProvider matches hextimate(color, theme)', () => {
		const html = decodeQuotes(
			renderToString(
				<HextimatorProvider
					defaultColor="#3366ff"
					theme={theme}
					darkMode={false}
				>
					<PaletteFromContext />
				</HextimatorProvider>,
			),
		);
		expect(html).toContain(
			JSON.stringify(hextimate('#3366ff', theme).format({ as: 'object' })),
		);
	});

	it('HextimatorScope matches hextimate(color, theme)', () => {
		const html = renderToString(
			<HextimatorScope defaultColor="#3366ff" theme={theme} darkMode={false}>
				<span />
			</HextimatorScope>,
		);
		const selector = html.match(/data-hextimator-scope="([^"]+)"/)?.[1];
		expect(cssOf(html)).toBe(
			expectedCss('#3366ff', theme, `[data-hextimator-scope="${selector}"]`),
		);
	});

	it('scope with its own theme ignores the parent theme', () => {
		const html = renderToString(
			<HextimatorProvider defaultColor="#3366ff" theme={theme} darkMode={false}>
				<HextimatorScope
					defaultColor="#3366ff"
					theme={baseTheme}
					darkMode={false}
				>
					<span />
				</HextimatorScope>
			</HextimatorProvider>,
		);
		expect(html).not.toContain('--cta:');
	});

	it('scope without a theme inherits the parent theme', () => {
		const html = renderToString(
			<HextimatorProvider defaultColor="#3366ff" theme={theme} darkMode={false}>
				<HextimatorScope defaultColor="#3366ff" darkMode={false}>
					<span />
				</HextimatorScope>
			</HextimatorProvider>,
		);
		expect(html).toContain('--cta:');
	});

	it('configure runs after the theme', () => {
		const html = renderToString(
			<HextimatorStyle
				color="#3366ff"
				theme={{ ...theme, style: { hueShift: 0 } }}
				configure={(b) => b.style({ hueShift: 30 })}
				darkMode={false}
			/>,
		);
		const expected = hextimate('#3366ff', { ...theme, style: { hueShift: 0 } });
		expected.style({ hueShift: 30 });
		expect(cssOf(html)).toBe(
			buildStyleContent(expected.format({ as: 'object' }), false, ''),
		);
		expect(cssOf(html)).not.toBe(
			expectedCss('#3366ff', { ...theme, style: { hueShift: 0 } }),
		);
	});

	it('an inline theme with unchanged content keeps the same options', () => {
		const seen: unknown[] = [];
		const changed = { ...theme, style: { hueShift: 30 } };
		function Probe() {
			const [pass, setPass] = useState(0);
			const stable = useStableOptions({
				theme: pass < 2 ? { ...theme } : { ...changed },
			});
			seen.push(stable);
			if (pass < 2) setPass(pass + 1);
			return null;
		}
		renderToString(<Probe />);
		expect(seen).toHaveLength(3);
		expect(seen[1]).toBe(seen[0]);
		expect(seen[2]).not.toBe(seen[1]);
	});
});
