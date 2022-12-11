/*global require */
const jQuery = require('jquery');
jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	const clickMethodNames =
		['saveMap', 'insertIntermediate', 'scaleUp', 'scaleDown', 'addSubIdea', 'editNode', 'removeSubIdea', 'toggleCollapse', 'addSiblingIdea', 'undo', 'redo', 'copy', 'cut', 'paste',
			'resetView', 'openAttachment', 'toggleAddLinkMode', 'activateChildren', 'activateNodeAndChildren', 'activateSiblingNodes', 'editIcon', 'insertRoot', 'makeSelectedNodeRoot'],
		changeMethodNames = [`readFile`, 'updateStyle'];
		// keyDownEnterMethodNames = ['handleKey_loadMap'];

	return this.each(function () {
		const element = jQuery(this);
		let preventRoundtrip = false;

		// Found alternative solution: allow the file input to be selected,
		// then use css pseudo selector :focus-within to make it look like the label is highlighted
		// keyDownEnterMethodNames.forEach(function (methodName) {
		// 	element.find('.' + methodName).on('keydown', function (event) {
		// 		if (event.key === 'Enter') {
		// 			if (mapModel[methodName]) {
		// 				mapModel[methodName]('toolbar', event, this.parentElement); // this.parentElement is container
		// 				event.stopPropagation(); // Stops enter bubbling up to container and adding a node.
		// 			};
		// 		};
		// 	});
		// });
		mapModel.addEventListener('nodeSelectionChanged', function () {
			preventRoundtrip = true;
			element.find('.updateStyle[data-mm-target-property]').val(function () {
				return mapModel.getSelectedStyle(jQuery(this).data('mm-target-property'));
			}).change();
			preventRoundtrip = false;
		});
		mapModel.addEventListener('addLinkModeToggled', function () {
			element.find('.toggleAddLinkMode').toggleClass('active');
		});
		clickMethodNames.forEach(function (methodName) {
			element.find('.' + methodName).click(function () {
				if (mapModel[methodName]) {
					mapModel[methodName]('toolbar');
				}
			});
		});
		changeMethodNames.forEach(function (methodName) {
			element.find('.' + methodName).change(function (event) {
				if (preventRoundtrip) {
					return;
				}
				const tool = jQuery(this);
				if (tool.data('mm-target-property')) {
					// QUESTION: could pass the tool rather than separate properties? Would give more flexibility for functions
					//	 Need to refactor called functions
					// Calls methodName function within mapModel
					mapModel[methodName]('toolbar', tool.data('mm-target-property'), tool.val(), event);
				}
			});
		});
	});
};
