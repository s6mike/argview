
/* mapjs entry point: Initialises, plus function to load JSON and embed visualisation into a container. */

/*global require, document, window, console */

const MAPJS = require('mindmup-mapjs'),
	jQuery = require('jquery'),
	themeProvider = require('./theme'),
	ThemeProcessor = require('mindmup-mapjs-layout').ThemeProcessor,
	content = require('mindmup-mapjs-model').content;

// QUESTION: Rename init() as addMap() ?
// TODO: Rename dom_ready() as init()
function dom_ready(event) {
	//TODO: Should pair up container and scripts and search only for one
	// Now looks for class instead of id, so can capture a number of containers each with own id.
	const scripts = jQuery('.argmap_json:first')
	const container = jQuery('.container_argmapjs:first')

	// TODO: need to loop round all containers
	// Use .each() for collections (I think this is one) or $.each()
	//  For now, just take first one:
	if (scripts.length > 0) { // Checks there are mapjs requests
		const script_src = scripts.attr('src');
		// container_src = container.attr('src');
		console.debug("script_src: ", script_src)

		// QUESTION: May want to use await instead? Review difference
		fetch(script_src)
			.then(response => response.json())
			.then(data => init(container, data))
			// .then((data) => console.log(data))
			.catch(error => console.log(error));

	} else { // If no mapjs requests:
		console.debug('No requests for mapjs detected.')
	};
};

async function init(container, testMap) {
	// TODO: Restore use strict and fix cause of warning/error:
	// 'use strict';

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

document.addEventListener('DOMContentLoaded', dom_ready);