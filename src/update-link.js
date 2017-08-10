/*global require */
const jQuery = require('jquery'),
	createSVG = require('./create-svg'),
	Connectors = require('mindmup-mapjs-layout').Connectors,
	//defaultTheme = require('mindmup-mapjs-layout').Themes.default,
	convertPositionToTransform = require('./convert-position-to-transform'),
	updateConnectorText = require('./update-connector-text'),
	_ = require('underscore'),
	calcLabelCenterPont = require('./calc-label-center-point'),
	DOMRender = require('./dom-render');


require('./get-box');
require('./get-data-box');

jQuery.fn.updateLink = function () {
	'use strict';
	return jQuery.each(this, function () {
		const element = jQuery(this),
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
			attrs = element.data('attr') || {},
			applyLabel = function (connection, toBox, pathElement) {
				const labelTheme = connection.theme.label,
					labelCenterPoint = calcLabelCenterPont(connection, toBox, pathElement[0], labelTheme);
				element.data('label-center-point', labelCenterPoint);
				updateConnectorText(
					element,
					labelCenterPoint,
					attrs.label || '',
					labelTheme
				);
			};
		let connection = false,
			pathElement = element.find('path.mapjs-link'),
			hitElement = element.find('path.mapjs-link-hit'),
			arrowElement = element.find('path.mapjs-arrow'),
			fromBox = false, toBox = false, changeCheck = false;
		if (!shapeFrom || !shapeTo || shapeFrom.length === 0 || shapeTo.length === 0) {
			element.hide();
			return;
		}
		fromBox = shapeFrom.getBox();
		toBox = shapeTo.getBox();

		changeCheck = {from: fromBox, to: toBox, attrs: attrs, theme: DOMRender.theme &&  DOMRender.theme.name};
		if (_.isEqual(changeCheck, element.data('changeCheck'))) {
			return;
		}

		element.data('changeCheck', changeCheck);

		connection = Connectors.linkPath(fromBox, toBox, attrs, DOMRender.theme);
		element.data('theme', connection.theme);
		element.css(_.extend(convertPositionToTransform(connection.position), {stroke: connection.lineProps.color}));

		if (pathElement.length === 0) {
			pathElement = createSVG('path').attr('class', 'mapjs-link').appendTo(element);
		}
		pathElement.attr({
			'd': connection.d,
			'stroke-width': connection.lineProps.width,
			'stroke-dasharray': connection.lineProps.strokes,
			'stroke-linecap': connection.lineProps.linecap,
			fill: 'transparent'
		});

		if (hitElement.length === 0) {
			hitElement = createSVG('path').attr('class', 'mapjs-link-hit').appendTo(element);
		}
		hitElement.attr({
			'd': connection.d,
			'stroke-width': connection.lineProps.width + 12
		});

		if (connection.arrow) {
			if (arrowElement.length === 0) {
				arrowElement = createSVG('path').attr('class', 'mapjs-arrow').appendTo(element);
			}
			arrowElement
			.attr({
				d: connection.arrow,
				fill: connection.lineProps.color,
				'stroke-width': connection.lineProps.width
			})
			.show();

		} else {
			arrowElement.hide();
		}
		applyLabel(connection, toBox, pathElement);
	});
};

