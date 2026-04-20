import { useContext } from 'react';
import { HextimatorContext, type HextimatorContextValue } from './context';

/**
 * Reads the current theme from the nearest `HextimatorProvider` or
 * `HextimatorScope`. See `HextimatorContextValue` for the returned fields.
 *
 * @example
 * ```tsx
 * const { mode, setMode } = useHextimatorTheme();
 * <button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
 *   Toggle dark mode
 * </button>
 * ```
 *
 * @throws If used outside of a `HextimatorProvider` or `HextimatorScope`.
 */
export function useHextimatorTheme(): HextimatorContextValue {
	const ctx = useContext(HextimatorContext);
	if (!ctx) {
		throw new Error(
			'useHextimatorTheme must be used within a <HextimatorProvider> or <HextimatorScope>',
		);
	}
	return ctx;
}
