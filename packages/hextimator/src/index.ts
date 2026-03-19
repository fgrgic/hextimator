import type { FormatResult } from './format';
import { format } from './format';
import { generate } from './generate';
import { parse } from './parse';
import type { ColorInput, HextimateOptions } from './types';

export { convert as convertColor } from './convert';
export type { FlatTokenMap, FormatResult, NestedTokenMap } from './format';
export { parse as parseColor } from './parse';
export { HextimateOptions } from './types';

export interface HextimateResult {
	light: FormatResult;
	dark: FormatResult;
}

class HextimateError extends Error {
	constructor(
		public readonly input: ColorInput,
		message?: string,
	) {
		super(message ?? `Failed to hextimate color:  ${String(input)}`);
		this.name = 'HextimateError';
	}
}

/**
 * Creates a palette from 1 base color, or more colors passed to it with additional options
 * @param color ColorInput
 * @param options HextimateOptions
 */
export function hextimate(
	color: ColorInput,
	options?: HextimateOptions,
): HextimateResult {
	try {
		const parsedColor = parse(color);

		return {
			light: format(generate(parsedColor, 'light', options), options),
			dark: format(generate(parsedColor, 'dark', options), options),
		};
	} catch (e) {
		if (e instanceof HextimateError) {
			throw e;
		}
		throw new HextimateError(
			color,
			e instanceof Error ? e.message : 'Unknown error',
		);
	}
}
