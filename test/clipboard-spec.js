/*global describe, it, expect, MAPJS, beforeEach*/
describe('MAPJS.MemoryClipboard', function () {
	'use strict';
	var underTest;
	beforeEach(function () {
		underTest = new MAPJS.MemoryClipboard();
	});
	it('returns undefined if nothing is saved', function () {
		expect(underTest.get()).toBeUndefined();
	});
	it('returns saved content as object if it is saved', function () {
		underTest.put([1, 2, 'c', {d: 1}]);
		expect(underTest.get()).toEqual([1, 2, 'c', {d: 1}]);
	});
	it('returns same object multiple times if asked for', function () {
		underTest.put([1, 2, 'c', {d: 1}]);
		underTest.get();

		expect(underTest.get()).toEqual([1, 2, 'c', {d: 1}]);
	});
	it('returns latest saved object', function () {
		underTest.put([1, 2, 'c', {d: 1}]);

		underTest.put([2, 'd', {e: 1}]);

		expect(underTest.get()).toEqual([2, 'd', {e: 1}]);

	});
	it('deep clones the object when stored', function () {
		var content = [1, 2, 'c', {d: 1}];
		underTest.put(content);
		content[0] = 2;

		expect(underTest.get()).toEqual([1, 2, 'c', {d: 1}]);
	});
	it('deep clones the object when retrieved', function () {
		underTest.put([1, 2, 'c', {d: 1}]);
		var retrieved = underTest.get();
		retrieved[0] = 2;

		expect(underTest.get()).toEqual([1, 2, 'c', {d: 1}]);
	});
});
