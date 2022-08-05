/*global describe, it, expect, beforeEach, require */
const underTest = require('../../../../src/core/layout/top-down/sort-nodes-by-left-position');
describe('sortNodesByLeftPosition', () => {
	'use strict';
	let first, second, third;
	beforeEach(() => {
		third = {x: 10, width: 5};
		first = {x: -2, width: 3};
		second = {x: 0, width: 5};
	});
	it('does not do anything in case of an empty array', () => {
		expect(underTest()).toBeFalsy();
		expect(underTest([])).toEqual([]);
	});
	it('sorts an array of nodes by left position', () => {
		expect(underTest([third, first, second])).toEqual([first, second, third]);
		expect(underTest([first, third, second])).toEqual([first, second, third]);
		expect(underTest([first, second, third])).toEqual([first, second, third]);
	});
	it('does not change a single-element array', () => {
		expect(underTest([first])).toEqual([first]);
	});
});
