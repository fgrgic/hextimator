import { Check, Copy } from 'iconoir-react';
import { useCallback, useState } from 'react';
import { cn } from '../../utils/cn';

type Tab = {
	label: string;
	code: string;
	prefix?: string;
};

type SimpleProps = {
	code: string;
	prefix?: string;
	tabs?: never;
};

type TabbedProps = {
	tabs: Tab[];
	code?: never;
	prefix?: never;
};

type CodeSnippetProps = (SimpleProps | TabbedProps) & {
	className?: string;
};

export function CodeSnippet({
	code,
	prefix,
	tabs,
	className,
}: CodeSnippetProps) {
	const [activeTab, setActiveTab] = useState(0);
	const [copied, setCopied] = useState(false);

	const activeCode = tabs ? tabs[activeTab].code : code;
	const activePrefix = tabs ? tabs[activeTab].prefix : prefix;

	const copy = useCallback(() => {
		navigator.clipboard.writeText(activeCode).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, [activeCode]);

	return (
		<div className={`bg-base-strong ${className ?? ''}`.trim()}>
			{tabs && (
				<div className="flex gap-1">
					{tabs.map((tab, i) => (
						<button
							key={tab.label}
							type="button"
							onClick={() => setActiveTab(i)}
							className={`cursor-pointer rounded-t-sm px-3 py-1.5 font-mono transition-colors ${
								i === activeTab
									? 'bg-base-weak text-base-foreground'
									: 'text-base-foreground hover:bg-base'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			)}
			<div
				className={cn(
					'group flex items-start gap-3 px-4 py-2.5 font-mono bg-base-weak text-base-foreground',
					tabs && activeTab === 0 ? 'rounded-sm rounded-tl-none' : 'rounded-sm',
				)}
			>
				{activePrefix && (
					<span className="select-none font-mono text-accent">
						{activePrefix}
					</span>
				)}
				{activeCode.includes('\n') ? (
					<pre className="flex-1 select-all whitespace-pre">{activeCode}</pre>
				) : (
					<code className="flex-1 select-all">{activeCode}</code>
				)}
				<button
					type="button"
					onClick={copy}
					className="cursor-pointer text-base-foreground opacity-0 transition-opacity hover:text-base-foreground group-hover:opacity-100"
					aria-label="Copy to clipboard"
				>
					{copied ? (
						<Check width="1rem" className="text-positive" strokeWidth={2} />
					) : (
						<Copy width="1rem" strokeWidth={2} />
					)}
				</button>
			</div>
		</div>
	);
}
