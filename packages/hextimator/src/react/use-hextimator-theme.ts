import { useContext } from 'react';
import { HextimatorContext, type HextimatorContextValue } from './context';

/**
 * Provides access to the current Hextimator palette and theme state from the
 * nearest `HextimatorProvider` or `HextimatorScope`. When called from inside a
 * `HextimatorScope`, returns the scope's palette and `color`/`setColor` state;
 * `mode` and `setMode` are inherited from the nearest enclosing provider.
 *
 * Returned properties:
 * - `color` / `setColor` — the current base color for this scope or provider.
 * - `mode` — the resolved color mode (`'light'` or `'dark'`), accounting for OS preference when set to `'system'`.
 * - `modePreference` — the raw preference (`'light'`, `'dark'`, or `'system'`).
 * - `setMode` — update the mode preference. Pass `'system'` to follow the OS.
 * - `style` / `setStyle` — palette style options.
 * - `configure` / `setConfigure` — builder configuration callback.
 * - `palette` — the generated `HextimateResult`.
 *
 * @example
 * ```tsx
 * const { mode, setMode } = useHextimatorTheme();
 *
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
