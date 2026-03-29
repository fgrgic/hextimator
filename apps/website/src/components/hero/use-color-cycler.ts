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

	useEffect(() => {
		if (!isActive) return;

		let timeout: ReturnType<typeof setTimeout>;
		let cancelled = false;
		let isFirst = true;
		let previousColor = initialColor;

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

				await delay(PAUSE_FULL);

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

	return { isActive, stop };
}
