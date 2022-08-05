/*global require, document, window, console */
const MAPJS = require('../../src/npm-main'),
	jQuery = require('jquery'),
	content = MAPJS.content,
	init = function () {
		'use strict';
		let theme;
		const container = jQuery('#container'),
			touchEnabled = false,
			mapModel = new MAPJS.MapModel([]),

			updateTheme = function (themeJson) {
				const themeCSS = themeJson && new MAPJS.ThemeProcessor().process(themeJson).css;
				if (!themeCSS) {
					return false;
				}

				if (window.themeCSS) {
					window.themeCSS.remove();
				}

				jQuery('<style id="themeCSS" type="text/css"></style>').appendTo('head').text(themeCSS);

				theme = new MAPJS.Theme(themeJson);
				return true;
			},
			getTheme = () => theme;

		mapModel.setThemeSource(getTheme);
		container.domMapWidget(console, mapModel, touchEnabled);

		new MAPJS.DomMapController(
			mapModel,
			container.find('[data-mapjs-role=stage]'),
			touchEnabled,
			undefined, // resourceTranslator
			getTheme
		);

		updateTheme(MAPJS.defaultTheme);
		window.addEventListener('message', function (messageEvent) {
			if (messageEvent.data.theme) {
				updateTheme(messageEvent.data.theme);
			}
			if (messageEvent.data.labels) {
				mapModel.setLabelGenerator(() => messageEvent.data.labels);
			}
			if (messageEvent.data.content) {
				mapModel.setIdea(content(messageEvent.data.content));
				container.css({overflow: 'visible'});
			}
		});
	};
document.addEventListener('DOMContentLoaded', init);
