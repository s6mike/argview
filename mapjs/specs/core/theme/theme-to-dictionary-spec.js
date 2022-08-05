/*global require, describe, it, expect*/

const underTest = require('../../../src/core/theme/theme-to-dictionary'),
	defaultTheme = require('../../../src/core/theme/default-theme');

describe('themeToDictionary', () => {
	'use strict';
	['name', 'connector', 'link'].forEach(attr => {
		it(`should leave ${attr} attribute unchanged`, () => {
			expect(underTest(defaultTheme)[attr]).toEqual(defaultTheme[attr]);
		});
	});
	it('should convert the node array into a dictionary', () => {
		const expectedNodes = {
			default: defaultTheme.node[0],
			level_1: defaultTheme.node[1],
			activated: defaultTheme.node[2],
			selected: defaultTheme.node[3],
			collapsed: defaultTheme.node[4],
			'collapsed.selected': defaultTheme.node[5]
		};
		expect(underTest(defaultTheme).node).toEqual(expectedNodes);
	});
});
