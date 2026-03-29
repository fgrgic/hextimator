import { HextimatorIcon } from '../icons';

export function ColorInput({
	color,
	onColorChange,
}: {
	color: string;
	onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
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
				/>
			</div>
		</div>
	);
}
