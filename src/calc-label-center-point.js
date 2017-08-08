/*global module */
module.exports = function calcLabelCenterPoint(connection, toBox, pathDOM, labelTheme) {
	'use strict';
	if (labelTheme.position.ratio) {
		return pathDOM.getPointAtLength(pathDOM.getTotalLength() * labelTheme.position.ratio);
	}
	return {
		x: toBox.left + (toBox.width / 2) - connection.position.left,
		y: toBox.top - connection.position.top - labelTheme.position.aboveEnd
	};
};

