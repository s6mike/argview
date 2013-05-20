/*global jQuery*/
jQuery.fn.linkEditWidget = function (mapModel) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this), currentLink, width, height;
		mapModel.addEventListener('linkSelected', function (link, selectionPoint) {
			currentLink = link;
			element.show();
			width = width || element.width();
			height = height || element.height();
			element.css({
				top: (selectionPoint.y - 0.5 * height) + 'px',
				left: (selectionPoint.x - 0.5 * width) + 'px'
			});
		});
		mapModel.addEventListener('mapMoveRequested', function () {
			element.hide();
		});
		element.find('.delete').click(function () {
			mapModel.removeLink(currentLink.ideaIdFrom, currentLink.ideaIdTo);
			element.hide();
		});
		element.mouseleave(function () {
			element.hide();
		});
	});
};
