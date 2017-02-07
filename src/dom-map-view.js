/*global document, window, require */
const jQuery = require('jquery'),
	_ = require('underscore'),
	DOMRender = require('./dom-render'),
	Connectors = require('mindmup-mapjs-layout').Connectors,
	URLHelper = require('mindmup-mapjs-model').URLHelper,
	foregroundStyle = require('mindmup-mapjs-layout').foregroundStyle,
	formattedNodeTitle = require('mindmup-mapjs-model').formattedNodeTitle,
	createSVG = require('./create-svg'),
	cleanDOMId = function (s) {
		'use strict';
		return s.replace(/[^A-Za-z0-9_-]/g, '_');
	},
	connectorKey = function (connectorObj) {
		'use strict';
		return cleanDOMId('connector_' + connectorObj.from + '_' + connectorObj.to);
	},
	linkKey = function (linkObj) {
		'use strict';
		return cleanDOMId('link_' + linkObj.ideaIdFrom + '_' + linkObj.ideaIdTo);
	},
	nodeKey = function (id) {
		'use strict';
		return cleanDOMId('node_' + id);
	};


require('./hammer-draggable');
require('./node-resize-widget');

jQuery.fn.setThemeClassList = function (classList) {
	'use strict';
	const domElement = this[0],
		filterClasses = function (classes) {
			return _.filter(classes, function (c) {
				return /^level_.+/.test(c) ||  /^attr_.+/.test(c);
			});
		},
		toRemove = filterClasses(domElement.classList),
		toAdd = classList && classList.length && filterClasses(classList);
	domElement.classList.remove.apply(domElement.classList, toRemove);
	if (toAdd && toAdd.length) {
		domElement.classList.add.apply(domElement.classList, toAdd);
	}
	return this;
};

jQuery.fn.getBox = function () {
	'use strict';
	const domShape = this && this[0];
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
	const domShapeData = this.data();
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
	const element = jQuery(this),
		shapeFrom = element.data('nodeFrom'),
		shapeTo = element.data('nodeTo'),
		fromBox = shapeFrom && shapeFrom.getDataBox(),
		toBox = shapeTo && shapeTo.getDataBox(),
		oldBox = {
			from: shapeFrom && shapeFrom.getBox(),
			to: shapeTo && shapeTo.getBox()
		};
	tolerance = tolerance || 1;
	if (fromBox && toBox && oldBox && oldBox.from.width === fromBox.width &&
		oldBox.to.width   === toBox.width   &&
		oldBox.from.height  === fromBox.height    &&
		oldBox.to.height  === toBox.height    &&
		Math.abs(oldBox.from.top - oldBox.to.top - (fromBox.top - toBox.top)) < tolerance &&
		Math.abs(oldBox.from.left - oldBox.to.left - (fromBox.left - toBox.left)) < tolerance) {

		element.animate({
			left: Math.round(Math.min(fromBox.left, toBox.left)),
			top: Math.round(Math.min(fromBox.top, toBox.top))
		}, animationOptions);
		return true;
	}
	return false;
};
jQuery.fn.queueFadeOut = function (options) {
	'use strict';
	const element = this;
	return element.fadeOut(_.extend({
		complete: function () {
			if (element.is(':focus')) {
				element.parents('[tabindex]').focus();
			}
			element.remove();
		}
	}, options));
};
jQuery.fn.queueFadeIn = function (options) {
	'use strict';
	const element = this;
	return element
		.css('opacity', 0)
		.animate(
			{'opacity': 1},
			_.extend({ complete: function () {
				element.css('opacity', '');
			}}, options)
		);
};

