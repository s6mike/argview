/*global require */
const jQuery = require('jquery');

module.exports = function mapToolbarWidget(mapModel, toolbarElement) {
// jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	const clickMethodNames =
		['downloadMap', 'resetView', 'scaleUp', 'scaleDown', 'addSubIdea', 'insertIntermediateGroup', 'addGroupSubidea', 'editNode', 'removeSubIdea', 'insertIntermediate', 'toggleCollapse', 'setInputEnabled',
			'undo', 'redo', 'cut', 'copy', 'paste', 'openAttachment', 'toggleAddLinkMode', 'insertRoot', 'makeSelectedNodeRoot'],
		// No buttons for these:
		// 'addSiblingIdea', 'activateChildren', 'activateNodeAndChildren', 'activateSiblingNodes', 'editIcon'],
		changeMethodNames = [`readFile`, 'updateStyle'],
		jQToolbarWidgetElement = jQuery(toolbarElement);

	let preventRoundtrip = false;

	mapModel.addEventListener('nodeSelectionChanged', function () {
		preventRoundtrip = true;
		jQToolbarWidgetElement.find('.updateStyle[data-mm-target-property]').val(function () {
			return mapModel.getSelectedStyle(jQuery(this).data('mm-target-property'));
		}).change();
		preventRoundtrip = false;
	});

	mapModel.addEventListener('addLinkModeToggled', function () {
		jQToolbarWidgetElement.find('.toggleAddLinkMode').toggleClass('active');
	});

	clickMethodNames.forEach(function (methodName) {
		const buttons = toolbarElement.getElementsByClassName(methodName);
		for (const button of buttons) {
			button.addEventListener('click', function () {
				if (mapModel[methodName]) {
					let button_data = button.dataset;
					if (Object.keys(button_data).length === 0) {
						button_data = undefined;
					}
					mapModel[methodName]('toolbar', button_data);
				}
			});
		};
	});

	changeMethodNames.forEach(function (methodName) {
		jQToolbarWidgetElement.find('.' + methodName).change(function (event) {
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
