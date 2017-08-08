/*global require */

const jQuery = require('jquery'),
	createSVG = require('./create-svg'),
	Connectors = require('mindmup-mapjs-layout').Connectors,
	defaultTheme = require('mindmup-mapjs-layout').Themes.default,
	lineStrokes = require('mindmup-mapjs-layout').lineStrokes,
	convertPositionToTransform = require('./convert-position-to-transform'),
	updateConnectorText = require('./update-connector-text'),
	_ = require('underscore'),
	calcLabelCenterPont = require('./calc-label-center-point'),
	DOMRender = require('./dom-render');


require('./get-box');
require('./get-data-box');

jQuery.fn.updateConnector = function (canUseData) {
	'use strict';
	return jQuery.each(this, function () {
		let connection = false, pathElement, hitElement, fromBox, toBox,
			changeCheck = false;
		const element = jQuery(this),
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
			connectorAttr = element.data('attr'),
			allowParentConnectorOverride = !(DOMRender.theme && DOMRender.theme.blockParentConnectorOverride),
			applyInnerRect = function (shape, box) {
				const innerRect = shape.data().innerRect;
				if (innerRect) {
					box.left += innerRect.dx;
					box.top += innerRect.dy;
					box.width = innerRect.width;
					box.height = innerRect.height;
				}
			},
			applyLabel = function () {
				const labelTheme = (connection.theme && connection.theme.label) || defaultTheme.connector.default.label,
					labelCenterPoint = calcLabelCenterPont(connection, toBox, pathElement[0], labelTheme);
				element.data('label-center-point', labelCenterPoint);
				updateConnectorText(
					element,
					labelCenterPoint,
					(connectorAttr && connectorAttr.label) || '',
					labelTheme
				);
			};



		if (!shapeFrom || !shapeTo || shapeFrom.length === 0 || shapeTo.length === 0) {
			element.hide();
			return;
		}
		if (canUseData) {
			fromBox = shapeFrom.getDataBox();
			toBox = shapeTo.getDataBox();
		} else {
			fromBox = shapeFrom.getBox();
			toBox = shapeTo.getBox();
		}
		applyInnerRect(shapeFrom, fromBox);
		applyInnerRect(shapeTo, toBox);
		/*
		fromBox.level = shapeFrom.attr('mapjs-level');
		toBox.level = shapeTo.attr('mapjs-level');
		*/
		fromBox.styles = shapeFrom.data('styles');
		toBox.styles = shapeTo.data('styles');
		changeCheck = {from: fromBox, to: toBox, theme: DOMRender.theme &&  DOMRender.theme.name, attr: connectorAttr};
		if (_.isEqual(changeCheck, element.data('changeCheck'))) {
			return;
		}
		element.data('changeCheck', changeCheck);

		connection = _.extend(Connectors.themePath(fromBox, toBox, DOMRender.theme), connectorAttr);
		element.data('theme', connection.theme);
		pathElement = element.find('path.mapjs-connector');
		hitElement = element.find('path.mapjs-link-hit');
		element.css(_.extend(convertPositionToTransform(connection.position), {stroke: connection.color}));
		if (pathElement.length === 0) {
			pathElement = createSVG('path').attr('class', 'mapjs-connector').appendTo(element);
		}
		//TODO: if the map was translated (so only the relative position changed), do not re-update the curve!!!!
		pathElement.attr({
			'd': connection.d,
			'stroke-width': connection.width,
			'stroke-dasharray': lineStrokes[connection.lineStyle || 'solid'],
			fill: 'transparent'
		});
		if (allowParentConnectorOverride) {
			if (hitElement.length === 0) {
				hitElement = createSVG('path').attr('class', 'mapjs-link-hit').appendTo(element);
			}
			hitElement.attr({
				'd': connection.d
			});
		} else {
			if (hitElement.length > 0) {
				hitElement.remove();
			}
		}

		applyLabel();

	});
};

