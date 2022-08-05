/*global module, require */
const _ = require('underscore');
module.exports = function convertPositionToTransform(cssPosition) {
	'use strict';
	const position = _.omit(cssPosition, 'left', 'top');
	position.transform = 'translate(' + cssPosition.left + 'px,' + cssPosition.top  + 'px)';
	return position;
};

