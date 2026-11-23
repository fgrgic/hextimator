import type { HextimateResult } from 'hextimator';
import { baseTheme, hextimate, presets, themes } from 'hextimator';
import { useCallback, useEffect, useRef, useState } from 'react';

type ColorFormat =
	| 'hex'
	| 'hsl'
	| 'hsl-raw'
	| 'oklch'
	| 'oklch-raw'
	| 'p3'
	| 'p3-raw'
	| 'rgb'
	| 'rgb-raw';

type CodeEvalResult = {
	object: HextimateResult | null;
	hex: HextimateResult | null;
	error: string | null;
};

export type { ColorFormat };

export function useCodeEval(
	code: string,
	color: string,
	colorFormat: ColorFormat = 'hex',
	debounceMs = 300,
) {
	const [result, setResult] = useState<CodeEvalResult>({
		object: null,
		hex: null,
		error: null,
	});
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const lastHexRef = useRef<HextimateResult | null>(null);
	const lastObjectRef = useRef<HextimateResult | null>(null);

	const evaluate = useCallback(
		(source: string, currentColor: string, format: ColorFormat) => {
			try {
				const fn = new Function(
					'hextimate',
					'presets',
					'themes',
					'baseTheme',
					'color',
					`"use strict";\nreturn (\n${source}\n);`,
				);
				const builder = fn(hextimate, presets, themes, baseTheme, currentColor);

				if (!builder || typeof builder.format !== 'function') {
					setResult({
						object: lastObjectRef.current,
						hex: lastHexRef.current,
						error:
							'Code must return a HextimatePaletteBuilder (the result of hextimate() chaining).',
					});
					return;
				}

				const object = builder.format({ as: 'object', colors: format });
				const hex = builder.format({ as: 'object', colors: 'hex' });

				lastHexRef.current = hex;
				lastObjectRef.current = object;
				setResult({ object, hex, error: null });
			} catch (e) {
				setResult({
					object: lastObjectRef.current,
					hex: lastHexRef.current,
					error: e instanceof Error ? e.message : String(e),
				});
			}
		},
		[],
	);

	useEffect(() => {
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(
			() => evaluate(code, color, colorFormat),
			debounceMs,
		);
		return () => clearTimeout(timerRef.current);
	}, [code, color, colorFormat, debounceMs, evaluate]);

	return result;
}
