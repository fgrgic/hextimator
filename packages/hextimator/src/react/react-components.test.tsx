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
});
