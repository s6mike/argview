/*global module */
module.exports = function compactedGroupWidth(nodeGroup, margin) {
	'use strict';
	if (!nodeGroup || !nodeGroup.length) {
		return 0;
	}
	const totalWidth = nodeGroup.reduce((total, current) => total + current.width, 0),
		requiredMargins = (nodeGroup.length - 1) * margin;
	return  totalWidth + requiredMargins;
};
