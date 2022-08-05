/*global describe, it, beforeEach, afterEach, expect, spyOn, require */
const jQuery = require('jquery');
require('../helpers/jquery-extension-matchers');
describe('toHaveBeenCalledOnJQueryObject matcher', function () {
	'use strict';
	let underTest1, underTest2;
	beforeEach(function () {
		underTest1 = jQuery('<div id="fst">').appendTo('body');
		underTest2 = jQuery('<div id="snd">').appendTo('body');
		spyOn(jQuery.fn, 'focus');
	});
	afterEach(function () {
		underTest1.remove();
		underTest2.remove();
	});
	it('checks that a function was applied to a jQuery selector by comparing elements', function () {
		underTest1.focus();
		expect(jQuery.fn.focus).toHaveBeenCalledOnJQueryObject(underTest1);
		expect(jQuery.fn.focus).toHaveBeenCalledOnJQueryObject(jQuery('#fst'));
		expect(jQuery.fn.focus).not.toHaveBeenCalledOnJQueryObject(underTest2);
		expect(jQuery.fn.focus).not.toHaveBeenCalledOnJQueryObject(jQuery('#snd'));
	});
});
describe('toHaveOwnStyle', function () {
	'use strict';
	let underTest;
	beforeEach(function () {
		underTest = jQuery('<div id="fst">').appendTo('body');
	});
	afterEach(function () {
		underTest.remove();
	});
	it('checks that a function was applied to a jQuery selector by comparing elements', function () {
		underTest.css('outline', 'none');
		expect(underTest).toHaveOwnStyle('outline');
		expect(underTest).not.toHaveOwnStyle('display');
	});
	it('checks for any of the styles in the array', function () {
		underTest.css('outline', 'none');
		expect(underTest).toHaveOwnStyle(['outline', 'display']);
		expect(underTest).not.toHaveOwnStyle(['display', 'z-index']);
	});

});


