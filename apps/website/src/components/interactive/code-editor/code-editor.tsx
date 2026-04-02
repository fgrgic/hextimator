import { useHextimatorTheme } from 'hextimator/react';
import { NavArrowDown } from 'iconoir-react';
import { Select } from 'radix-ui';
import { useCallback, useState } from 'react';
import { InteractiveCard } from '../interactive-card';
import { ScopedThemePreview } from './scoped-theme-preview';
import { type ColorFormat, useCodeEval } from './use-code-eval';
import { useCodeMirror } from './use-codemirror';

const DEFAULT_CODE = `hextimate(color)
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

function OutputContent({
	objectResult,
	outputMode,
}: {
	objectResult: { light: unknown; dark: unknown } | null;
	outputMode: 'light' | 'dark';
}) {
	if (objectResult) {
		return (
			<pre className="text-xs font-mono text-base-foreground/80 whitespace-pre leading-relaxed">
				{formatObject(objectResult[outputMode], 0)}
			</pre>
		);
	}
	return (
		<span className="text-xs font-mono text-base-foreground/30">
			Evaluating...
		</span>
	);
}

function TabButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			className={`cursor-pointer px-2 py-0.5 text-xs font-mono rounded-sm transition-colors ${
				active
					? 'bg-base-weak text-base-foreground'
					: 'text-base-foreground/40 hover:text-base-foreground/60'
			}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

export function CodeEditor() {
	const { color } = useHextimatorTheme();
	const [code, setCode] = useState(DEFAULT_CODE);
	const [outputMode, setOutputMode] = useState<'light' | 'dark'>('light');
	const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');

	const { object, css, error } = useCodeEval(code, color, colorFormat);

	const handleChange = useCallback((value: string) => {
		setCode(value);
	}, []);

	const { containerRef } = useCodeMirror({
		initialValue: DEFAULT_CODE,
		onChange: handleChange,
	});

	const cssTokens = css
		? (css[outputMode] as unknown as Record<string, string>)
		: null;

	return (
		<>
			{cssTokens && <ScopedThemePreview tokens={cssTokens} className="mb-8" />}

			<InteractiveCard className="p-0! gap-0! overflow-hidden rotate-0!">
				<div className="flex flex-col md:flex-row">
					{/* Code editor pane */}
					<div className="flex flex-col flex-1 min-w-0 md:min-h-80">
						<div className="flex items-center gap-2 px-3 py-2 border-b border-base-weak">
							<div className="flex gap-1.5">
								<span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
								<span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
								<span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
							</div>
							<span className="text-xs text-base-foreground/50 font-mono">
								theme.ts
							</span>
						</div>
						<div ref={containerRef} className="flex-1 overflow-auto min-h-45" />
						{error && (
							<div className="px-3 py-2 text-xs font-mono text-negative border-t border-base-weak bg-negative/5 break-all">
								{error}
							</div>
						)}
					</div>

					{/* Output pane */}
					<div className="flex flex-col flex-1 min-w-0 border-t md:border-t-0 md:border-l border-base-weak max-h-[300px] md:max-h-[320px]">
						<div className="flex items-center justify-between px-3 py-2 border-b border-base-weak gap-2">
							<div className="flex gap-1">
								{(['light', 'dark'] as const).map((m) => (
									<TabButton
										key={m}
										active={outputMode === m}
										onClick={() => setOutputMode(m)}
									>
										{m}
									</TabButton>
								))}
							</div>
							<Select.Root
								value={colorFormat}
								onValueChange={(value) => setColorFormat(value as ColorFormat)}
							>
								<Select.Trigger className="flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded-sm bg-transparent text-base-foreground/50 cursor-pointer hover:text-base-foreground/70 border border-base-weak">
									<Select.Value />
									<Select.Icon>
										<NavArrowDown width="10" height="10" />
									</Select.Icon>
								</Select.Trigger>
								<Select.Portal>
									<Select.Content
										className="rounded-lg bg-base p-1 shadow-lg border border-base-strong z-50"
										position="popper"
										sideOffset={4}
									>
										<Select.Viewport>
											{COLOR_FORMATS.map((f) => (
												<Select.Item
													key={f}
													value={f}
													className="flex items-center text-base-foreground gap-2 text-xs font-mono px-2 py-1.5 rounded cursor-pointer hover:bg-base-strong outline-none data-highlighted:bg-base-strong"
												>
													<Select.ItemText className="font-mono">
														{f}
													</Select.ItemText>
												</Select.Item>
											))}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>
						<div className="flex-1 overflow-auto p-3">
							<OutputContent objectResult={object} outputMode={outputMode} />
						</div>
					</div>
				</div>
			</InteractiveCard>
		</>
	);
}
