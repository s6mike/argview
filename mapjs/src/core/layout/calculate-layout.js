/*global module, require*/
const contentUpgrade = require('../content/content-upgrade'),
	Theme = require('../theme/theme'),
	extractConnectors = require('./extract-connectors'),
	extractLinks = require('./extract-links'),
	MultiRootLayout = require('./multi-root-layout'),
	nodeAttributeUtils = require('./node-attribute-utils'),
	defaultLayouts = {
		'standard': require('./standard/calculate-standard-layout'),
		'top-down': require('./top-down/calculate-top-down-layout')
	},
	formatResult = function (result, idea, theme, orientation) {
		'use strict';
		nodeAttributeUtils.setThemeAttributes(result, theme);
		return {
			orientation: orientation,
			nodes: result,
			connectors: extractConnectors(idea, result, theme),
			links: extractLinks(idea, result),
			theme: idea.attr && idea.attr.theme,
			themeOverrides: Object.assign({}, idea.attr && idea.attr.themeOverrides)
		};
	};

module.exports = function calculateLayout(idea, dimensionProvider, optional) {
	'use strict';
	const layouts = (optional && optional.layouts) || defaultLayouts,
		theme = (optional && optional.theme) || new Theme({}),
		multiRootLayout = new MultiRootLayout(),
		margin = theme.attributeValue(['layout'], [], ['spacing'], {h: 20, v: 20}),
		orientation = theme.attributeValue(['layout'], [], ['orientation'], 'standard'),
		calculator = layouts[orientation] || layouts.standard;

	idea = contentUpgrade(idea);

	Object.keys(idea.ideas).forEach(function (rank) {
		const rootIdea = idea.ideas[rank],
			rootResult = calculator(rootIdea, dimensionProvider, {h: (margin.h || margin), v: (margin.v || margin)});
		multiRootLayout.appendRootNodeLayout(rootResult, rootIdea);
	});

	return formatResult (multiRootLayout.getCombinedLayout(10, optional), idea, theme, orientation);
	// result = calculator(idea, dimensionProvider, {h: (margin.h || margin), v: (margin.v || margin)});

};

