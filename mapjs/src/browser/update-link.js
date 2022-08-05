/*global require */
const jQuery = require('jquery'),
	createSVG = require('./create-svg'),
	convertPositionToTransform = require('../core/util/convert-position-to-transform'),
	updateConnectorText = require('./update-connector-text'),
	themeLink = require('../core/theme/link'),
	calcLabelCenterPont = require('./calc-label-center-point'),
	showArrows = function (connection, element) {
		'use strict';
		const arrowElements = element.find('path.mapjs-arrow');
		if (connection.arrows && connection.arrows.length) {
			//connection.arrow can be true, 'to', 'from', 'both'
			connection.arrows.forEach((arrow, index) => {
				let arrowElement = arrowElements.eq(index);
				if (arrowElement.length === 0) {
					arrowElement = createSVG('path').attr('class', 'mapjs-arrow').appendTo(element);
				}
				arrowElement
				.attr({
					d: arrow,
					fill: connection.lineProps.color,
					'stroke-width': connection.lineProps.width
				})
				.show();
			});
			arrowElements.slice(connection.arrows.length).hide();
		} else {
			arrowElements.hide();
		}
	};

require('./get-data-box');

jQuery.fn.updateLink = function (optional) {
	'use strict';
	const linkBuilder = (optional && optional.linkBuilder) || themeLink,
		theme = (optional && optional.theme);
	return jQuery.each(this, function () {
		const element = jQuery(this),
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
			attrs = element.data('attr') || {},
			applyLabel = function (connection, fromBox, toBox) {
				const labelText = attrs.label || '',
					labelTheme = connection.theme.label,
					labelCenterPoint = labelText && calcLabelCenterPont(connection.position, fromBox, toBox, connection.d, labelTheme);
				updateConnectorText(
					element,
					labelCenterPoint,
					labelText,
					labelTheme
				);
			};
		let connection = false,
			pathElement = element.find('path.mapjs-link'),
			hitElement = element.find('path.mapjs-link-hit'),
			fromBox = false, toBox = false, changeCheck = false;
		if (!shapeFrom || !shapeTo || shapeFrom.length === 0 || shapeTo.length === 0) {
			element.hide();
			return;
		}
		fromBox = shapeFrom.getDataBox();
		toBox = shapeTo.getDataBox();

		connection = linkBuilder(fromBox, toBox, attrs, theme);
		changeCheck = JSON.stringify(connection) + (theme && theme.name);
		if (changeCheck === element.data('changeCheck')) {
			return;
		}
		element.data('changeCheck', changeCheck);


		element.data('theme', connection.theme);
		element.data('position', Object.assign({}, connection.position));
		element.css(Object.assign(convertPositionToTransform(connection.position), {stroke: connection.lineProps.color}));

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
			hitElement = createSVG('path').attr('class', 'mapjs-link-hit noTransition').appendTo(element);
		}
		hitElement.attr({
			'd': connection.d,
			'stroke-width': connection.lineProps.width + 12
		});
		showArrows(connection, element);
		applyLabel(connection, fromBox, toBox);
	});
};

