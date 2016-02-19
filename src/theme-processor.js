/*global MAPJS, _, Color*/
MAPJS.ThemeProcessor = function () {
	'use strict';
	var self = this,
		addPx = function (val) {
			return val + 'px';
		},
		cssProp = {
			cornerRadius: 'border-radius',
			background: 'background-color',
			backgroundColor: 'background-color',
			border: 'border',
			shadow: 'box-shadow'
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
		parsers = {
			cornerRadius: addPx,
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
			}
		},
		processNodeStyles = function (nodeStyleArray) {
			var result = [], parser, cssVal;
			nodeStyleArray.forEach(function (nodeStyle) {
				result.push('.mapjs-node');
				if (nodeStyle.name !== 'default') {
					result.push('.');
					result.push(nodeStyle.name.replace(/\s/g, '_'));
				}
				result.push('{');
				_.each(nodeStyle, function (val, key) {
					if (cssProp[key]) {
						parser = parsers[key] || _.identity;
						cssVal = parser(val);
						if (cssVal) {
							result.push(cssProp[key]);
							result.push(':');
							result.push(cssVal);
							result.push(';');
						}
					}
				});
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
