import { Check, Copy, NavArrowDown, RefreshDouble } from 'iconoir-react';
import { Select } from 'radix-ui';
import { useCallback, useRef, useState } from 'react';
import { HextimatorLogo } from './hextimator-logo';
import './App.css';
import { type ColorFormat, useCodeEval } from './use-code-eval';
import { useCodeMirror } from './use-codemirror';

function getColorFromURL(): string {
	const path = window.location.pathname.replace(/^\//, '');
	if (/^[0-9a-fA-F]{3,8}$/.test(path)) return `#${path}`;
	return '#3a86ff';
}

const INITIAL_COLOR = getColorFromURL();

const DEFAULT_CODE = `hextimate('${INITIAL_COLOR}')
  // .preset(presets.shadcn)
  // .addRole('cta', '#ff006e')
  // .addVariant('muted', { beyond: 'weak' })
  // .addToken('ring', { from: 'accent' })
  `;

const COLOR_FORMATS: ColorFormat[] = [
	'hex',
	'rgb',
	'hsl',
	'oklch',
	'p3',
	'rgb-raw',
	'hsl-raw',
	'oklch-raw',
	'p3-raw',
];

function formatObject(obj: unknown, indent = 0): string {
	if (obj === null || obj === undefined) return String(obj);
	if (typeof obj === 'string') return `"${obj}"`;
	if (typeof obj !== 'object') return String(obj);

	const pad = '  '.repeat(indent);
	const innerPad = '  '.repeat(indent + 1);
	const entries = Object.entries(obj as Record<string, unknown>);

	if (entries.length === 0) return '{}';

	const lines = entries.map(
		([key, value]) =>
			`${innerPad}${JSON.stringify(key)}: ${formatObject(value, indent + 1)}`,
	);

	return `{\n${lines.join(',\n')}\n${pad}}`;
}

function CopyButton({ getText }: { getText: () => string }) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const copy = useCallback(() => {
		navigator.clipboard.writeText(getText()).then(() => {
			setCopied(true);
			clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => setCopied(false), 2000);
		});
	}, [getText]);

	return (
		<button type="button" className="icon-btn" onClick={copy} aria-label="Copy">
			{copied ? (
				<Check width="1rem" strokeWidth={2} style={{ color: '#4ade80' }} />
			) : (
				<Copy width="1rem" strokeWidth={2} />
			)}
		</button>
	);
}

function App() {
	const [code, setCode] = useState(DEFAULT_CODE);
	const [outputMode, setOutputMode] = useState<'light' | 'dark'>('light');
	const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');

	const { object, css, error } = useCodeEval(code, INITIAL_COLOR, colorFormat);

	const handleChange = useCallback((value: string) => {
		setCode(value);
	}, []);

	const { containerRef, viewRef } = useCodeMirror({
		initialValue: DEFAULT_CODE,
		onChange: handleChange,
	});

	const resetCode = useCallback(() => {
		const view = viewRef.current;
		if (view) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: DEFAULT_CODE },
			});
		}
	}, [viewRef]);

	return (
		<div className="app">
			<div className="top-bar">
				<HextimatorLogo scale={0.6} />
			</div>

			<div className="editor-layout">
				{/* Code editor pane */}
				<div className="editor-pane">
					<div className="pane-header">
						<div className="pane-header-left">
							<div className="traffic-dots mr-2">
								<span className="dot dot-red" />
								<span className="dot dot-yellow" />
								<span className="dot dot-green" />
							</div>
							<span className="pane-title">theme.ts</span>
						</div>
						<div className="pane-actions">
							<CopyButton getText={() => code} />
							<button
								type="button"
								className="icon-btn"
								onClick={resetCode}
								aria-label="Reset"
							>
								<RefreshDouble width=".8rem" strokeWidth={2} />
							</button>
						</div>
					</div>
					<div ref={containerRef} className="codemirror-container" />
					{error && <div className="editor-error">{error}</div>}
				</div>

				{/* Output pane */}
				<div className="output-pane">
					<div className="pane-header">
						<div className="tab-group">
							{(['light', 'dark'] as const).map((m) => (
								<button
									key={m}
									type="button"
									className={`tab-btn ${outputMode === m ? 'tab-active' : ''}`}
									onClick={() => setOutputMode(m)}
								>
									{m}
								</button>
							))}
						</div>
						<div className="pane-actions">
							<Select.Root
								value={colorFormat}
								onValueChange={(v) => setColorFormat(v as ColorFormat)}
							>
								<Select.Trigger className="format-trigger">
									<Select.Value />
									<Select.Icon>
										<NavArrowDown width="10" height="10" />
									</Select.Icon>
								</Select.Trigger>
								<Select.Portal>
									<Select.Content
										className="format-content"
										position="popper"
										sideOffset={4}
									>
										<Select.Viewport>
											{COLOR_FORMATS.map((f) => (
												<Select.Item key={f} value={f} className="format-item">
													<Select.ItemText>{f}</Select.ItemText>
												</Select.Item>
											))}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
							<CopyButton
								getText={() =>
									object ? formatObject(object[outputMode], 0) : ''
								}
							/>
						</div>
					</div>
					<div className="output-scroll">
						{object ? (
							<div className="token-list">
								{Object.entries(
									object[outputMode] as Record<string, string>,
								).map(([name, value]) => {
									const cssTokens = css?.[outputMode] as
										| Record<string, string>
										| undefined;
									const hexColor =
										cssTokens?.[name] ?? cssTokens?.[`--${name}`] ?? value;
									return (
										<div key={name} className="token-row">
											<span
												className="token-swatch"
												style={{ background: hexColor }}
											/>
											<span className="token-name">{name}</span>
											<code className="token-value">{value}</code>
										</div>
									);
								})}
							</div>
						) : (
							<span className="output-placeholder">Evaluating...</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
