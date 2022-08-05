/*global document, describe, it, expect, require, window, afterEach */

const jQuery = require('jquery');
require('../../src/browser/place-caret-at-end');

describe('placeCaretAtEnd', () => {
	'use strict';
	let underTest;
	afterEach(() => {
		underTest.remove();
	});
	it('works on contenteditable divs', () => {
		underTest = jQuery('<span>').html('some text').appendTo('body');
		underTest.placeCaretAtEnd();
		const selection = window.getSelection(),
			range = selection.getRangeAt(0);
		expect(selection.type).toEqual('Caret');
		expect(selection.rangeCount).toEqual(1);
		range.surroundContents(document.createElement('i'));
		expect(underTest.html()).toEqual('some text<i></i>');
	});

});
