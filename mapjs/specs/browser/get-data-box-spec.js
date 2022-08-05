/*global describe, it, beforeEach, afterEach, expect, require */
const jQuery = require('jquery');
require('../../src/browser/get-data-box');
describe('getDataBox', function () {
	'use strict';
	let underTest, stage;
	beforeEach(function () {
		stage = jQuery('<div>').appendTo('body');
		underTest = jQuery('<div>').appendTo(stage).css({
			position: 'absolute',
			top: '200px',
			left: '300px',
			width: '150px',
			height: '20px'
		}).data({
			x: 11,
			y: 12,
			width: 13,
			height: 14
		});
	});
	afterEach(function () {
		underTest.remove();
		stage.remove();
	});
	it('retrieves a pre-calculated box from data attributes if they are present', function () {
		expect(underTest.getDataBox()).toEqual({
			left: 11,
			top: 12,
			width: 13,
			height: 14
		});
	});
	it('ignores stage offset and zoom', function () {
		stage.data({'offsetX': 200, 'offsetY': 300, 'scale': 2});
		expect(underTest.getDataBox()).toEqual({
			left: 11,
			top: 12,
			width: 13,
			height: 14
		});
	});
	['width', 'height'].forEach(function (attrib) {
		it('falls back to DOM boxing if data attribute ' + attrib + ' is not present', function () {
			underTest.data(attrib, '');
			expect(underTest.getDataBox()).toEqual({
				top: 200,
				left: 300,
				width: 150,
				height: 20
			});
		});
	});
	it('returns false if selector is empty', function () {
		expect(jQuery('#non-existent').getDataBox()).toBeFalsy();
	});
});

