/*global MAPJS, _*/
MAPJS.Theme = function (themeJson) {
	'use strict';
	var self = this,
		themeDictionary = _.extend({}, themeJson),
		getElementForPath = function (object, pathArray) {
			var remaining = pathArray.slice(0),
				current = object;

			while (remaining.length > 0) {
				current = current[remaining[0]];
				if (current === undefined) {
					return;
				}
				remaining = remaining.slice(1);
			}
			return current;
		};
	self.attributeValue = function (prefixes, styles, postfixes, fallback) {
		var rootElement = getElementForPath(themeDictionary, prefixes),
			merged = {},
			result;
		if (!rootElement) {
			return fallback;
		}
		styles.reverse().forEach(function (style) {
			merged = _.extend(merged, rootElement[style]);
		});
		result = getElementForPath(merged, postfixes);
		if (result === undefined) {
			return fallback;
		}
		return result;
	};

	if (themeDictionary && themeDictionary.node && themeDictionary.node.forEach) {
		themeDictionary.nodeArray = themeDictionary.node;
		themeDictionary.node = {};
		themeDictionary.nodeArray.forEach(function (nodeStyle) {
			themeDictionary.node[nodeStyle.name] = nodeStyle;
		});
		delete themeDictionary.nodeArray;
	}
};
