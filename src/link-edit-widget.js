/*global jQuery*/
jQuery.fn.linkEditWidget = function (mapModel) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this), currentLink;
		mapModel.addEventListener('linkSelected', function (link, selectionPoint) {
			currentLink = link;
			element.show();
			element.css({
				top: (selectionPoint.y - 0.5 * element.height()) + 'px',
				left: (selectionPoint.x - 0.5 * element.width()) + 'px'
			});
		});
		element.find('.delete').click(function () {
			mapModel.removeLink(currentLink.ideaIdFrom, currentLink.ideaIdTo);
			element.hide();
		});
		element.find('.close').click(function () {
			element.hide();
		});
	});
};
