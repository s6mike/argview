/*global MAPJS, Color, _, jQuery, Kinetic*/
/*jslint nomen: true, newcap: true, browser: true*/
(function () {
	'use strict';
	/*shamelessly copied from http://james.padolsey.com/javascript/wordwrap-for-javascript */
	var COLUMN_WORD_WRAP_LIMIT = 25,
		urlPattern = /(https?:\/\/|www\.)[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/i;
	function wordWrap(str, width, brk, cut) {
		brk = brk || '\n';
		width = width || 75;
		cut = cut || false;
		if (!str) {
			return str;
		}
		var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');
		return str.match(new RegExp(regex, 'g')).join(brk);
	}
	function joinLines(string) {
		return string.replace(/\n/g, ' ');
	}
	function breakWords(string) {
		return wordWrap(joinLines(string), COLUMN_WORD_WRAP_LIMIT, '\n', false);
	}
	function createLink() {
		var link = new Kinetic.Group(),
			rectProps = {
				width: 10,
				height: 20,
				rotation: 0.6,
				stroke: '#555555',
				strokeWidth: 3,
				cornerRadius: 6,
				shadowOffset: [2, 2],
				shadow: '#CCCCCC',
				shadowBlur: 0.4,
				shadowOpacity: 0.4,
			},
			rect = new Kinetic.Rect(rectProps),
			rect2 = new Kinetic.Rect(rectProps);
		rect2.attrs.x = 7;
		rect2.attrs.y = -7;
		link.add(rect);
		link.add(rect2);
		link.setActive = function (isActive) {
			rect.attrs.stroke = rect2.attrs.stroke = (isActive ? 'black' : '#555555');
			link.getLayer().draw();
		};
		return link;
	}
	Kinetic.Idea = function (config) {
		var ENTER_KEY_CODE = 13,
			ESC_KEY_CODE = 27,
			self = this,
			unformattedText = joinLines(config.text),
			bgRect = function (offset) {
				return new Kinetic.Rect({
					strokeWidth: 1,
					cornerRadius: 10,
					x: offset,
					y: offset,
					visible: false
				});
			};
		this.level = config.level;
		this.mmStyle = config.mmStyle;
		this.isSelected = false;
		config.draggable = config.level > 1;
		config.name = 'Idea';
		Kinetic.Group.call(this, config);
		this.rect = new Kinetic.Rect({
			strokeWidth: 1,
			cornerRadius: 10
		});
		this.rectbg1 = bgRect(8);
		this.rectbg2 = bgRect(4);
		this.link = createLink();
		this.link.on('click tap', function () {
			var url = unformattedText.match(urlPattern);
			if (url && url[0]) {
				url = url[0];
				if (!/https?:\/\//i.test(url)) {
					url = 'http://' + url;
				}
				window.open(url, '_blank');
			}
		});
		this.link.on('mouseover', function () {
			self.link.setActive(true);
		});
		this.link.on('mouseout', function () {
			self.link.setActive(false);
		});
		this.text = new Kinetic.Text({
			fontSize: 12,
			fontFamily: 'Helvetica',
			lineHeight: 1.5,
			fontStyle: 'bold',
			align: 'center'
		});
		this.add(this.rectbg1);
		this.add(this.rectbg2);
		this.add(this.rect);
		this.add(this.text);
		this.add(this.link);
		this.setText = function (text) {
			unformattedText = text;
			self.text.setText(breakWords(text.replace(urlPattern, '')));
			self.link.setVisible(urlPattern.test(text));
			self.setStyle();
		};
		this.setText(config.text);
		this.classType = 'Idea';
		this.getNodeAttrs = function () {
			return self.attrs;
		};
		this.isVisible = function (offset) {
			var stage = self.getStage();
			return stage && stage.isRectVisible(new MAPJS.Rectangle(self.attrs.x, self.attrs.y, self.getWidth(), self.getHeight()), offset);
		};
		this.editNode = function (shouldSelectAll) {
			self.fire(':editing');
			self.getLayer().draw();
			var canvasPosition = jQuery(self.getLayer().getCanvas().getElement()).offset(),
				ideaInput,
				onStageMoved = _.throttle(function () {
					ideaInput.css({
						top: canvasPosition.top + self.getAbsolutePosition().y,
						left: canvasPosition.left + self.getAbsolutePosition().x
					});
				}, 10),
				updateText = function (newText) {
					self.setStyle();
					self.getStage().draw();
					self.fire(':textChanged', {
						text: newText || unformattedText
					});
					ideaInput.remove();
					self.stopEditing = undefined;
					self.getStage().off('xChange yChange', onStageMoved);
				},
				onCommit = function () {
					updateText(ideaInput.val());
				},
				onCancelEdit = function () {
					updateText(unformattedText);
				},
				scale = self.getStage().getScale().x || 1;
			ideaInput = jQuery('<textarea type="text" wrap="soft" class="ideaInput"></textarea>')
				.css({
					top: canvasPosition.top + self.getAbsolutePosition().y,
					left: canvasPosition.left + self.getAbsolutePosition().x,
					width: (6 + self.getWidth()) * scale,
					height: (6 + self.getHeight()) * scale,
					'padding': 3 * scale + 'px',
					'font-size': self.text.attrs.fontSize * scale + 'px',
					'line-height': '150%',
					'background-color': self.getBackground(),
					'margin': -3 * scale,
					'border-radius': self.rect.attrs.cornerRadius * scale + 'px',
					'border': self.rect.attrs.strokeWidth * (2 * scale) + 'px dashed ' + self.rect.attrs.stroke,
					'color': self.text.attrs.fill
				})
				.val(unformattedText)
				.appendTo('body')
				.keydown(function (e) {
					if (e.which === ENTER_KEY_CODE) {
						onCommit();
					} else if (e.which === ESC_KEY_CODE) {
						onCancelEdit();
					} else if (e.which === 9) {
						e.preventDefault();
					} else if (e.which === 83 && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						onCommit();
						return; /* propagate to let the environment handle ctrl+s */
					} else if (!e.shiftKey && e.which === 90 && (e.metaKey || e.ctrlKey)) {
						if (ideaInput.val() === unformattedText) {
							onCancelEdit();
						}
					}
					e.stopPropagation();
				})
				.blur(onCommit)
				.focus(function () {
					if (shouldSelectAll) {
						if (ideaInput[0].setSelectionRange) {
							ideaInput[0].setSelectionRange(0, unformattedText.length);
						} else {
							ideaInput.select();
						}
					} else if (ideaInput[0].setSelectionRange) {
						ideaInput[0].setSelectionRange(unformattedText.length, unformattedText.length);
					}
				})
				.on('input', function () {
					var text = new Kinetic.Idea({
						text: ideaInput.val()
					});
					ideaInput.width(Math.max(ideaInput.width(), text.getWidth() * scale));
					ideaInput.height(Math.max(ideaInput.height(), text.getHeight() * scale));
				});

			self.stopEditing = onCancelEdit;
			ideaInput.focus();

			self.getStage().on('xChange yChange', onStageMoved);
		};
	};
}());

Kinetic.Idea.prototype.setShadowOffset = function (offset) {
	'use strict';
	offset = this.getMMScale().x * offset;
	_.each([this.rect, this.rectbg1, this.rectbg2], function (r) {
		r.setShadowOffset([offset, offset]);
	});
};

Kinetic.Idea.prototype.getMMScale = function () {
	'use strict';
	var stage = this.getStage(),
		scale = (stage && stage.attrs && stage.attrs.scale && stage.attrs.scale.x) || (this.attrs && this.attrs.scale && this.attrs.scale.x) || 1;
	return {x: scale, y: scale};
};


Kinetic.Idea.prototype.setupShadows = function () {
	'use strict';
	var scale = this.getMMScale().x,
		isSelected = this.isSelected,
		offset =  (this.mmStyle && this.mmStyle.collapsed) ? 3 * scale : 4 * scale,
		normalShadow = {
			color: 'black',
			blur: 10 * scale,
			offset: [offset, offset],
			opacity: 0.4 * scale
		},
		selectedShadow = {
			color: 'black',
			blur: 0,
			offset: [offset, offset],
			opacity: 1
		},
		shadow = isSelected ? selectedShadow : normalShadow;
	_.each([this.rect, this.rectbg1, this.rectbg2], function (r) {
		r.setShadowColor(shadow.color);
		r.setShadowBlur(shadow.blur);
		r.setShadowOpacity(shadow.opacity);
		r.setShadowOffset(shadow.offset);
	});
};
Kinetic.Idea.prototype.getBackground = function () {
	'use strict';
	/*jslint newcap: true*/
	var isRoot = this.level === 1,
		defaultBg = MAPJS.defaultStyles[isRoot ? 'root' : 'nonRoot'].background,
		validColor = function (color, defaultColor) {
			if (!color) {
				return defaultColor;
			}
			var parsed = Color(color).hexString();
			return color.toUpperCase() === parsed.toUpperCase() ? color : defaultColor;
		};
	return validColor(this.mmStyle && this.mmStyle.background, defaultBg);
};
Kinetic.Idea.prototype.setStyle = function () {
	'use strict';
	/*jslint newcap: true*/
	var self = this,
		isDroppable = this.isDroppable,
		isSelected = this.isSelected,
		background = this.getBackground(),
		tintedBackground = Color(background).mix(Color('#EEEEEE')).hexString(),
		padding = 8;
	this.attrs.width = this.text.getWidth() + 2 * padding;
	this.attrs.height = this.text.getHeight() + 2 * padding;
	this.text.attrs.x = padding;
	this.text.attrs.y = padding;
	this.link.attrs.x = this.text.getWidth() + 10;
	this.link.attrs.y = this.text.getHeight() + 5;
	_.each([this.rect, this.rectbg1, this.rectbg2], function (r) {
		r.attrs.width = self.text.getWidth() + 2 * padding;
		r.attrs.height = self.text.getHeight() + 2 * padding;
		if (isDroppable) {
			r.attrs.stroke = '#9F4F4F';
			r.attrs.fillLinearGradientStartPoint = {x: 0, y: 0};
			r.attrs.fillLinearGradientEndPoint = {x: 100, y: 100};
			background = '#EF6F6F';
			r.attrs.fillLinearGradientColorStops = [0, background, 1, '#CF4F4F'];
		} else if (isSelected) {
			r.attrs.fillLinearGradientColorStops = [0, background, 1, background];
		} else {
			r.attrs.stroke = '#888';
			r.attrs.fillLinearGradientStartPoint = {x: 0, y: 0};
			r.attrs.fillLinearGradientEndPoint = {x: 100, y: 100};
			r.attrs.fillLinearGradientColorStops = [0, tintedBackground, 1, background];
		}
	});
	this.setupShadows();
	this.text.attrs.fill = MAPJS.contrastForeground(tintedBackground);
};
Kinetic.Idea.prototype.setMMStyle = function (newMMStyle) {
	'use strict';
	this.mmStyle = newMMStyle;
	this.setStyle();
	this.rectbg1.setVisible(this.mmStyle.collapsed || false);
	this.rectbg2.setVisible(this.mmStyle.collapsed || false);
	this.getLayer().draw();
};
Kinetic.Idea.prototype.getIsSelected = function () {
	'use strict';
	return this.isSelected;
};

Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	'use strict';
	this.isSelected = isSelected;
	this.setStyle();
	this.getLayer().draw();
	if (!isSelected && this.stopEditing) {
		this.stopEditing();
	}
};
Kinetic.Idea.prototype.setIsDroppable = function (isDroppable) {
	'use strict';
	this.isDroppable = isDroppable;
	this.setStyle(this.attrs);
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Group);
