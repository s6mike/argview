/*global require */
const jQuery = require('jquery');

module.exports = function mapToolbarWidget(mapModel) {
// jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	const clickMethodNames =
		['saveMap', 'scaleUp', 'scaleDown', 'addSubIdea', 'insertIntermediateGroup', 'addGroupSubidea', 'editNode', 'removeSubIdea', 'insertIntermediate', 'toggleCollapse', 'setInputEnabled', 'addSiblingIdea', 'undo', 'redo', 'copy', 'cut', 'paste',
			'resetView', 'openAttachment', 'toggleAddLinkMode', 'activateChildren', 'activateNodeAndChildren', 'activateSiblingNodes', 'editIcon', 'insertRoot', 'makeSelectedNodeRoot'],
		changeMethodNames = [`readFile`, 'updateStyle'],

		// TODO review and improve this part
		containerElement = mapModel.containerElement,
		jQContainerElement = jQuery(containerElement);

	let preventRoundtrip = false;

	mapModel.addEventListener('nodeSelectionChanged', function () {
		preventRoundtrip = true;
		jQContainerElement.find('.updateStyle[data-mm-target-property]').val(function () {
			return mapModel.getSelectedStyle(jQuery(this).data('mm-target-property'));
		}).change();
		preventRoundtrip = false;
	});

	mapModel.addEventListener('addLinkModeToggled', function () {
		jQContainerElement.find('.toggleAddLinkMode').toggleClass('active');
	});

	clickMethodNames.forEach(function (methodName) {
		const buttons = containerElement.getElementsByClassName(methodName);
		for (const button of buttons) {
			button.addEventListener('click', function () {
				if (mapModel[methodName]) {
					mapModel[methodName]('toolbar', button.dataset);
				}
			});
		};
	});

	changeMethodNames.forEach(function (methodName) {
		jQContainerElement.find('.' + methodName).change(function (event) {
			if (preventRoundtrip) {
				return;
			}
			const tool = jQuery(this);
			if (tool.data('mm-target-property')) {
				// QUESTION: could pass the tool rather than separate properties? Would give more flexibility for functions
				//	 Need to refactor called functions
				// Calls methodName function within mapModel
				// More flexible to pass whole dataset rather than specific properties
				//	 See clickMethodNames.forEach
				mapModel[methodName]('toolbar', tool.data('mm-target-property'), tool.val(), event);
			}
		});
	});
	// });
};
