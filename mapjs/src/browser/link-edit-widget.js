/*global require */
const jQuery = require('jquery');
jQuery.fn.linkEditWidget = function (mapModel) {
	'use strict';
	return this.each(function () {
		const element = jQuery(this),
			colorElement = element.find('.color'),
			lineStyleElement = element.find('.lineStyle'),
			arrowElement = element.find('.arrow');
		let currentLink, width, height;
		element.hide();
		mapModel.addEventListener('linkSelected', function (link, selectionPoint, linkStyle) {
			currentLink = link;
			element.show();
			width = width || element.width();
			height = height || element.height();
			element.css({
				top: (selectionPoint.y - 0.5 * height - 15) + 'px',
				left: (selectionPoint.x - 0.5 * width - 15) + 'px'
			});
			colorElement.val(linkStyle.color).change();
			lineStyleElement.val(linkStyle.lineStyle);
			arrowElement[linkStyle.arrow ? 'addClass' : 'removeClass']('active');
		});
		mapModel.addEventListener('mapMoveRequested', function () {
			element.hide();
		});
		element.find('.delete').click(function () {
			if (!currentLink) { // Added check to stop error message when delete link button clicked without any link selected.
				return false;
			}
			mapModel.removeLink('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo);
			element.hide();
		});
		colorElement.change(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'color', jQuery(this).val());
		});
		// Fixes lineystle selector:
		// lineStyleElement.find('a').click(function () {
		lineStyleElement.change(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'lineStyle', jQuery(this).text());
		});
		arrowElement.click(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'arrow', !arrowElement.hasClass('active'));
		});
		// Removing so menu stays visible after mouse over or link change.
		// element.mouseleave(element.hide.bind(element));
	});
};
