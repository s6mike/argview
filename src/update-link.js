/*global require */
const jQuery = require('jquery'),
	createSVG = require('./create-svg'),
	Connectors = require('mindmup-mapjs-layout').Connectors,
	//defaultTheme = require('mindmup-mapjs-layout').Themes.default,
	lineStrokes = require('mindmup-mapjs-layout').lineStrokes,
	convertPositionToTransform = require('./convert-position-to-transform'),
	//updateConnectorText = require('./update-connector-text'),
	_ = require('underscore');
	//calcLabelCenterPont = require('./calc-label-center-point'),
	//DOMRender = require('./dom-render');


require('./get-box');
require('./get-data-box');

jQuery.fn.updateLink = function () {
	'use strict';
	return jQuery.each(this, function () {
		const element = jQuery(this),
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
			n = Math.tan(Math.PI / 9),
			attrs = element.data('attr') || {};
		let connection = false,
			pathElement = element.find('path.mapjs-link'),
			hitElement = element.find('path.mapjs-link-hit'),
			arrowElement = element.find('path.mapjs-arrow'),
			fromBox = false, toBox = false, changeCheck = false,
			a1x, a1y, a2x, a2y, len, iy, m, dx, dy;
		if (!shapeFrom || !shapeTo || shapeFrom.length === 0 || shapeTo.length === 0) {
			element.hide();
			return;
		}
		fromBox = shapeFrom.getBox();
		toBox = shapeTo.getBox();

		changeCheck = {from: fromBox, to: toBox, attrs: attrs};
		if (_.isEqual(changeCheck, element.data('changeCheck'))) {
			return;
		}

		element.data('changeCheck', changeCheck);

		connection = Connectors.linkPath(fromBox, toBox);
		element.css(_.extend(convertPositionToTransform(connection.position), {stroke: attrs.color}));

		if (pathElement.length === 0) {
			pathElement = createSVG('path').attr('class', 'mapjs-link').appendTo(element);
		}
		pathElement.attr({
			'd': connection.d,
			'stroke-dasharray': lineStrokes[attrs.lineStyle]
		});

		if (hitElement.length === 0) {
			hitElement = createSVG('path').attr('class', 'mapjs-link-hit').appendTo(element);
		}
		hitElement.attr({
			'd': connection.d
		});

		if (attrs.arrow) {
			if (arrowElement.length === 0) {
				arrowElement = createSVG('path').attr('class', 'mapjs-arrow').appendTo(element);
			}
			len = 14;
			dx = connection.conn.to.x - connection.conn.from.x;
			dy = connection.conn.to.y - connection.conn.from.y;
			if (dx === 0) {
				iy = dy < 0 ? -1 : 1;
				a1x = connection.conn.to.x + len * Math.sin(n) * iy;
				a2x = connection.conn.to.x - len * Math.sin(n) * iy;
				a1y = connection.conn.to.y - len * Math.cos(n) * iy;
				a2y = connection.conn.to.y - len * Math.cos(n) * iy;
			} else {
				m = dy / dx;
				if (connection.conn.from.x < connection.conn.to.x) {
					len = -len;
				}
				a1x = connection.conn.to.x + (1 - m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a1y = connection.conn.to.y + (m + n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a2x = connection.conn.to.x + (1 + m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a2y = connection.conn.to.y + (m - n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
			}
			arrowElement.attr('d',
				'M' + Math.round(a1x - connection.position.left) + ',' + Math.round(a1y - connection.position.top) +
				'L' + Math.round(connection.conn.to.x - connection.position.left) + ',' + Math.round(connection.conn.to.y - connection.position.top) +
				'L' + Math.round(a2x - connection.position.left) + ',' + Math.round(a2y - connection.position.top) +
				'Z')
				.css('fill', attrs.color)
				.show();
		} else {
			arrowElement.hide();
		}

	});
};

