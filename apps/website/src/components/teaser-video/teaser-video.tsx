import { PlaySolid } from 'iconoir-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

const DESKTOP_SRC = '/videos/hextimator-teaser.mp4';
const MOBILE_SRC = '/videos/hextimator-teaser-mobile.mp4';
const POSTER = '/videos/hextimator-teaser-poster.jpg';

const MOBILE_QUERY = '(max-width: 767px)';

export function TeaserVideo() {
	const rootRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isMobile, setIsMobile] = useState(false);
	const [inView, setInView] = useState(false);
	const [started, setStarted] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(MOBILE_QUERY);
		const sync = () => setIsMobile(media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	}, []);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setInView(true);
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' },
		);

		observer.observe(root);
		return () => observer.disconnect();
	}, []);

	const src = isMobile ? MOBILE_SRC : DESKTOP_SRC;
	const square = isMobile && started;

	const handlePlay = () => {
		const video = videoRef.current;
		if (!video) return;

		setStarted(true);
		video.muted = false;
		void video.play().catch(() => {
			setStarted(false);
		});
	};

	return (
		<div
			ref={rootRef}
			className={cn(
				'w-full min-w-0 mx-auto px-6 mt-16 md:mt-20',
				'transition-[max-width] duration-500 ease-in-out',
				started ? 'max-w-7xl' : 'max-w-3xl',
			)}
		>
			<div
				className={cn(
					'relative w-full overflow-hidden rounded-lg bg-surface-weak',
					'transition-[aspect-ratio] duration-500 ease-in-out',
					square ? 'aspect-square' : 'aspect-video',
				)}
			>
				{inView && (
					// biome-ignore lint/a11y/useMediaCaption: teaser has no dialogue captions yet
					<video
						ref={videoRef}
						src={src}
						poster={POSTER}
						preload="none"
						playsInline
						controls={started}
						className="absolute inset-0 size-full object-cover"
						onEnded={() => {
							const video = videoRef.current;
							if (video) video.currentTime = 0;
							setStarted(false);
						}}
					/>
				)}

				{inView && !started && (
					<button
						type="button"
						onClick={handlePlay}
						aria-label="Play teaser video"
						className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
					>
						<img
							src={POSTER}
							alt=""
							decoding="async"
							className="absolute inset-0 size-full object-cover"
						/>
						<span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md transition-transform duration-200 hover:scale-105">
							<PlaySolid width="1.5rem" height="1.5rem" />
						</span>
					</button>
				)}
			</div>
		</div>
	);
}
