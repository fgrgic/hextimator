import { PlaySolid } from 'iconoir-react';
import { Popover } from 'radix-ui';
import { type ReactNode, useCallback, useRef, useState } from 'react';

const PICKER_WIDTH = 280;
const PICKER_HEIGHT = 160;
const LIGHTNESS = 0.5;

function hslToHex(h: number, s: number, l: number): string {
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * Math.max(0, Math.min(1, color)))
			.toString(16)
			.padStart(2, '0');
	};
	return `${f(0)}${f(8)}${f(4)}`;
}

function hexToHS(hex: string): { h: number; s: number } | null {
	if (hex.length !== 6) return null;
	const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
	const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
	const b = Number.parseInt(hex.slice(4, 6), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	const l = (max + min) / 2;

	if (d === 0) return { h: 0, s: 0 };

	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;

	return { h: h * 360, s };
}

function drawGradient(ctx: CanvasRenderingContext2D, w: number, h: number) {
	const imageData = ctx.createImageData(w, h);
	for (let x = 0; x < w; x++) {
		const hue = (x / w) * 360;
		for (let y = 0; y < h; y++) {
			const sat = 1 - y / h;
			const hex = hslToHex(hue, sat, LIGHTNESS);
			const i = (y * w + x) * 4;
			imageData.data[i] = Number.parseInt(hex.slice(0, 2), 16);
			imageData.data[i + 1] = Number.parseInt(hex.slice(2, 4), 16);
			imageData.data[i + 2] = Number.parseInt(hex.slice(4, 6), 16);
			imageData.data[i + 3] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

type ColorPickerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	color: string;
	onColorSelect: (hex: string) => void;
	showResume: boolean;
	onResume: () => void;
	children: ReactNode;
};

export function ColorPicker({
	open,
	onOpenChange,
	color,
	onColorSelect,
	showResume,
	onResume,
	children,
}: ColorPickerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const anchorRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const canvasCallbackRef = useCallback((canvas: HTMLCanvasElement | null) => {
		canvasRef.current = canvas;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		drawGradient(ctx, PICKER_WIDTH, PICKER_HEIGHT);
	}, []);

	const pickColor = useCallback(
		(clientX: number, clientY: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = Math.max(0, Math.min(PICKER_WIDTH - 1, clientX - rect.left));
			const y = Math.max(0, Math.min(PICKER_HEIGHT - 1, clientY - rect.top));
			const hue = (x / PICKER_WIDTH) * 360;
			const sat = 1 - y / PICKER_HEIGHT;
			onColorSelect(hslToHex(hue, sat, LIGHTNESS));
		},
		[onColorSelect],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			e.preventDefault();
			setIsDragging(true);
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
			pickColor(e.clientX, e.clientY);
		},
		[pickColor],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging) return;
			pickColor(e.clientX, e.clientY);
		},
		[isDragging, pickColor],
	);

	const handlePointerUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	const hs = hexToHS(color);
	const cursorX = hs ? (hs.h / 360) * PICKER_WIDTH : 0;
	const cursorY = hs ? (1 - hs.s) * PICKER_HEIGHT : PICKER_HEIGHT / 2;

	return (
		<Popover.Root open={open} onOpenChange={onOpenChange}>
			<Popover.Anchor asChild ref={anchorRef}>
				{children}
			</Popover.Anchor>
			<Popover.Portal>
				<Popover.Content
					className="rounded-xl bg-base-weak p-3 shadow-lg border border-base-strong z-50 flex flex-col gap-2"
					sideOffset={8}
					onOpenAutoFocus={(e) => e.preventDefault()}
					onFocusOutside={(e) => e.preventDefault()}
					onInteractOutside={(e) => {
						if (anchorRef.current?.contains(e.target as Node)) {
							e.preventDefault();
							return;
						}
						onOpenChange(false);
					}}
				>
					<div className="relative select-none">
						<canvas
							ref={canvasCallbackRef}
							width={PICKER_WIDTH}
							height={PICKER_HEIGHT}
							className="rounded-md cursor-crosshair block"
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerUp}
						/>
						{hs && (
							<div
								className="absolute w-4 h-4 rounded-full border-2 border-base-weak shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
								style={{
									left: cursorX,
									top: cursorY,
									backgroundColor: `#${color}`,
								}}
							/>
						)}
					</div>
					{showResume && (
						<button
							type="button"
							className="flex items-center justify-center gap-1.5 text-xs text-base-foreground/70 hover:text-base-foreground cursor-pointer py-1 transition-colors"
							onClick={onResume}
						>
							<PlaySolid width="0.6rem" />
							Continue with random colors
						</button>
					)}
					<Popover.Arrow className="fill-base-strong" />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
