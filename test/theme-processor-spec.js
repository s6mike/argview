/*global MAPJS, describe, it, expect, beforeEach*/
describe('ThemeProcessor', function () {
	'use strict';
	var underTest = new MAPJS.ThemeProcessor();
	it('converts a trivial single-item theme file to css', function () {
		var result = underTest.process({
				node: [
					{
						name: 'default',
						cornerRadius: 12
					}
				]
			});
		expect(result.css).toEqual('.mapjs-node{' +
			'border-radius:12px;' +
		'}');
	});
	it('converts a trivial multi-property item theme file to css', function () {
		var result = underTest.process({
				node: [
					{
						name: 'default',
						cornerRadius: 12,
						backgroundColor: '#E0E0E0'
					}
				]
			});
		expect(result.css).toEqual('.mapjs-node{' +
			'border-radius:12px;' +
			'background-color:#E0E0E0;' +
		'}');
	});
	it('converts a multi-style theme to css', function () {
		var result = underTest.process({
				node: [
					{
						name: 'default',
						cornerRadius: 12,
						backgroundColor: '#E0E0E0'
					},
					{
						name: 'level_1',
						backgroundColor: '#22AAE0'
					}
				]
			});
		expect(result.css).toEqual(
			'.mapjs-node{' +
				'border-radius:12px;' +
				'background-color:#E0E0E0;' +
			'}' +
			'.mapjs-node.level_1{' +
				'background-color:#22AAE0;' +
			'}'
		);
	});
	it('replaces spaces with underscores in theme names', function () {
		var result = underTest.process({
				node: [
					{
						name: 'def au lt',
						cornerRadius: 12,
						backgroundColor: '#E0E0E0'
					},
					{
						name: 'level 1',
						backgroundColor: '#22AAE0'
					}
				]
			});
		expect(result.css).toEqual(
			'.mapjs-node.def_au_lt{' +
				'border-radius:12px;' +
				'background-color:#E0E0E0;' +
			'}' +
			'.mapjs-node.level_1{' +
				'background-color:#22AAE0;' +
			'}'
		);
	});
	describe('complex props', function () {
		var theme, result;
		describe('border', function () {
			beforeEach(function () {
				theme = {
					node: [{
						name: 'default',
						border: {
							type: 'surround',
							line: {
								color: '#707070',
								width: 1
							}
						}
					}]
				};
			});

			it('reads it into the border css when border type is surround', function () {
				var result = underTest.process(theme);
				expect(result.css).toEqual('.mapjs-node{border:1px solid #707070;}');

			});
			it('interprets line style dashed', function () {
				theme.node[0].border.line.style = 'dashed';
				expect(underTest.process(theme).css).toEqual('.mapjs-node{border:1px dashed #707070;}');
			});
			it('ignores it in css if the border is underline -- will be handled with a connector', function () {
				theme.node[0].border.type = 'underline';
				result = underTest.process(theme);
				expect(result.css).toEqual('.mapjs-node{}');
			});
		});

	});

});
