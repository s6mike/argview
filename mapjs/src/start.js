/* mapjs entry point: Initialises, plus function to load JSON and embed visualisation into a container. */

/*global require, document, window, console */
const MAPJS = require('./npm-main'),
	jQuery = require('jquery'),
	themeProvider = require('../src/theme'),
	content = MAPJS.content;
let mapInstance = {}; // New object for keeping data for keeping various mapjs objects separate

// QUESTION: Can I loop through these somehow instead without having to know the name of each one?
// 	new MAPJS.Theme[x] ?
MAPJS.arg = require('../src/themes/argmap-theme.json');
MAPJS.argumentMapping = require('../src/themes/mapjs-argument-mapping.json');
MAPJS.topdown = require('../src/themes/top-down-simple.json');
MAPJS.compact = require('../src/themes/compact.json');
MAPJS.v1 = require('../src/themes/v1.json');
MAPJS.md = require('../src/themes/deep_merged_x.json');
MAPJS.m2 = require('../src/themes/merged_x2.json');

const init = function () {
	'use strict';
	// let domMapController = false;

	// Looks for class not id, so can capture a number of containers each with own id.
	const containers = document.getElementsByClassName("container_argmapjs");

	if (containers.length > 0) { // Checks there are mapjs requests
		// jQuery(containers).each(function (container) {
		for (let container of containers) {
			// containers.foreach(function (container) {
			// TODO: check for 0 > script > 1
			//	See https://stackoverflow.com/questions/1474089/how-to-select-a-single-child-element-using-jquery#answer-1474103
			// const script_src = jQuery(this).children('script.argmap_json').attr('src');
			const script_src = container.getElementsByClassName("argmap_json")[0].getAttribute('src');
			console.debug("script_src: ", script_src);

			// TODO: switch to await/async for simpler code and debugging.
			fetch(script_src)
				.then(response => response.json())
				.then(data => addMap(container, data))
				// .then((data) => console.debug(data))
				.catch(error => console.error(error));
		}

		// TODO: This stuff only needed once, not per map
		window.onerror = console.error; // Stops annoying pop ups when there's an error.
		window.jQuery = jQuery;
		window.mapInstance = mapInstance;

	} else { // If no mapjs requests:
		console.debug('No requests for mapjs detected.')
	};
};

// Injects Theme CSS into page
// So can't easily make themes independent for each container without making css directives container independent
const layoutThemeStyle = function (themeJson) {
	const themeCSS = themeJson && new MAPJS.ThemeProcessor().process(themeJson).css;
	if (!themeCSS) {
		return false;
	}

	// Used to only apply if there wasn't already a theme, but now we want to replace it
	if (window.themeCSS) {
		jQuery('#themeCSS')[0].remove()
	}
	jQuery('<style id="themeCSS" type="text/css"></style>').appendTo('head').text(themeCSS);

	return true;
};

// TODO: Move to mapModel.changeTheme() in map-model.js
// Changes theme of all maps on page
// 	TODO: Make this apply to a specific map only
const changeTheme = function (map, themeJson = themeProvider.default) {
	// QUESTION: Should I build this into function in case themeJson invalid?
	//	 themeJson = themeProvider.default || MAPJS.defaultTheme;
	// QUESTION: Should I add getTheme to map?
	theme = new MAPJS.Theme(themeJson),
		getTheme = () => theme;
	map.mapModel.setThemeSource(getTheme);

	layoutThemeStyle(themeJson);

	// Can't reset map with setIdea if domMapController hasn't been defined yet
	// 	This is run at start of init(), so why is it undefined on first run?
	// 		let domMapController = false;
	// Could check for whether mapModel has a layoutCalculator function instead
	if (map && typeof map.domMapController !== 'undefined') {
		// ISSUE: This call breaks on second map, I guess since layout calculator wasn't set for new domMapController
		// So really need to check for layout calculator
		map.mapModel.setIdea(idea);
	}

	return getTheme;
}

// Add a (ideally) separate map to each container div on the page.
const addMap = function (container, mapJson) {
	// console.debug("mapJson: ", mapJson);
	map = mapInstance[container.id] = {};
	// map = mapInstance[container.id];
	jQcontainer = jQuery(container),

		idea = content(mapJson),
		touchEnabled = false,
		// QUESTION: do only need 1 mapModel for all the maps?
		// 	Or are there generic methods I can separate out from object ones?
		map.mapModel = new MAPJS.MapModel([]),

		// themeJson = themeProvider.default || MAPJS.defaultTheme;
		themeJson = idea.theme || MAPJS.arg || themeProvider.default || MAPJS.defaultTheme,

		// TODO: Might only need one of these for the whole page, rather than for each container:
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

	// Moved this section to init()
	// // TODO: This stuff only needed once, not per map
	// window.onerror = console.error; // Stops annoying pop ups when there's an error.
	// window.jQuery = jQuery;

	jQcontainer.domMapWidget(console, map.mapModel, touchEnabled);

	getTheme = changeTheme(map, themeJson)

	// different stage for each container so need to have one for each container
	// Using container.id as index for relevant controller
	// domMapController[jQcontainer[0].id] = new MAPJS.DomMapController(
	map.domMapController = new MAPJS.DomMapController(
		map.mapModel,
		jQcontainer.find('[data-mapjs-role=stage]'),
		touchEnabled,
		undefined, // resourceTranslator
		getTheme
	);
	//jQuery('#themecss').themeCssWidget(themeProvider, new MAPJS.ThemeProcessor(), mapModel, domMapController);
	// activityLog, mapModel, touchEnabled, imageInsertController, dragContainer, centerSelectedNodeOnOrientationChange

	// jQuery('body').mapToolbarWidget(map.mapModel);
	// jQuery('body').attachmentEditorWidget(map.mapModel);
	// jQuery('#linkEditWidget').linkEditWidget(map.mapModel);

	jQcontainer.mapToolbarWidget(map.mapModel);
	jQcontainer.attachmentEditorWidget(map.mapModel);
	jQcontainer.find('.linkEditWidget').linkEditWidget(map.mapModel);

	// Moved this part into init()
	// window.map.mapModel = map.mapModel;

	map.mapModel.setIdea(idea);

	// Second link widget doesn't work, might need to do this for all in the class, not just one
	jQuery('.arrow').click(function () {
		jQuery(this).toggleClass('active');
	});

	jQcontainer.on('drop', function (e) {
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
