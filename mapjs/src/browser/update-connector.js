/*global require */

const jQuery = require('jquery'),
	createSVG = require('./create-svg'),
	defaultTheme = require('../core/theme/default-theme'),
	lineStrokes = require('../core/theme/line-strokes'),
	convertPositionToTransform = require('../core/util/convert-position-to-transform'),
	updateConnectorText = require('./update-connector-text'),
	calcLabelCenterPont = require('./calc-label-center-point'),
	buildConnection = require('../browser/build-connection'),
	connectionIsUpdated = (element, connection, theme) => {
		'use strict';
		const connectionPropCheck = JSON.stringify(connection) + (theme && theme.name);
		if (!connection || connectionPropCheck === element.data('changeCheck')) {
			return false;
		}
		element.data('changeCheck', connectionPropCheck);
		return connection;
	};
require('./get-data-box');

jQuery.fn.updateConnector = function (optional) {
	'use strict';
	const theme = optional && optional.theme;
	return jQuery.each(this, function () {
		let pathElement, hitElement;
		const element = jQuery(this),
			connectorAttr = element.data('attr'),
			allowParentConnectorOverride = !theme || !(theme.connectorEditingContext || theme.blockParentConnectorOverride) || (theme.connectorEditingContext && theme.connectorEditingContext.allowed && theme.connectorEditingContext.allowed.length), //TODO: rempve blockParentConnectorOverride once site has been live for a while
			connection = buildConnection(element, optional),
			applyLabel = function () {
				const labelText = (connectorAttr && connectorAttr.label) || '',
					shapeTo = labelText && element.data('nodeTo'),
					shapeFrom = labelText && element.data('nodeFrom'),
					labelTheme = (connection.theme && connection.theme.label) || defaultTheme.connector.default.label,
					labelCenterPoint = labelText && calcLabelCenterPont(connection.position, shapeFrom.getDataBox(), shapeTo.getDataBox(), connection.d, labelTheme);
				updateConnectorText(
					element,
					labelCenterPoint,
					labelText,
					labelTheme
				);
			};

		if (!connection) {
			element.remove();
			return;
		}

		if (!connectionIsUpdated(element, connection, theme)) {
			return;
		}
		element.data('theme', connection.theme);
		element.data('position', Object.assign({}, connection.position));
		pathElement = element.find('path.mapjs-connector');
		hitElement = element.find('path.mapjs-link-hit');
		element.css(Object.assign(convertPositionToTransform(connection.position), {stroke: connection.color}));
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
				hitElement = createSVG('path').attr('class', 'mapjs-link-hit noTransition').appendTo(element);
			}
			hitElement.attr({
				'd': connection.d,
				'stroke-width': connection.width + 12
			});
		} else {
			if (hitElement.length > 0) {
				hitElement.remove();
			}
		}
		applyLabel();
	});
};

