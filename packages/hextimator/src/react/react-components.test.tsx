import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import {
	HextimatorProvider,
	HextimatorScope,
	HextimatorStyle,
	useHextimatorTheme,
} from './index';

function ThemeColor() {
	const { color } = useHextimatorTheme();
	return <span data-color={color} />;
}

function ThemeColors() {
	const { color, lightColor, darkColor } = useHextimatorTheme();
	return (
		<span
			data-color={color}
			data-light={lightColor}
			data-dark={darkColor}
		/>
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

	it('controlled color prop overrides defaultColor', () => {
		const html = renderToString(
			<HextimatorProvider
				defaultColor="#000000"
				color={{ light: '#3366ff', dark: '#ff6600' }}
				onColorChange={() => {}}
				darkMode={false}
			>
				<ThemeColors />
			</HextimatorProvider>,
		);
		expect(html).toContain('data-light="#3366ff"');
		expect(html).toContain('data-dark="#ff6600"');
		expect(html).not.toContain('data-light="#000000"');
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
		const darkMatch = html.match(/\.dark\s+\[data-hextimator-scope="[^"]+"\]\s*\{([^}]+)\}/);
		expect(lightMatch).not.toBeNull();
		expect(darkMatch).not.toBeNull();
		const lightAccent = lightMatch?.[1].match(/--accent:\s*([^;]+);/)?.[1];
		const darkAccent = darkMatch?.[1].match(/--accent:\s*([^;]+);/)?.[1];
		expect(lightAccent).toBeDefined();
		expect(darkAccent).toBeDefined();
		expect(lightAccent).not.toBe(darkAccent);
	});
});
