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
			mapModel.removeLink('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo);
			element.hide();
		});
		colorElement.change(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'color', jQuery(this).val());
		});
		lineStyleElement.find('a').click(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'lineStyle', jQuery(this).text());
		});
		arrowElement.click(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'arrow', !arrowElement.hasClass('active'));
		});
		element.mouseleave(element.hide.bind(element));
	});
};
