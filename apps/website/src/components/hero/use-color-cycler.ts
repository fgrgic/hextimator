import { useCallback, useEffect, useRef, useState } from 'react';
import { generateRandomColor } from '../../utils';

const TYPE_DELAY = 100;
const DELETE_DELAY = 60;
const PAUSE_FULL = 2000;
const PAUSE_EMPTY = 400;

export function useColorCycler(
	onUpdate: (value: string, updateTheme?: boolean) => void,
	initialColor: string,
) {
	const [isActive, setIsActive] = useState(true);
	const onUpdateRef = useRef(onUpdate);
	const shouldStopAfterCurrentRef = useRef(false);
	const resumeColorRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isActive) return;

		let timeout: ReturnType<typeof setTimeout>;
		let cancelled = false;
		const resumeFrom = resumeColorRef.current;
		resumeColorRef.current = null;
		let isFirst = !resumeFrom;
		let previousColor = resumeFrom ?? initialColor;

		async function delay(ms: number) {
			return new Promise<void>((resolve, reject) => {
				if (cancelled) return reject('cancelled');
				timeout = setTimeout(resolve, ms);
			});
		}

		async function cycle() {
			while (!cancelled) {
				const target = isFirst
					? initialColor
					: generateRandomColor(previousColor);
				previousColor = target;

				// Type phase
				for (let i = 1; i <= target.length; i++) {
					if (cancelled) return;
					const shouldUpdate = !isFirst && i === target.length;
					onUpdateRef.current(target.slice(0, i), shouldUpdate);
					await delay(TYPE_DELAY);
				}

				isFirst = false;

				if (shouldStopAfterCurrentRef.current) {
					setIsActive(false);
					return;
				}

				await delay(PAUSE_FULL);

				if (shouldStopAfterCurrentRef.current) {
					setIsActive(false);
					return;
				}

				// Delete phase
				for (let i = target.length - 1; i >= 0; i--) {
					if (cancelled) return;
					onUpdateRef.current(target.slice(0, i), false);
					await delay(DELETE_DELAY);
				}

				await delay(PAUSE_EMPTY);
			}
		}

		cycle();

		return () => {
			cancelled = true;
			clearTimeout(timeout);
		};
	}, [isActive, initialColor]);

	const stop = useCallback(() => setIsActive(false), []);

	const restart = useCallback((fromColor?: string) => {
		shouldStopAfterCurrentRef.current = false;
		resumeColorRef.current = fromColor ?? null;
		setIsActive(true);
	}, []);

	const stopAfterCurrent = useCallback(() => {
		shouldStopAfterCurrentRef.current = true;
	}, []);

	return { isActive, stop, restart, stopAfterCurrent };
}
