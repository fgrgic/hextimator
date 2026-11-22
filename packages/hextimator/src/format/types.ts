import type { HextimateFormatOptions } from '../types';

export type FormatOptions = HextimateFormatOptions;

export interface TokenEntry {
	role: string;
	variant: string;
	isDefault: boolean;
	value: string;
}

export type FlatTokenMap = Record<string, string>;
export type NestedTokenMap = Record<string, Record<string, string>>;
export type FormatResult = FlatTokenMap | NestedTokenMap | string;
