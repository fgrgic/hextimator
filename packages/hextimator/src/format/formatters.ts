import type { FlatTokenMap, NestedTokenMap, TokenEntry } from './types';

function toFlatKey(entry: TokenEntry, sep: string): string {
	if (entry.isDefault && entry.variant === 'DEFAULT') return entry.role;
	return `${entry.role}${sep}${entry.variant}`;
}

export function formatObject(entries: TokenEntry[], sep: string): FlatTokenMap {
	const result: FlatTokenMap = {};
	for (const entry of entries) {
		result[toFlatKey(entry, sep)] = entry.value;
	}
	return result;
}

export function formatCSS(entries: TokenEntry[], sep: string): FlatTokenMap {
	const result: FlatTokenMap = {};
	for (const entry of entries) {
		result[`--${toFlatKey(entry, sep)}`] = entry.value;
	}
	return result;
}

export function formatSCSS(entries: TokenEntry[], sep: string): FlatTokenMap {
	const result: FlatTokenMap = {};
	for (const entry of entries) {
		result[`$${toFlatKey(entry, sep)}`] = entry.value;
	}
	return result;
}

export function formatTailwind(entries: TokenEntry[]): NestedTokenMap {
	const result: NestedTokenMap = {};
	for (const { role, variant, value } of entries) {
		if (!result[role]) result[role] = {};
		result[role][variant] = value;
	}
	return result;
}

export function formatJSON(entries: TokenEntry[], sep: string): string {
	return JSON.stringify(formatObject(entries, sep), null, 2);
}
