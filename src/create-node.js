/*global require*/
const jQuery = require('jquery'),
	nodeKey = require('./node-key');
jQuery.fn.createNode = function (node) {
	'use strict';
	return jQuery('<div>')
		.attr({'id': nodeKey(node.id), 'tabindex': 0, 'data-mapjs-role': 'node' })
		.css({
			display: 'block',
			position: 'absolute',
			top: Math.round(node.y || 0) + 'px',
			left: Math.round(node.x || 0) + 'px'
		})
		.addClass('mapjs-node')
		.appendTo(this);
};
