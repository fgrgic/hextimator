import { useHextimatorTheme } from 'hextimator/react';
import { HalfMoon, Menu, SunLight, Xmark } from 'iconoir-react';
import { Switch } from 'radix-ui';
import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../button';
import { HextimatorLogo } from '../hextimator-logo';

function DarkModeSwitch() {
	const { mode, setMode } = useHextimatorTheme();
	const isDark = mode === 'dark';

	return (
		<Switch.Root
			checked={isDark}
			onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')}
			className="relative h-6 w-11 cursor-pointer rounded-full bg-base-weak transition-colors duration-200 hover:bg-accent"
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<>
			<Button href="#features" variant="navigation" onClick={onNavigate}>
				Features
			</Button>
			<Button href="#playground" variant="navigation" onClick={onNavigate}>
				Playground
			</Button>
			<Button
				href="https://www.npmjs.com/package/hextimator"
				variant="navigation"
				onClick={onNavigate}
				target="_blank"
				rel="noopener noreferrer"
			>
				Docs
			</Button>
		</>
	);
}

export function NavBar() {
	const [open, setOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => {
			const y = window.scrollY;
			setScrolled((prev) => (prev ? y > 10 : y > 30));
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return (
		<header
			className={[
				'sticky top-0 z-50 transition-all duration-300',
				scrolled ? 'px-4 pt-2' : 'px-0 pt-0',
			].join(' ')}
		>
			<nav
				className={cn(
					'md:grid md:grid-cols-[1fr_auto_1fr] flex items-center justify-between px-6 text-base-foreground transition-all duration-300',
					scrolled
						? 'py-2 pl-4 pr-3 -mx-2 md:mx-0 rounded-full bg-base/70 backdrop-blur-lg shadow-lg'
						: 'py-4 rounded-none bg-transparent',
				)}
			>
				<button
					type="button"
					className="origin-left transition-transform duration-300 cursor-pointer"
					style={{ transform: scrolled ? 'scale(0.9)' : 'scale(1)' }}
					onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
					aria-label="Scroll to top"
				>
					<HextimatorLogo scale={0.6} />
				</button>
				<div className="hidden md:flex flex-row gap-4">
					<NavLinks />
				</div>
				<div className={'hidden items-center justify-end gap-4 md:flex'}>
					<DarkModeSwitch />
				</div>

				<div className={cn('flex items-center gap-3 md:hidden')}>
					<DarkModeSwitch />
					<button
						type="button"
						className="text-base-foreground cursor-pointer"
						onClick={() => setOpen((v) => !v)}
						aria-label={open ? 'Close menu' : 'Open menu'}
					>
						{open ? <Xmark width="1.2rem" /> : <Menu width="1.2rem" />}
					</button>
				</div>
			</nav>
			{open && (
				<button
					type="button"
					className="fixed inset-0 z-40 md:hidden"
					onClick={() => setOpen(false)}
					aria-label="Close menu"
				/>
			)}
			<div
				className={cn(
					'absolute left-0 right-0 z-50 mx-4 mt-2 flex flex-col gap-2 px-4 py-3 rounded-2xl bg-base/70 backdrop-blur-lg shadow-lg md:hidden transition-all duration-300',
					open
						? 'opacity-100 translate-y-0'
						: 'opacity-0 -translate-y-2 pointer-events-none',
				)}
			>
				<NavLinks onNavigate={() => setOpen(false)} />
			</div>
		</header>
	);
}
