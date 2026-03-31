import type { ComponentPropsWithRef } from 'react';
import { HextimatorIcon } from '../../icons';

type ColorInputProps = ComponentPropsWithRef<'input'> & {
	color: string;
	onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ColorInput({ color, onColorChange, ...rest }: ColorInputProps) {
	return (
		<div className="flex bg-base-weak font-extrabold rounded-sm px-1 gap-1">
			<HextimatorIcon className="my-2" scale={1.2} />
			<div className="inline-grid">
				<span
					aria-hidden="true"
					className="invisible whitespace-pre col-start-1 row-start-1"
				>
					{color || ' '}
				</span>
				<input
					type="text"
					value={color}
					onChange={onColorChange}
					aria-label="Hex color code"
					className="text-base-foreground col-start-1 row-start-1 focus:outline-none w-0 min-w-full underline"
					maxLength={6}
					spellCheck={false}
					{...rest}
				/>
			</div>
		</div>
	);
}
