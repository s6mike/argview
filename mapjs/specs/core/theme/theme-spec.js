/*global describe, beforeEach, it, expect, require*/
const defaultTheme = require('../../../src/core/theme/default-theme'),
	Theme = require('../../../src/core/theme/theme'),
	themeAttibuteUtils = require('../../../src/core/theme/theme-attribute-utils'),
	themeToDictionary = require('../../../src/core/theme/theme-to-dictionary'),
	themeFallBackValues = require('../../../src/core/theme/theme-fallback-values');

describe('Theme', function () {
	'use strict';
	let underTest, theme, themeDictionary;
	beforeEach(function () {
		theme = {
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
		};
		themeDictionary = themeToDictionary(theme);
		underTest = new Theme(theme);
	});
	it('should set the theme name', function () {
		expect(underTest.name).toEqual('Mike');
	});
	describe('connectorEditingContext', function () {
		it('should be falsy if connectorEditingContext flag is ommitted', function () {
			expect(underTest.connectorEditingContext).toBeFalsy();
		});
		it('should be truthy when connectorEditingContext flag is set', function () {
			theme.connectorEditingContext = {allowed: ['width']};
			underTest = new Theme(theme);
			expect(underTest.connectorEditingContext).toEqual({allowed: ['width']});
		});

	});
	describe('attributeValue', function () {
		it('should return default value for empty theme', function () {
			underTest = new Theme({});
			expect(underTest.attributeValue(['node'], ['special', 'default'], ['cornerRadius'], 100)).toEqual(100);
		});
		it('should return first value found', function () {
			expect(underTest.attributeValue(['node'], ['special', 'default'], ['cornerRadius'], 100)).toEqual(1.0);
		});
		it('should return a secondary style value if primary not configured', function () {
			expect(underTest.attributeValue(['node'], ['special', 'default'], ['backgroundColor'], '#FFFFFF')).toEqual('transparent');
		});
		it('should return falsy values', function () {
			expect(underTest.attributeValue(['node'], ['sharp', 'special', 'default'], ['cornerRadius'], 100)).toEqual(0.0);
		});
		it('should return the fallback value if nothing configured', function () {
			expect(underTest.attributeValue(['node'], ['special', 'default'], ['foregroundColor'], '#FFFFFF')).toEqual('#FFFFFF');
		});
		it('should return the fallback value if no styles supplied', function () {
			expect(underTest.attributeValue(['node'], [], ['backgroundColor'], '#FFFFFF')).toEqual('#FFFFFF');
		});
		it('should return the value from a non-array structure', function () {
			expect(underTest.attributeValue(['layout'], [], ['spacing'])).toEqual(30);
		});
	});
	describe('nodeStyles', function () {
		it('attaches level only if attributes not provided', function () {
			expect(underTest.nodeStyles(3)).toEqual(['level_3', 'default']);
			expect(underTest.nodeStyles(3, {})).toEqual(['level_3', 'default']);
			expect(underTest.nodeStyles(3, {nongroup: 'x'})).toEqual(['level_3', 'default']);
		});
		it('attaches group attr if it is provided', function () {
			expect(underTest.nodeStyles(3, {group: 'blue'})).toEqual(['attr_group_blue', 'attr_group', 'level_3', 'default']);
			expect(underTest.nodeStyles(3, {group: 1})).toEqual(['attr_group_1', 'attr_group', 'level_3', 'default']);
			expect(underTest.nodeStyles(3, {group: true})).toEqual(['attr_group', 'level_3', 'default']);

		});
		it('does not explode when the group value is not a string', function () {
			expect(underTest.nodeStyles(3, {group: undefined})).toEqual(['level_3', 'default']);
			expect(underTest.nodeStyles(3, {group: false})).toEqual(['level_3', 'default']);
			expect(underTest.nodeStyles(3, {group: {'a': 'b'}})).toEqual(['attr_group', 'level_3', 'default']);
			expect(underTest.nodeStyles(3, {group: ['a', 'b']})).toEqual(['attr_group', 'level_3', 'default']);
		});

		it('prepends the styleNames attribute before the group', function () {
			expect(underTest.nodeStyles(3, {styleNames: ['perfect'], group: 'blue'})).toEqual(['perfect', 'attr_group_blue', 'attr_group', 'level_3', 'default']);
			expect(underTest.nodeStyles(3, {styleNames: ['perfect']})).toEqual(['perfect', 'level_3', 'default']);
		});
		it('does not explode if the styleNames attribute is not an array', () => {
			expect(underTest.nodeStyles(3, {styleNames: 1})).toEqual(['level_3', 'default']);
			expect(underTest.nodeStyles(3, {styleNames: true})).toEqual(['level_3', 'default']);
			expect(underTest.nodeStyles(3, {styleNames: 'text'})).toEqual(['level_3', 'default']);
		});
	});
	describe('nodeTheme', function () {
		it('should return default values for empty theme', function () {
			underTest = new Theme({});
			expect(underTest.nodeTheme([])).toEqual(themeFallBackValues.nodeTheme);
		});
		it('should return a cloned object for the default values', () => {
			underTest = new Theme({});
			const nodeTheme1 = underTest.nodeTheme([]),
				original = nodeTheme1.margin;
			nodeTheme1.margin = nodeTheme1.margin * 2;
			nodeTheme1.font.size = nodeTheme1.font.size * 2;
			nodeTheme1.text.margin = nodeTheme1.text.margin * 2;
			expect(underTest.nodeTheme([]).margin).toEqual(original);

		});
		it('should return the overridden values in the theme', function () {
			expect(underTest.nodeTheme(['default'])).toEqual({
				margin: 5,
				font: themeFallBackValues.nodeTheme.font,
				maxWidth: 146,
				backgroundColor: 'transparent',
				borderType: 'surround',
				cornerRadius: 10,
				lineColor: '#707070',
				lineStyle: 'solid',
				lineWidth: 1,
				text: {
					color: '#4F4F4F',
					lightColor: '#EEEEEE',
					darkColor: '#000000'
				}
			});
		});
		it('should let the node theme override line color and style', () => {
			theme.node[0].border = {
				type: 'surround',
				line: {
					style: 'dashed',
					width: 3
				}
			};
			expect(underTest.nodeTheme(['default']).lineWidth).toEqual(3);
			expect(underTest.nodeTheme(['default']).lineStyle).toEqual('dashed');

		});
		it('should return background color for background theme object', function () {
			delete theme.node[0].backgroundColor;
			theme.node[0].background = {
				color: '#FFFFFF',
				opacity: 0.8
			};
			underTest = new Theme(theme);
			expect(underTest.nodeTheme(['default']).backgroundColor).toEqual('rgba(255,255,255,0.8)');
		});
	});
	describe('linkTheme', function () {

		it('returns the default link theme if no theme is provided', function () {
			expect(underTest.linkTheme()).toEqual(defaultTheme.link.default);
		});
		it('returns the link theme from the current theme object if it exists', function () {
			underTest = new Theme({
				link: {
					default: {
						line: 'lll',
						label: 'xxx'
					}
				}
			});
			expect(underTest.linkTheme()).toEqual({label: 'xxx', line: 'lll'});
		});
		it('returns a particular link style if required', function () {
			underTest = new Theme({
				link: {
					default: {
						line: 'lll',
						label: 'xxx'
					},
					hipster: {
						line: 'hipl',
						label: 'hipt'
					}
				}
			});
			expect(underTest.linkTheme('hipster')).toEqual({line: 'hipl', label: 'hipt'});

		});
		it('merges with the default theme if the provided theme is only partial', function () {
			underTest = new Theme({
				link: {
					default: {
						line: 'yyy'
					}
				}
			});
			expect(underTest.linkTheme()).toEqual({line: 'yyy', label: defaultTheme.link.default.label });
		});

	});
	describe('connectorTheme', function () {
		let childPosition, defaultLabel, defaultControlPoint;

		beforeEach(function () {
			defaultControlPoint = { width: 0, height: 1.75 };
			defaultLabel = {
				position: {
					ratio: 0.5
				},
				backgroundColor: 'transparent',
				borderColor: 'transparent',
				text: {
					color: '#4F4F4F',
					font: {
						size: 9,
						sizePx: 12,
						weight: 'normal'
					}
				}
			};
			childPosition = 'above';
		});
		it('should return default line if not configured', function () {
			expect(underTest.connectorTheme(childPosition, ['no-line'])).toEqual({
				type: 'no-line-curve',
				controlPoint: defaultControlPoint,
				label: defaultLabel,
				line: {
					color: '#707070',
					width: 1.0
				}
			});
		});
		it('should return configured label', function () {
			theme.connector['no-line-curve'].label = 'configuredLabelHere';
			expect(underTest.connectorTheme(childPosition, ['no-line'])).toEqual({
				type: 'no-line-curve',
				controlPoint: defaultControlPoint,
				label: 'configuredLabelHere',
				line: {
					color: '#707070',
					width: 1.0
				}
			});
		});
		describe('should return the default style', function () {
			it('should default to a horizontal child position and default style to calculate controlPoint', () => {
				expect(underTest.connectorTheme().controlPoint).toEqual(themeAttibuteUtils.connectorControlPoint(themeDictionary, 'horizontal', 'default'));
			});
			it('when childStyles is undefined', function () {
				expect(underTest.connectorTheme()).toEqual({
					type: 'top-down-s-curve',
					controlPoint: themeAttibuteUtils.connectorControlPoint(themeDictionary, 'horizontal', 'default'),
					label: defaultLabel,
					line: {
						color: '#070707',
						width: 2.0
					}
				});

			});
			it('when childStyles is empty', function () {
				expect(underTest.connectorTheme(childPosition, [])).toEqual({
					type: 'top-down-s-curve',
					controlPoint: defaultControlPoint,
					label: defaultLabel,
					line: {
						color: '#070707',
						width: 2.0
					}
				});
			});
			it('when childStyles is undefined and there is no default style configured', function () {
				delete theme.connector.default;
				expect(underTest.connectorTheme()).toEqual({
					type: 'quadratic',
					controlPoint: themeAttibuteUtils.connectorControlPoint(themeDictionary, 'horizontal', 'default'),
					label: defaultLabel,
					line: {
						color: '#707070',
						width: 1.0
					}
				});

			});
		});
		[['no parent', undefined], ['a parent with no child style configured', ['sharp']]].forEach(function (args) {
			describe('when the node has ' + args[0], function () {
				it('should use the child connector style to calculate the control point', function () {
					expect(underTest.connectorTheme(childPosition, ['special'], args[1]).controlPoint).toEqual(themeAttibuteUtils.connectorControlPoint(themeDictionary, 'above', 'green'));
				});
				it('should return the default connector style when no connector style configured', function () {
					expect(underTest.connectorTheme(childPosition, ['sharp'], args[1])).toEqual({
						type: 'top-down-s-curve',
						controlPoint: defaultControlPoint,
						label: defaultLabel,
						line: {
							color: '#070707',
							width: 2.0
						}
					});
				});
				it('should return the hard coded default connector style when the node has no connector style configured and there is no default style configured',  function () {
					delete theme.connector.default;

					expect(underTest.connectorTheme(childPosition, ['sharp'], args[1])).toEqual({
						type: 'quadratic',
						controlPoint: defaultControlPoint,
						label: defaultLabel,
						line: {
							color: '#707070',
							width: 1.0
						}
					});
				});
				it('should return the configured connector style when the node has a connector style configured', function () {
					expect(underTest.connectorTheme(childPosition, ['special'], args[1])).toEqual({
						type: 'green-curve',
						controlPoint: defaultControlPoint,
						label: defaultLabel,
						line: {
							color: '#00FF00',
							width: 3.0
						}
					});
				});
			});
		});
		describe('when the node has a parent with a child style configured', function () {
			it('should use the combined connector style to calculate the control point', function () {
				expect(underTest.connectorTheme(childPosition, ['special'], ['special']).controlPoint).toEqual(themeAttibuteUtils.connectorControlPoint(themeDictionary, 'above', 'no-connector.green'));
			});
			it('should use the parent.childstyle connector style to calculate the control point', function () {
				expect(underTest.connectorTheme(childPosition, ['sharp'], ['special']).controlPoint).toEqual(themeAttibuteUtils.connectorControlPoint(themeDictionary, 'above', 'no-connector'));
			});

			it('should return a connector style that matches parentchildstyle.childstyle if it exists', function () {
				expect(underTest.connectorTheme(childPosition, ['special'], ['special'])).toEqual({
					type: 'no-connector-green',
					controlPoint: defaultControlPoint,
					label: defaultLabel,
					line: {
						color: '#FFFF00',
						width: 4.0
					}
				});
			});

			it('should return a connector style that matches parentchildstyle if parentchildstyle.childstyle does not exist', function () {
				expect(underTest.connectorTheme(childPosition, ['sharp'], ['special'])).toEqual({
					type: 'no-connector',
					controlPoint: defaultControlPoint,
					label: defaultLabel,
					line: {
						color: '#707070',
						width: 0
					}
				});
			});
		});
	});
	describe('getLayoutConnectorAttributes', () => {
		it('should return the parentConnectorAttribute with color', () => {
			expect(underTest.getLayoutConnectorAttributes(['default'])).toEqual({
				parentConnector: {
					color: '#070707'
				}
			});
		});
		it('should return the parentConnectorAttribute with color as inherited', () => {
			expect(underTest.getLayoutConnectorAttributes(['inherit-color'])).toEqual({
				parentConnector: {
					color: 'inherit'
				}
			});
		});
		it('should return the parentConnectorAttribute with defaulted color', () => {
			underTest = new Theme({});
			expect(underTest.getLayoutConnectorAttributes(['default'])).toEqual({
				parentConnector: {
					color: '#707070'
				}
			});
		});
	});
	describe('getPersistedAttributes', () => {
		describe('should determint automatically assigned colors', () => {
			it('should remove attributes that are not theme persisted if line color is not auto-color', () => {
				expect(underTest.getPersistedAttributes({foo: 'bar'}, 1, 0).attr).toEqual({});
			});

			it('should return attributes with parentConnector.color if line color is auto-color', () => {
				expect(underTest.getPersistedAttributes({}, 7, 0).attr).toEqual({
					parentConnector: {
						color: 'red',
						themeAutoColor: 'red'
					}
				});
			});
			it('should return attributes with previous autoColor parentConnector.color if line color is auto-color and autoColorAttribute exists', () => {
				expect(underTest.getPersistedAttributes({
					parentConnector: {
						color: 'blue',
						themeAutoColor: 'blue'
					}
				}, 7, 0).attr).toEqual({
					parentConnector: {
						color: 'blue',
						themeAutoColor: 'blue'
					}
				});
			});
			it('should remove attributes that are not theme persisted ', () => {
				expect(underTest.getPersistedAttributes({
					foo: 'bar',
					parentConnector: {
						color: 'blue',
						themeAutoColor: 'blue'
					}
				}, 7, 0).attr).toEqual({
					parentConnector: {
						color: 'blue',
						themeAutoColor: 'blue'
					}
				});
			});
			it('should remove attributes with parentConnector.color if line color is not auto-color and color was auto color', () => {
				expect(underTest.getPersistedAttributes({
					parentConnector: {
						color: 'red',
						themeAutoColor: 'red'
					}
				}, 2, 0)).toEqual({
					attr: {},
					removed: ['parentConnector']
				});
			});
			it('should not remove attributes with parentConnector.color if line color is not auto-color but color was different to auto color', () => {
				expect(underTest.getPersistedAttributes({
					parentConnector: {
						color: 'red',
						themeAutoColor: 'blue'
					}
				}, 2, 0).attr).toEqual({
					parentConnector: {
						color: 'red'
					}
				});
			});
			it('should not remove attributes with parentConnector.color if line color is not auto-color but color was not auto color', () => {
				expect(underTest.getPersistedAttributes({
					parentConnector: {
						color: 'red'
					}
				}, 2, 0).attr).toEqual({
					parentConnector: {
						color: 'red'
					}
				});
			});

			it('should return next color according to number of siblings', () => {
				expect(underTest.getPersistedAttributes({}, 7, 0).attr.parentConnector.color).toEqual('red');
				expect(underTest.getPersistedAttributes({}, 7, 1).attr.parentConnector.color).toEqual('green');
				expect(underTest.getPersistedAttributes({}, 7, 2).attr.parentConnector.color).toEqual('blue');
				expect(underTest.getPersistedAttributes({}, 7, 3).attr.parentConnector.color).toEqual('red');
			});

			it('should not override existing attributes', () => {
				expect(underTest.getPersistedAttributes({parentConnector: {color: 'pink'}}, 7, 0).attr.parentConnector.color).toEqual('pink');
			});

			it('should use default color is autoColors not defined', () => {
				delete theme.autoColors;
				underTest = new Theme(theme);
				expect(underTest.getPersistedAttributes({}, 7, 0).attr.parentConnector.color).toEqual('#707070');
				expect(underTest.getPersistedAttributes({}, 7, 1).attr.parentConnector.color).toEqual('#707070');
			});
		});
	});
	describe('self.cleanPersistedAttributes', () => {
		let attr;
		beforeEach(() => {
			attr = {
				parentConnector: {
					color: 'red',
					themeAutoColor: 'red'
				}
			};
		});
		it('should mutate and remove autoColor attribute', () => {
			underTest.cleanPersistedAttributes(attr);
			expect(attr).toEqual({});
		});
		it('should return mutatedattribute', () => {
			expect(underTest.cleanPersistedAttributes(attr)).toEqual({});
		});
		it('should not touch color if different from themeAutoColor autoColor attribute', () => {
			attr.parentConnector.color = 'blue';
			underTest.cleanPersistedAttributes(attr);
			expect(attr).toEqual({
				parentConnector: {
					color: 'blue'
				}
			});
		});
		it('should not touch properties of parentConnector other than color', () => {
			attr.parentConnector.foo = 'bar';
			underTest.cleanPersistedAttributes(attr);
			expect(attr).toEqual({
				parentConnector: {
					foo: 'bar'
				}
			});
		});
		it('should not touch other attribute properties', () => {
			attr.foo = 'bar';
			underTest.cleanPersistedAttributes(attr);
			expect(attr).toEqual({
				foo: 'bar'
			});
		});
	});
});
