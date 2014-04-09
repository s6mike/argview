/*global jQuery, Color, _, MAPJS*/
/*
 * MapViewController
 * -  listening to map model, updating the dom on the stage
 * -  interaction between keyboard and mouse and the model
 * -  listening to the DOM updates and telling the model about that
 * -  repositioning various UI elements
 */
jQuery.fn.updateNodeContent = function (nodeContent) {
	'use strict';
	var MAX_URL_LENGTH = 25,
		self = jQuery(this),
		linkElement,
		textSpan = function () {
			var span = self.find('[data-mapjs-role=title]');
			if (span.length === 0) {
				span = jQuery('<span>').attr('data-mapjs-role', 'title').appendTo(self);
			}
			return span;
		},
		applyLinkUrl = function (title) {
			var url = MAPJS.URLHelper.getLink(title);
			if (!url) {
				if (linkElement) {
					linkElement.hide();
				}
				return;
			}
			if (!linkElement) {
				linkElement = jQuery('<a target="_blank" class="mapjs-link"></a>').appendTo(self);
			}
			linkElement.attr('href', url).show();
		},
		updateText = function (title) {
			var text = MAPJS.URLHelper.stripLink(title) ||
					(title.length < MAX_URL_LENGTH ? title : (title.substring(0, MAX_URL_LENGTH) + '...'));

			textSpan().text(text.trim());
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
				textWidth = textBox.outerWidth(),
				padding,
				selfProps = {
					'min-height': '',
					'min-width': '',
					'background-image': '',
					'background-repeat': '',
					'background-size': '',
					'background-position': ''
				},
				textProps = {'margin-top': ''};
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
					if (icon.width > textWidth) {
						selfProps['min-width'] = icon.width;
					}
				}
			}
			self.css(selfProps);
			textBox.css(textProps);
		};
	updateText(nodeContent.title);
	applyLinkUrl(nodeContent.title);
	self.attr('mapjs-level', nodeContent.level);

	setColors();
	setIcon(nodeContent.attr && nodeContent.attr.icon);
	setCollapseClass();
	return self;
};
