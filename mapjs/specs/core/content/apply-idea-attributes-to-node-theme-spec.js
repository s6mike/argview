/*global require, describe, it, expect, beforeEach*/

const underTest = require('../../../src/core/content/apply-idea-attributes-to-node-theme');

describe('applyIdeaAttributesToNodeTheme', () => {
	'use strict';
	let nodeTheme, idea;
	beforeEach(() => {
		nodeTheme = {
			font: {
				size: 10,
				sizePx: 12,
				lineSpacing: 3,
				lineSpacingPx: 5
			},
			backgroundColor: 'grey',
			borderType: 'surround',
			text: {
				alignment: 'center',
				color: 'silver',
				lightColor: 'white',
				darkColor: 'black'
			}
		};
		idea = {
			attr: {
				style: {
					fontMultiplier: 1.5,
					textAlign: 'left'
				}
			}
		};
	});
	it('should set the text alignment', () => {
		expect(underTest(idea, nodeTheme).text.alignment).toEqual('left');
	});
	it('should multiply the font size', () => {
		expect(underTest(idea, nodeTheme).font.size).toEqual(15);
	});
	it('should multiply the font size when multiple is less than 1', () => {
		idea.attr.style.fontMultiplier = 0.25;
		expect(underTest(idea, nodeTheme).font.size).toEqual(2.5);
	});
	it('should multiply the line lineSpacing', () => {
		expect(underTest(idea, nodeTheme).font.lineSpacing).toEqual(4.5);
	});
	it('should multiply the font size px ', () => {
		expect(underTest(idea, nodeTheme).font.sizePx).toEqual(18);
	});
	it('should multiply the lineSpacing px ', () => {
		expect(underTest(idea, nodeTheme).font.lineSpacingPx).toEqual(7.5);
	});
	it('should set the hasFontMultiplier flag', () => {
		expect(underTest(idea, nodeTheme).hasFontMultiplier).toBeTruthy();
	});
	it('does not change the theme colors when no color is set by user', () => {
		expect(underTest(idea, nodeTheme).backgroundColor).toEqual('grey');
		expect(underTest(idea, nodeTheme).text.color).toEqual('silver');
	});
	['false', 'transparent'].forEach(color => {
		it(`does not change the theme colors when the color is set by user as "${color}"`, () => {
			idea.attr.style.background = color;
			expect(underTest(idea, nodeTheme).backgroundColor).toEqual('grey');
			expect(underTest(idea, nodeTheme).text.color).toEqual('silver');
		});
	});
	describe('when user has applied color to the node', () => {
		beforeEach(() => {
			idea.attr.style.background = 'red';
		});
		it('should use the users defined color as the background color', () => {
			expect(underTest(idea, nodeTheme).backgroundColor).toEqual('red');
			expect(underTest(idea, nodeTheme).text.color).toEqual('white');
		});
		it('should use the darkColor the text color when the users defined color is light', () => {
			idea.attr.style.background = '#FFFFFF';
			expect(underTest(idea, nodeTheme).backgroundColor).toEqual('#FFFFFF');
			expect(underTest(idea, nodeTheme).text.color).toEqual('black');
		});

		it('should use the users defined color as thetext color when the border is not surround', () => {
			nodeTheme.borderType = 'underline';
			expect(underTest(idea, nodeTheme).backgroundColor).toEqual('grey');
			expect(underTest(idea, nodeTheme).text.color).toEqual('red');
		});
	});
	['size', 'sizePx', 'lineSpacing', 'lineSpacingPx'].forEach((key) => {
		it('should not add ' + key + ' when falsy in nodeTheme font', () => {
			delete nodeTheme.font[key];
			const result = underTest(idea, nodeTheme);

			expect(result.font.hasOwnProperty	(key)).toBeFalsy();
		});
	});
	[1, 1.0, '1', 0, undefined, false, 0.01].forEach((multi) => {
		it('should not set the hasFontMultiplier flag when multiplier is ' + multi, () => {
			idea.attr.style.fontMultiplier = multi;
			const result = underTest(idea, nodeTheme);
			expect(result.hasFontMultiplier).toBeFalsy();
			expect(result.font).toEqual({
				size: 10,
				sizePx: 12,
				lineSpacing: 3,
				lineSpacingPx: 5
			});
		});
	});
	it('should not nultiply twice', () => {
		expect(underTest(idea, underTest(idea, nodeTheme)).font).toEqual({
			size: 15,
			lineSpacing: 4.5,
			sizePx: 18,
			lineSpacingPx: 7.5
		});
	});
});
