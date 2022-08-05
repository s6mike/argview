/*global require */
const jQuery = require('jquery');
jQuery.fn.createReorderBounds = function () {
	'use strict';
	const result = jQuery('<div>').attr({
		'data-mapjs-role': 'reorder-bounds',
		'class': 'mapjs-reorder-bounds'
	}).hide().css('position', 'absolute').appendTo(this);
	return result;
};

