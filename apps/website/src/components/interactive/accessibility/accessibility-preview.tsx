import { useState } from 'react';
import { stopColorCycler } from '../../hero/color-cycler-signal';

export function AccessibilityPreview() {
	const [surface, setSurface] = useState('surface');

	return (
		<div className="mt-5 flex flex-col gap-2">
			<fieldset
				aria-label="Preview background"
				className="flex flex-wrap items-center gap-1 text-xs"
			>
				<legend className="sr-only">Preview background</legend>
				{[
					{ name: 'surface', label: 'Default' },
					{ name: 'surface-weak', label: 'Weak' },
					{ name: 'surface-strong', label: 'Strong' },
				].map((option) => (
					<button
						type="button"
						key={option.name}
						aria-pressed={surface === option.name}
						className={`cursor-pointer rounded px-2 py-1 ${surface === option.name ? 'bg-surface-weak' : 'hover:bg-surface-strong'}`}
						onClick={() => {
							stopColorCycler();
							setSurface(option.name);
						}}
					>
						{option.label}
					</button>
				))}
				<code className="ml-auto text-surface-foreground/70">bg-{surface}</code>
			</fieldset>
			<div
				className="flex flex-col gap-3 rounded-lg border border-surface-weak p-3"
				style={{ backgroundColor: `var(--${surface})` }}
			>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<code className="text-xs text-surface-foreground/70">
						text-negative
					</code>
					<span className="text-negative text-sm">Negative text</span>
				</div>
				<label className="flex flex-wrap items-center justify-between gap-2">
					<code className="text-xs text-surface-foreground/70">
						placeholder-negative
					</code>
					<input
						readOnly
						placeholder="Placeholder text"
						className="placeholder-negative w-32 min-w-0 rounded border border-surface-weak bg-transparent px-2 py-1 text-sm text-surface-foreground"
					/>
				</label>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-col text-xs text-surface-foreground/70">
						<code>bg-negative</code>
						<code>text-negative-foreground</code>
					</div>
					<span className="bg-negative text-negative-foreground rounded px-2 py-1 text-sm">
						Fill + foreground
					</span>
				</div>
			</div>
		</div>
	);
}
