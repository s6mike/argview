/*global MAPJS, Color, $*/
/*jslint nomen: true, newcap: true, browser: true*/

MAPJS.domMediator = function (mapModel, stageElement) {
	'use strict';

	var horizontalConnector = function (parentX, parentY, parentWidth, parentHeight,
			childX, childY, childWidth, childHeight) {
		var childHorizontalOffset = parentX < childX ? 0.1 : 0.9,
			parentHorizontalOffset = 1 - childHorizontalOffset;
		return {
			from: {
				x: parentX + parentHorizontalOffset * parentWidth,
				y: parentY + 0.5 * parentHeight
			},
			to: {
				x: childX + childHorizontalOffset * childWidth,
				y: childY + 0.5 * childHeight
			},
			controlPointOffset: 0
		};
	},
	calculateConnector = function (parent, child) {
		return calculateConnectorInner(parent.position().left, parent.position().top, parent.width(), parent.height(),
			child.position().left, child.position().top, child.width(), child.height());
	},
	calculateConnectorInner = _.memoize(function (parentX, parentY, parentWidth, parentHeight,
			childX, childY, childWidth, childHeight) {
		var tolerance = 10,
			childMid = childY + childHeight * 0.5,
			parentMid = parentY + parentHeight * 0.5,
			childHorizontalOffset;
		if (Math.abs(parentMid - childMid) + tolerance < Math.max(childHeight, parentHeight * 0.75)) {
			return horizontalConnector(parentX, parentY, parentWidth, parentHeight, childX, childY, childWidth, childHeight);
		}
		childHorizontalOffset = parentX < childX ? 0 : 1;
		return {
			from: {
				x: parentX + 0.5 * parentWidth,
				y: parentY + 0.5 * parentHeight
			},
			to: {
				x: childX + childHorizontalOffset * childWidth,
				y: childY + 0.5 * childHeight
			},
			controlPointOffset: 0.75
		};
	}, function () {
		return Array.prototype.join.call(arguments, ',');
	});

	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = $('#node_' + ideaId);
		if (isSelected) {
			node.focus();
		}
	});
	mapModel.addEventListener('connectorCreated', function (connector) {
		var	shapeFrom = $('#node_' + connector.from),
			shapeTo = $('#node_' + connector.to),
			config = {
				stroke: '#888',
				width: 1
			},
			domConnector,
			svg = function (tag) {
				return document.createElementNS('http://www.w3.org/2000/svg', tag);
			},
			calculatedConnector = calculateConnector(shapeFrom, shapeTo),
			from = {
				top: calculatedConnector.from.y,
				left: calculatedConnector.from.x
			},
			to = {
				top: calculatedConnector.to.y,
				left: calculatedConnector.to.x
			},
			position = {
				left: Math.min(from.left, to.left),
				top: Math.min(from.top, to.top),
			};

		position.width = Math.max(from.left, to.left, position.left + 1) - position.left;
		position.height = Math.max(from.top, to.top, position.top + 1) - position.top;
		domConnector = $(svg('svg')).attr({
			height: position.height,
			width: position.width
		});
		$(svg('line')).attr({
			x1: from.left - position.left,
			x2: to.left - position.left,
			y1: from.top - position.top,
			y2: to.top - position.top,
			style: 'stroke:' + config.stroke + ';stroke-width:' + config.width + 'px'
		}).appendTo(domConnector);
		domConnector.css(position).addClass('connector').appendTo(stageElement);
	});

	mapModel.addEventListener('nodeCreated', function (node) {
		var config = {
				padding: '8px'
			},
			backgroundColor = function () {
				var fromStyle =	node.attr && node.attr.style && node.attr.style.background,
					generic = MAPJS.defaultStyles[node.level === 1 ? 'root' : 'nonRoot'].background;
				return fromStyle ||  generic;
			},
			foregroundColor = function (backgroundColor) {
				var tintedBackground = Color(backgroundColor).mix(Color('#EEEEEE')).hexString();
				return MAPJS.contrastForeground(tintedBackground);
			},
			nodeDiv = $('<div>')
				.attr('tabindex', 0)
				.attr('id', 'node_' + node.id)
				.addClass('node')
				.css({
				'left': node.x + stageElement.innerWidth() / 2,
				'top': node.y + stageElement.innerHeight() / 2,
				'width': node.width,
				'height': node.height,
				'background-color': backgroundColor()
			}).appendTo(stageElement),
			textBox = $('<span>').addClass('text').text(node.title).appendTo(nodeDiv).css({
				color: foregroundColor(backgroundColor()),
				display: 'block'
			}),
			icon;
		if (node.attr && node.attr.icon) {
			icon = document.createElement('img');
			icon.src = node.attr.icon.url;
			icon.width = node.attr.icon.width;
			icon.height = node.attr.icon.height;

			if (node.attr.icon.position === 'top') {
				$(icon).css({
					'display': 'block',
					'margin-left': (node.width - icon.width) / 2,
					'margin-top': config.padding
				}).prependTo(nodeDiv);
				textBox.css({
					'display': 'block',
					'width': '100%',
					'margin-top': config.padding
				});
				nodeDiv.css('text-align', 'center');
			} else {
				nodeDiv.prepend(icon);
			}
		}
		else {
			textBox.css({
				'margin-top': (node.height - textBox.outerHeight(true)) / 2,
				'margin-left': (node.width - textBox.outerWidth(true)) / 2
			});

		}
	});
};
$.fn.domMapWidget = function (activityLog, mapModel) {
	'use strict';
	return this.each(function () {
		var element = $(this);
		MAPJS.domMediator(mapModel, element);
	});
};

// + shadows
// + selected
// + default and non default backgrounds for root and children
// + multi-line text
//
// icon position
// link
// attachment - clip
// straight lines extension
// collaboration avatars
// folded
// activated
// zoom
// mouse events



