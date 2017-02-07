/*global require, document, module */
const _ = require('underscore'),
	jQuery = require('jquery'),
	calculateLayout = require('mindmup-mapjs-layout').calculateLayout,
	DOMRender = {
		svgPixel: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
		nodeCacheMark: function (idea, levelOverride) {
			'use strict';
			return {
				title: idea.title,
				width: idea.attr && idea.attr.style && idea.attr.style.width,
				theme: DOMRender.theme &&  DOMRender.theme.name,
				icon: idea.attr && idea.attr.icon && _.pick(idea.attr.icon, 'width', 'height', 'position'),
				collapsed: idea.attr && idea.attr.collapsed,
				note: !!(idea.attr && idea.attr.note),
				styles: DOMRender.theme &&  DOMRender.theme.nodeStyles(idea.level  || levelOverride, idea.attr),
				level: idea.level || levelOverride
			};
		},
		dummyTextBox: jQuery('<div>').addClass('mapjs-node').css({position: 'absolute', visibility: 'hidden'}),
		dimensionProvider: function (idea, level) {
			'use strict'; /* support multiple stages? */
			const translateToPixel = function () {
				return DOMRender.svgPixel;
			};
			let result = false,
				textBox = jQuery(document).nodeWithId(idea.id);
			if (textBox && textBox.length > 0) {
				if (_.isEqual(textBox.data('nodeCacheMark'), DOMRender.nodeCacheMark(idea, level))) {
					return _.pick(textBox.data(), 'width', 'height');
				}
			}
			textBox = DOMRender.dummyTextBox;
			textBox.appendTo('body').updateNodeContent(idea, translateToPixel, level);
			result = {
				width: textBox.outerWidth(true),
				height: textBox.outerHeight(true)
			};
			textBox.detach();
			return result;
		},
		layoutCalculator: function (contentAggregate) {
			'use strict';
			return calculateLayout(contentAggregate, DOMRender.dimensionProvider, {
				theme: DOMRender.theme
			});
		},
		fixedLayout: false
	};

module.exports = DOMRender;
