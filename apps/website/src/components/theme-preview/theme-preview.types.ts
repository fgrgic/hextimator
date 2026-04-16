import type { ComponentPropsWithRef } from 'react';

export type ThemePreviewProps = ComponentPropsWithRef<'div'> & {
	defaultActive?: string | null;
};
