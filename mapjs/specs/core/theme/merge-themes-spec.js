/*global require, describe, it, expect*/

const underTest = require('../../../src/core/theme/merge-themes'),
	defaultTheme = require('../../../src/core/theme/default-theme');

describe('mergeThemes', () => {
	'use strict';
	describe('should throw invalid-args', () => {
		it('when theme is falsy', () => {
			expect(() => underTest(undefined, {})).toThrowError('invalid-args');
		});
		it('when theme is not an object', () => {
			expect(() => underTest(true, {})).toThrowError('invalid-args');
		});
		it('when themeOverride is falsy', () => {
			expect(() => underTest(defaultTheme)).toThrowError('invalid-args');
		});
		it('when themeOverride is not an object', () => {
			expect(() => underTest(defaultTheme, 'not an object')).toThrowError('invalid-args');
		});
	});
	it('should return if there are no overrides', () => {
		expect(underTest(defaultTheme, {})).toEqual(defaultTheme);
	});
	it('should return unmerged if the theme has blockThemeOverrides flag', () => {
		const theme = JSON.parse(JSON.stringify(defaultTheme)),
			override = {
				connector: {
					default: {
						label: {
							backgroundColor: 'red'
						}
					}
				}
			};

		theme.blockThemeOverrides = true;
		expect(underTest(theme, override)).toEqual(theme);
	});
	it('should allow overriding of connectors', () => {
		const expected = JSON.parse(JSON.stringify(defaultTheme)),
			override = {
				connector: {
					default: {
						label: {
							backgroundColor: 'red'
						}
					}
				}
			};
		expected.connector.default.label.backgroundColor = 'red';
		expect(underTest(defaultTheme, override)).toEqual(expected);
	});
	it('should allow overriding of links', () => {
		const expected = JSON.parse(JSON.stringify(defaultTheme)),
			override = {
				link: {
					default: {
						label: {
							position: {
								ratio: 0.75
							}
						}
					}
				}
			};
		expected.link.default.label.position.ratio = 0.75;
		expect(underTest(defaultTheme, override)).toEqual(expected);
	});
	it('should allow overriding of non existing node styles', () => {
		const toMerge = JSON.parse(JSON.stringify(defaultTheme)),
			override = {
				node: [
					{
						name: 'level_1',
						text: {
							margin: 10.0
						}
					},
					{
						name: 'activated',
						border: {
							line: {
								color: 'red'
							}
						}
					}
				]
			};

		delete toMerge.node;
		expect(underTest(toMerge, override)).toEqual(Object.assign(toMerge, {node: override.node}));
	});
	it('should allow overriding of existing node styles with an empty object', () => {
		const expected = JSON.parse(JSON.stringify(defaultTheme)),
			override = {};
		expect(underTest(defaultTheme, override)).toEqual(expected);
	});

	it('should allow overriding of existing node styles', () => {
		const expected = JSON.parse(JSON.stringify(defaultTheme)),
			override = {
				node: [
					{
						name: 'level_1',
						text: {
							margin: 10.0
						}
					},
					{
						name: 'activated',
						border: {
							line: {
								color: 'red'
							}
						}
					}
				]
			};
		expected.node.find(n => n.name === 'level_1').text = {margin: 10.0};
		expected.node.find(n => n.name === 'activated').border.line.color = 'red';
		expect(underTest(defaultTheme, override)).toEqual(expected);
	});
	it('should allow adding of new node styles', () => {
		const expected = JSON.parse(JSON.stringify(defaultTheme)),
			override = {
				node: [
					{
						name: 'level_2',
						backgroundColor: 'red'
					},
					{
						name: 'level_3',
						backgroundColor: 'blue'
					}
				]
			};
		expected.node.push({
			name: 'level_2',
			backgroundColor: 'red'
		});
		expected.node.push({
			name: 'level_3',
			backgroundColor: 'blue'
		});

		expect(underTest(defaultTheme, override)).toEqual(expected);
	});
});
