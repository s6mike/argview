/*global describe, it, beforeEach, afterEach, expect, spyOn, require */
const jQuery = require('jquery');

require('../../src/browser/inner-text');
require('../helpers/jquery-extension-matchers');

describe('innerText', function () {
	'use strict';
	let underTest;
	beforeEach(function () {
		jQuery.fn.innerText.check = false;
		underTest = jQuery('<span></span>').appendTo('body');
		spyOn(jQuery.fn, 'text').and.callThrough();
	});
	afterEach(function () {
		underTest.detach();
	});
	it('executes using .text if content does not contain BR elements', function () {
		underTest.html('does\nthis\nhave\nbreaks');
		expect(underTest.innerText()).toEqual('does\nthis\nhave\nbreaks');
		expect(jQuery.fn.text).toHaveBeenCalledOnJQueryObject(underTest);
	});
	it('removes html tags and replaces BR with newlines if content contains BR elements (broken firefox contenteditable)', function () {
		underTest.html('does<br>this<br/>ha<a href="">ve</a><br>breaks');
		expect(underTest.innerText()).toEqual('does\nthis\nhave\nbreaks');
		expect(jQuery.fn.text).not.toHaveBeenCalledOnJQueryObject(underTest);
	});
	it('removes html tags and replaces divs with newlines if content contains div elements (broken safari contenteditable)', function () {
		underTest.html('does<div>this</div><div>ha<a href="">ve</a></div>breaks and spaces');
		expect(underTest.innerText()).toEqual('does\nthis\nhave\nbreaks and spaces');
		expect(jQuery.fn.text).not.toHaveBeenCalledOnJQueryObject(underTest);
	});
});

