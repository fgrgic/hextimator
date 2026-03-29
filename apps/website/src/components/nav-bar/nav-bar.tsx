import { Menu, Xmark } from 'iconoir-react';
import { useState } from 'react';
import { Button } from '../button';
import { HextimatorLogo } from '../hextimator-logo';

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
		<nav className="relative flex items-center justify-between px-6 py-4">
			<HextimatorLogo scale={0.6} />

			<div className="hidden items-center gap-2 md:flex">{navLinks}</div>

			<button
				type="button"
				className="text-foreground cursor-pointer md:hidden"
				onClick={() => setOpen((v) => !v)}
				aria-label={open ? 'Close menu' : 'Open menu'}
			>
				{open ? <Xmark width="1.5rem" /> : <Menu width="1.5rem" />}
			</button>

			{/*hamburger menu*/}
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
