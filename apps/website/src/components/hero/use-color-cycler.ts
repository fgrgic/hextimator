import { useCallback, useEffect, useState } from 'react';
import { generateRandomColor } from '../../utils';

const TYPE_DELAY = 100;
const DELETE_DELAY = 60;
const PAUSE_FULL = 1800;
const PAUSE_EMPTY = 400;

export function useColorCycler(
	onUpdate: (value: string, updateTheme?: boolean) => void,
	initialColor: string,
) {
	const [isActive, setIsActive] = useState(true);

	useEffect(() => {
		if (!isActive) return;

		let timeout: ReturnType<typeof setTimeout>;
		let cancelled = false;
		let isFirst = true;

		async function delay(ms: number) {
			return new Promise<void>((resolve) => {
				timeout = setTimeout(() => {
					if (!cancelled) resolve();
				}, ms);
			});
		}

		async function cycle() {
			while (!cancelled) {
				const target = isFirst ? initialColor : generateRandomColor();

				// Type phase
				for (let i = 1; i <= target.length; i++) {
					if (cancelled) return;
					// First cycle: theme is already applied, no update needed
					const shouldUpdate = !isFirst && i === target.length;
					onUpdate(target.slice(0, i), shouldUpdate);
					await delay(TYPE_DELAY);
				}

				isFirst = false;

				await delay(PAUSE_FULL);

				// Delete phase
				for (let i = target.length - 1; i >= 0; i--) {
					if (cancelled) return;
					onUpdate(target.slice(0, i), false);
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
	}, [isActive, onUpdate, initialColor]);

	const stop = useCallback(() => setIsActive(false), []);

	return { isActive, stop };
}
