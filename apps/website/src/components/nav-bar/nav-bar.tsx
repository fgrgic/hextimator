import { useHextimatorTheme } from 'hextimator/react';
import { HalfMoon, Menu, SunLight, Xmark } from 'iconoir-react';
import { Switch } from 'radix-ui';
import { useState } from 'react';
import { Button } from '../button';
import { HextimatorLogo } from '../hextimator-logo';

function DarkModeSwitch() {
	const { mode, setMode } = useHextimatorTheme();
	const isDark = mode === 'dark';

	return (
		<Switch.Root
			checked={isDark}
			onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')}
			className="relative h-6 w-11 cursor-pointer rounded-full bg-base-weak transition-colors hover:bg-accent"
		>
			<Switch.Thumb
				className="flex h-5 w-5 items-center justify-center rounded-full bg-base-foreground"
				style={{
					translate: isDark ? '1.375rem' : '0.125rem',
					transition: 'translate 200ms ease-out',
				}}
			>
				{isDark ? (
					<HalfMoon width="0.75rem" className="text-base" />
				) : (
					<SunLight width="0.75rem" className="text-base" />
				)}
			</Switch.Thumb>
		</Switch.Root>
	);
}

const navLinks = (
	<>
		<Button href="#features" variant="ghost">
			Features
		</Button>
		<Button href="https://github.com/fgrgic/hextimator" variant="ghost">
			Docs
		</Button>
	</>
);

export function NavBar() {
	const [open, setOpen] = useState(false);

	return (
		<nav className="relative z-10 flex items-center justify-between px-6 py-4 text-base-foreground">
			<HextimatorLogo scale={0.6} />

			<div className="hidden items-center gap-4 md:flex">
				<DarkModeSwitch />
				{navLinks}
			</div>

			<div className="flex items-center gap-3 md:hidden">
				<DarkModeSwitch />
				<button
					type="button"
					className="text-base-foreground cursor-pointer"
					onClick={() => setOpen((v) => !v)}
					aria-label={open ? 'Close menu' : 'Open menu'}
				>
					{open ? <Xmark width="1.5rem" /> : <Menu width="1.5rem" />}
				</button>
			</div>

			{open && (
				<>
					<button
						type="button"
						className="fixed inset-0 md:hidden"
						onClick={() => setOpen(false)}
						aria-label="Close menu"
					/>
					<div className="bg-base absolute top-full right-0 left-0 flex flex-col gap-2 px-4 py-3 shadow-md md:hidden">
						{navLinks}
					</div>
				</>
			)}
		</nav>
	);
}
