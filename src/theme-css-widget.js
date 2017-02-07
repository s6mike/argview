/*global require */
const $ = require('jquery'),
	Theme = require('mindmup-mapjs-layout').Theme,
	DOMRender = require('./dom-render');
$.fn.themeCssWidget = function (themeProvider, themeProcessor, mapModel) {
	'use strict';
	const element = $(this),
		activateTheme =	function (theme) {
			const themeJson = themeProvider[(theme || 'default')];
			if (!themeJson) {
				return;
			}
			DOMRender.theme = new Theme(themeJson);
			element.text(themeProcessor.process(themeJson).css);
		};
	activateTheme('default');
	mapModel.addEventListener('themeChanged', activateTheme);
	return element;
};

