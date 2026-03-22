import { useHextimatorTheme } from 'hextimator/react';

export function Hero() {
	const { color, setColor } = useHextimatorTheme();

	return (
		<section>
			<h1>Hextimator</h1>
			<p>Perceptually uniform color palettes from a single color.</p>
			<input
				type="text"
				value={color}
				onChange={(e) => setColor(e.target.value)}
				className="bg-base-weak border border-base-strong rounded-lg px-4 py-3 text-lg font-mono text-base-foreground w-40 focus:outline-none focus:ring-2 focus:ring-accent"
				spellCheck={false}
			/>
		</section>
	);
}
