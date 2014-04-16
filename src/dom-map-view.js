/*global jQuery, Color, _, MAPJS, document, window*/
MAPJS.createSVG = function (tag) {
	'use strict';
	return jQuery(document.createElementNS('http://www.w3.org/2000/svg', tag || 'svg'));
};
jQuery.fn.getBox = function () {
	'use strict';
	var domShape = this && this[0];
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
	var domShapeData = this.data();
	if (domShapeData && domShapeData.width && domShapeData.height) {
		return {
			top: domShapeData.y,
			left: domShapeData.x,
			width: domShapeData.width,
			height: domShapeData.height
		};
	}
	return this.getBox();
};


jQuery.fn.animateConnectorToPosition = function (animationOptions, tolerance) {
	'use strict';
	var element = jQuery(this),
		shapeFrom = element.data('nodeFrom'),
		shapeTo = element.data('nodeTo'),
		fromBox = shapeFrom && shapeFrom.getDataBox(),
		toBox = shapeTo && shapeTo.getDataBox(),
		oldBox = {
			from: shapeFrom && shapeFrom.getBox(),
			to: shapeTo && shapeTo.getBox()
		};
	tolerance = tolerance || 1;
	if (fromBox && toBox && oldBox && oldBox.from.width	=== fromBox.width	&&
		oldBox.to.width		=== toBox.width		&&
		oldBox.from.height	=== fromBox.height		&&
		oldBox.to.height	=== toBox.height		&&
		Math.abs(oldBox.from.top - oldBox.to.top - (fromBox.top - toBox.top)) < tolerance &&
		Math.abs(oldBox.from.left - oldBox.to.left - (fromBox.left - toBox.left)) < tolerance) {

		element.animate({
			left: Math.round(Math.min(fromBox.left, toBox.left)),
			top: Math.round(Math.min(fromBox.top, toBox.top)),
		}, animationOptions);
		return true;
	}
	return false;
};
jQuery.fn.queueFadeOut = function (options) {
	'use strict';
	var element = this;
	return element.fadeOut(_.extend({
		complete: function () {
			element.remove();
		}
	}, options));
};
jQuery.fn.queueFadeIn = function (options) {
	'use strict';
	var element = this;
	return element
		.css('opacity', 0)
		.animate(
			{'opacity': 1},
			_.extend({ complete: function () { element.css('opacity', ''); }}, options)
		);
};

