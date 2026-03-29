import type { ComponentPropsWithRef } from 'react';
import { HextimatorIcon } from '../../icons';

type ColorInputProps = ComponentPropsWithRef<'input'> & {
	color: string;
	onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ColorInput({ color, onColorChange, ...rest }: ColorInputProps) {
	return (
		<div className="flex bg-base-weak font-extrabold rounded-sm px-1 gap-1">
			<HextimatorIcon className="my-1" />
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
					className="col-start-1 row-start-1 focus:outline-none w-0 min-w-full  underline"
					spellCheck={false}
					{...rest}
				/>
			</div>
		</div>
	);
}
