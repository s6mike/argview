/*global describe, it, require, beforeEach, jasmine, expect */
const buildConnection = require('../../src/browser/build-connection'),
	jQuery = require('jquery');

describe('buildConnection', () => {
	'use strict';
	let element, connectorBuilder, shapeFrom, shapeTo;
	beforeEach(() => {
		shapeFrom = jQuery('<div>');
		shapeFrom.data({
			x: 11,
			y: 12,
			width: 20,
			height: 30,
			styles: ['green']
		});
		shapeTo = jQuery('<div>');
		shapeTo.data({
			x: 111,
			y: 112,
			width: 120,
			height: 130,
			styles: ['yellow']
		});
		element = jQuery('<div>');
		element.data({
			nodeFrom: shapeFrom,
			nodeTo: shapeTo
		});
		connectorBuilder = jasmine.createSpy('connectorBuilder').and.callFake((from, to, theme) => ({from: from, to: to, theme: theme}));
	});
	it('creates the connection using the builder by passing from and to boxes and the theme', () => {
		expect(buildConnection(element, {theme: 'ugly', connectorBuilder: connectorBuilder})).toEqual({
			from: { top: 12, left: 11, width: 20, height: 30, styles: ['green']},
			to: { top: 112, left: 111, width: 120, height: 130, styles: ['yellow']},
			theme: 'ugly'
		});
	});
	it('applies the inner rect for origin node if set', () => {
		shapeFrom.data('innerRect', {
			dx: 10,
			dy: 20,
			width: 14,
			height: 15
		});
		expect(buildConnection(element, {theme: 'ugly', connectorBuilder: connectorBuilder})).toEqual({
			from: { top: 32, left: 21, width: 14, height: 15, styles: ['green']},
			to: { top: 112, left: 111, width: 120, height: 130, styles: ['yellow']},
			theme: 'ugly'
		});
	});
	it('applies the inner rect for destination node if set', () => {
		shapeTo.data('innerRect', {
			dx: 10,
			dy: 20,
			width: 14,
			height: 15
		});
		expect(buildConnection(element, {theme: 'ugly', connectorBuilder: connectorBuilder})).toEqual({
			from: { top: 12, left: 11, width: 20, height: 30, styles: ['green']},
			to: { top: 132, left: 121, width: 14, height: 15, styles: ['yellow']},
			theme: 'ugly'
		});
	});
	it('adds connector attributes', () => {
		element.data('attr', {
			theme: 'pretty',
			variant: 'super'
		});
		expect(buildConnection(element, {theme: 'ugly', connectorBuilder: connectorBuilder})).toEqual({
			from: { top: 12, left: 11, width: 20, height: 30, styles: ['green']},
			to: { top: 112, left: 111, width: 120, height: 130, styles: ['yellow']},
			theme: 'pretty',
			variant: 'super'
		});

	});
});
