/*global MAPJS, _*/
MAPJS.ThemeProcessor = function () {
	'use strict';
	var self = this,
		addPx = function (val) {
			return val + 'px';
		},
		cssProp = {
			cornerRadius: 'border-radius',
			backgroundColor: 'background-color',
			border: 'border'
		},
		parsers = {
			cornerRadius: addPx,
			border: function (borderOb) {
				if (borderOb.type === 'underline') {
					return false;
				}
				return borderOb.line.width + 'px ' + (borderOb.line.style || 'solid') + ' '  + borderOb.line.color;
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