jQuery.fn.updateStage = function () {
	'use strict';
	var data = this.data(),
		size = {
			'min-width': Math.round(data.width - data.offsetX),
			'min-height': Math.round(data.height - data.offsetY),
			'width': Math.round(data.width - data.offsetX),
			'height': Math.round(data.height - data.offsetY),
			'transform-origin': 'top left',
			'transform': 'translate3d(' + Math.round(data.offsetX) + 'px, ' + Math.round(data.offsetY) + 'px, 0)'
		};
	if (data.scale && data.scale !== 1) {
		size.transform = 'scale(' + data.scale + ') translate(' + Math.round(data.offsetX) + 'px, ' + Math.round(data.offsetY) + 'px)';
	}
	this.css(size);
	return this;
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
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
			calculatedConnector, from, to, position, offset, maxOffset, pathElement, fromBox, toBox, changeCheck;
		if (!shapeFrom || !shapeTo || shapeFrom.length === 0 || shapeTo.length === 0) {
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
		element.css(position);
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
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
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


		conn = calculateConnector(fromBox, toBox);
		position = {
			left: Math.min(fromBox.left, toBox.left),
			top: Math.min(fromBox.top, toBox.top),
		};
		position.width = Math.max(fromBox.left + fromBox.width, toBox.left + toBox.width, position.left + 1) - position.left;
		position.height = Math.max(fromBox.top + fromBox.height, toBox.top + toBox.height, position.top + 1) - position.top;
		element.css(position);

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
			self.data('title', title);
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
			if (fromStyle === 'false' || fromStyle === 'transparent') {
				fromStyle = false;
			}
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
jQuery.fn.placeCaretAtEnd = function () {
	'use strict';
	var el = this[0];
	if (window.getSelection && document.createRange) {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (document.body.createTextRange) {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
};
jQuery.fn.editNode = function () {
	'use strict';
	var textBox = this.find('[data-mapjs-role=title]'),
		unformattedText = this.data('title'),
		originalText = textBox.text(),
		result = jQuery.Deferred(),
		clear = function () {
			detachListeners();
			textBox.css('word-break', '');
			textBox.removeAttr('contenteditable');
		},
		finishEditing = function () {
			if (textBox.text() === unformattedText) {
				return cancelEditing();
			}
			clear();
			result.resolve(textBox.text());
		},
		cancelEditing = function () {
			clear();
			textBox.text(originalText);
			result.reject();
		},
		keyboardEvents = function (e) {
			var ENTER_KEY_CODE = 13,
				ESC_KEY_CODE = 27,
				TAB_KEY_CODE = 9,
				S_KEY_CODE = 83,
				Z_KEY_CODE = 90;
			if (e.shiftKey && e.which === ENTER_KEY_CODE) {
				return; // allow shift+enter to break lines
			}
			else if (e.which === ENTER_KEY_CODE) {
				finishEditing();
				e.stopPropagation();
			} else if (e.which === ESC_KEY_CODE) {
				cancelEditing();
				e.stopPropagation();
			} else if (e.which === TAB_KEY_CODE || (e.which === S_KEY_CODE && (e.metaKey || e.ctrlKey))) {
				finishEditing();
				e.preventDefault(); /* stop focus on another object */
			} else if (!e.shiftKey && e.which === Z_KEY_CODE && (e.metaKey || e.ctrlKey)) { /* undo node edit on ctrl+z if text was not changed */
				if (textBox.text() === unformattedText) {
					cancelEditing();
				}
				e.stopPropagation();
			}
		},
		attachListeners = function () {
			textBox.on('blur', finishEditing).on('keydown', keyboardEvents);
		},
		detachListeners = function () {
			textBox.off('blur', finishEditing).off('keydown', keyboardEvents);
		};
	attachListeners();
	if (unformattedText !== originalText) { /* links or some other potential formatting issues */
		textBox.css('word-break', 'break-all');
	}
	textBox.text(unformattedText).attr('contenteditable', true).focus();
	if (unformattedText) {
		textBox.placeCaretAtEnd();
	}
	return result.promise();
};
MAPJS.DOMRender = {
	nodeCacheMark: function (idea) {
		'use strict';
		return {
			title: idea.title,
			icon: idea.attr && idea.attr.icon && _.pick(idea.attr.icon, 'width', 'height', 'position'),
			collapsed: idea.attr && idea.attr.collapsed
		};
	},
	addNodeCacheMark: function (domNode, idea) {
		'use strict';
		domNode.data('nodeCacheMark', MAPJS.DOMRender.nodeCacheMark(idea));
	},
	dimensionProvider: function (idea) {
		'use strict'; /* support multiple stages? */
		var existing = document.getElementById('node_' + idea.id),
			textBox,
			result;
		if (existing) {
			textBox = jQuery(existing);
			if (_.isEqual(textBox.data('nodeCacheMark'), MAPJS.DOMRender.nodeCacheMark(idea))) {
				return _.pick(textBox.data(), 'width', 'height');
			}
		}
		textBox = jQuery('<div>').addClass('mapjs-node').css({position: 'absolute', visibility: 'hidden'}).appendTo('body').updateNodeContent(idea);
		result = {
			width: textBox.outerWidth(true),
			height: textBox.outerHeight(true)
		};
		textBox.detach();
		return result;
	},
	layoutCalculator: function (contentAggregate) {
		'use strict';
		return MAPJS.calculateLayout(contentAggregate, MAPJS.DOMRender.dimensionProvider);
	}
};



MAPJS.DOMRender.viewController = function (mapModel, stageElement) {
	'use strict';
	var viewPort = stageElement.parent(),
		connectorsForAnimation = jQuery(),
		linksForAnimation = jQuery(),
		nodeAnimOptions = { duration: 400, queue: 'nodeQueue', easing: 'linear' };

	var cleanDOMId = function (s) {
			return s.replace(/\./g, '_');
		},
		connectorKey = function (connectorObj) {
			return cleanDOMId('connector_' + connectorObj.from + '_' + connectorObj.to);
		},
		linkKey = function (linkObj) {
			return cleanDOMId('link_' + linkObj.ideaIdFrom + '_' + linkObj.ideaIdTo);
		},
		nodeKey = function (id) {
			return cleanDOMId('node_' + id);
		},
		stageToViewCoordinates = function (x, y) {
			var stage = stageElement.data();
			return {
				x: stage.scale * (x + stage.offsetX) - viewPort.scrollLeft(),
				y: stage.scale * (y + stage.offsetY) - viewPort.scrollTop()
			};
		},
		viewToStageCoordinates = function (x, y) {
			var stage = stageElement.data();
			return {
				x: (viewPort.scrollLeft() + x) / stage.scale - stage.offsetX,
				y: (viewPort.scrollTop() + y) / stage.scale - stage.offsetY
			};
		},
		updateScreenCoordinates = function () {
			var element = jQuery(this);
			element.css({
				'left': element.data('x'),
				'top' : element.data('y'),
			}).trigger('mapjs:move');
		},
		animateToPositionCoordinates = function () {
			var element = jQuery(this);
			element.clearQueue(nodeAnimOptions.queue).animate({
				'left': element.data('x'),
				'top' : element.data('y'),
				'opacity': 1 /* previous animation can be cancelled with clearqueue, so ensure it gets visible */
			}, _.extend({
				complete: function () {
					element.each(updateScreenCoordinates);
				},
			}, nodeAnimOptions)).trigger('mapjs:animatemove');
		},
		ensureSpaceForPoint = function (x, y) {/* in stage coordinates */
			var stage = stageElement.data(),
				dirty = false;
			if (x < -1 * stage.offsetX) {
				stage.width =  stage.width - stage.offsetX - x;
				stage.offsetX = -1 * x;
				dirty = true;
			}
			if (y < -1 * stage.offsetY) {
				stage.height = stage.height - stage.offsetY - y;
				stage.offsetY = -1 * y;
				dirty = true;
			}
			if (x > stage.width - stage.offsetX) {
				stage.width = stage.offsetX + x;
				dirty = true;
			}
			if (y > stage.height - stage.offsetY) {
				stage.height = stage.offsetY + y;
				dirty = true;
			}
			if (dirty) {
				stageElement.updateStage();
			}
		},
		ensureSpaceForNode = function () {
			return jQuery(this).each(function () {
				var node = jQuery(this).data();
				/* sequence of calculations is important because maxX and maxY take into consideration the new offsetX snd offsetY */
				ensureSpaceForPoint(node.x, node.y);
				ensureSpaceForPoint(node.x + node.width, node.y + node.height);
			});
		},
		centerViewOn = function (x, y, animate)/*in the stage coordinate system*/ {
			var stage = stageElement.data(),
				viewPortCenter = {
					x: viewPort.innerWidth() / 2,
					y: viewPort.innerHeight() / 2
				},
				newLeftScroll, newTopScroll;
			ensureSpaceForPoint(x - viewPortCenter.x / stage.scale, y - viewPortCenter.y / stage.scale);
			ensureSpaceForPoint(x + viewPortCenter.x / stage.scale, y + viewPortCenter.y / stage.scale);

			newLeftScroll = stage.scale * (x + stage.offsetX) - viewPortCenter.x;
			newTopScroll = stage.scale * (y + stage.offsetY) - viewPortCenter.y;

			if (animate) {
				viewPort.animate({
					scrollLeft: newLeftScroll,
					scrollTop: newTopScroll
				}, {
					duration: 400
				});
			} else {
				viewPort.scrollLeft(newLeftScroll);
				viewPort.scrollTop(newTopScroll);
			}
		},
		stagePointAtViewportCenter = function () {
			return viewToStageCoordinates(viewPort.innerWidth() / 2, viewPort.innerHeight() / 2);
		},
		ensureNodeVisible = function (domElement) {
			var result = jQuery.Deferred(),
				node = domElement.data(),
				nodeTopLeft = stageToViewCoordinates(node.x, node.y),
				nodeBottomRight = stageToViewCoordinates(node.x + node.width, node.y + node.height),
				animation = {},
				margin = 10;
			if (nodeTopLeft.x < 0) {
				animation.scrollLeft = viewPort.scrollLeft() + nodeTopLeft.x - margin;
			} else if (nodeBottomRight.x > viewPort.innerWidth()) {
				animation.scrollLeft = viewPort.scrollLeft() + nodeBottomRight.x - viewPort.innerWidth() + margin;
			}
			if (nodeTopLeft.y < 0) {
				animation.scrollTop = viewPort.scrollTop() + nodeTopLeft.y - margin;
			} else if (nodeBottomRight.y > viewPort.innerHeight()) {
				animation.scrollTop = viewPort.scrollTop() + nodeBottomRight.y - viewPort.innerHeight() + margin;
			}
			if (_.isEmpty(animation)) {
				result.resolve();
			} else {
				viewPort.animate(animation, {duration: 100, complete: result.resolve});
			}
			return result;
		};
	mapModel.addEventListener('nodeCreated', function (node) {
		var element = jQuery('<div>')
			.attr({ 'tabindex': 0, 'id': nodeKey(node.id), 'data-mapjs-role': 'node' })
			.data({'x': Math.round(node.x), 'y': Math.round(node.y), 'width': Math.round(node.width), 'height': Math.round(node.height), 'nodeId': node.id})
			.css({display: 'block', position: 'absolute'})
			.addClass('mapjs-node')
			.appendTo(stageElement)
			.queueFadeIn(nodeAnimOptions)
			.updateNodeContent(node)
			.on('tap', function (evt) {
				var realEvent = (evt.gesture && evt.gesture.srcEvent) || evt;
				mapModel.clickNode(node.id, realEvent);
			})
			.on('doubletap', function () {
				if (!mapModel.isEditingEnabled()) {
					mapModel.toggleCollapse('mouse');
					return;
				}
				mapModel.editNode('mouse');
			})
			.on('attachment-click', function () {
				mapModel.openAttachment('mouse', node.id);
			})
			.each(ensureSpaceForNode)
			.each(updateScreenCoordinates)
			.on('mm:start-dragging', function () {
				element.addClass('dragging');
			})
			.on('mm:stop-dragging', function (evt) {
				element.removeClass('dragging');
				var dropPosition = evt && evt.gesture && evt.gesture.center,
					isShift = evt && evt.gesture && evt.gesture.srcEvent && evt.gesture.srcEvent.shiftKey,
					vpOffset = viewPort.offset(),
					viewportDropCoordinates = {
						x: dropPosition.pageX - vpOffset.left,
						y: dropPosition.pageY -  vpOffset.top
					},
				stageDropCoordinates = viewToStageCoordinates(viewportDropCoordinates.x, viewportDropCoordinates.y);
				return mapModel.dropNode(node.id, stageDropCoordinates.x, stageDropCoordinates.y, isShift);
			})
			.on('mm:cancel-dragging', function () {
				element.removeClass('dragging');
			});
		element.css('min-width', element.css('width'));
		MAPJS.DOMRender.addNodeCacheMark(element, node);
		if (mapModel.isEditingEnabled() && node.level > 1) {
			element.simpleDraggable();
		}
	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = jQuery('#' + nodeKey(ideaId));
		if (isSelected) {
			ensureNodeVisible(node).then(function () {
				node.addClass('selected').focus();
			});
		} else {
			node.removeClass('selected');
		}
	});
	mapModel.addEventListener('nodeRemoved', function (node) {
		jQuery('#' + nodeKey(node.id)).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('nodeMoved', function (node /*, reason*/) {
		var	nodeDom = jQuery('#' + nodeKey(node.id)).data({
				'x': Math.round(node.x),
				'y': Math.round(node.y)
			}).each(ensureSpaceForNode),
			screenTopLeft = stageToViewCoordinates(Math.round(node.x), Math.round(node.y)),
			screenBottomRight = stageToViewCoordinates(Math.round(node.x + node.width), Math.round(node.y + node.height));
		if (screenBottomRight.x < 0 || screenBottomRight.y < 0 || screenTopLeft.x > viewPort.innerWidth() || screenTopLeft.y > viewPort.innerHeight()) {
			nodeDom.each(updateScreenCoordinates);
		} else {
			nodeDom.each(animateToPositionCoordinates);
		}
	});
	mapModel.addEventListener('nodeTitleChanged nodeAttrChanged', function (n) {
		jQuery('#' + nodeKey(n.id)).updateNodeContent(n);
	});
	mapModel.addEventListener('connectorCreated', function (connector) {
		var element = MAPJS.createSVG()
			.attr({'id': connectorKey(connector), 'data-mapjs-role': 'connector', 'class': 'mapjs-draw-container'})
			.data({'nodeFrom': jQuery('#' + nodeKey(connector.from)), 'nodeTo': jQuery('#' + nodeKey(connector.to))})
			.appendTo(stageElement).queueFadeIn(nodeAnimOptions).updateConnector();
		jQuery('#' + nodeKey(connector.from)).add(jQuery('#' + nodeKey(connector.to)))
			.on('mapjs:move mm:drag', function () { element.updateConnector(); })
			.on('mapjs:animatemove', function () { connectorsForAnimation = connectorsForAnimation.add(element); });
	});
	mapModel.addEventListener('connectorRemoved', function (connector) {
		jQuery('#' + connectorKey(connector)).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('linkCreated', function (l) {
		var attr = _.extend({color: 'red', lineStyle: 'dashed'}, l.attr && l.attr.style, { 'nodeFrom': jQuery('#' + nodeKey(l.ideaIdFrom)), 'nodeTo': jQuery('#' + nodeKey(l.ideaIdTo)) }),
			link = MAPJS.createSVG()
			.attr({
				'id': linkKey(l),
				'data-mapjs-role': 'link',
				'class': 'mapjs-draw-container'
			})
			.data(attr)
			.appendTo(stageElement).queueFadeIn(nodeAnimOptions).updateLink();
		jQuery('#' + nodeKey(l.ideaIdFrom)).add(jQuery('#' + nodeKey(l.ideaIdTo)))
			.on('mapjs:move mm:drag', function () { link.updateLink(); })
			.on('mapjs:animatemove', function () { linksForAnimation = linksForAnimation.add(link); });

	});
	mapModel.addEventListener('linkRemoved', function (l) {
		jQuery('#' + linkKey(l)).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier /*, zoomPoint */) {
		var currentScale = stageElement.data('scale'),
			targetScale = Math.max(Math.min(currentScale * scaleMultiplier, 5), 0.2),
			currentCenter = stagePointAtViewportCenter();
		if (currentScale === targetScale) {
			return;
		}
		stageElement.data('scale', targetScale).updateStage();
		centerViewOn(currentCenter.x, currentCenter.y);
	});
	mapModel.addEventListener('nodeFocusRequested', function (ideaId)  {
		var node = jQuery('#' + nodeKey(ideaId)).data(),
			nodeCenterX = node.x + node.width / 2,
			nodeCenterY = node.y + node.height / 2;
		if (stageElement.data('scale') !== 1) {
			stageElement.data('scale', 1).updateStage();
		}
		centerViewOn(nodeCenterX, nodeCenterY, true);
	});
	mapModel.addEventListener('mapViewResetRequested', function () {
		stageElement.data('scale', 1).updateStage();
		centerViewOn(0, 0);
	});
	mapModel.addEventListener('layoutChangeComplete', function () {
		var connectorGroupClone = jQuery(), linkGroupClone = jQuery();

		connectorsForAnimation.each(function () {
			if (!jQuery(this).animateConnectorToPosition(nodeAnimOptions, 2)) {
				connectorGroupClone = connectorGroupClone.add(this);
			}
		});
		linksForAnimation.each(function () {
			if (!jQuery(this).animateConnectorToPosition(nodeAnimOptions, 2)) {
				linkGroupClone = linkGroupClone.add(this);
			}
		});
		connectorsForAnimation = jQuery();
		linksForAnimation = jQuery();
		stageElement.animate({'opacity': 1}, _.extend({
			progress: function () { connectorGroupClone.updateConnector(); linkGroupClone.updateLink(); },
		}, nodeAnimOptions));
		stageElement.children().andSelf().dequeue(nodeAnimOptions.queue);
	});

	/* editing */

	mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll, editingNew) {
		var editingElement = jQuery('#' + nodeKey(nodeId));
		mapModel.setInputEnabled(false);
		viewPort.finish(); /* close any pending animations */
		editingElement.editNode().done(
			function (newText) {
				mapModel.setInputEnabled(true);
				mapModel.updateTitle(nodeId, newText, editingNew);
				editingElement.focus();

			}).fail(function () {
				mapModel.setInputEnabled(true);
				if (editingNew) {
					mapModel.undo('internal');
				}
				editingElement.focus();
			});
	});
	mapModel.addEventListener('addLinkModeToggled', function (isOn) {
		if (isOn) {
			stageElement.addClass('mapjs-add-link');
		} else {
			stageElement.removeClass('mapjs-add-link');
		}
	});
	mapModel.addEventListener('linkAttrChanged', function (l) {
		var  attr = _.extend({arrow: false}, l.attr && l.attr.style);
		jQuery('#' + linkKey(l)).data(attr).updateLink();
	});

	mapModel.addEventListener('activatedNodesChanged', function (activatedNodes, deactivatedNodes) {
		_.each(activatedNodes, function (nodeId) {
			jQuery('#' + nodeKey(nodeId)).addClass('activated');
		});
		_.each(deactivatedNodes, function (nodeId) {
			jQuery('#' + nodeKey(nodeId)).removeClass('activated');
		});
	});
};

