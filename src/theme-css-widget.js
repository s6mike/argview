/*global $, MAPJS*/
$.fn.themeCssWidget = function (themeProvider, themeProcessor, mapModel) {
	'use strict';
	var element = $(this),
		activateTheme =	function (theme) {
			var themeJson = themeProvider[(theme || 'default')];
			if (!themeJson) {
				return;
			}
			MAPJS.DOMRender.theme = new MAPJS.Theme(themeJson);
			element.text(themeProcessor.process(themeJson).css);
		};
	activateTheme('default');
	mapModel.addEventListener('themeChanged', activateTheme);
	return element;
};

