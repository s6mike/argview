/*global require, describe, it, expect, beforeEach*/
const themeToDictionary = require('../../../src/core/theme/theme-to-dictionary'),
	defaultTheme = require('../../../src/core/theme/default-theme'),
	deepAssign = require('../../../src/core/deep-assign'),
	themeFallbackValues = require('../../../src/core/theme/theme-fallback-values'),
	underTest = require('../../../src/core/theme/theme-attribute-utils');

describe('themeAttributeUtils', () => {
	'use strict';
	let themeDictionary;
	beforeEach(() => {
		themeDictionary = themeToDictionary(defaultTheme);
	});
	describe('attributeForPath', () => {
		it('should return attribute value for path', () => {
			expect(underTest.attributeForPath(themeDictionary, ['node'], 'fallbackValueHere')).toEqual(themeDictionary.node);
			expect(underTest.attributeForPath(themeDictionary, ['node', 'default'], 'fallbackValueHere')).toEqual(themeDictionary.node.default);
			expect(underTest.attributeForPath(themeDictionary.connector.default.controlPoint.above, ['width'], 'fallbackValueHere')).toEqual(0);
		});
		it('return attribute 0 value for path', () => {
			expect(underTest.attributeForPath(themeDictionary.connector.default.controlPoint, ['above', 'width'], 'fallbackValueHere')).toEqual(0);
			expect(underTest.attributeForPath(themeDictionary.connector.default.controlPoint.above, ['width'], 'fallbackValueHere')).toEqual(0);
			expect(underTest.attributeForPath(themeDictionary.connector.default.controlPoint.above.width, [], 'fallbackValueHere')).toEqual(0);

		});
		describe('should return root object', () => {
			it('when pathArray is empty', () => {
				expect(underTest.attributeForPath(themeDictionary, [], 'fallbackValueHere')).toEqual(themeDictionary);
			});
			it('when pathArray is falsy', () => {
				expect(underTest.attributeForPath(themeDictionary, undefined, 'fallbackValueHere')).toEqual(themeDictionary);
			});

		});
		describe('should return provided fallback', () => {
			it('when object is falsy', () => {
				expect(underTest.attributeForPath(undefined, ['node'], 'fallbackValueHere')).toEqual('fallbackValueHere');
			});
			it('when object is falsy and pathArray is empty', () => {
				expect(underTest.attributeForPath(undefined, [], 'fallbackValueHere')).toEqual('fallbackValueHere');
			});
			it('when object and pathArray are falsy', () => {
				expect(underTest.attributeForPath(undefined, undefined, 'fallbackValueHere')).toEqual('fallbackValueHere');
			});
			it('when attribute for path is falsy', () => {
				expect(underTest.attributeForPath(themeDictionary, ['node', 'wut'], 'fallbackValueHere')).toEqual('fallbackValueHere');
			});
		});
	});
	describe('themeAttributeValue', () => {
		it('should return a merged value for the styles', () => {
			const expected = deepAssign({}, themeDictionary.node.default, themeDictionary.node.level_1);
			expect(underTest.themeAttributeValue(themeDictionary, ['node'], ['level_1', 'default'])).toEqual(expected);
		});
		it('should ignore styles that are not in the theme', () => {
			const expected = deepAssign({}, themeDictionary.node.default, themeDictionary.node.level_1);
			expect(underTest.themeAttributeValue(themeDictionary, ['node'], ['level_foo', 'level_1', 'default'])).toEqual(expected);
		});
		it('should use postfixes to return part of the merged attribute', () => {
			expect(underTest.themeAttributeValue(themeDictionary, ['node'], ['level_1', 'default'], ['text', 'font'])).toEqual(themeDictionary.node.default.text.font);
		});
		it('should return the fallback value if nothing found', () => {
			expect(underTest.themeAttributeValue(themeDictionary, ['node'], ['level_1', 'default'], ['text', 'font', 'wut'], 'fallbackValueHere')).toEqual('fallbackValueHere');
		});
		it('should not return the fallback value if attribute value is 0', () => {
			expect(underTest.themeAttributeValue(themeDictionary, ['connector'], ['default'], ['controlPoint', 'above', 'width'], 'fallbackValueHere')).toEqual(0);
		});
		it('should return the value when there are no styles and the value is not an object', () => {
			expect(underTest.themeAttributeValue(themeDictionary, ['name'], [], [], 'fallbackValueHere')).toEqual('MindMup Default');

		});
		it('should return the fallback value when there are no styles and the value is not an object but there are postfixes', () => {
			expect(underTest.themeAttributeValue(themeDictionary, ['name'], [], ['propertyHere'], 'fallbackValueHere')).toEqual('fallbackValueHere');

		});
	});
	describe('nodeAttributeToNodeTheme', () => {
		let nodeAttribute;
		beforeEach(() => {
			nodeAttribute = underTest.themeAttributeValue(themeDictionary, ['node'], ['level_1', 'default']);
		});
		describe('should return defaults', () => {
			it('when merged object is falsy', () => {
				expect(underTest.nodeAttributeToNodeTheme()).toEqual(themeFallbackValues.nodeTheme);
			});
			it('when merged object is empty', () => {
				expect(underTest.nodeAttributeToNodeTheme({})).toEqual(themeFallbackValues.nodeTheme);
			});
		});
		describe('should return result with attributes', () => {
			it('margin', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).margin).toEqual(nodeAttribute.text.margin);
			});
			it('font', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).font).toEqual(nodeAttribute.text.font);
			});
			it('text', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).text).toEqual(nodeAttribute.text);
			});
			it('borderType', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).borderType).toEqual(nodeAttribute.border.type);
			});
			it('backgroundColor', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).backgroundColor).toEqual(nodeAttribute.backgroundColor);
			});
			it('cornerRadius', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).cornerRadius).toEqual(nodeAttribute.cornerRadius);
			});
			it('lineColor', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).lineColor).toEqual(nodeAttribute.border.line.color);
			});
			it('lineWidth', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).lineWidth).toEqual(nodeAttribute.border.line.width);
			});
			it('lineStyle', () => {
				expect(underTest.nodeAttributeToNodeTheme(nodeAttribute).lineStyle).toEqual(nodeAttribute.border.line.style);
			});


		});
	});
	describe('connectorControlPoint', function () {
		beforeEach(() => {
			themeDictionary = themeToDictionary({
				name: 'Mike',
				autoColors: ['red', 'green', 'blue'],
				'node': [
					{
						'name': 'default',
						'cornerRadius': 10.0,
						'backgroundColor': 'transparent'

					},
					{
						'name': 'special',
						'cornerRadius': 1.0,
						'connections': {
							childstyle: 'no-connector',
							style: 'green'
						}
					},
					{
						'name': 'sharp',
						'cornerRadius': 0.0
					},
					{
						'name': 'no-line',
						'connections': {
							style: 'no-line-curve'
						}
					},
					{
						'name': 'inherit-color',
						'connections': {
							style: 'inherit'
						}
					},
					{
						'name': 'level_7',
						'connections': {
							style: 'autoColor'
						}
					}
				],
				connector: {
					default: {
						type: 'top-down-s-curve',
						line: {
							color: '#070707',
							width: 2.0
						}
					},
					inherit: {
						type: 'top-down-s-curve',
						line: {
							color: 'inherit',
							width: 2.0
						}
					},
					autoColor: {
						line: {
							color: 'theme-auto-color'
						}
					},
					'no-connector': {
						type: 'no-connector',
						line: {
							color: '#707070',
							width: 0
						}
					},
					green: {
						type: 'green-curve',
						line: {
							color: '#00FF00',
							width: 3.0
						}
					},
					'no-connector.green': {
						type: 'no-connector-green',
						line: {
							color: '#FFFF00',
							width: 4.0
						}
					},
					'no-line-curve': {
						type: 'no-line-curve'
					},
					controlPointCurve: {
						type: 'control-curve',
						line: {
							color: '#00FF00',
							width: 3.0
						},
						controlPoint: {
							'above': {'width': 0.5, 'height': 2.75},
							'below': {'width': 0.75, 'height': 0.5},
							'horizontal': {'width': 2, 'height': 1}
						}
					}

				},
				layout: {
					spacing: 30
				}
			});
		});
		it('should return the default horizontal connector if no style provided', function () {
			expect(underTest.connectorControlPoint(themeDictionary, 'horizontal')).toEqual({'width': 0, 'height': 1});
		});
		it('should return the default horizontal connector if no style provided', function () {
			expect(underTest.connectorControlPoint(themeDictionary, 'above')).toEqual({'width': 0, 'height': 1.75});
		});

		it('should return the default horizontal connector if no control point is configured for the connector style', function () {
			expect(underTest.connectorControlPoint(themeDictionary, 'horizontal', 'green')).toEqual({'width': 0, 'height': 1});
		});
		it('should return the default non-horizontal connector if no control point is configured for the connector style', function () {
			expect(underTest.connectorControlPoint(themeDictionary, 'above', 'green')).toEqual({'width': 0, 'height': 1.75});
		});
		['above', 'below'].forEach(function (pos) {
			it('should return the default ' + pos + ' connector if no style provided', function () {
				expect(underTest.connectorControlPoint(themeDictionary, pos)).toEqual({'width': 0, 'height': 1.75});
			});
		});
		it('should return the configured controlPoint', function () {
			expect(underTest.connectorControlPoint(themeDictionary, 'horizontal', 'controlPointCurve')).toEqual({'width': 2, 'height': 1});
			expect(underTest.connectorControlPoint(themeDictionary, 'above', 'controlPointCurve')).toEqual({'width': 0.5, 'height': 2.75});
			expect(underTest.connectorControlPoint(themeDictionary, 'below', 'controlPointCurve')).toEqual({'width': 0.75, 'height': 0.5});
		});
		it('should return the default non-horizontal connector if unconfigured childPosition supplied', function () {
			expect(underTest.connectorControlPoint(themeDictionary, 'outside', 'controlPointCurve')).toEqual({'width': 0, 'height': 1.75});
		});

	});

});
