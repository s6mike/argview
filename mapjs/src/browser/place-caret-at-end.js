/*global require, window, document */
const jQuery = require('jquery');
jQuery.fn.placeCaretAtEnd = function () {
	'use strict';

	if (!window.getSelection || !document.createRange) {
		return;
	}
	const el = this[0],
		range = document.createRange(),
		sel = window.getSelection();
	range.selectNodeContents(el);
	range.collapse(false);
	sel.removeAllRanges();
	sel.addRange(range);
};

