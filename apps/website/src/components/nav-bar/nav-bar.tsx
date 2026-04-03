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
			aria-label="Toggle dark mode"
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
		<Button
			href="#features"
			variant="ghost"
			className="hover:bg-base-weak py-1"
		>
			Features
		</Button>
		<Button
			href="#playground"
			variant="ghost"
			className="hover:bg-base-weak py-1"
		>
			Playground
		</Button>
		<Button
			href="https://github.com/fgrgic/hextimator"
			variant="ghost"
			className="hover:bg-base-weak py-1"
		>
			Docs
		</Button>
	</>
);

export function NavBar() {
	const [open, setOpen] = useState(false);

	return (
		<nav className="relative z-10 flex items-center justify-between px-6 py-4 text-base-foreground">
			<div className="md:min-w-3xs">
				<HextimatorLogo scale={0.5} />
			</div>
			<div className="hidden md:flex flex-row gap-4">{navLinks}</div>
			<div className="hidden items-center justify-end gap-4 md:flex md:min-w-3xs">
				<DarkModeSwitch />
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
