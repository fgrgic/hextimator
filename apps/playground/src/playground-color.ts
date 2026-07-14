export const DEFAULT_PLAYGROUND_COLOR = '#3a86ff';

export function getColorFromPath(pathname: string): string {
	const path = pathname.replace(/^\//, '');
	if (/^[0-9a-fA-F]{3,8}$/.test(path)) return `#${path}`;
	return DEFAULT_PLAYGROUND_COLOR;
}

export function isHexPath(pathname: string): boolean {
	return /^\/[0-9a-fA-F]{3,8}$/.test(pathname);
}
