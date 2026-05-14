import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

const BAR_DEFS = [
	{ id: 'b1', tone: 'bg-accent' },
	{ id: 'b2', tone: 'bg-accent-strong' },
	{ id: 'b3', tone: 'bg-accent-weak' },
	{ id: 'b4', tone: 'bg-accent' },
	{ id: 'b5', tone: 'bg-accent-strong' },
	{ id: 'b6', tone: 'bg-accent-weak' },
	{ id: 'b7', tone: 'bg-accent' },
	{ id: 'b8', tone: 'bg-accent-strong' },
] as const;

function chartHeightPct() {
	return `${Math.round(28 + Math.random() * 72)}%`;
}

function barHeightPx(h: string) {
	return Number.parseFloat(h);
}

function barsWithRandomHeights(_accentKey: string) {
	const rows = BAR_DEFS.map((bar) => ({
		...bar,
		h: chartHeightPct(),
	}));

	let lowest = Infinity;
	let lowestIdx = 0;
	for (let i = 0; i < rows.length; i++) {
		const v = barHeightPx(rows[i].h);
		if (v < lowest) {
			lowest = v;
			lowestIdx = i;
		}
	}

	return rows.map((row, i) => ({
		...row,
		tone: i === lowestIdx ? 'bg-negative' : BAR_DEFS[i].tone,
	}));
}

type PartnerDashboardMockProps = {
	accentColor: string;
};

