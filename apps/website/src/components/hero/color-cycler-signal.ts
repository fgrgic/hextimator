let stopFn: (() => void) | null = null;

export function registerColorCyclerStop(fn: () => void) {
	stopFn = fn;
}

export function stopColorCycler() {
	stopFn?.();
}
