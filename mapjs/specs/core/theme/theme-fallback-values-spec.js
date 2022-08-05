/*global require, describe it, expect*/
const underTest = require('../../../src/core/theme/theme-fallback-values');

describe('theme-fallback-values', () => {
	'use strict';
	it('should include a node theme', () => {
		expect(underTest.nodeTheme).toEqual({
			margin: 5,
			font: {
				lineSpacing: 2.5,
				size: 9,
				weight: 'bold'
			},
			maxWidth: 146,
			backgroundColor: '#E0E0E0',
			borderType: 'surround',
			cornerRadius: 10,
			lineColor: '#707070',
			lineWidth: 1,
			lineStyle: 'solid',
			text: {
				color: '#4F4F4F',
				lightColor: '#EEEEEE',
				darkColor: '#000000'
			}
		});
	});
	it('should include a connector control point', () => {
		expect(underTest.connectorControlPoint).toEqual({
			horizontal: 1,
			default: 1.75
		});
	});
	it('should include a connector theme', () => {
		expect(underTest.connectorTheme).toEqual({
			type: 'quadratic',
			label: {
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
			},
			line: {
				color: '#707070',
				width: 1
			}
		});
	});
});
