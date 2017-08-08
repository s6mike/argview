/*global require */

const jQuery = require('jquery'),
	createSVG = require('./create-svg'),
	Connectors = require('mindmup-mapjs-layout').Connectors,
	defaultTheme = require('mindmup-mapjs-layout').Themes.default,
	lineStrokes = require('mindmup-mapjs-layout').lineStrokes,
	convertPositionToTransform = require('./convert-position-to-transform'),
	_ = require('underscore'),
	DOMRender = require('./dom-render');

require('./get-box');
require('./get-data-box');

jQuery.fn.updateConnector = function (canUseData) {
	'use strict';
	return jQuery.each(this, function () {
		let connection = false, pathElement, hitElement, fromBox, toBox, changeCheck = false;
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
			getTextElement = function (elementType) {
				elementType = elementType || 'text';
				let textElement = element.find(elementType + '.mapjs-connector-text');
				if (!(connectorAttr && connectorAttr.label)) {
					textElement.remove();
					return false;
				} else {
					if (textElement.length === 0) {
						textElement = createSVG(elementType).attr('class', 'mapjs-connector-text');
						textElement.appendTo(element);
					}
					return textElement;
				}
			},
			updateConnectorText = function (labelTheme) {
				const calcCenterPoint = function (pathDOM) {
						if (labelTheme.position.ratio) {
							return pathDOM.getPointAtLength(pathDOM.getTotalLength() * labelTheme.position.ratio);
						}
						return {
							x: toBox.left + (toBox.width / 2) - connection.position.left,
							y: toBox.top - connection.position.top - labelTheme.position.aboveEnd
						};
					},
					rectElement = getTextElement('rect'),
					textElement = getTextElement(),
					textDOM = textElement && textElement[0],
					rectDOM = rectElement && rectElement[0],
					pathDOM = pathElement && pathElement[0],
					centrePoint = pathDOM && calcCenterPoint(pathDOM),
					labelText = (connectorAttr && connectorAttr.label) || '';

				element.data('label-center-point', centrePoint);
				let dimensions = false;
				if (!textDOM) {
					return false;
				}
				textDOM.style.stroke = 'none';
				textDOM.style.fill = labelTheme.text.color;
				textDOM.style.fontSize = labelTheme.text.font.sizePx + 'px';
				textDOM.style.fontWeight = labelTheme.text.font.weight;
				textDOM.style.alignmentBaseline = 'hanging';
				textElement.text(labelText.trim());
				dimensions = textDOM.getClientRects()[0];
				textDOM.setAttribute('x', Math.round(centrePoint.x - dimensions.width / 2));
				textDOM.setAttribute('y', Math.round(centrePoint.y - dimensions.height));
				rectDOM.setAttribute('x', Math.round(centrePoint.x - dimensions.width / 2));
				rectDOM.setAttribute('y', Math.round(centrePoint.y - dimensions.height - 2));
				rectDOM.style.height = Math.round(dimensions.height) + 'px';
				rectDOM.style.width = Math.round(dimensions.width) + 'px';
				rectDOM.style.fill = labelTheme.backgroundColor;
				rectDOM.style.stroke = labelTheme.borderColor;
				return textElement;
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
		updateConnectorText((connection.theme && connection.theme.label) || defaultTheme.connector.default.label);

	});
};

