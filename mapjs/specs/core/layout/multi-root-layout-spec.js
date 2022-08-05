/*global describe, beforeEach, it, require, expect*/
const MultiRootLayout = require('../../../src/core/layout/multi-root-layout');

describe('MultiRootLayout', function () {
	'use strict';
	let underTest,
		rootLayouts,
		defaultRootMargin;
	beforeEach(function () {
		underTest = new MultiRootLayout();
		rootLayouts = {
			first: {
				1: {level: 1, x: -50, y: -10, height: 20, width: 100}
			},
			second: {
				2: {level: 1, x: -40, y: -12, height: 24, width: 80}
			},
			third: {
				3: {level: 1, x: -30, y: -12, height: 24, width: 60},
				4: {level: 2, x: -30, y: 22, height: 24, width: 60}
			}
		};
		defaultRootMargin = 20;
	});
	it('should throw an exception if no margin supplied', function () {
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1});
		expect(function () {
			underTest.getCombinedLayout();
		}).toThrow();
	});
	it('should return a single root layout unchanged', function () {
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1});
		expect(underTest.getCombinedLayout(defaultRootMargin)).toEqual(rootLayouts.first);
	});
	it('should push layouts without advisory locations vertically when that movement is smaller', function () {
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1});
		underTest.appendRootNodeLayout(rootLayouts.second, {id: 2});
		expect(underTest.getCombinedLayout(defaultRootMargin)).toEqual({
			1: { level: 1, x: -50, y: -10, height: 20, width: 100, rootId: 1},
			2: { level: 1, x: -40, y: 50, height: 24, width: 80, rootId: 2}
		});
	});
	it('should push layouts without advisory locations horizontally when that movement is smaller', function () {
		//rootLayouts.second[2].x = 45;
		rootLayouts.first = {
			1: {level: 1, x: -4, y: -10, height: 20, width: 8}
		};
		rootLayouts.second = {
			2: {level: 1, x: -5, y: -12, height: 24, width: 10}
		};
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1});
		underTest.appendRootNodeLayout(rootLayouts.second, {id: 2});
		expect(underTest.getCombinedLayout(defaultRootMargin)).toEqual({
			1: { level: 1, x: -4, y: -10, height: 20, width: 8, rootId: 1},
			2: { level: 1, x: 44, y: -12, height: 24, width: 10, rootId: 2}
		});
	});
	it('should push layouts with advisory locations horizontally when that movement is smaller', function () {
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1, attr: {position: [-50, -10, 2]}});
		underTest.appendRootNodeLayout(rootLayouts.second, {id: 2, attr: {position: [45, -5, 1]}});
		expect(underTest.getCombinedLayout(defaultRootMargin)).toEqual({
			1: { level: 1, x: -50, y: -10, height: 20, width: 100, rootId: 1},
			2: { level: 1, x: 90, y: -5, height: 24, width: 80, rootId: 2}
		});
	});

	it('should push layouts with advisory locations vertically when that movement is smaller', function () {
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1, attr: {position: [-50, -10, 2]}});
		underTest.appendRootNodeLayout(rootLayouts.second, {id: 2, attr: {position: [-40, 10, 1]}});
		expect(underTest.getCombinedLayout(defaultRootMargin)).toEqual({
			1: { level: 1, x: -50, y: -10, height: 20, width: 100, rootId: 1},
			2: { level: 1, x: -40, y: 50, height: 24, width: 80, rootId: 2}
		});
	});
	it('should put layouts into desired positions if not overlapping', function () {
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1, attr: {position: [-200, -100, 2]}});
		underTest.appendRootNodeLayout(rootLayouts.second, {id: 2, attr: {position: [200, 50, 1]}});
		expect(underTest.getCombinedLayout(defaultRootMargin)).toEqual({
			1: { level: 1, x: -200, y: -100, height: 20, width: 100, rootId: 1},
			2: { level: 1, x: 200, y: 50, height: 24, width: 80, rootId: 2}
		});
	});
	it('should place layouts with advisory locations ordered by how close they are to map center', function () {
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1, attr: {position: [-50, -10, 2]}});
		underTest.appendRootNodeLayout(rootLayouts.second, {id: 2, attr: {position: [-35, 50, 1]}});
		underTest.appendRootNodeLayout(rootLayouts.third, {id: 3, attr: {position: [-40, 5, 1]}});
		expect(underTest.getCombinedLayout(defaultRootMargin)).toEqual({
			1: { level: 1, x: -50, y: -10, height: 20, width: 100, rootId: 1},
			2: { level: 1, x: 60, y: 50, height: 24, width: 80, rootId: 2},
			3: { level: 1, x: -40, y: 50, height: 24, width: 60, rootId: 3},
			4: { level: 2, x: -40, y: 84, height: 24, width: 60, rootId: 3}
		});
	});
	it('should place layouts with advisory locations ordered by how close they are to context node', function () {
		underTest.appendRootNodeLayout(rootLayouts.first, {id: 1, attr: {position: [-50, -10, 2]}});
		underTest.appendRootNodeLayout(rootLayouts.second, {id: 2, attr: {position: [-40, 10, 1]}});
		underTest.appendRootNodeLayout(rootLayouts.third, {id: 3, attr: {position: [-40, 5, 1]}});
		expect(underTest.getCombinedLayout(defaultRootMargin, {contextNode: 4})).toEqual({
			1: { level: 1, x: -50, y: -119, height: 20, width: 100, rootId: 1},
			2: { level: 1, x: -40, y: -59, height: 24, width: 80, rootId: 2},
			3: { level: 1, x: -40, y: 5, height: 24, width: 60, rootId: 3},
			4: { level: 2, x: -40, y: 39, height: 24, width: 60, rootId: 3}
		});
	});

});
