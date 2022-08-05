/*global require */
const jQuery = require('jquery');
jQuery.fn.updateStage = function () {
	'use strict';
	const data = this.data(),
		size = {
			'min-width': Math.round(data.width - data.offsetX),
			'min-height': Math.round(data.height - data.offsetY),
			'width': Math.round(data.width - data.offsetX),
			'height': Math.round(data.height - data.offsetY),
			'transform-origin': 'top left',
			'transform': 'translate3d(' + Math.round(data.offsetX) + 'px, ' + Math.round(data.offsetY) + 'px, 0)'
		},
		svgContainer = this.find('[data-mapjs-role=svg-container]')[0];
	if (data.scale && data.scale !== 1) {
		size.transform = 'scale(' + data.scale + ') translate(' + Math.round(data.offsetX) + 'px, ' + Math.round(data.offsetY) + 'px)';
	}
	this.css(size);
	if (svgContainer) {
		svgContainer.setAttribute('viewBox',
			'' + Math.round(-1 * data.offsetX) + ' ' +  Math.round(-1 * data.offsetY) + ' ' + Math.round(data.width) + ' ' + Math.round(data.height)
		);
		svgContainer.setAttribute('style',
			'top:' + Math.round(-1 * data.offsetY) + 'px; ' +
			'left:' + Math.round(-1 * data.offsetX) + 'px; ' +
			'width:' +  Math.round(data.width) + 'px; ' +
			'height:' +  Math.round(data.height) + 'px;'
		);
	}
	return this;
};

