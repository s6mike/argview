/*global require */
const jQuery = require('jquery');
jQuery.fn.imageDropWidget = function (imageInsertController) {
	'use strict';
	this.on('dragleave dragend', function (e) {
		jQuery('.droppable').removeClass('droppable');
	}).on('dragenter dragover', function (e) {
		let stageDropCoordinates = map.domMapController.stagePositionForPointEvent(e),
			nodeAtDrop = stageDropCoordinates && map.mapModel.getNodeIdAtPosition(stageDropCoordinates.x, stageDropCoordinates.y);
		if (typeof (nodeAtDrop) != undefined) {
			// ISSUE: TODO: This is not a good way to access node, better the function return the node or I look it up some other way
			jQuery("#node_" + nodeAtDrop).addClass('droppable');
		}
		if (e.originalEvent.dataTransfer) {
			return false;
		}
	}).on('drop', function (e) {
		const dataTransfer = e.originalEvent.dataTransfer;
		let htmlContent;
		e.stopPropagation();
		e.preventDefault();
		if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
			imageInsertController.insertFiles(dataTransfer.files, e.originalEvent);
		} else if (dataTransfer) {
			htmlContent = dataTransfer.getData('text/html');
			imageInsertController.insertHtmlContent(htmlContent, e.originalEvent);
		}
		jQuery('.droppable').removeClass('droppable');
	});
	return this;
};
