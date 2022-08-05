/*global describe, it, expect, require */
const nodeCacheMark = require('../../src/browser/node-cache-mark'),
	Theme = require('../../src/core/theme/theme');
describe('nodeCacheMark', function () {
	'use strict';

	describe('returns the same value for two nodes if they have the same title, icon sizes, levels and positions, groups and collapsed attribute', function () {
		[
			['no icons, just titles', {level: 1, title: 'zeka', x: 1, attr: {ignored: 1}}, {level: 1, title: 'zeka', x: 2, attr: {ignored: 2}}],
			['titles and collapsed', {level: 1, title: 'zeka', x: 1, attr: {ignored: 1, collapsed: true}}, {level: 1, title: 'zeka', x: 2, attr: {ignored: 2, collapsed: true}}],
			['titles and icon', {level: 1, title: 'zeka', x: 1, attr: { ignored: 1, icon: {width: 100, height: 120, position: 'top', url: '1'} }}, {level: 1, title: 'zeka', x: 2, attr: {ignored: 2, icon: {width: 100, height: 120, position: 'top', url: '2'}}}],
			['titles and groups', {level: 1, title: 'zeka', x: 1, attr: {group: 'xx', ignored: 1}}, {level: 1, title: 'zeka', x: 2, attr: {ignored: 2, group: 'xx'}}]
		].forEach(function (testCase) {
			const testName = testCase[0],
				first = testCase[1],
				second = testCase[2];
			it(testName, function () {
				expect(nodeCacheMark(first)).toEqual(nodeCacheMark(second));
			});
		});
	});
	describe('returns different values for two nodes if they differ', function () {
		[
			['titles', {title: 'zeka'}, {title: 'zeka2'}],
			['levels', {title: 'zeka', level: 2}, {title: 'zeka', level: 1}],
			['groups', {title: 'zeka', level: 3, attr: {group: 's1'}}, {title: 'zeka', level: 3, attr: { group: 's2' }}],
			['collapsed', {title: 'zeka', attr: {collapsed: true}}, {title: 'zeka', attr: {collapsed: false}}],
			['icon width', {title: 'zeka', attr: { icon: {width: 100, height: 120, position: 'top'} }}, {title: 'zeka', attr: { icon: {width: 101, height: 120, position: 'top'}}}],
			['icon height', {title: 'zeka', attr: { icon: {width: 100, height: 120, position: 'top'} }}, {title: 'zeka', attr: { icon: {width: 100, height: 121, position: 'top'}}}],
			['icon position', {title: 'zeka', attr: { icon: {width: 100, height: 120, position: 'left'} }}, {title: 'zeka', attr: {icon: {width: 100, height: 120, position: 'top'}}}]
		].forEach(function (testCase) {
			const testName = testCase[0],
				first = testCase[1],
				second = testCase[2];

			it(testName, function () {
				expect(nodeCacheMark(first)).not.toEqual(nodeCacheMark(second, {theme: new Theme({})}));
			});
		});
	});
	it('ignores group titles', function () {
		expect(nodeCacheMark({title: 'zeka', attr: {group: 'supporting'}})).toEqual(nodeCacheMark({title: '', attr: {group: 'supporting'}}));
	});
});

