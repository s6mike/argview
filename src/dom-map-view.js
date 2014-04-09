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
				return calculateConnectorInner(parent.position().left, parent.position().top, parent.outerWidth(true), parent.outerHeight(true),
					child.position().left, child.position().top, child.outerWidth(true), child.outerHeight(true));
			},
			calculateConnectorInner = function (parentX, parentY, parentWidth, parentHeight,
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
			},
			shapeFrom = jQuery('#' + element.attr('data-mapjs-node-from')),
			shapeTo = jQuery('#' + element.attr('data-mapjs-node-to')),
			calculatedConnector = calculateConnector(shapeFrom, shapeTo),
			from = calculatedConnector.from,
			to = calculatedConnector.to,
			position = {
				left: Math.min(shapeFrom.position().left, shapeTo.position().left),
				top: Math.min(shapeFrom.position().top, shapeTo.position().top),
			},
			offset = calculatedConnector.controlPointOffset * (from.y - to.y),
			maxOffset = Math.min(shapeTo.height(), shapeFrom.height()) * 1.5,
			pathElement = element.find('path');
		position.width = Math.max(shapeFrom.position().left + shapeFrom.outerWidth(true), shapeTo.position().left + shapeTo.outerWidth(true), position.left + 1) - position.left;
		position.height = Math.max(shapeFrom.position().top + shapeFrom.outerHeight(true), shapeTo.position().top + shapeTo.outerHeight(true), position.top + 1) - position.top;
		element.css(position);
		offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
		if (pathElement.length === 0) {
			pathElement = MAPJS.createSVG('path').attr('class', 'mapjs-connector').appendTo(element);
		}
		pathElement.attr('d',
			'M' + (from.x - position.left) + ',' + (from.y - position.top) +
			'Q' + (from.x - position.left) + ',' + (to.y - offset - position.top) + ' ' + (to.x - position.left) + ',' + (to.y - position.top)
		);
	});
};
jQuery.fn.updateLink = function () {
	'use strict';
	return jQuery.each(this, function () {
		var	element = jQuery(this),
			shapeFrom = jQuery('#' + element.attr('data-mapjs-node-from')),
			shapeTo = jQuery('#' + element.attr('data-mapjs-node-to')),
			calculateConnectorInner = function (parentX, parentY, parentWidth, parentHeight, childX, childY, childWidth, childHeight) {
				var parent = [
					{
						x: parentX + 0.5 * parentWidth,
						y: parentY
					},
					{
						x: parentX + parentWidth,
						y: parentY + 0.5 * parentHeight
					},
					{
						x: parentX + 0.5 * parentWidth,
						y: parentY + parentHeight
					},
					{
						x: parentX,
						y: parentY + 0.5 * parentHeight
					}
				], child = [
					{
						x: childX + 0.5 * childWidth,
						y: childY
					},
					{
						x: childX + childWidth,
						y: childY + 0.5 * childHeight
					},
					{
						x: childX + 0.5 * childWidth,
						y: childY + childHeight
					},
					{
						x: childX,
						y: childY + 0.5 * childHeight
					}
				], i, j, min = Infinity, bestParent, bestChild, dx, dy, current;
				for (i = 0; i < parent.length; i += 1) {
					for (j = 0; j < child.length; j += 1) {
						dx = parent[i].x - child[j].x;
						dy = parent[i].y - child[j].y;
						current = dx * dx + dy * dy;
						if (current < min) {
							bestParent = i;
							bestChild = j;
							min = current;
						}
					}
				}
				return {
					from: parent[bestParent],
					to: child[bestChild]
				};
			},
			calculateConnector = function (parent, child) {
				return calculateConnectorInner(parent.position().left, parent.position().top, parent.outerWidth(true), parent.outerHeight(true),
					child.position().left, child.position().top, child.outerWidth(true), child.outerHeight(true));
			},
			conn = calculateConnector(shapeFrom, shapeTo),
			position = {
				left: Math.min(shapeFrom.position().left, shapeTo.position().left),
				top: Math.min(shapeFrom.position().top, shapeTo.position().top),
			},
			pathElement = element.find('path.mapjs-link'),
			arrowElement = element.find('path.mapjs-arrow'),
			n = Math.tan(Math.PI / 9),
			dashes = {
				dashed: '8, 8'
			};
		position.width = Math.max(shapeFrom.position().left + shapeFrom.outerWidth(true), shapeTo.position().left + shapeTo.outerWidth(true), position.left + 1) - position.left;
		position.height = Math.max(shapeFrom.position().top + shapeFrom.outerHeight(true), shapeTo.position().top + shapeTo.outerHeight(true), position.top + 1) - position.top;
		element.css(position);

		if (pathElement.length === 0) {
			pathElement = MAPJS.createSVG('path').attr('class', 'mapjs-link').appendTo(element);
		}
		pathElement.attr({
			'd': 'M' + (conn.from.x - position.left) + ',' + (conn.from.y - position.top) +
				 'L' + (conn.to.x - position.left) + ',' + (conn.to.y - position.top),
			'stroke-dasharray': dashes[element.data('mapjs-line-style')]
		}).css({stroke: element.data('mapjs-line-color')});
		if (element.data('mapjs-line-arrow')) {
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
				'M' + (a1x - position.left) + ',' + (a1y - position.top) +
				'L' + (conn.to.x - position.left) + ',' + (conn.to.y - position.top) +
				'L' + (a2x - position.left) + ',' + (a2y - position.top) +
				'Z')
				.css({fill: element.data('mapjs-line-color')})
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
