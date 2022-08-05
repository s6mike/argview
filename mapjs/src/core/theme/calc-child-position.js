/*global module*/

module.exports = function calcChildPosition(parent, child, tolerance) {
	'use strict';
	const childMid = child.top + child.height * 0.5;
	if (childMid < parent.top - tolerance) {
		return 'above';
	}
	if (childMid > parent.top + parent.height + tolerance) {
		return 'below';
	}
	return 'horizontal';
};
