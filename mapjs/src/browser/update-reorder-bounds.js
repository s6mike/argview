/*global require */
const jQuery = require('jquery');
jQuery.fn.updateReorderBounds = function (border, box, dropCoords) {
	'use strict';
	const element = this;
	if (!border) {
		element.hide();
		return;
	}
	element.show();
	element.attr('mapjs-edge', border.edge);
	if (border.edge === 'top') {
		element.css({
			top: border.minY,
			left: Math.round(dropCoords.x - element.width() / 2)
		});
	} else {
		element.css({
			top: Math.round(dropCoords.y - element.height() / 2),
			left: border.x - (border.edge === 'left' ? element.width() : 0)
		});
	}

};
