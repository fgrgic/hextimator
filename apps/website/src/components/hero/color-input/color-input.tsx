import { type ComponentPropsWithRef, forwardRef } from 'react';
import { HextimatorIcon } from '../../icons';

type ColorInputProps = ComponentPropsWithRef<'input'> & {
	color: string;
	onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	cycling?: boolean;
};

export const ColorInput = forwardRef<HTMLDivElement, ColorInputProps>(
	function ColorInput({ color, onColorChange, cycling, ...rest }, ref) {
		return (
			<div
				ref={ref}
				className="flex h-fit cursor-text items-center gap-1.5 rounded-sm bg-surface-weak px-1.5 py-0 text-3xl font-extrabold leading-none lg:gap-1 lg:px-1 lg:text-4xl"
			>
				<HextimatorIcon className="shrink-0" scale={1.2} />
				<div className="inline-grid">
					<span
						aria-hidden="true"
						className="invisible col-start-1 row-start-1 whitespace-pre leading-none"
					>
						{color || '\u00a0'}
					</span>
					<input
						type="text"
						value={color}
						onChange={onColorChange}
						aria-label="Hex color code"
						className="text-surface-foreground col-start-1 row-start-1 m-0 w-0 min-w-full appearance-none border-0 bg-transparent p-0 leading-none underline decoration-[0.12em] underline-offset-[0.14em] focus:outline-none"
						maxLength={6}
						spellCheck={false}
						autoComplete="off"
						autoCorrect="off"
						autoCapitalize="off"
						data-form-type="other"
						tabIndex={cycling ? -1 : 0}
						readOnly={cycling}
						{...rest}
					/>
				</div>
			</div>
		);
	},
);
