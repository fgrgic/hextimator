import {
	type CSSProperties,
	type SVGProps,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { cn } from '../../utils/cn';
import { HextimatorLogo } from './hextimator-logo';
import {
	HEXTIMATOR_ICON_PATH,
	HEXTIMATOR_WORDMARK_PATHS,
	LOGO_VIEWBOX,
} from './logo-paths';

const SESSION_KEY = 'hextimator-logo-reveal-seen';
const REVEAL_DURATION_MS = 900;

let revealInProgress = false;

function shouldPlayReveal() {
	if (typeof window === 'undefined') return false;
	if (revealInProgress) return true;
	if (sessionStorage.getItem(SESSION_KEY)) return false;
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function markRevealComplete() {
	sessionStorage.setItem(SESSION_KEY, '1');
	revealInProgress = false;
}

function RevealingLogo({
	width,
	height,
	className,
	...props
}: SVGProps<SVGSVGElement> & { width: number; height: number }) {
	const strokeRef = useRef<SVGPathElement>(null);
	const [pathLength, setPathLength] = useState(0);
	const [active, setActive] = useState(false);

	useLayoutEffect(() => {
		if (!strokeRef.current) return;
		const length = strokeRef.current.getTotalLength();
		setPathLength(length);
		const frame = requestAnimationFrame(() => setActive(true));
		return () => cancelAnimationFrame(frame);
	}, []);

	useEffect(() => {
		if (!active) return;
		const timer = window.setTimeout(markRevealComplete, REVEAL_DURATION_MS);
		return () => window.clearTimeout(timer);
	}, [active]);

	return (
		<svg
			width={width}
			height={height}
			viewBox={LOGO_VIEWBOX}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn('logo-reveal', active && 'logo-reveal--active', className)}
			style={
				{
					'--logo-path-length': pathLength,
				} as CSSProperties
			}
			aria-hidden="true"
			{...props}
		>
			<path
				ref={strokeRef}
				d={HEXTIMATOR_ICON_PATH}
				className="logo-reveal__icon-stroke"
				fill="none"
				stroke="currentColor"
				strokeWidth={0.75}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d={HEXTIMATOR_ICON_PATH}
				className="logo-reveal__icon-fill"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
			<g className="logo-reveal__wordmark">
				{HEXTIMATOR_WORDMARK_PATHS.map((d) => (
					<path key={d.slice(0, 12)} d={d} fill="currentColor" />
				))}
			</g>
		</svg>
	);
}

export function HextimatorLogoReveal(
	props: SVGProps<SVGSVGElement> & { scale?: number },
) {
	const {
		scale,
		className,
		width: widthProp,
		height: heightProp,
		...svgProps
	} = props;
	const width = scale ? scale * 257 : Number(widthProp ?? 257);
	const height = scale ? scale * 40 : Number(heightProp ?? 40);

	const [animate, setAnimate] = useState(false);

	const startReveal = useCallback(() => {
		if (!shouldPlayReveal()) return;
		revealInProgress = true;
		setAnimate(true);
	}, []);

	useLayoutEffect(() => {
		startReveal();
	}, [startReveal]);

	if (!animate) {
		return (
			<HextimatorLogo
				scale={scale}
				className={className}
				aria-hidden="true"
				{...svgProps}
			/>
		);
	}

	return (
		<RevealingLogo
			width={width}
			height={height}
			className={className}
			{...svgProps}
		/>
	);
}
