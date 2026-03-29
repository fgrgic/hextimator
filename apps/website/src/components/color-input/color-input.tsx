export function ColorInput({
	color,
	onColorChange,
}: {
	color: string;
	onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="flex bg-base-weak font-extrabold rounded-sm px-1">
			<span>#</span>
			<input
				type="text"
				value={color}
				onChange={onColorChange}
				size={color.length || 1}
				className="underline focus:outline-none "
				spellCheck={false}
			/>
		</div>
	);
}
