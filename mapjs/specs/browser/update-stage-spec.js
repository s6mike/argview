/*global describe, it, beforeEach, afterEach, expect, require */
const jQuery = require('jquery'),
	createSVG = require('../../src/browser/create-svg');

require('../../src/browser/update-stage');

describe('updateStage', function () {
	'use strict';
	let stage, second;
	beforeEach(function () {
		stage = jQuery('<div>').appendTo('body');
		second = jQuery('<div>').appendTo('body');
	});
	afterEach(function () {
		stage.remove();
		second.remove();
	});
	it('applies width and height by adding subtracting offset from data width', function () {
		stage.data({width: 200, height: 100, offsetX: 50, offsetY: 10}).updateStage();
		expect(stage.css('width')).toBe('150px');
		expect(stage.css('min-width')).toBe('150px');
		expect(stage.css('height')).toBe('90px');
		expect(stage.css('min-height')).toBe('90px');
	});
	it('translates by offsetX, offsetY if scale is 1', function () {
		/* different browsers report transformations differently so we transform an element and compare css */
		stage.data({width: 200, height: 100, offsetX: 50, offsetY: 10, scale: 1}).updateStage();
		second.css({'width': '100px', 'height': '200px', 'transform': 'translate(50px,10px)'});
		expect(stage.css('transform')).toEqual(second.css('transform'));
		second.remove();
	});
	it('scales then transforms', function () {
		stage.data({width: 200, height: 100, offsetX: 50, offsetY: 10, scale: 2}).updateStage();
		second.css({'transform-origin': 'top left', 'width': '100px', 'height': '200px', 'transform': 'scale(2) translate(50px,10px)'});
		expect(stage.css('transform')).toEqual(second.css('transform'));
		expect(stage.css('transform-origin')).toEqual(second.css('transform-origin'));
	});
	it('rounds coordinates for performance', function () {
		stage.data({width: 137.33, height: 100.34, offsetX: 50.21, offsetY: 10.93, scale: 1}).updateStage();
		second.css({'width': '137px', 'height': '100px', 'transform': 'translate(50px,11px)'});
		expect(stage.css('transform')).toEqual(second.css('transform'));
		expect(stage.css('width')).toEqual('87px');
		expect(stage.css('min-width')).toEqual('87px');
		expect(stage.css('height')).toEqual('89px');
		expect(stage.css('min-height')).toEqual('89px');

	});
	it('updates the svg container if present', function () {
		const svgContainer = createSVG()
		.css({
			position: 'absolute',
			top: 0,
			left: 0
		})
		.attr({
			'data-mapjs-role': 'svg-container',
			'class': 'mapjs-draw-container',
			'width': '100%',
			'height': '100%'
		})
		.appendTo(stage);

		stage.data({width: 137.33, height: 100.34, offsetX: 50.21, offsetY: 10.93, scale: 1}).updateStage();
		expect(svgContainer[0].getAttribute('viewBox')).toEqual('-50 -11 137 100');
		expect(svgContainer[0].style.top).toEqual('-11px');
		expect(svgContainer[0].style.left).toEqual('-50px');
		expect(svgContainer[0].style.width).toEqual('137px');
		expect(svgContainer[0].style.height).toEqual('100px');
	});
});

