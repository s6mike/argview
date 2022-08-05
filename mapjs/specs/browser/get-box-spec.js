/*global describe, it, beforeEach, afterEach, expect, require */
const jQuery = require('jquery');
require('../../src/browser/get-box');

describe('getBox', function () {
	'use strict';
	let underTest;
	beforeEach(function () {
		underTest = jQuery('<div>').appendTo('body').css({
			position: 'absolute',
			top: '200px',
			left: '300px',
			width: '150px',
			height: '20px'
		});

	});
	afterEach(function () {
		underTest.remove();
	});
	it('retrieves offset box from a DOM element', function () {
		expect(underTest.getBox()).toEqual({
			top: 200,
			left: 300,
			width: 150,
			height: 20
		});
	});
	it('retrieves the offset box from the first element of a jQuery selector', function () {
		const another = jQuery('<div>');
		expect(underTest.add(another).getBox()).toEqual({
			top: 200,
			left: 300,
			width: 150,
			height: 20
		});
	});
	it('returns false if selector is empty', function () {
		expect(jQuery('#non-existent').getBox()).toBeFalsy();
	});
});

