/*global MAPJS, _, Color*/
MAPJS.ThemeProcessor = function () {
	'use strict';
	var self = this,
		addPx = function (val) {
			return val + 'px';
		},
		cssProp = {
			cornerRadius: 'border-radius',
			'text.margin': 'padding',
			background: 'background-color',
			backgroundColor: 'background-color',
			border: 'border',
			shadow: 'box-shadow',
			'text.font': 'font'
		},
		colorParser = function (colorObj) {
			if (!colorObj.color || colorObj.opacity === 0) {
				return 'transparent';
			}
			if (colorObj.opacity) {
				return 'rgba(' + new Color(colorObj.color).rgbArray().join(',') + ',' + colorObj.opacity + ')';
			} else {
				return colorObj.color;
			}
		},
		fontWeightParser = function (fontObj) {
			var weightMap = {
				'light': '200',
				'semi-bold': '600'
			};
			if (!fontObj || !fontObj.weight) {
				return 'bold';
			}
			return weightMap[fontObj.weight] || fontObj.weight;
		},
		fontSizeParser = function (textObj) {
			var fontSize = (textObj && textObj.font && textObj.font.size) || 12,
				lineSpacing = (textObj && textObj.lineSpacing) || 3;

			return fontSize + 'pt/' + (lineSpacing + fontSize) + 'pt';
		},
		parsers = {
			cornerRadius: addPx,
			'text.margin': addPx,
			background: colorParser,
			border: function (borderOb) {
				if (borderOb.type === 'underline') {
					return '0';
				}
				return borderOb.line.width + 'px ' + (borderOb.line.style || 'solid') + ' '  + borderOb.line.color;
			},
			shadow: function (shadowArray) {
				var boxshadows = [];
				if (shadowArray.length === 1 && shadowArray[0].color === 'transparent') {
					return 'none';
				}
				shadowArray.forEach(function (shadow) {
					boxshadows.push(shadow.offset.width + 'px ' + shadow.offset.height + 'px ' + shadow.radius + 'px ' + colorParser(shadow));
				});
				return boxshadows.join(',');
			},
			'text.font': function (textObj) {
				return 'normal normal ' + fontWeightParser(textObj.font) + ' ' +  fontSizeParser(textObj) + ' -apple-system, "Helvetica Neue", Roboto, Helvetica, Arial, sans-serif';
			}
		},
		processNodeStyles = function (nodeStyleArray) {
			var result = [], parser, cssVal,
				pushProperties = function (styleObject, keyPrefix) {
					_.each(styleObject, function (val, propKey) {
						var key = (keyPrefix || '') + propKey;
						if (cssProp[key]) {
							parser = parsers[key] || _.identity;
							cssVal = parser(val);
							if (cssVal) {
								result.push(cssProp[key]);
								result.push(':');
								result.push(cssVal);
								result.push(';');
							}
						} else if (_.isObject(val)) {
							pushProperties(val, key + '.');
						}
					});

				};
			nodeStyleArray.forEach(function (nodeStyle) {
				result.push('.mapjs-node');
				if (nodeStyle.name !== 'default') {
					result.push('.');
					result.push(nodeStyle.name.replace(/\s/g, '_'));
				}
				result.push('{');
				pushProperties(nodeStyle);
				result.push('}');
			});
			return result.join('');
		};
	self.process = function (theme) {
		var nodeStyles = '';
		if (theme.node) {
			nodeStyles = processNodeStyles(theme.node);
		}
		return {
			css: nodeStyles
		};
	};
};
