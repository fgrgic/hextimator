import { hextimate, presets } from 'hextimator';
import type { HextimateResult } from 'hextimator';
import { useCallback, useEffect, useRef, useState } from 'react';

type ColorFormat = 'hex' | 'hsl' | 'hsl-raw' | 'oklch' | 'oklch-raw' | 'p3' | 'p3-raw' | 'rgb' | 'rgb-raw';

type CodeEvalResult = {
	object: HextimateResult | null;
	css: HextimateResult | null;
	error: string | null;
};

export type { ColorFormat };

export function useCodeEval(code: string, color: string, colorFormat: ColorFormat = 'hex', debounceMs = 300) {
	const [result, setResult] = useState<CodeEvalResult>({ object: null, css: null, error: null });
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const lastCssRef = useRef<HextimateResult | null>(null);
	const lastObjectRef = useRef<HextimateResult | null>(null);

	const evaluate = useCallback(
		(source: string, currentColor: string, format: ColorFormat) => {
			try {
				const fn = new Function(
					'hextimate',
					'presets',
					'color',
					`"use strict";\nreturn (\n${source}\n);`,
				);
				const builder = fn(hextimate, presets, currentColor);

				if (!builder || typeof builder.format !== 'function') {
					setResult({
						object: lastObjectRef.current,
						css: lastCssRef.current,
						error: 'Code must return a HextimatePaletteBuilder (the result of hextimate() chaining).',
					});
					return;
				}

				const object = builder.format({ as: 'object', colors: format });
				const css = builder.format({ as: 'css', colors: 'hex' });

				lastCssRef.current = css;
				lastObjectRef.current = object;
				setResult({ object, css, error: null });
			} catch (e) {
				setResult({
					object: lastObjectRef.current,
					css: lastCssRef.current,
					error: e instanceof Error ? e.message : String(e),
				});
			}
		},
		[],
	);

	useEffect(() => {
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => evaluate(code, color, colorFormat), debounceMs);
		return () => clearTimeout(timerRef.current);
	}, [code, color, colorFormat, debounceMs, evaluate]);

	return result;
}