jQuery.fn.updateStage = function () {
	'use strict';
	const data = this.data(),
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

DOMRender.appendUnderLine = function (connectorCurve, calculatedConnector, position) {
	'use strict';
	if (calculatedConnector.nodeUnderline) {
		connectorCurve.d += 'M' + (calculatedConnector.nodeUnderline.from.x - position.left) + ',' + (calculatedConnector.nodeUnderline.from.y - position.top) + ' H' + (calculatedConnector.nodeUnderline.to.x - position.left);
	}
	return connectorCurve;
};

jQuery.fn.updateConnector = function (canUseData) {
	'use strict';
	return jQuery.each(this, function () {
		let connection = false, pathElement, fromBox, toBox, changeCheck = false;
		const element = jQuery(this),
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),

			applyInnerRect = function (shape, box) {
				const innerRect = shape.data().innerRect;
				if (innerRect) {
					box.left += innerRect.dx;
					box.top += innerRect.dy;
					box.width = innerRect.width;
					box.height = innerRect.height;
				}
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
		changeCheck = {from: fromBox, to: toBox, theme: DOMRender.theme &&  DOMRender.theme.name };
		if (_.isEqual(changeCheck, element.data('changeCheck'))) {
			return;
		}
		element.data('changeCheck', changeCheck);
		connection = Connectors.themePath(fromBox, toBox, DOMRender.theme);
		pathElement = element.find('path');
		element.css(connection.position);
		if (pathElement.length === 0) {
			pathElement = createSVG('path').attr('class', 'mapjs-connector').appendTo(element);
		}

		// if only the relative position changed, do not re-update the curve!!!!
		pathElement.attr({
			'd': connection.d,
			'stroke': connection.color,
			'stroke-width': connection.width,
			fill: 'transparent'
		});
	});
};

jQuery.fn.updateLink = function () {
	'use strict';
	return jQuery.each(this, function () {
		const element = jQuery(this),
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
			n = Math.tan(Math.PI / 9),
			dashes = {
				dashed: '8, 8',
				solid: ''
			},
			attrs = _.pick(element.data(), 'lineStyle', 'arrow', 'color');
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
		element.css(connection.position);

		if (pathElement.length === 0) {
			pathElement = createSVG('path').attr('class', 'mapjs-link').appendTo(element);
		}
		pathElement.attr({
			'd': connection.d,
			'stroke-dasharray': dashes[attrs.lineStyle]
		}).css('stroke', attrs.color);

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

jQuery.fn.addNodeCacheMark = function (idea) {
	'use strict';
	this.data('nodeCacheMark', DOMRender.nodeCacheMark(idea));
};

jQuery.fn.updateNodeContent = function (nodeContent, resourceTranslator, forcedLevel) {
	'use strict';
	const self = jQuery(this),
		textSpan = function () {
			let span = self.find('[data-mapjs-role=title]');
			if (span.length === 0) {
				span = jQuery('<span>').attr('data-mapjs-role', 'title').appendTo(self);
			}
			return span;
		},
		decorations = function () {
			let element = self.find('[data-mapjs-role=decorations]');
			if (element.length === 0) {
				element = jQuery('<div data-mapjs-role="decorations" class="mapjs-decorations">').on('mousedown click', function (e) {
					e.stopPropagation();
					e.stopImmediatePropagation();
				}).appendTo(self);
			}
			return element;
		},
		applyLinkUrl = function (title) {
			const url = URLHelper.getLink(title);
			let element = self.find('a.mapjs-hyperlink');
			if (!url) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<a target="_blank" class="mapjs-hyperlink icon-hyperlink"></a>').addClass().appendTo(decorations());
			}
			element.attr('href', url).show();
		},
		applyLabel = function (label) {
			let element = self.find('.mapjs-label');
			if (!label && label !== 0) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<span class="mapjs-label"></span>').appendTo(decorations());
			}
			element.text(label).show();
		},
		applyAttachment = function () {
			const attachment = nodeContent.attr && nodeContent.attr.attachment;
			let element = self.find('a.mapjs-attachment');
			if (!attachment) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<a href="#" class="mapjs-attachment icon-attachment"></a>').
					appendTo(decorations()).click(function () {
						self.trigger('attachment-click');
						self.trigger('decoration-click', 'attachment');
					});
			}
			element.show();
		},
		applyNote = function () {
			const note = nodeContent.attr && nodeContent.attr.note;
			let element = self.find('a.mapjs-note');
			if (!note) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<a href="#" class="mapjs-note icon-note"></a>').appendTo(decorations()).click(function () {
					self.trigger('decoration-click', 'note');
				});
			}
			element.show();
		},
		updateText = function (title) {
			const text = formattedNodeTitle(title, 25),
				nodeTextPadding = DOMRender.nodeTextPadding || 11,
				element = textSpan(),
				domElement = element[0],
				preferredWidth = nodeContent.attr && nodeContent.attr.style && nodeContent.attr.style.width;
			let height;

			element.text(text.trim());
			self.data('title', title);
			element.css({'max-width': '', 'min-width': ''});
			if (preferredWidth) {
				element.css({'max-width': preferredWidth, 'min-width': preferredWidth});
			}
			if ((domElement.scrollWidth - nodeTextPadding) > domElement.offsetWidth) {
				element.css('max-width', domElement.scrollWidth + 'px');
			} else if (!preferredWidth) {
				height = domElement.offsetHeight;
				element.css('min-width', element.css('max-width'));
				if (domElement.offsetHeight === height) {
					element.css('min-width', '');
				}
			}
		},
		setCollapseClass = function () {
			if (nodeContent.attr && nodeContent.attr.collapsed) {
				self.addClass('collapsed');
			} else {
				self.removeClass('collapsed');
			}
		},
		setColors = function (colorText) {
			let fromStyle = nodeContent.attr && nodeContent.attr.style && nodeContent.attr.style.background;
			const textColorClasses = {
				'color': 'mapjs-node-light',
				'lightColor': 'mapjs-node-dark',
				'darkColor': 'mapjs-node-white'
			};
			if (fromStyle === 'false' || fromStyle === 'transparent') {
				fromStyle = false;
			}
			self.removeClass('mapjs-node-dark mapjs-node-white mapjs-node-light mapjs-node-colortext');
			self.css({'color': '', 'background-color': ''});
			if (fromStyle) {
				if (colorText) {
					self.css('color', fromStyle);
				} else {
					self.css('background-color', fromStyle);
					self.addClass(textColorClasses[foregroundStyle(fromStyle)]);
				}
			}
			if (colorText) {
				self.addClass('mapjs-node-colortext');
			}
		},
		setIcon = function (icon) {
			let textHeight,
				textWidth,
				maxTextWidth,
				padding;
			const textBox = textSpan(),
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
			if (icon) {
				padding = parseInt(self.css('padding-left'), 10);
				textHeight = textBox.outerHeight();
				textWidth = textBox.outerWidth();
				maxTextWidth = parseInt(textBox.css('max-width'), 10);
				_.extend(selfProps, {
					'background-image': 'url("' + (resourceTranslator ? resourceTranslator(icon.url) : icon.url) + '")',
					'background-repeat': 'no-repeat',
					'background-size': icon.width + 'px ' + icon.height + 'px',
					'background-position': 'center center'
				});
				if (icon.position === 'top' || icon.position === 'bottom') {
					if (icon.position === 'top') {
						selfProps['background-position'] = 'center ' + padding + 'px';
					} else if (DOMRender.fixedLayout) {
						selfProps['background-position'] = 'center ' + (padding + textHeight) + 'px';
					} else {
						selfProps['background-position'] = 'center ' + icon.position + ' ' + padding + 'px';
					}

					selfProps['padding-' + icon.position] = icon.height + (padding * 2);
					selfProps['min-width'] = icon.width;
					if (icon.width > maxTextWidth) {
						textProps['margin-left'] =  Math.round((icon.width - maxTextWidth) / 2);
					}
				} else if (icon.position === 'left' || icon.position === 'right') {
					if (icon.position === 'left') {
						selfProps['background-position'] = padding + 'px center';
					} else if (DOMRender.fixedLayout) {
						selfProps['background-position'] = (textWidth + (2 * padding)) + 'px center ';
					} else {
						selfProps['background-position'] = icon.position + ' ' + padding + 'px center';
					}

					selfProps['padding-' + icon.position] = icon.width + (padding * 2);
					if (icon.height > textHeight) {
						textProps['margin-top'] =  Math.round((icon.height - textHeight) / 2);
						selfProps['min-height'] = icon.height;
					}
				} else {
					if (icon.height > textHeight) {
						textProps['margin-top'] =  Math.round((icon.height - textHeight) / 2);
						selfProps['min-height'] = icon.height;
					}
					selfProps['min-width'] = icon.width;
					if (icon.width > maxTextWidth) {
						textProps['margin-left'] =  Math.round((icon.width - maxTextWidth) / 2);
					}
				}
			}
			self.css(selfProps);
			textBox.css(textProps);
		},
		nodeLevel = forcedLevel || nodeContent.level,
		themeDefault =  function (a, b, c, d) {
			return d;
		},
		styleDefault = function () {
			return ['default'];
		},
		attrValue = (DOMRender.theme && DOMRender.theme.attributeValue) || themeDefault,
		nodeStyles = (DOMRender.theme &&  DOMRender.theme.nodeStyles) || styleDefault,
		effectiveStyles = nodeStyles(nodeLevel, nodeContent.attr),
		borderType = attrValue(['node'], effectiveStyles, ['border', 'type'], 'surround'),
		decorationEdge = attrValue(['node'], effectiveStyles, ['decorations', 'edge'], ''),
		decorationOverlap = attrValue(['node'], effectiveStyles, ['decorations', 'overlap'], ''),
		colorText = (borderType !== 'surround'),
		isGroup = nodeContent.attr && nodeContent.attr.group,
		nodeCacheData = {
			x: Math.round(nodeContent.x),
			y: Math.round(nodeContent.y),
			width: Math.round(nodeContent.width),
			height: Math.round(nodeContent.height),
			nodeId: nodeContent.id,
			styles: effectiveStyles
		};


	let offset;




	nodeCacheData.innerRect = _.pick(nodeCacheData, ['width', 'height']);
	nodeCacheData.innerRect.dx = 0;
	nodeCacheData.innerRect.dy = 0;


	if (isGroup) {
		this.css({margin: '', width: nodeContent.width, height: nodeContent.height});
		updateText('');
	} else {
		updateText(nodeContent.title);
		applyLinkUrl(nodeContent.title);
		applyLabel(nodeContent.label);
		applyNote();
		applyAttachment();
		this.css({margin: '', width: '', height: ''});
		if (decorationEdge === 'left') {
			nodeCacheData.innerRect.dx = decorations().outerWidth();
			nodeCacheData.innerRect.width = nodeCacheData.width - decorations().outerWidth();
			self.css('margin-left', decorations().outerWidth());
		} else if (decorationEdge === 'right') {
			nodeCacheData.innerRect.width = nodeCacheData.width - decorations().outerWidth();
			self.css('margin-right', decorations().outerWidth());
		} else if (decorationEdge === 'top') {
			offset = (decorations().outerHeight() * (decorationOverlap ? 0.5 : 1));
			nodeCacheData.innerRect.dy = offset;
			nodeCacheData.innerRect.height = nodeCacheData.height - offset;
			if (offset) {
				self.css('margin-top', offset);
			}

		} else if (decorationEdge === 'bottom') {
			offset = decorations().outerHeight() * (decorationOverlap ? 0.5 : 1);
			nodeCacheData.innerRect.height = nodeCacheData.height - offset;
			self.css('margin-bottom', decorations().outerHeight() * (decorationOverlap ? 0.5 : 1));
		}
	}

	self.setThemeClassList(effectiveStyles).attr('mapjs-level', nodeLevel);

	self.data(nodeCacheData).addNodeCacheMark(nodeContent);
	setColors(colorText);
	setIcon(nodeContent.attr && nodeContent.attr.icon);
	setCollapseClass();
	self.trigger('mapjs:resize');
	return self;
};
jQuery.fn.placeCaretAtEnd = function () {
	'use strict';
	const el = this[0];
	let range, sel, textRange;
	if (window.getSelection && document.createRange) {
		range = document.createRange();
		range.selectNodeContents(el);
		range.collapse(false);
		sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	} else if (document.body.createTextRange) {
		textRange = document.body.createTextRange();
		textRange.moveToElementText(el);
		textRange.collapse(false);
		textRange.select();
	}
};
jQuery.fn.selectAll = function () {
	'use strict';
	const el = this[0];
	let range, sel, textRange;
	if (window.getSelection && document.createRange) {
		range = document.createRange();
		range.selectNodeContents(el);
		sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	} else if (document.body.createTextRange) {
		textRange = document.body.createTextRange();
		textRange.moveToElementText(el);
		textRange.select();
	}
};
jQuery.fn.innerText = function () {
	'use strict';
	const htmlContent = this.html(),
		containsBr = /<br\/?>/.test(htmlContent),
		containsDiv = /<div>/.test(htmlContent);
	if (containsDiv && this[0].innerText) { /* broken safari jquery text */
		return this[0].innerText.trim();
	} else if (containsBr) { /*broken firefox innerText */
		return htmlContent.replace(/<br\/?>/gi, '\n').replace(/(<([^>]+)>)/gi, '');
	}
	return this.text();
};
jQuery.fn.editNode = function (shouldSelectAll) {
	'use strict';
	const node = this,
		textBox = this.find('[data-mapjs-role=title]'),
		unformattedText = this.data('title'),
		originalText = textBox.text(),
		result = jQuery.Deferred(),
		clear = function () {
			detachListeners(); //eslint-disable-line no-use-before-define
			textBox.css('word-break', '');
			textBox.removeAttr('contenteditable');
			node.shadowDraggable();
		},
		finishEditing = function () {
			const content = textBox.innerText();
			if (content === unformattedText) {
				return cancelEditing(); //eslint-disable-line no-use-before-define
			}
			clear();
			result.resolve(content);
		},
		cancelEditing = function () {
			clear();
			textBox.text(originalText);
			result.reject();
		},
		keyboardEvents = function (e) {
			const ENTER_KEY_CODE = 13,
				ESC_KEY_CODE = 27,
				TAB_KEY_CODE = 9,
				S_KEY_CODE = 83,
				Z_KEY_CODE = 90;
			if (e.shiftKey && e.which === ENTER_KEY_CODE) {
				return; // allow shift+enter to break lines
			} else if (e.which === ENTER_KEY_CODE) {
				finishEditing();
				e.stopPropagation();
			} else if (e.which === ESC_KEY_CODE) {
				cancelEditing();
				e.stopPropagation();
			} else if (e.which === TAB_KEY_CODE || (e.which === S_KEY_CODE && (e.metaKey || e.ctrlKey) && !e.altKey)) {
				finishEditing();
				e.preventDefault(); /* stop focus on another object */
			} else if (!e.shiftKey && e.which === Z_KEY_CODE && (e.metaKey || e.ctrlKey) && !e.altKey) { /* undo node edit on ctrl+z if text was not changed */
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
	if (shouldSelectAll) {
		textBox.selectAll();
	} else if (unformattedText) {
		textBox.placeCaretAtEnd();
	}
	node.shadowDraggable({disable: true});
	return result.promise();
};
jQuery.fn.updateReorderBounds = function (border, box, dropCoords) {
	'use strict';
	const element = this;
	if (!border) {
		element.hide();
		return;
	}
	element.show();
	element.attr('mapjs-edge', border.edge);
	if (border.edge === 'top') {
		element.css({
			top: border.minY,
			left: Math.round(dropCoords.x - element.width() / 2)
		});
	} else {
		element.css({
			top: Math.round(dropCoords.y - element.height() / 2),
			left: border.x - (border.edge === 'left' ? element.width() : 0)
		});
	}

};

jQuery.fn.createNode = function (node) {
	'use strict';
	return jQuery('<div>')
		.attr({'id': nodeKey(node.id), 'tabindex': 0, 'data-mapjs-role': 'node' })
		.css({display: 'block', position: 'absolute'})
		.addClass('mapjs-node')
		.appendTo(this);
};
jQuery.fn.createConnector = function (connector) {
	'use strict';
	return createSVG()
		.attr({'id': connectorKey(connector), 'data-mapjs-role': 'connector', 'class': 'mapjs-draw-container'})
		.data({'nodeFrom': this.nodeWithId(connector.from), 'nodeTo': this.nodeWithId(connector.to)})
		.appendTo(this);
};
jQuery.fn.createLink = function (l) {
	'use strict';
	const defaults = _.extend({color: 'red', lineStyle: 'dashed'}, l.attr && l.attr.style);
	return createSVG()
		.attr({
			'id': linkKey(l),
			'data-mapjs-role': 'link',
			'class': 'mapjs-draw-container'
		})
	.data({'nodeFrom': this.nodeWithId(l.ideaIdFrom), 'nodeTo': this.nodeWithId(l.ideaIdTo) })
		.data(defaults)
		.appendTo(this);
};
jQuery.fn.nodeWithId = function (id) {
	'use strict';
	return this.find('#' + nodeKey(id));
};
jQuery.fn.findConnector = function (connectorObj) {
	'use strict';
	return this.find('#' + connectorKey(connectorObj));
};
jQuery.fn.findLink = function (linkObj) {
	'use strict';
	return this.find('#' + linkKey(linkObj));
};
jQuery.fn.createReorderBounds = function () {
	'use strict';
	const result = jQuery('<div>').attr({
		'data-mapjs-role': 'reorder-bounds',
		'class': 'mapjs-reorder-bounds'
	}).hide().css('position', 'absolute').appendTo(this);
	return result;
};

DOMRender.viewController = function (mapModel, stageElement, touchEnabled, imageInsertController, resourceTranslator, options) {
	'use strict';
	let currentDroppable = false,
		connectorsForAnimation = jQuery(),
		linksForAnimation = jQuery(),
		viewPortDimensions;

	const viewPort = stageElement.parent(),
		nodeAnimOptions = { duration: 400, queue: 'nodeQueue', easing: 'linear' },
		reorderBounds = mapModel.isEditingEnabled() ? stageElement.createReorderBounds() : jQuery('<div>'),
		getViewPortDimensions = function () {
			if (viewPortDimensions) {
				return viewPortDimensions;
			}
			viewPortDimensions =  {
				left: viewPort.scrollLeft(),
				top: viewPort.scrollTop(),
				innerWidth: viewPort.innerWidth(),
				innerHeight: viewPort.innerHeight()
			};
			return viewPortDimensions;
		},
		stageToViewCoordinates = function (x, y) {
			const stage = stageElement.data(),
				scrollPosition = getViewPortDimensions();
			return {
				x: stage.scale * (x + stage.offsetX) - scrollPosition.left,
				y: stage.scale * (y + stage.offsetY) - scrollPosition.top
			};
		},
		viewToStageCoordinates = function (x, y) {
			const stage = stageElement.data(),
				scrollPosition = getViewPortDimensions();
			return {
				x: (scrollPosition.left + x) / stage.scale - stage.offsetX,
				y: (scrollPosition.top + y) / stage.scale - stage.offsetY
			};
		},
		updateScreenCoordinates = function () {
			const element = jQuery(this);
			element.css({
				'left': element.data('x'),
				'top': element.data('y')
			}).trigger('mapjs:move');
		},
		animateToPositionCoordinates = function () {
			const element = jQuery(this);
			element.clearQueue(nodeAnimOptions.queue).animate({
				'left': element.data('x'),
				'top': element.data('y'),
				'opacity': 1 /* previous animation can be cancelled with clearqueue, so ensure it gets visible */
			}, _.extend({
				complete: function () {
					element.css('opacity', '');
					element.each(updateScreenCoordinates);
				}
			}, nodeAnimOptions)).trigger('mapjs:animatemove');
		},
		ensureSpaceForPoint = function (x, y) {/* in stage coordinates */
			const stage = stageElement.data();
			let dirty = false;
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
				const node = jQuery(this).data(),
					margin = DOMRender.stageMargin || {top: 0, left: 0, bottom: 0, right: 0};
				/* sequence of calculations is important because maxX and maxY take into consideration the new offsetX snd offsetY */
				ensureSpaceForPoint(node.x - margin.left, node.y - margin.top);
				ensureSpaceForPoint(node.x + node.width + margin.right, node.y + node.height + margin.bottom);
			});
		},
		centerViewOn = function (x, y, animate) { /*in the stage coordinate system*/
			const stage = stageElement.data(),
				viewPortCenter = {
					x: Math.round(viewPort.innerWidth() / 2),
					y: Math.round(viewPort.innerHeight() / 2)
				},
				margin = DOMRender.stageVisibilityMargin || {top: 0, left: 0, bottom: 0, right: 0};
			let newLeftScroll = false, newTopScroll = false;

			ensureSpaceForPoint(x - viewPortCenter.x / stage.scale, y - viewPortCenter.y / stage.scale);
			ensureSpaceForPoint(x + viewPortCenter.x / stage.scale - margin.left, y + viewPortCenter.y / stage.scale - margin.top);

			newLeftScroll = stage.scale * (x + stage.offsetX) - viewPortCenter.x;
			newTopScroll = stage.scale * (y + stage.offsetY) - viewPortCenter.y;
			viewPort.finish();
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
			return viewToStageCoordinates(Math.round(viewPort.innerWidth() / 2), Math.round(viewPort.innerHeight() / 2));
		},
		ensureNodeVisible = function (domElement) {
			if (!domElement || domElement.length === 0) {
				return;
			}
			viewPort.finish();
			const node = domElement.data(),
				nodeTopLeft = stageToViewCoordinates(node.x, node.y),
				nodeBottomRight = stageToViewCoordinates(node.x + node.width, node.y + node.height),
				animation = {},
				margin = DOMRender.stageVisibilityMargin || {top: 10, left: 10, bottom: 10, right: 10};
			if ((nodeTopLeft.x - margin.left) < 0) {
				animation.scrollLeft = viewPort.scrollLeft() + nodeTopLeft.x - margin.left;
			} else if ((nodeBottomRight.x + margin.right) > viewPort.innerWidth()) {
				animation.scrollLeft = viewPort.scrollLeft() + nodeBottomRight.x - viewPort.innerWidth() + margin.right;
			}
			if ((nodeTopLeft.y - margin.top) < 0) {
				animation.scrollTop = viewPort.scrollTop() + nodeTopLeft.y - margin.top;
			} else if ((nodeBottomRight.y + margin.bottom) > viewPort.innerHeight()) {
				animation.scrollTop = viewPort.scrollTop() + nodeBottomRight.y - viewPort.innerHeight() + margin.bottom;
			}
			if (!_.isEmpty(animation)) {
				viewPort.animate(animation, {duration: 100});
			}
		},
		viewportCoordinatesForPointEvent = function (evt) {
			const dropPosition = (evt && evt.gesture && evt.gesture.center) || evt,
				vpOffset = viewPort.offset();
			let result;
			if (dropPosition) {
				result = {
					x: dropPosition.pageX - vpOffset.left,
					y: dropPosition.pageY -  vpOffset.top
				};
				if (result.x >= 0 && result.x <= viewPort.innerWidth() && result.y >= 0 && result.y <= viewPort.innerHeight()) {
					return result;
				}
			}
		},
		stagePositionForPointEvent = function (evt) {
			const viewportDropCoordinates = viewportCoordinatesForPointEvent(evt);
			if (viewportDropCoordinates) {
				return viewToStageCoordinates(viewportDropCoordinates.x, viewportDropCoordinates.y);
			}
		},
		clearCurrentDroppable = function () {
			if (currentDroppable || currentDroppable === false) {
				jQuery('.mapjs-node').removeClass('droppable');
				currentDroppable = undefined;
			}
		},
		showDroppable = function (nodeId) {
			stageElement.nodeWithId(nodeId).addClass('droppable');
			currentDroppable = nodeId;
		},
		withinReorderBoundary = function (boundaries, box) {
			const closeTo = function (reorderBoundary) {
				let nodeX = box.x;
				if (reorderBoundary.edge === 'right') {
					nodeX += box.width;
				}
				if (reorderBoundary.x && reorderBoundary.margin) {
					return Math.abs(nodeX - reorderBoundary.x) < reorderBoundary.margin * 2 &&
						box.y < reorderBoundary.maxY &&
						box.y > reorderBoundary.minY;
				} else {
					return box.y < reorderBoundary.maxY &&
						box.y > reorderBoundary.minY &&
						box.x < reorderBoundary.maxX &&
						box.x > reorderBoundary.minX;
				}
			};
			if (_.isEmpty(boundaries)) {
				return false;
			}
			if (!box) {
				return false;
			}
			return _.find(boundaries, closeTo);
		};
	viewPort.on('scroll', function () {
		viewPortDimensions = undefined;
	});
	if (imageInsertController) {
		imageInsertController.addEventListener('imageInserted', function (dataUrl, imgWidth, imgHeight, evt) {
			const point = stagePositionForPointEvent(evt);
			mapModel.dropImage(dataUrl, imgWidth, imgHeight, point && point.x, point && point.y);
		});
	}
	mapModel.addEventListener('nodeCreated', function (node) {
		let currentReorderBoundary;
		const element = stageElement.createNode(node)
			.queueFadeIn(nodeAnimOptions)
			.updateNodeContent(node, resourceTranslator)
			.nodeResizeWidget(node.id, mapModel, stagePositionForPointEvent)
			.on('tap', function (evt) {

				const realEvent = (evt.gesture && evt.gesture.srcEvent) || evt;
				if (realEvent.button && realEvent.button !== -1) {
					return;
				}
				mapModel.clickNode(node.id, realEvent);
				if (evt) {
					evt.stopPropagation();
				}
				if (evt && evt.gesture) {
					evt.gesture.stopPropagation();
				}

			})
			.on('doubletap', function (event) {
				if (event) {
					event.stopPropagation();
					if (event.gesture) {
						event.gesture.stopPropagation();
					}
				}
				if (!mapModel.isEditingEnabled()) {
					mapModel.toggleCollapse('mouse');
					return;
				}
				mapModel.editNode('mouse');
			})
			.on('attachment-click', function () {
				mapModel.openAttachment('mouse', node.id);
			})
			.on('decoration-click', function (evt, decorationType) {
				mapModel.decorationAction('mouse', node.id, decorationType);
			})
			.each(ensureSpaceForNode)
			.each(updateScreenCoordinates)
			.on('mm:start-dragging mm:start-dragging-shadow', function (evt) {
				if (evt && evt.relatedTarget === this) {
					mapModel.selectNode(node.id);
					currentReorderBoundary = mapModel.getReorderBoundary(node.id);
					element.addClass('dragging');
				}
			})
			.on('mm:drag', function (evt) {
				const dropCoords = stagePositionForPointEvent(evt),
					currentPosition = evt.currentPosition && stagePositionForPointEvent({pageX: evt.currentPosition.left, pageY: evt.currentPosition.top}),
					hasShift = evt && evt.gesture && evt.gesture.srcEvent && evt.gesture.srcEvent.shiftKey,
					nodeId = dropCoords && mapModel.getNodeIdAtPosition(dropCoords.x, dropCoords.y);
				let border;
				if (!dropCoords) {
					clearCurrentDroppable();
					return;
				}


				if (!hasShift && !nodeId && currentPosition) {
					currentPosition.width = element.outerWidth();
					currentPosition.height = element.outerHeight();
					border = withinReorderBoundary(currentReorderBoundary, currentPosition);
					reorderBounds.updateReorderBounds(border, currentPosition, dropCoords);
				} else {
					reorderBounds.hide();
				}
				if (!nodeId || nodeId === node.id) {
					clearCurrentDroppable();
				} else if (nodeId !== currentDroppable) {
					clearCurrentDroppable();
					if (nodeId) {
						showDroppable(nodeId);
					}
				}
			})
			.on('contextmenu', function (event) {
				mapModel.selectNode(node.id);
				if (mapModel.requestContextMenu(event.pageX, event.pageY)) {
					event.preventDefault();
					return false;
				}
			})
			.on('mm:stop-dragging', function (evt) {
				element.removeClass('dragging');
				reorderBounds.hide();
				let dropResult, manualPosition;
				const isShift = evt && evt.gesture && evt.gesture.srcEvent && evt.gesture.srcEvent.shiftKey,
					stageDropCoordinates = stagePositionForPointEvent(evt),
					nodeAtDrop = stageDropCoordinates && mapModel.getNodeIdAtPosition(stageDropCoordinates.x, stageDropCoordinates.y),
					finalPosition = evt.finalPosition && stagePositionForPointEvent({pageX: evt.finalPosition.left, pageY: evt.finalPosition.top});

				clearCurrentDroppable();
				if (!stageDropCoordinates) {
					return;
				}

				if (nodeAtDrop && nodeAtDrop !== node.id) {
					dropResult = mapModel.dropNode(node.id, nodeAtDrop, !!isShift);
				} else {
					finalPosition.width = element.outerWidth();
					finalPosition.height = element.outerHeight();
					manualPosition = (!!isShift) || !withinReorderBoundary(currentReorderBoundary, finalPosition);
					if (manualPosition) {
						dropResult = mapModel.positionNodeAt(node.id, finalPosition.x, finalPosition.y, manualPosition);
					} else {
						dropResult = mapModel.positionNodeAt(node.id, stageDropCoordinates.x, stageDropCoordinates.y, manualPosition);
					}
				}
				return dropResult;
			})
			.on('mm:cancel-dragging', function () {
				clearCurrentDroppable();
				element.removeClass('dragging');
				reorderBounds.hide();
			}).on('mm:resize', function (event) {
				mapModel.setNodeWidth('mouse', node.id, event.nodeWidth);
			});
		if (touchEnabled) {
			element.on('hold', function (evt) {
				const realEvent = (evt.gesture && evt.gesture.srcEvent) || evt;
				mapModel.clickNode(node.id, realEvent);
				if (mapModel.requestContextMenu(evt.gesture.center.pageX, evt.gesture.center.pageY)) {
					evt.preventDefault();
					if (evt.gesture) {
						evt.gesture.preventDefault();
						evt.gesture.stopPropagation();
					}
					return false;
				}
			});
		}
		element.css('min-width', element.css('width'));
		if (mapModel.isEditingEnabled()) {
			element.shadowDraggable();
		}
	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		const node = stageElement.nodeWithId(ideaId);
		if (isSelected) {
			node.addClass('selected');
			ensureNodeVisible(node);
		} else {
			node.removeClass('selected');
		}
	});
	mapModel.addEventListener('nodeRemoved', function (node) {
		stageElement.nodeWithId(node.id).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('nodeMoved', function (node /*, reason*/) {
		const currentViewPortDimensions = getViewPortDimensions(),
			nodeDom = stageElement.nodeWithId(node.id).data({
				'x': Math.round(node.x),
				'y': Math.round(node.y),
				'width': Math.round(node.width),
				'height': Math.round(node.height)
			}).each(ensureSpaceForNode),
			screenTopLeft = stageToViewCoordinates(Math.round(node.x), Math.round(node.y)),
			screenBottomRight = stageToViewCoordinates(Math.round(node.x + node.width), Math.round(node.y + node.height));
		if (screenBottomRight.x < 0 || screenBottomRight.y < 0 || screenTopLeft.x > currentViewPortDimensions.innerWidth || screenTopLeft.y > currentViewPortDimensions.innerHeight) {
			nodeDom.each(updateScreenCoordinates);
		} else {
			nodeDom.each(animateToPositionCoordinates);
		}
	});
	mapModel.addEventListener('nodeTitleChanged nodeAttrChanged nodeLabelChanged', function (n) {
		stageElement.nodeWithId(n.id).updateNodeContent(n, resourceTranslator);
	});
	mapModel.addEventListener('connectorCreated', function (connector) {
		const element = stageElement.createConnector(connector).queueFadeIn(nodeAnimOptions).updateConnector(true);
		stageElement.nodeWithId(connector.from).add(stageElement.nodeWithId(connector.to))
			.on('mapjs:move', function () {
				element.updateConnector(true);
			})
			.on('mapjs:resize', function () {
				element.updateConnector(true);
			})
			.on('mm:drag', function () {
				element.updateConnector();
			})
			.on('mapjs:animatemove', function () {
				connectorsForAnimation = connectorsForAnimation.add(element);
			});
	});
	mapModel.addEventListener('connectorRemoved', function (connector) {
		stageElement.findConnector(connector).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('linkCreated', function (l) {
		const link = stageElement.createLink(l).queueFadeIn(nodeAnimOptions).updateLink();
		link.find('.mapjs-link-hit').on('tap', function (event) {
			mapModel.selectLink('mouse', l, { x: event.gesture.center.pageX, y: event.gesture.center.pageY });
			event.stopPropagation();
			event.gesture.stopPropagation();
		});
		stageElement.nodeWithId(l.ideaIdFrom).add(stageElement.nodeWithId(l.ideaIdTo))
			.on('mapjs:move mm:drag', function () {
				link.updateLink();
			})
			.on('mapjs:animatemove', function () {
				linksForAnimation = linksForAnimation.add(link);
			});

	});
	mapModel.addEventListener('linkRemoved', function (l) {
		stageElement.findLink(l).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier /*, zoomPoint */) {
		const currentScale = stageElement.data('scale'),
			targetScale = Math.max(Math.min(currentScale * scaleMultiplier, 5), 0.2),
			currentCenter = stagePointAtViewportCenter();
		if (currentScale === targetScale) {
			return;
		}
		stageElement.data('scale', targetScale).updateStage();
		centerViewOn(currentCenter.x, currentCenter.y);
	});
	mapModel.addEventListener('nodeVisibilityRequested', function (ideaId) {
		const id = ideaId || mapModel.getCurrentlySelectedIdeaId(),
			node = stageElement.nodeWithId(id);
		if (node) {
			ensureNodeVisible(node);
			viewPort.finish();
		}

	});
	mapModel.addEventListener('nodeFocusRequested', function (ideaId) {
		const node = stageElement.nodeWithId(ideaId).data(),
			nodeCenterX = Math.round(node.x + node.width / 2),
			nodeCenterY = Math.round(node.y + node.height / 2);
		if (stageElement.data('scale') !== 1) {
			stageElement.data('scale', 1).updateStage();
		}
		centerViewOn(nodeCenterX, nodeCenterY, true);
	});
	mapModel.addEventListener('mapViewResetRequested', function () {
		stageElement.data({'scale': 1, 'height': 0, 'width': 0, 'offsetX': 0, 'offsetY': 0}).updateStage();
		stageElement.children().andSelf().finish(nodeAnimOptions.queue);
		jQuery(stageElement).find('.mapjs-node').each(ensureSpaceForNode);
		jQuery(stageElement).find('[data-mapjs-role=connector]').updateConnector(true);
		jQuery(stageElement).find('[data-mapjs-role=link]').updateLink(true);
		centerViewOn(0, 0);
		viewPort.focus();
	});
	mapModel.addEventListener('layoutChangeStarting', function () {
		viewPortDimensions = undefined;
		stageElement.children().finish(nodeAnimOptions.queue);
		stageElement.finish(nodeAnimOptions.queue);
	});
	mapModel.addEventListener('layoutChangeComplete', function (options) {
		let connectorGroupClone = jQuery(), linkGroupClone = jQuery();
		if (options && options.themeChanged) {
			stageElement.children().andSelf().finish(nodeAnimOptions.queue);
			jQuery(stageElement).find('[data-mapjs-role=connector]').updateConnector(true);
			jQuery(stageElement).find('[data-mapjs-role=link]').updateLink(true);
		} else {
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
			stageElement.animate({'opacity': 1}, _.extend({
				progress: function () {
					connectorGroupClone.updateConnector();
					linkGroupClone.updateLink();
				},
				complete: function () {
					connectorGroupClone.updateConnector(true);
					linkGroupClone.updateLink(true);
				}
			}, nodeAnimOptions));
			stageElement.children().dequeue(nodeAnimOptions.queue);
			stageElement.dequeue(nodeAnimOptions.queue);
		}
		connectorsForAnimation = jQuery();
		linksForAnimation = jQuery();

		ensureNodeVisible(stageElement.nodeWithId(mapModel.getCurrentlySelectedIdeaId()));
	});

	/* editing */
	if (!options || !options.inlineEditingDisabled) {
		mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll, editingNew) {
			const editingElement = stageElement.nodeWithId(nodeId);
			mapModel.setInputEnabled(false);
			viewPort.finish(); /* close any pending animations */
			editingElement.editNode(shouldSelectAll).done(
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
	}
	mapModel.addEventListener('addLinkModeToggled', function (isOn) {
		if (isOn) {
			stageElement.addClass('mapjs-add-link');
		} else {
			stageElement.removeClass('mapjs-add-link');
		}
	});
	mapModel.addEventListener('linkAttrChanged', function (l) {
		const attr = _.extend({arrow: false}, l.attr && l.attr.style);
		stageElement.findLink(l).data(attr).updateLink();
	});

	mapModel.addEventListener('activatedNodesChanged', function (activatedNodes, deactivatedNodes) {
		_.each(activatedNodes, function (nodeId) {
			stageElement.nodeWithId(nodeId).addClass('activated');
		});
		_.each(deactivatedNodes, function (nodeId) {
			stageElement.nodeWithId(nodeId).removeClass('activated');
		});
	});
};

