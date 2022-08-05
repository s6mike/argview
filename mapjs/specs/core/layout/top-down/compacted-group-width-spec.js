/*global describe, it, expect, require */
const compactedGroupWidth = require('../../../../src/core/layout/top-down/compacted-group-width');
describe('compactedGroupWidth', function () {
	'use strict';
	it('does not add margins if the group contains a single node', () => {
		expect(compactedGroupWidth([{width: 20}], 10)).toEqual(20);
	});
	it('adds margins between nodes to calculate full width', () => {
		expect(compactedGroupWidth([{width: 15}, {width: 30}], 10)).toEqual(55);
	});
	it('returns 0 for empty groups', () => {
		expect(compactedGroupWidth([], 10)).toEqual(0);
		expect(compactedGroupWidth(false, 10)).toEqual(0);
	});
});
