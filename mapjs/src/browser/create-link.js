/*global require */
const jQuery = require('jquery'),
	createSVG = require('./create-svg'),
	linkKey = require('../core/util/link-key'),
	themeLink = require('../core/theme/link'),
	convertPositionToTransform = require('../core/util/convert-position-to-transform');

require('./get-data-box');
jQuery.fn.createLink = function (l, optional) {
	'use strict';
	const stage = this.parent('[data-mapjs-role=stage]'),
		theme = (optional && optional.theme),
		linkBuilder = (optional && optional.linkBuilder) || themeLink,
		elementData = {
			'nodeFrom': stage.nodeWithId(l.ideaIdFrom),
			'nodeTo': stage.nodeWithId(l.ideaIdTo),
			attr: (l.attr && l.attr.style) || {}
		},
		element = createSVG('g')
		.attr({
			'id': linkKey(l),
			'data-mapjs-role': 'link'
		})
		.data(elementData),
		connection = linkBuilder(elementData.nodeFrom.getDataBox(), elementData.nodeTo.getDataBox(), elementData.attrs, theme);
	element.css(Object.assign(convertPositionToTransform(connection.position), {stroke: connection.lineProps.color}));
	element.appendTo(this);
	return element;
};

