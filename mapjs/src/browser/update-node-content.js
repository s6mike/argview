/*global require */
const jQuery = require('jquery'),
	_ = require('underscore'),
	URLHelper = require('../core/util/url-helper'),
	formattedNodeTitle = require('../core/content/formatted-node-title'),
	nodeCacheMark = require('./node-cache-mark'),
	applyIdeaAttributesToNodeTheme = require('../core/content/apply-idea-attributes-to-node-theme'),
	calcMaxWidth = require('../core/util/calc-max-width');

require('./set-theme-class-list');

jQuery.fn.updateNodeContent = function (nodeContent, theme, optional) {
	'use strict';
	const resourceTranslator = optional && optional.resourceTranslator,
		forcedLevel = optional && optional.level,
		nodeTextPadding = (optional && optional.nodeTextPadding) || 11,
		fixedLayout = (optional && optional.fixedLayout),
		// theme = (optional && optional.theme),
		self = jQuery(this),
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
					})
					.trigger(jQuery.Event('attachment-link-created', {nodeId: nodeContent.id}));
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
		level = forcedLevel || 1,
		styles = nodeContent.styles || (theme && theme.nodeStyles(level, nodeContent.attr)) || [],
		nodeTheme = theme && theme.nodeTheme && applyIdeaAttributesToNodeTheme(nodeContent, theme.nodeTheme(styles)),
		updateTextStyle = function () {
			if (nodeTheme && nodeTheme.hasFontMultiplier) {
				self.css({
					'font-size': nodeTheme.font.size + 'pt'
				});
			} else {
				self.css({'font-size': ''});
			}
			if (nodeTheme && nodeTheme.text && nodeTheme.text.alignment) {
				self.css('text-align', nodeTheme.text.alignment);
			} else {
				self.css('text-align', '');
			}
		},
		updateText = function (title) {
			const text = formattedNodeTitle(title, 25),
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
				element.css('min-width', nodeContent.textWidth || element.css('max-width'));
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
			self.removeClass('mapjs-node-colortext mapjs-node-transparent');
			self.css({'color': nodeTheme.text.color, 'background-color': nodeTheme.backgroundColor});

			if (colorText) {
				self.addClass('mapjs-node-colortext');
			}
			if (!nodeTheme || !nodeTheme.backgroundColor || nodeTheme.backgroundColor === 'transparent') {
				self.addClass('mapjs-node-transparent');
			}
		},
		setIcon = function (icon) {
			let textHeight,
				textWidth,
				maxTextWidth;
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
				},
				padding = (nodeTheme && nodeTheme.margin) || 10;
			self.css({padding: ''});
			if (icon) {
				textHeight = textBox.outerHeight();
				textWidth = textBox.outerWidth();
				maxTextWidth = calcMaxWidth(nodeContent.attr, nodeTheme);
				_.extend(selfProps, {
					'background-image': 'url("' + (resourceTranslator ? resourceTranslator(icon.url) : icon.url) + '")',
					'background-repeat': 'no-repeat',
					'background-size': icon.width + 'px ' + icon.height + 'px',
					'background-position': 'center center'
				});
				if (icon.position === 'top' || icon.position === 'bottom') {
					if (icon.position === 'top') {
						selfProps['background-position'] = 'center ' + padding + 'px';
					} else if (fixedLayout) {
						selfProps['background-position'] = 'center ' + (padding + textHeight) + 'px';
					} else {
						selfProps['background-position'] = 'center ' + icon.position + ' ' + padding + 'px';
					}

					selfProps['padding-' + icon.position] = icon.height + (padding * 2);
					selfProps['min-width'] = icon.width;
					if (icon.width > maxTextWidth) {
						textProps['max-width'] = `${icon.width}px`;
					}
				} else if (icon.position === 'left' || icon.position === 'right') {
					if (icon.position === 'left') {
						selfProps['background-position'] = padding + 'px center';
					} else if (fixedLayout) {
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
						textProps['max-width'] = `${icon.width}px`;
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
		attrValue = (theme && theme.attributeValue) || themeDefault,
		nodeStyles = (theme &&  theme.nodeStyles) || styleDefault,
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
			textWidth: Math.round(nodeContent.textWidth),
			height: Math.round(nodeContent.height),
			nodeId: nodeContent.id,
			styles: effectiveStyles,
			parentConnector: nodeContent && nodeContent.attr && nodeContent.attr.parentConnector
		};


	let offset;




	nodeCacheData.innerRect = _.pick(nodeCacheData, ['width', 'height']);
	nodeCacheData.innerRect.dx = 0;
	nodeCacheData.innerRect.dy = 0;

	updateTextStyle();
	if (isGroup) {
		this.css({margin: '', width: nodeContent.width, height: nodeContent.height, opacity: 1});
		updateText('');
	} else {
		updateText(nodeContent.title);
		if (optional && optional.decorations && !optional.decorations.includes(decorationEdge)) {
			decorations().empty();
		} else {
			applyLinkUrl(nodeContent.title);
			applyLabel(nodeContent.label);
			applyNote();
			applyAttachment();
		};
		this.css({margin: '', width: '', height: '', opacity: 1});
		if (decorationEdge === 'left') {
			nodeCacheData.innerRect.dx = decorations().outerWidth();
			nodeCacheData.innerRect.width = nodeCacheData.width - decorations().outerWidth();
			self.css('margin-left', decorations().outerWidth());
		} else if (decorationEdge === 'right') {
			nodeCacheData.innerRect.width = nodeCacheData.width - decorations().outerWidth();
			self.css('margin-right', decorations().outerWidth());
		} else if (decorationEdge === 'bottom') {
			offset = decorations().outerHeight() * (decorationOverlap ? 0.5 : 1);
			nodeCacheData.innerRect.height = nodeCacheData.height - offset;
			self.css('margin-bottom', decorations().outerHeight() * (decorationOverlap ? 0.5 : 1));
		}
	}

	self.setThemeClassList(effectiveStyles).attr('mapjs-level', nodeLevel);

	self.data(nodeCacheData);
	self.data('nodeCacheMark', nodeCacheMark(nodeContent, Object.assign({theme: theme}, optional)));
	setColors(colorText);
	setIcon(nodeContent.attr && nodeContent.attr.icon);
	setCollapseClass();
	self.trigger('mapjs:resize');
	return self;
};

