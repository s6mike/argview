/*global require, document, window, console */
// TODO not sure module vs example_map

const testMap = () => import('./example-map.json'); //.then(module => module.default);
// const testMap = () => import(/* webpackChunkName: "example-map" */ './example-map.json').then(module => module.default);
// const testMap = () => import('./example-map.json').then(src => src.default);
console.log("testMap(): ", testMap())
const MAPJS = require('../src/npm-main'),
	jQuery = require('jquery'),
	themeProvider = require('./theme'),
	// testMap = require('./example-map.json'),
	content = MAPJS.content,
	init = function () {
		'use strict';
		// const testMap = () => import(/* webpackChunkName: "example-map" */ './example-map.json').then(module => module.default);
		let domMapController = false;
		const container = jQuery('#container'),
			idea = content(testMap()),
			touchEnabled = false,
			mapModel = new MAPJS.MapModel([]),
			layoutThemeStyle = function (themeJson) {
				const themeCSS = themeJson && new MAPJS.ThemeProcessor().process(themeJson).css;
				if (!themeCSS) {
					return false;
				}

				if (!window.themeCSS) {
					jQuery('<style id="themeCSS" type="text/css"></style>').appendTo('head').text(themeCSS);
				}
				return true;
			},
			themeJson = themeProvider.default || MAPJS.defaultTheme,
			theme = new MAPJS.Theme(themeJson),
			getTheme = () => theme;

		jQuery.fn.attachmentEditorWidget = function (mapModel) {
			return this.each(function () {
				mapModel.addEventListener('attachmentOpened', function (nodeId, attachment) {
					mapModel.setAttachment(
						'attachmentEditorWidget',
						nodeId, {
						contentType: 'text/html',
						content: window.prompt('attachment', attachment && attachment.content)
					});
				});
			});
		};
		window.onerror = window.alert;
		window.jQuery = jQuery;

		container.domMapWidget(console, mapModel, touchEnabled);

		domMapController = new MAPJS.DomMapController(
			mapModel,
			container.find('[data-mapjs-role=stage]'),
			touchEnabled,
			undefined, // resourceTranslator
			getTheme
		);
		//jQuery('#themecss').themeCssWidget(themeProvider, new MAPJS.ThemeProcessor(), mapModel, domMapController);
		// activityLog, mapModel, touchEnabled, imageInsertController, dragContainer, centerSelectedNodeOnOrientationChange

		jQuery('body').attachmentEditorWidget(mapModel);
		layoutThemeStyle(themeJson);
		mapModel.setIdea(idea);


		jQuery('#linkEditWidget').linkEditWidget(mapModel);
		window.mapModel = mapModel;
		jQuery('.arrow').click(function () {
			jQuery(this).toggleClass('active');
		});

		container.on('drop', function (e) {
			const dataTransfer = e.originalEvent.dataTransfer;
			e.stopPropagation();
			e.preventDefault();
			if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
				const fileInfo = dataTransfer.files[0];
				if (/\.mup$/.test(fileInfo.name)) {
					const oFReader = new window.FileReader();
					oFReader.onload = function (oFREvent) {
						mapModel.setIdea(content(JSON.parse(oFREvent.target.result)));
					};
					oFReader.readAsText(fileInfo, 'UTF-8');
				}
			}
		});
	};
document.addEventListener('DOMContentLoaded', init);
