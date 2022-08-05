/*global describe, it, expect, require, beforeEach */
const calcMaxWidth = require('../../../src/core/util/calc-max-width');
describe('calcMaxWidth', () => {
	'use strict';
	let theme;
	beforeEach(() => {
		theme = {
			text: {
				maxWidth: 150,
				margin: 10
			}
		};
	});
	it('uses node width when it is specified instead of theme default width', () => {
		expect(calcMaxWidth({style: {width: 300}}, theme)).toEqual(300);
	});
	it('uses the theme default width if the node style does not override it', () => {
		expect(calcMaxWidth({}, theme)).toEqual(150);
	});

});
