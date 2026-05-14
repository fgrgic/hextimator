import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../utils/cn';

const BAR_DEFS = [
	{ id: 'b1', tone: 'bg-accent' },
	{ id: 'b2', tone: 'bg-accent-strong' },
	{ id: 'b3', tone: 'bg-accent-weak' },
	{ id: 'b4', tone: 'bg-accent' },
	{ id: 'b5', tone: 'bg-accent-strong' },
	{ id: 'b6', tone: 'bg-accent-weak' },
	{ id: 'b7', tone: 'bg-accent-strong' },
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

function mobileMainChartIndices(hs: readonly { h: string }[]) {
	let lo = 0;
	for (let i = 1; i < hs.length; i++) {
		if (barHeightPx(hs[i].h) < barHeightPx(hs[lo].h)) lo = i;
	}
	const picked = new Set<number>([lo]);
	for (let i = 0; i < hs.length && picked.size < 3; i++) {
		picked.add(i);
	}
	return [...picked].sort((a, b) => a - b);
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

	const mobileBarIndices = useMemo(
		() => mobileMainChartIndices(chartBars),
		[chartBars],
	);

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
				'mx-auto flex w-full min-w-0 max-w-md flex-col select-none overflow-hidden rounded-2xl border border-surface-weak bg-surface-strong shadow-lg shadow-surface-weak max-lg:rotate-0 lg:mx-auto lg:max-w-xl lg:origin-top lg:scale-[1.04] lg:rounded-xl lg:rotate-(--card-rotation)',
			)}
		>
			<div className="relative flex justify-between py-2 px-3 shrink-0 border-b border-surface-weak bg-surface">
				<div className="flex items-center gap-1.5">
					<div className="size-2 rounded-full bg-negative-weak" />
					<div className="size-2 rounded-full bg-caution-weak" />
					<div className="size-2 rounded-full bg-positive-weak" />
				</div>
				<div className="h-2 w-36 rounded-full bg-surface-weak lg:w-32" />
			</div>

			<div className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:flex-row">
				<div className="order-1 flex min-w-0 flex-1 flex-col lg:order-2">
					<div className="space-y-3.5 bg-surface-strong p-3.5 pb-4 lg:space-y-4 lg:p-4">
						<div className="flex flex-wrap items-center gap-2">
							<div className="h-5 w-19 shrink-0 rounded-full bg-accent" />
							<div className="h-5 w-14 shrink-0 rounded-full bg-accent-weak" />
							<div className="h-5 w-12 shrink-0 rounded-full bg-positive" />
						</div>

						<div className="hidden lg:grid grid-cols-2 gap-2.5 lg:gap-3">
							<div className="rounded-lg border border-surface-weak bg-surface p-2.5 shadow-xs ring-1 ring-accent-weak">
								<div className="mb-2 h-1 w-[55%] rounded-full bg-surface-weak" />
								<div className="h-9 rounded-md bg-accent-strong" />
							</div>
							<div className="rounded-lg border border-surface-weak bg-surface p-2.5 shadow-xs">
								<div className="mb-2 h-1 w-[48%] rounded-full bg-surface-weak" />
								<div className="h-9 rounded-md bg-accent-weak" />
							</div>
						</div>

						<div className="min-w-0 overflow-hidden rounded-xl border border-surface-weak bg-surface px-3 pb-3 pt-5 lg:px-3.5">
							<div className="flex h-[3.75rem] w-full min-w-0 items-end gap-2 lg:hidden">
								{(['left', 'mid', 'right'] as const).map((slotKey, i) => {
									const barIndex = mobileBarIndices[i];
									const bar = chartBars[barIndex];
									return (
										<div
											key={slotKey}
											className={cn(
												bar.tone,
												'min-w-0 flex-1 basis-0 rounded-t-sm transition-[height] duration-300 ease-out motion-reduce:transition-none',
											)}
											style={{ height: bar.h }}
										/>
									);
								})}
							</div>
							<div className="hidden h-[4rem] w-full min-w-0 gap-2 lg:flex lg:items-end">
								{chartBars.map((bar) => (
									<div
										key={bar.id}
										className={cn(
											bar.tone,
											'min-w-0 flex-1 basis-0 rounded-t-sm transition-[height] duration-300 ease-out motion-reduce:transition-none',
										)}
										style={{ height: bar.h }}
									/>
								))}
							</div>
						</div>

						<div className="overflow-hidden rounded-lg border border-surface-weak bg-surface">
							<div className="flex items-center gap-2.5 px-3 py-2">
								<div className="size-2 shrink-0 rounded-full bg-surface-weak" />
								<div className="h-1.5 flex-1 rounded-full bg-surface-weak" />
							</div>
							<div className="flex items-center gap-2.5 border-t border-surface-weak bg-surface-strong px-3 py-2">
								<div className="size-2 shrink-0 rounded-full bg-surface-weak" />
								<div className="h-1.5 flex-1 rounded-full bg-surface-weak" />
							</div>
						</div>
					</div>
				</div>

				<aside className="order-2 flex w-full shrink-0 flex-row items-center border-t border-surface-weak bg-surface-weak px-3 py-3 max-lg:gap-4 lg:order-1 lg:w-14 lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:border-r lg:border-t-0 lg:px-2.5 lg:py-5">
					<div className="hidden size-8 shrink-0 self-center rounded-full bg-brand-exact lg:block" />
					<div className="flex min-w-0 flex-1 flex-row items-center justify-evenly lg:mt-1 lg:flex-none lg:flex-col lg:items-stretch lg:justify-start lg:gap-2">
						<div className="aspect-square size-9 shrink-0 rounded-lg bg-accent ring-inset lg:size-auto lg:w-full lg:ring-0" />
						<div className="aspect-square size-9 shrink-0 rounded-lg bg-surface-strong ring-inset lg:size-auto lg:w-full lg:ring-0" />
						<div className="aspect-square size-9 shrink-0 rounded-lg bg-surface-strong ring-inset lg:size-auto lg:w-full lg:ring-0" />
						<div className="aspect-square size-9 shrink-0 rounded-lg bg-surface-strong ring-inset lg:size-auto lg:w-full lg:ring-0" />
					</div>
				</aside>
			</div>
		</div>
	);
}
