/*global require, describe, expect, beforeEach, afterEach, it */
const jQuery = require('jquery');

require('../../src/browser/set-theme-class-list');

describe('setThemeClassList', function () {
	'use strict';
	let underTest, domElement;
	beforeEach(function () {
		underTest = jQuery('<div>').appendTo('body');
		domElement = underTest[0];
		domElement.classList.add.apply(domElement.classList, ['level_2', 'attr_foo']);
	});
	afterEach(function () {
		underTest.remove();
	});
	it('should remove theme classes that are already set on the element', function () {
		underTest.setThemeClassList([]);
		expect(underTest.attr('class')).toEqual('');
	});
	it('should remove theme classes if no array is supplied', function () {
		underTest.setThemeClassList();
		expect(underTest.attr('class')).toEqual('');
	});
	it('should not remove non theme classes that are already set on the element', function () {
		domElement.classList.add.apply(domElement.classList, ['foo', 'bar']);
		underTest.setThemeClassList([]);
		expect(underTest.attr('class')).toEqual('foo bar');
	});
	it('should not add the default class', function () {
		underTest.setThemeClassList(['default']);
		expect(underTest.attr('class')).toEqual('');

	});
	it('should add theme classes to the element', function () {
		underTest.setThemeClassList(['level_3', 'attr_bar']);
		expect(underTest.attr('class')).toEqual('level_3 attr_bar');
		expect(underTest.hasClass('level_3')).toBeTruthy();
		expect(underTest.hasClass('attr_bar')).toBeTruthy();
	});
	it('should not duplicate classes on the element', function () {
		underTest.setThemeClassList(['level_2', 'attr_bar']);
		expect(underTest.attr('class')).toEqual('level_2 attr_bar');

	});

});

