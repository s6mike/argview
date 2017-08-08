/*global require */
const jQuery = require('jquery');
require('./get-box');
jQuery.fn.getDataBox = function () {
	'use strict';
	const domShapeData = this.data();
	if (domShapeData && domShapeData.width && domShapeData.height) {
		return {
			top: domShapeData.y,
			left: domShapeData.x,
			width: domShapeData.width,
			height: domShapeData.height
		};
	}
	return this.getBox();
};

