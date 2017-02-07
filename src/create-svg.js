/*global module, require, document */
const jQuery = require('jquery');
module.exports = function createSVG(tag) {
	'use strict';
	return jQuery(document.createElementNS('http://www.w3.org/2000/svg', tag || 'svg'));
};
