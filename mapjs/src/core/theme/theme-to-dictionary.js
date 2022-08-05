/*global module*/

module.exports = function themeToDictionary(themeJson) {
	'use strict';
	const themeDictionary = Object.assign({}, themeJson),
		nodeArray = themeDictionary.node;
	if (themeDictionary && Array.isArray(themeDictionary.node)) {
		themeDictionary.node = {};
		nodeArray.forEach(function (nodeStyle) {
			themeDictionary.node[nodeStyle.name] = nodeStyle;
		});
	}
	return themeDictionary;
};
