/*global require, module */
const _ = require('underscore');
module.exports = function nodeCacheMark(idea, optional) {
	'use strict';
	const levelOverride = optional && optional.level,
		theme = (optional && optional.theme),
		isGroup = idea.attr && idea.attr.group;
	return {
		title: !isGroup && idea.title,
		width: idea.attr && idea.attr.style && idea.attr.style.width,
		theme: theme &&  theme.name,
		icon: idea.attr && idea.attr.icon && _.pick(idea.attr.icon, 'width', 'height', 'position'),
		collapsed: idea.attr && idea.attr.collapsed,
		note: !!(idea.attr && idea.attr.note),
		fontMultiplier: idea.attr && idea.attr.style && idea.attr.style.fontMultiplier,
		styles: theme &&  theme.nodeStyles(idea.level  || levelOverride, idea.attr),
		level: idea.level || levelOverride
	};
};

