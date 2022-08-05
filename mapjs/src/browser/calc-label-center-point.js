/*global module, require */
const defaultTheme = require('../core/theme/default-theme'),
	createSVG = require('./create-svg'),
	pathElement = createSVG('path');
module.exports = function calcLabelCenterPoint(connectionPosition, fromBox, toBox, d, labelTheme) {
	'use strict';
	labelTheme = labelTheme || defaultTheme.connector.default.label;
	const labelPosition = labelTheme.position || {};

	pathElement.attr('d', d);
	if (labelPosition.aboveEnd) {
		const middleToBox = toBox.left + (toBox.width / 2) - connectionPosition.left,
			middleFromBox = fromBox.left + (fromBox.width / 2) - connectionPosition.left,
			multiplier = labelPosition.ratio || 1;
		return {
			x: Math.round(middleFromBox + multiplier * (middleToBox - middleFromBox)),
			y: toBox.top - connectionPosition.top - labelPosition.aboveEnd
		};
	} else if (labelPosition.ratio) {
		return pathElement[0].getPointAtLength(pathElement[0].getTotalLength() * labelTheme.position.ratio);
	}

	return pathElement[0].getPointAtLength(pathElement[0].getTotalLength() * 0.5);

};

