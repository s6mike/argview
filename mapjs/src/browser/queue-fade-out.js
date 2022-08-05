/*global require, setTimeout */
const jQuery = require('jquery');
jQuery.fn.queueFadeOut = function (theme) {
	'use strict';
	const element = this,
		removeElement = () => {
			if (element.is(':focus')) {
				element.parents('[tabindex]').focus();
			}
			return element.remove();
		};
	if (!theme || theme.noAnimations()) {
		return removeElement();
	}
	return element
	.on('transitionend', removeElement)
	.css('opacity', 0);
	setTimeout(removeElement, 500);
};

