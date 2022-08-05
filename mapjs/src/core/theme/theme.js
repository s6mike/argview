/*global module, require */
const AUTO_COLOR = 'theme-auto-color',
	themeFallbackValues = require('./theme-fallback-values'),
	themeToDictionary = require('./theme-to-dictionary'),
	themeAttributeUtils = require('./theme-attribute-utils'),
	defaultTheme = require('./default-theme');
module.exports = function Theme(themeJson) {
	'use strict';

	const self = this,
		themeDictionary = themeToDictionary(themeJson),
		attributeValue = (prefixes, styles, postfixes, fallback) => themeAttributeUtils.themeAttributeValue(themeDictionary, prefixes, styles, postfixes, fallback);

	self.getFontForStyles = function (themeStyles) {
		const weight = attributeValue(['node'], themeStyles, ['text', 'font', 'weight'], 'semibold'),
			size = attributeValue(['node'], themeStyles, ['text', 'font', 'size'], themeFallbackValues.nodeTheme.font.size),
			lineSpacing = attributeValue(['node'], themeStyles, ['text', 'font', 'lineSpacing'], themeFallbackValues.nodeTheme.font.lineSpacing);
		return {size: size, weight: weight, lineGap: lineSpacing};
	};
	self.getNodeMargin = function (themeStyles) {
		return attributeValue(['node'], themeStyles, ['text', 'margin'], themeFallbackValues.nodeTheme.margin);
	};
	self.name = themeJson && themeJson.name;
	self.connectorEditingContext = themeJson && themeJson.connectorEditingContext;
	//TODO: rempve blockParentConnectorOverride once site has been live for a while
	self.blockParentConnectorOverride = themeJson && themeJson.blockParentConnectorOverride;

	self.attributeValue = (prefixes, styles, postfixes, fallback) => attributeValue(prefixes, styles, postfixes, fallback);

	self.nodeStyles = function (nodeLevel, nodeAttr) {
		const result = ['level_' + nodeLevel, 'default'];
		if (nodeAttr && nodeAttr.group) {
			result.unshift('attr_group');
			if (typeof nodeAttr.group === 'string' || typeof nodeAttr.group === 'number') {
				result.unshift('attr_group_' + nodeAttr.group);
			}
		}
		if (nodeAttr && nodeAttr.styleNames && Array.isArray(nodeAttr.styleNames)) {
			return nodeAttr.styleNames.concat(result);
		}
		return result;
	};
	self.nodeTheme = function (styles) {
		const nodeAttribute = attributeValue(['node'], styles);
		return themeAttributeUtils.nodeAttributeToNodeTheme(nodeAttribute);
	};

	self.connectorTheme = function (childPosition, childStyles, parentStyles) {
		const position = childPosition || 'horizontal',
			childConnectorStyle = attributeValue(['node'], childStyles, ['connections', 'style'], 'default'),
			parentConnectorStyle = parentStyles && attributeValue(['node'], parentStyles, ['connections', 'childstyle'], false),
			childConnector = themeAttributeUtils.attributeForPath(themeDictionary, ['connector', childConnectorStyle]),
			parentConnector = parentConnectorStyle && themeAttributeUtils.attributeForPath(themeDictionary, ['connector', parentConnectorStyle]),
			combinedStyle = parentConnectorStyle && (parentConnectorStyle + '.' + childConnectorStyle),
			combinedConnector = combinedStyle &&  themeAttributeUtils.attributeForPath(themeDictionary, ['connector', combinedStyle]),
			connectorStyle  = (combinedConnector && combinedStyle) || (parentConnector && parentConnectorStyle) || childConnectorStyle || 'default',
			controlPoint = themeAttributeUtils.connectorControlPoint(themeDictionary, position, connectorStyle),
			connectorDefaults = Object.assign({}, themeFallbackValues.connectorTheme),
			returnedConnector =  Object.assign({}, combinedConnector || parentConnector || childConnector || connectorDefaults);
		if (!returnedConnector.label) {
			returnedConnector.label = connectorDefaults.label;
		}
		returnedConnector.controlPoint = controlPoint;
		returnedConnector.line = returnedConnector.line || connectorDefaults.line;
		return returnedConnector;
	};
	self.linkTheme = function (linkStyle) {
		const fromCurrentTheme = themeAttributeUtils.attributeForPath(themeDictionary, ['link', linkStyle || 'default']),
			fromDefaultTheme = defaultTheme.link.default;
		return Object.assign({}, fromDefaultTheme, fromCurrentTheme);
	};

	self.noAnimations = () => !!(themeDictionary.noAnimations);
	self.getLayoutConnectorAttributes = (styles) => {
		const childConnectorStyle = attributeValue(['node'], styles, ['connections', 'style'], 'default'),
			connectorDefaults = Object.assign({}, themeFallbackValues.connectorTheme),
			childConnector = themeAttributeUtils.attributeForPath(themeDictionary, ['connector', childConnectorStyle]) || connectorDefaults,
			result = {};
		if (childConnector && childConnector.line) {
			result.parentConnector = {
				color: childConnector.line.color
			};
		}
		return result;
	};

	self.cleanPersistedAttributes = (currentAttribs) => {
		if (currentAttribs && currentAttribs.parentConnector && currentAttribs.parentConnector.themeAutoColor) {
			if (currentAttribs.parentConnector.themeAutoColor === currentAttribs.parentConnector.color) {
				delete currentAttribs.parentConnector.color;
			}
			delete currentAttribs.parentConnector.themeAutoColor;
			if (!currentAttribs || !currentAttribs.parentConnector || !Object.keys(currentAttribs.parentConnector).length) {
				delete currentAttribs.parentConnector;
			}
		}
		return currentAttribs;
	};

	self.getPersistedAttributes = (currentAttribs, nodeLevel, numberOfSiblings) => {
		const styles = ['level_' + nodeLevel, 'default'],
			getAutoColor = () => {
				const autoColors = themeDictionary.autoColors || [defaultTheme.connector.default.line.color],
					index = (numberOfSiblings % autoColors.length);
				return autoColors[index];
			},
			childConnectorStyle = attributeValue(['node'], styles, ['connections', 'style'], 'default'),
			connectorDefaults = Object.assign({}, themeFallbackValues.connectorTheme),
			childConnector = themeAttributeUtils.attributeForPath(themeDictionary, ['connector', childConnectorStyle]) || connectorDefaults,
			autoColor = getAutoColor(),
			result = {
				attr: (currentAttribs && currentAttribs.parentConnector && {parentConnector: currentAttribs.parentConnector}) || {},
				removed: []
			};

		if (childConnector && childConnector.line && childConnector.line.color === AUTO_COLOR) {
			result.attr = Object.assign({
				parentConnector: {
					color: autoColor,
					themeAutoColor: autoColor
				}
			}, result.attr);
		} else if (result.attr.parentConnector && result.attr.parentConnector.themeAutoColor) {
			result.attr.parentConnector = Object.assign({}, result.attr.parentConnector);
			if (result.attr.parentConnector.themeAutoColor === result.attr.parentConnector.color) {
				delete result.attr.parentConnector.color;
			}
			delete result.attr.parentConnector.themeAutoColor;

			if (!result || !result.attr || !result.attr.parentConnector || !Object.keys(result.attr.parentConnector).length) {
				result.removed.push('parentConnector');
				delete result.attr.parentConnector;
			}
		}
		return result;
	};
};
