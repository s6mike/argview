/*global module, require*/
const deepAssign = require('../deep-assign'),
	isObjectObject = require('../is-object-object');
module.exports = function mergeThemes(theme, themeOverride) {
	'use strict';
	if (!isObjectObject(theme) || !isObjectObject(themeOverride)) {
		throw new Error('invalid-args');
	}
	if (theme.blockThemeOverrides) {
		return theme;
	}
	const themeNode = theme.node || [],
		themeOverrideNodes = themeOverride.node,
		mergedTheme = deepAssign({}, theme, themeOverride);
	if (themeOverrideNodes && themeOverrideNodes.length) {
		mergedTheme.node = [];
		themeNode.forEach(node => {
			const toMerge = themeOverrideNodes.find(overrride => overrride.name === node.name) || {};
			mergedTheme.node.push(deepAssign({}, node, toMerge));
		});
		themeOverrideNodes.forEach(overrride => {
			if (!mergedTheme.node.find(node => node.name === overrride.name)) {
				const toAdd = deepAssign({}, overrride);
				mergedTheme.node.push(toAdd);
			}
		});
	}
	return mergedTheme;
};
