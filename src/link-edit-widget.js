/*global jQuery*/
jQuery.fn.linkEditWidget = function (mapModel) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this), currentLink, width, height, colorElement, lineStyleElement;
		colorElement = element.find('.color');
		lineStyleElement = element.find('.lineStyle');
		mapModel.addEventListener('linkSelected', function (link, selectionPoint, linkStyle) {
			currentLink = link;
			element.show();
			width = width || element.width();
			height = height || element.height();
			element.css({
				top: (selectionPoint.y - 0.5 * height) + 'px',
				left: (selectionPoint.x - 0.5 * width) + 'px'
			});
			colorElement.val(linkStyle.color);
			lineStyleElement.val(linkStyle.lineStyle);
		});
		mapModel.addEventListener('mapMoveRequested', function () {
			element.hide();
		});
		element.find('.delete').click(function () {
			mapModel.removeLink(currentLink.ideaIdFrom, currentLink.ideaIdTo);
			element.hide();
		});
		colorElement.change(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'color', jQuery(this).val());
		});
		lineStyleElement.change(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'lineStyle', jQuery(this).val());
		});
		element.mouseleave(element.hide.bind(element));
	});
};