export function PartnerDashboardMock({
	accentColor,
}: PartnerDashboardMockProps) {
	const [cardRotationDeg] = useState(() => {
		const sign = Math.random() < 0.5 ? -1 : 1;
		const value = Math.round((Math.random() * 0.4 + 0.4) * 10) / 10;
		return sign * value;
	});

	const [chartBars, setChartBars] = useState(() => barsWithRandomHeights(''));

	useEffect(() => {
		setChartBars(barsWithRandomHeights(accentColor));
	}, [accentColor]);

	return (
		<div
			aria-hidden
			style={
				{
					'--card-rotation': `${cardRotationDeg}deg`,
				} as CSSProperties
			}
			className={cn(
				'mx-auto w-full min-w-0 max-w-md select-none overflow-hidden rounded-2xl border border-surface-weak bg-surface-strong shadow-lg shadow-surface-weak/30 max-lg:rotate-0 lg:mx-0 lg:max-w-none lg:origin-top-right lg:scale-[1.04] lg:rounded-xl lg:rotate-(--card-rotation)',
			)}
		>
			<div className="flex flex-col lg:flex-row">
				<div className="order-1 flex min-w-0 flex-1 flex-col lg:order-2">
					<div className="flex items-center justify-between gap-2 border-b border-surface-weak bg-surface px-3 py-2 lg:hidden">
						<div className="flex items-center gap-2">
							<div className="size-2 rounded-full bg-surface-weak" />
							<div className="size-2 rounded-full bg-surface-weak" />
							<div className="h-1.5 w-8 rounded-full bg-surface-weak" />
						</div>
						<div className="h-2 w-10 rounded-full bg-surface-weak" />
					</div>

					<header className="flex items-center justify-between gap-3 border-b border-surface-weak bg-surface px-3 py-2.5">
						<div className="min-w-0 space-y-1.5">
							<div className="h-2 w-20 rounded-full bg-surface-weak lg:w-24" />
							<div className="h-2 w-32 max-w-[70%] rounded-full bg-accent-weak/60 lg:w-40" />
						</div>
						<span className="pointer-events-none shrink-0 rounded-lg bg-positive px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-accent-foreground lg:px-3 lg:py-1.5 lg:text-[10px]">
							New
						</span>
					</header>

					<div className="bg-surface-strong p-3">
						<div className="mb-3 flex flex-wrap items-center gap-2">
							<div className="h-5 w-12 shrink-0 rounded-full bg-accent" />
							<div className="h-5 w-11 shrink-0 rounded-full bg-accent-weak" />
							<div className="h-5 w-10 shrink-0 rounded-full bg-negative" />
						</div>

						<div className="mb-3 flex flex-col gap-2 lg:grid lg:grid-cols-3">
							<div className="rounded-lg border border-surface-weak bg-surface p-2 shadow-xs ring-1 ring-accent-weak/50">
								<div className="mb-2 h-1.5 w-2/3 rounded-full bg-surface-weak" />
								<div className="h-10 rounded-md bg-accent-strong lg:h-8" />
							</div>
							<div className="hidden rounded-lg border border-surface-weak bg-surface p-2 shadow-xs md:block lg:block">
								<div className="mb-2 h-1.5 w-2/3 rounded-full bg-surface-weak" />
								<div className="h-10 rounded-md bg-accent-weak lg:h-8" />
							</div>
							<div className="hidden rounded-lg border border-surface-weak bg-surface p-2 shadow-xs md:block lg:block">
								<div className="mb-2 h-1.5 w-2/3 rounded-full bg-surface-weak" />
								<div className="h-10 rounded-md bg-accent lg:h-8" />
							</div>
						</div>

						<div className="mb-3 flex h-20 items-end justify-between gap-1.5 rounded-lg border border-surface-weak bg-surface px-2.5 pb-2.5 pt-2 lg:h-24 lg:px-3 lg:pb-3">
							{chartBars.map((bar) => (
								<div
									key={bar.id}
									className={cn(
										bar.tone,
										'max-w-[10%] min-w-[4px] w-full shrink-0 rounded-t-sm opacity-95 transition-[height] duration-300 ease-out motion-reduce:transition-none',
									)}
									style={{ height: bar.h }}
								/>
							))}
						</div>

						<div className="overflow-hidden rounded-lg border border-surface-weak bg-surface">
							<div className="flex border-b border-surface-weak bg-surface-strong px-3 py-2">
								<div className="h-2 flex-1 rounded-full bg-surface-weak" />
							</div>
							<div className="flex items-center gap-2 px-3 py-1.5">
								<div className="h-3 w-3 shrink-0 rounded-full bg-surface-weak" />
								<div className="h-6 min-w-0 flex-1 rounded-md bg-surface-weak" />
							</div>
							<div className="flex items-center gap-2 bg-surface-strong px-3 py-1.5">
								<div className="h-3 w-3 shrink-0 rounded-full bg-surface-weak" />
								<div className="h-6 min-w-0 flex-1 rounded-md bg-surface-weak" />
							</div>
						</div>
					</div>
				</div>

				<aside className="order-2 flex w-full shrink-0 flex-row items-center justify-center gap-2 border-t border-surface-weak bg-surface-weak/40 px-2 py-2.5 lg:order-1 lg:w-14 lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:border-r lg:border-t-0 lg:px-2.5 lg:py-5">
					<div className="mx-auto size-7 shrink-0 rounded-full bg-brand-exact lg:mx-0 lg:size-8" />
					<div className="flex flex-1 flex-row flex-wrap items-center justify-center gap-2 lg:mt-1 lg:flex-none lg:flex-col lg:items-stretch lg:justify-start lg:gap-2">
						<div className="aspect-square size-9 shrink-0 rounded-lg bg-accent ring-1 ring-inset ring-surface-foreground/10 lg:size-auto lg:w-full lg:ring-0" />
						<div className="aspect-square size-9 shrink-0 rounded-lg bg-surface-strong ring-1 ring-inset ring-surface-foreground/10 lg:size-auto lg:w-full lg:ring-0" />
						<div className="aspect-square size-9 shrink-0 rounded-lg bg-surface-weak ring-1 ring-inset ring-surface-foreground/10 lg:size-auto lg:w-full lg:ring-0" />
						<div className="aspect-square size-9 shrink-0 rounded-lg bg-positive ring-1 ring-inset ring-surface-foreground/10 lg:size-auto lg:w-full lg:ring-0" />
					</div>
				</aside>
			</div>
		</div>
	);
}
