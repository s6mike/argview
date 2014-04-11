/*global jQuery, Color, _, MAPJS, document*/
/*
 * MapViewController
 * -  listening to map model, updating the dom on the stage
 * -  interaction between keyboard and mouse and the model
 * -  listening to the DOM updates and telling the model about that
 * -  repositioning various UI elements
 */
MAPJS.createSVG = function (tag) {
	'use strict';
	return jQuery(document.createElementNS('http://www.w3.org/2000/svg', tag || 'svg'));
};
jQuery.fn.getBoxSlow = function () {
	'use strict';
	var domShape = jQuery(this),
		pos = domShape.position();
	pos.width = domShape.outerWidth(true);
	pos.height = domShape.outerHeight(true);
	return pos;
};
jQuery.fn.getBox = function () {
	'use strict';
	var domShape = jQuery(this)[0];
	if (!domShape) {
		return false;
	}
	return {
		top: domShape.offsetTop,
		left: domShape.offsetLeft,
		width: domShape.offsetWidth,
		height: domShape.offsetHeight
	};
};
jQuery.fn.getDataBox = function () {
	'use strict';
	var domShape = jQuery(this);
	if (!domShape.data('width')) {
		return domShape.getBox();
	}
	return {
		top: domShape.data('y') + domShape.parent().data('stageY'),
		left: domShape.data('x') + domShape.parent().data('stageX'),
		width: domShape.data('width'),
		height: domShape.data('height')
	};
};
jQuery.fn.animateConnectorToPosition = function () {
	'use strict';
	var element = jQuery(this),
		shapeFrom = jQuery('#' + element.attr('data-mapjs-node-from')),
		shapeTo = jQuery('#' + element.attr('data-mapjs-node-to')),
		fromBox = shapeFrom.getDataBox(),
		toBox = shapeTo.getDataBox(),
		oldBox = element.data('changeCheck');
	if (fromBox && toBox && oldBox && oldBox.from.width	=== fromBox.width	&&
		oldBox.to.width		=== toBox.width		&&
		oldBox.from.height	=== fromBox.height		&&
		oldBox.to.height	=== toBox.height		&&
		Math.abs(oldBox.from.top - oldBox.to.top - (fromBox.top - toBox.top)) < 2 &&
		Math.abs(oldBox.from.left - oldBox.to.left - (fromBox.left - toBox.left)) < 2) {

		element.animate({
			left: Math.min(fromBox.left, toBox.left),
			top: Math.min(fromBox.top, toBox.top),
		}, {
			duration: 400,
			queue: 'nodeQueue',
			easing: 'linear'
		});
		return true;
	}
	return false;
};
jQuery.fn.updateConnector = function () {
	'use strict';
	return jQuery.each(this, function () {
		var	element = jQuery(this),
			horizontalConnector = function (parentX, parentY, parentWidth, parentHeight,
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
				var tolerance = 10,
					childHorizontalOffset,
					childMid = child.top + child.height * 0.5,
					parentMid = parent.top + parent.height * 0.5;

				if (Math.abs(parentMid - childMid) + tolerance < Math.max(child.height, parent.height * 0.75)) {
					return horizontalConnector(parent.left, parent.top, parent.width, parent.height, child.left, child.top, child.width, child.height);
				}
				childHorizontalOffset = parent.left < child.left ? 0 : 1;
				return {
					from: {
						x: parent.left + 0.5 * parent.width,
						y: parent.top + 0.5 * parent.height
					},
					to: {
						x: child.left + childHorizontalOffset * child.width,
						y: child.top + 0.5 * child.height
					},
					controlPointOffset: 0.75
				};
			},
			shapeFrom = jQuery('#' + element.attr('data-mapjs-node-from')),
			shapeTo = jQuery('#' + element.attr('data-mapjs-node-to')),
			calculatedConnector, from, to, position, offset, maxOffset, pathElement, fromBox, toBox, changeCheck;
		if (shapeFrom.length === 0 || shapeTo.length === 0) {
			element.hide();
			return;
		}
		fromBox = shapeFrom.getBox();
		toBox = shapeTo.getBox();
		changeCheck = {from: fromBox, to: toBox};
		if (_.isEqual(changeCheck, element.data('changeCheck'))) {
			return;
		}

		element.data('changeCheck', changeCheck);
		calculatedConnector = calculateConnector(fromBox, toBox);
		from = calculatedConnector.from;
		to = calculatedConnector.to;
		position = {
			left: Math.min(fromBox.left, toBox.left),
			top: Math.min(fromBox.top, toBox.top),
		};
		offset = calculatedConnector.controlPointOffset * (from.y - to.y);
		maxOffset = Math.min(toBox.height, fromBox.height) * 1.5;
		pathElement = element.find('path');
		position.width = Math.max(fromBox.left + fromBox.width, toBox.left + toBox.width, position.left + 1) - position.left;
		position.height = Math.max(fromBox.top + fromBox.height, toBox.top + toBox.height, position.top + 1) - position.top;
		element.css(position).show();
		offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
		if (pathElement.length === 0) {
			pathElement = MAPJS.createSVG('path').attr('class', 'mapjs-connector').appendTo(element);
		}
		// if only the relative position changed, do not re-update the curve!!!!
		pathElement.attr('d',
			'M' + Math.round(from.x - position.left) + ',' + Math.round(from.y - position.top) +
			'Q' + Math.round(from.x - position.left) + ',' + Math.round(to.y - offset - position.top) + ' ' + Math.round(to.x - position.left) + ',' + Math.round(to.y - position.top)
		);
	});
};
jQuery.fn.updateLink = function () {
	'use strict';
	return jQuery.each(this, function () {
		var	element = jQuery(this),
			shapeFrom = jQuery('#' + element.attr('data-mapjs-node-from')),
			shapeTo = jQuery('#' + element.attr('data-mapjs-node-to')),
			calculateConnector = function (parent, child) {
				var parentPoints = [
					{
						x: parent.left + 0.5 * parent.width,
						y: parent.top
					},
					{
						x: parent.left + parent.width,
						y: parent.top + 0.5 * parent.height
					},
					{
						x: parent.left + 0.5 * parent.width,
						y: parent.top + parent.height
					},
					{
						x: parent.left,
						y: parent.top + 0.5 * parent.height
					}
				], childPoints = [
					{
						x: child.left + 0.5 * child.width,
						y: child.top
					},
					{
						x: child.left + child.width,
						y: child.top + 0.5 * child.height
					},
					{
						x: child.left + 0.5 * child.width,
						y: child.top + child.height
					},
					{
						x: child.left,
						y: child.top + 0.5 * child.height
					}
				], i, j, min = Infinity, bestParent, bestChild, dx, dy, current;
				for (i = 0; i < parentPoints.length; i += 1) {
					for (j = 0; j < childPoints.length; j += 1) {
						dx = parentPoints[i].x - childPoints[j].x;
						dy = parentPoints[i].y - childPoints[j].y;
						current = dx * dx + dy * dy;
						if (current < min) {
							bestParent = i;
							bestChild = j;
							min = current;
						}
					}
				}
				return {
					from: parentPoints[bestParent],
					to: childPoints[bestChild]
				};
			},
			conn, position,
			pathElement = element.find('path.mapjs-link'),
			arrowElement = element.find('path.mapjs-arrow'),
			n = Math.tan(Math.PI / 9),
			dashes = {
				dashed: '8, 8'
			},
			attrs = _.pick(element.data(), 'lineStyle', 'arrow', 'color'),
			fromBox, toBox, changeCheck;
		if (shapeFrom.length === 0 || shapeTo.length === 0) {
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


		conn = calculateConnector(fromBox, toBox);
		position = {
			left: Math.min(fromBox.left, toBox.left),
			top: Math.min(fromBox.top, toBox.top),
		};
		position.width = Math.max(fromBox.left + fromBox.width, toBox.left + toBox.width, position.left + 1) - position.left;
		position.height = Math.max(fromBox.top + fromBox.height, toBox.top + toBox.height, position.top + 1) - position.top;
		element.css(position).show();

		if (pathElement.length === 0) {
			pathElement = MAPJS.createSVG('path').attr('class', 'mapjs-link').appendTo(element);
		}
		pathElement.attr({
			'd': 'M' + Math.round(conn.from.x - position.left) + ',' + Math.round(conn.from.y - position.top) +
				 'L' + Math.round(conn.to.x - position.left) + ',' + Math.round(conn.to.y - position.top),
			'stroke-dasharray': dashes[attrs.lineStyle]
		}).css('stroke', attrs.color);
		if (attrs.arrow) {
			if (arrowElement.length === 0) {
				arrowElement = MAPJS.createSVG('path').attr('class', 'mapjs-arrow').appendTo(element);
			}
			var a1x, a1y, a2x, a2y, len = 14, iy, m,
				dx = conn.to.x - conn.from.x,
				dy = conn.to.y - conn.from.y;
			if (dx === 0) {
				iy = dy < 0 ? -1 : 1;
				a1x = conn.to.x + len * Math.sin(n) * iy;
				a2x = conn.to.x - len * Math.sin(n) * iy;
				a1y = conn.to.y - len * Math.cos(n) * iy;
				a2y = conn.to.y - len * Math.cos(n) * iy;
			} else {
				m = dy / dx;
				if (conn.from.x < conn.to.x) {
					len = -len;
				}
				a1x = conn.to.x + (1 - m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a1y = conn.to.y + (m + n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a2x = conn.to.x + (1 + m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a2y = conn.to.y + (m - n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
			}
			arrowElement.attr('d',
				'M' + Math.round(a1x - position.left) + ',' + Math.round(a1y - position.top) +
				'L' + Math.round(conn.to.x - position.left) + ',' + Math.round(conn.to.y - position.top) +
				'L' + Math.round(a2x - position.left) + ',' + Math.round(a2y - position.top) +
				'Z')
				.css('fill', attrs.color)
				.show();
		} else {
			arrowElement.hide();
		}

	});
};
jQuery.fn.updateNodeContent = function (nodeContent) {
	'use strict';
	var MAX_URL_LENGTH = 25,
		self = jQuery(this),
		textSpan = function () {
			var span = self.find('[data-mapjs-role=title]');
			if (span.length === 0) {
				span = jQuery('<span>').attr('data-mapjs-role', 'title').appendTo(self);
			}
			return span;
		},
		applyLinkUrl = function (title) {
			var url = MAPJS.URLHelper.getLink(title),
				element = self.find('a.mapjs-link');
			if (!url) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<a target="_blank" class="mapjs-link"></a>').appendTo(self);
			}
			element.attr('href', url).show();
		},
		applyAttachment = function () {
			var attachment = nodeContent.attr && nodeContent.attr.attachment,
				element = self.find('a.mapjs-attachment');
			if (!attachment) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<a href="#" class="mapjs-attachment"></a>').appendTo(self).click(function () {
					self.trigger('attachment-click');
				});
			}
			element.show();
		},
		updateText = function (title) {
			var text = MAPJS.URLHelper.stripLink(title) ||
					(title.length < MAX_URL_LENGTH ? title : (title.substring(0, MAX_URL_LENGTH) + '...')),
				element = textSpan();
			element.text(text.trim());
			element.css({'max-width': '', 'min-width': ''});
			if ((element[0].scrollWidth - 10) > element.outerWidth()) {
				element.css('max-width', element[0].scrollWidth + 'px');
			}
			else {
				var height = element.height();
				element.css('min-width', element.css('max-width'));
				if (element.height() === height) {
					element.css('min-width', '');
				}
			}
		},
		setCollapseClass = function () {
			if (nodeContent.attr && nodeContent.attr.collapsed) {
				self.addClass('mapjs-collapsed');
			} else {
				self.removeClass('mapjs-collapsed');
			}
		},
		foregroundClass = function (backgroundColor) {
			/*jslint newcap:true*/
			var luminosity = Color(backgroundColor).mix(Color('#EEEEEE')).luminosity();
			if (luminosity < 0.5) {
				return 'mapjs-node-dark';
			}
			else if (luminosity < 0.9) {
				return 'mapjs-node-light';
			}
			return 'mapjs-node-white';
		},
		setColors = function () {
			var fromStyle =	nodeContent.attr && nodeContent.attr.style && nodeContent.attr.style.background;
			self.removeClass('mapsj-node-dark mapjs-node-white mapjs-node-light');
			if (fromStyle) {
				self.css('background-color', fromStyle);
				self.addClass(foregroundClass(fromStyle));
			} else {
				self.css('background-color', '');
			}
		},
		setIcon = function (icon) {
			var textBox = textSpan(),
				textHeight = textBox.outerHeight(),
				maxTextWidth = parseInt(textBox.css('max-width'), 10),
				padding,
				selfProps = {
					'min-height': '',
					'min-width': '',
					'background-image': '',
					'background-repeat': '',
					'background-size': '',
					'background-position': ''
				},
				textProps = {
					'margin-top': '',
					'margin-left': ''
				};
			self.css({padding: ''});
			padding = parseInt(self.css('padding-left'), 10);
			if (icon) {
				_.extend(selfProps, {
					'background-image': 'url("' + icon.url + '")',
					'background-repeat': 'no-repeat',
					'background-size': icon.width + 'px ' + icon.height + 'px',
					'background-position': 'center center'
				});
				if (icon.position === 'top' || icon.position === 'bottom') {
					selfProps['background-position'] = 'center ' + icon.position + ' ' + padding + 'px';
					selfProps['padding-' + icon.position] = icon.height + (padding * 2);
					selfProps['min-width'] = icon.width;
					if (icon.width > maxTextWidth) {
						textProps['margin-left'] =  (icon.width - maxTextWidth) / 2;
					}
				}
				else if (icon.position === 'left' || icon.position === 'right') {
					selfProps['background-position'] = icon.position + ' ' + padding + 'px center';
					selfProps['padding-' + icon.position] = icon.width + (padding * 2);
					if (icon.height > textHeight) {
						textProps['margin-top'] =  (icon.height - textHeight) / 2;
						selfProps['min-height'] = icon.height;
					}
				} else {
					if (icon.height > textHeight) {
						textProps['margin-top'] =  (icon.height - textHeight) / 2;
						selfProps['min-height'] = icon.height;
					}
					selfProps['min-width'] = icon.width;
					if (icon.width > maxTextWidth) {
						textProps['margin-left'] =  (icon.width - maxTextWidth) / 2;
					}
				}
			}
			self.css(selfProps);
			textBox.css(textProps);
		};
	updateText(nodeContent.title);
	applyLinkUrl(nodeContent.title);
	applyAttachment();
	self.attr('mapjs-level', nodeContent.level);

	setColors();
	setIcon(nodeContent.attr && nodeContent.attr.icon);
	setCollapseClass();
	return self;
};
