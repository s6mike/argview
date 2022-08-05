/*global require */
const jQuery = require('jquery');
jQuery.fn.getBox = function () {
	'use strict';
	const domShape = this && this[0];
	if (!domShape) {
		return false;
	}
	return {
		top: domShape.offsetTop,
		left: domShape.offsetLeft,
		width: domShape.offsetWidth,
		height: domShape.offsetHeight
	};
};

