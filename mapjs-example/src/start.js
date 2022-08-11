/* mapjs entry point: Initialises, plus function to load JSON and embed visualisation into a container. */

/*global require, document, window, console */

// TODO: Restore use strict and fix cause of warning/error:
// 'use strict';

const MAPJS = require('mindmup-mapjs'),
	jQuery = require('jquery'),
	themeProvider = require('./theme'),
	ThemeProcessor = require('mindmup-mapjs-layout').ThemeProcessor,
	content = require('mindmup-mapjs-model').content;

function init(event) {
	// Looks for class not id, so can capture a number of containers each with own id.
	const containers = jQuery('.container_argmapjs');

	if (containers.length > 0) { // Checks there are mapjs requests

		jQuery(containers).each(function (container) {
			// TODO: check for 0 > script > 1
			//	See https://stackoverflow.com/questions/1474089/how-to-select-a-single-child-element-using-jquery#answer-1474103
			const script_src = jQuery(this).children('script.argmap_json').attr('src');
			console.debug("script_src: ", script_src)

			// TODO: switch to await/async for simpler code and debugging.
			fetch(script_src)
				.then(response => response.json())
				.then(data => addMap(jQuery(this), data))
				// .then((data) => console.debug(data))
				.catch(error => console.log(error));
		})

	} else { // If no mapjs requests:
		console.debug('No requests for mapjs detected.')
	};
};

function addMap(container, testMap) {
	// console.debug("testMap: ", testMap);

	var idea = content(testMap),
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