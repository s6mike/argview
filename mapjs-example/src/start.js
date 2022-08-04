/*global require, document, window, console */

const MAPJS = require('mindmup-mapjs'),
	jQuery = require('jquery'),
	themeProvider = require('./theme'),
	ThemeProcessor = require('mindmup-mapjs-layout').ThemeProcessor,

	// Takes value passed in from command line e.g.
	//   npm run pack-js -- --env.input_map=../examples/example-map.json
	// testMap = require(process.env.input_map),

	content = require('mindmup-mapjs-model').content,
	init = function (event, map = './argmap_output/example-map') {
		// TODO: Restore use strict and fix cause of warning/error:
		// 'use strict';

		// Now looks for class instead of id, so can capture a number of containers each with own id.
		// TODO: need to loop round all containers
		// Use .each() for collections (I think this is one) or $.each()
		//  For now, just take first one:
		const container = jQuery('.container_argmapjs:first')

		container_src = container.attr('src');
		console.debug("container_src: ", container_src)

		// console.debug("map: ", map)

		// TODO: tells webpack to acquire dependency at runtime instead of during build:
		// https://webpack.js.org/configuration/externals/

		// import { readFile } from 'fs/promises';
		// const testMap = JSON.parse(
		// 	await readFile(
		// 		new URL('./example-map.json', import.meta.url)
		// 	)
		// );

		// QUESTION: Should I still use assert with require?
		// More secure to use assert, but this throws error about needing a loader
		// Using node --experimental-json-modules should fix this, but not sure how to call this via npm
		// Possible solution: https://stackoverflow.com/questions/48536902/how-to-let-npm-package-bin-run-with-experimental-modules-option
		// Added export NODE_OPTIONS="--experimental-json-modules" to argmaps init script
		// import testMap from './example-map.json'; // assert {type: `json`};

		// const testMap = () => import(/* webpackChunkName: "example-map" */ './example-map.json').then(module => module.default);

		// const testMap = require('./' + map);
		// const testMap = require('./argmap_output/' + container_src + '.json');
		const testMap = require('/home/s6mike/git_projects/argmap/mapjs-example/src/argmap_output/' + container_src + '.json');
		console.debug("testMap: ", testMap);

		idea = content(testMap),
			imageInsertController = new MAPJS.ImageInsertController('http://localhost:4999?u='),
			mapModel = new MAPJS.MapModel(MAPJS.DOMRender.layoutCalculator, []);
		console.debug("idea: ", idea);
		jQuery.fn.attachmentEditorWidget = function (mapModel) {
			return this.each(function () {
				mapModel.addEventListener('attachmentOpened', function (nodeId, attachment) {
					mapModel.setAttachment(
						'attachmentEditorWidget',
						nodeId, {
						contentType: 'text/html',
						content: window.prompt('attachment', attachment && attachment.content)
					}
					);
				});
			});
		};
		window.onerror = window.alert;


		jQuery('#themecss').themeCssWidget(themeProvider, new ThemeProcessor(), mapModel);
		container.domMapWidget(console, mapModel, false, imageInsertController);
		jQuery('body').mapToolbarWidget(mapModel);
		jQuery('body').attachmentEditorWidget(mapModel);
		mapModel.setIdea(idea);


		jQuery('#linkEditWidget').linkEditWidget(mapModel);
		window.mapModel = mapModel;
		jQuery('.arrow').click(function () {
			jQuery(this).toggleClass('active');
		});
		imageInsertController.addEventListener('imageInsertError', function (reason) {
			console.error('image insert error', reason);
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