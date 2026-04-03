import type { HextimateResult } from 'hextimator';
import { Check, Copy, NavArrowDown, RefreshDouble } from 'iconoir-react';
import { Select } from 'radix-ui';
import { useCallback, useRef, useState } from 'react';
import { type ColorFormat, useCodeEval } from './use-code-eval';
import { useCodeMirror } from './use-codemirror';

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
		<button
			type="button"
			className="hxp-icon-btn"
			onClick={copy}
			aria-label="Copy"
		>
			{copied ? (
				<Check width="1rem" strokeWidth={2} style={{ color: '#4ade80' }} />
			) : (
				<Copy width="1rem" strokeWidth={2} />
			)}
		</button>
	);
}

export interface CodeEditorProps {
	defaultCode: string;
	color: string;
	className?: string;
	outputClassName?: string;
}

export function CodeEditor({
	defaultCode,
	color,
	className,
	outputClassName,
}: CodeEditorProps) {
	const [code, setCode] = useState(defaultCode);
	const [outputMode, setOutputMode] = useState<'light' | 'dark'>('light');
	const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');

	const { object, css, error } = useCodeEval(code, color, colorFormat);

	const handleChange = useCallback((value: string) => {
		setCode(value);
	}, []);

	const { containerRef, viewRef } = useCodeMirror({
		initialValue: defaultCode,
		onChange: handleChange,
	});

	const resetCode = useCallback(() => {
		const view = viewRef.current;
		if (view) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: defaultCode },
			});
		}
	}, [viewRef, defaultCode]);

	return (
		<div className={`hxp-editor-layout ${className ?? ''}`}>
			{/* Code editor pane */}
			<div className="hxp-editor-pane">
				<div className="hxp-pane-header">
					<div className="hxp-pane-header-left">
						<div className="hxp-traffic-dots">
							<span className="hxp-dot hxp-dot-red" />
							<span className="hxp-dot hxp-dot-yellow" />
							<span className="hxp-dot hxp-dot-green" />
						</div>
						<span className="hxp-pane-title">theme.ts</span>
					</div>
					<div className="hxp-pane-actions">
						<CopyButton getText={() => code} />
						<button
							type="button"
							className="hxp-icon-btn"
							onClick={resetCode}
							aria-label="Reset"
						>
							<RefreshDouble width=".8rem" strokeWidth={2} />
						</button>
					</div>
				</div>
				<div ref={containerRef} className="hxp-codemirror-container" />
				{error && <div className="hxp-editor-error">{error}</div>}
			</div>

			{/* Output pane */}
			<div className={`hxp-output-pane ${outputClassName ?? ''}`}>
				<div className="hxp-pane-header">
					<div className="hxp-tab-group">
						{(['light', 'dark'] as const).map((m) => (
							<button
								key={m}
								type="button"
								className={`hxp-tab-btn ${outputMode === m ? 'hxp-tab-active' : ''}`}
								onClick={() => setOutputMode(m)}
							>
								{m}
							</button>
						))}
					</div>
					<div className="hxp-pane-actions">
						<Select.Root
							value={colorFormat}
							onValueChange={(v) => setColorFormat(v as ColorFormat)}
						>
							<Select.Trigger
								className="hxp-format-trigger"
								aria-label="Select color format"
							>
								<Select.Value />
								<Select.Icon>
									<NavArrowDown width="10" height="10" />
								</Select.Icon>
							</Select.Trigger>
							<Select.Portal>
								<Select.Content
									className="hxp-format-content"
									position="popper"
									sideOffset={4}
								>
									<Select.Viewport>
										{COLOR_FORMATS.map((f) => (
											<Select.Item
												key={f}
												value={f}
												className="hxp-format-item"
											>
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
				<div className="hxp-output-scroll">
					{object ? (
						<TokenList object={object} css={css} outputMode={outputMode} />
					) : (
						<span className="hxp-output-placeholder">Evaluating...</span>
					)}
				</div>
			</div>
		</div>
	);
}

function TokenList({
	object,
	css,
	outputMode,
}: {
	object: HextimateResult;
	css: HextimateResult | null;
	outputMode: 'light' | 'dark';
}) {
	return (
		<div className="hxp-token-list">
			{Object.entries(object[outputMode] as Record<string, string>).map(
				([name, value]) => {
					const cssTokens = css?.[outputMode] as
						| Record<string, string>
						| undefined;
					const hexColor =
						cssTokens?.[name] ?? cssTokens?.[`--${name}`] ?? value;
					return (
						<div key={name} className="hxp-token-row">
							<span
								className="hxp-token-swatch"
								style={{ background: hexColor }}
							/>
							<span className="hxp-token-name">{name}</span>
							<code className="hxp-token-value">{value}</code>
						</div>
					);
				},
			)}
		</div>
	);
}
