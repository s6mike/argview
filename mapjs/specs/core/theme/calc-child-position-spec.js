/*global require, describe, it, expect, beforeEach*/

const underTest = require('../../../src/core/theme/calc-child-position');

describe('calcChildPosition', () => {
	'use strict';
	let parent, child;
	beforeEach(() => {
		parent = {top: 100, height: 100};
		child = {top: 100, height: 100};
	});
	'use strict';
	it('should return above when child mid point is above the parent top with tolerance', () => {
		child.top = 39;
		expect(underTest(parent, child, 10)).toEqual('above');
	});
	it('should return below when child mid point is below the parent bottom with tolerance', () => {
		child.top = 161;
		expect(underTest(parent, child, 10)).toEqual('below');
	});
	describe('should return horizontal', () => {
		it('when child mid point is not above the parent top with tolerance', () => {
			child.top = 40;
			expect(underTest(parent, child, 10)).toEqual('horizontal');
		});
		it('when child mid point is not below the parent top with tolerance', () => {
			child.top = 160;
			expect(underTest(parent, child, 10)).toEqual('horizontal');
		});
		it('when child mid point is within then parent top and bottom', () => {
			expect(underTest(parent, child, 10)).toEqual('horizontal');
		});

	});
});
