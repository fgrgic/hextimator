import { expect, test } from 'bun:test';
import { hextimate, presets, themes } from './index';

for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
	test(`${name} theme matches its legacy preset in light and dark mode`, () => {
		for (const accent of ['#6366F1', '#ffcc00', '#808080']) {
			const legacy = hextimate(accent).preset(presets[name]);
			const theme = hextimate(accent, themes[name]);

			expect(theme.format()).toEqual(legacy.format());
			expect(theme.format({ as: 'object' })).toEqual(
				legacy.format({ as: 'object' }),
			);
		}
	});
}
