/*global module */
module.exports = function sortNodesByLeftPosition(nodes) {
	'use strict';
	if (!nodes || !nodes.length) {
		return nodes;
	}
	return [].concat(nodes).sort((a, b) => a.x - b.x);
};
