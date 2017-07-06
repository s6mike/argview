/*global describe, it, beforeEach, afterEach, expect, require, spyOn */
const jQuery = require('jquery'),
	createSVG = require('../src/create-svg'),
	DOMRender = require('../src/dom-render'),
	Theme = require('mindmup-mapjs-layout').Theme,
	Connectors = require('mindmup-mapjs-layout').Connectors;

require('./helpers/jquery-extension-matchers');
require('../src/dom-map-view');

describe('updateConnector', function () {
	'use strict';
	let underTest, fromNode, toNode, third, anotherConnector;
	beforeEach(function () {
		fromNode = jQuery('<div>').attr('id', 'node_fr').data('styles', ['funky']).css({ position: 'absolute', top: '100px', left: '200px', width: '100px', height: '40px'}).appendTo('body');
		toNode = jQuery('<div>').attr('id', 'node_to').data('styles', ['bleak']).css({ position: 'absolute', top: '220px', left: '330px', width: '12px', height: '44px'}).appendTo('body');
		underTest = createSVG().appendTo('body').attr('data-role', 'test-connector').data({'nodeFrom': fromNode, 'nodeTo': toNode});
		third = jQuery('<div>').attr('id', 'node_third').css({ position: 'absolute', top: '330px', left: '220px', width: '119px', height: '55px'}).appendTo('body');
		anotherConnector = createSVG().appendTo('body').attr('data-role', 'test-connector').css('position', 'absolute').data({'nodeFrom': fromNode, 'nodeTo': third});
	});
	afterEach(function () {
		DOMRender.theme = undefined;
	});
	it('calls themePath with styles', function () {
		spyOn(Connectors, 'themePath').and.callThrough();
		underTest.updateConnector();
		expect(Connectors.themePath.calls.mostRecent().args[0].styles).toEqual(['funky']);
		expect(Connectors.themePath.calls.mostRecent().args[1].styles).toEqual(['bleak']);
	});
	describe('should set the path attributes', function () {
		let path;
		beforeEach(function () {
			spyOn(Connectors, 'themePath').and.returnValue({'d': 'Z', color: 'black', width: 3.0, position: {top: 0}});
			underTest.updateConnector();
			path = underTest.find('path');
		});
		it('sets the stroke of the path from the connector color', function () {
			expect(underTest[0].style.stroke).toEqual('black');
			expect(path.attr('stroke')).toBeFalsy();
			expect(path[0].style.stroke).toBeFalsy();
			expect(underTest.attr('stroke')).toBeFalsy();
		});
		it('overrides the theme color with connector attribute color', function () {
			underTest.data('attr', {color: 'green'});
			underTest.updateConnector();
			expect(underTest[0].style.stroke).toEqual('green');
			expect(path.attr('stroke')).toBeFalsy();
			expect(path[0].style.stroke).toBeFalsy();
			expect(underTest.attr('stroke')).toBeFalsy();
		});
		it('sets the stroke-width from the connector width', function () {
			expect(path.attr('stroke-width')).toEqual('3');
		});
		it('sets the stroke-dasharray to empty by default', function () {
			expect(path.attr('stroke-dasharray')).toEqual('');
		});
		it('overrides the theme lineStyle with the connector attributes', function () {
			underTest.data('attr', {lineStyle: 'dashed'});
			underTest.updateConnector();
			expect(path.attr('stroke-dasharray')).toEqual('8, 8');
		});
		it('sets the path fill to transparent', function () {
			expect(path.attr('fill')).toEqual('transparent');
		});
		describe('when the theme has blockParentConnectorOverride flag', function () {
			beforeEach(function () {
				DOMRender.theme = new Theme({name: 'blocked', blockParentConnectorOverride: true});
			});
			it('still adds a connector path', function () {
				underTest.updateConnector();
				expect(underTest.find('path.mapjs-connector').length).toBe(1);
			});
			it('does not add a link-hit element', function () {
				underTest.updateConnector();
				expect(underTest.find('path.mapjs-link-hit').length).toBe(0);
			});
			it('removes a pre-existing link-hit element', function () {
				createSVG('path').addClass('mapjs-link-hit').appendTo(underTest);
				underTest.updateConnector();
				expect(underTest.find('path.mapjs-link-hit').length).toBe(0);
			});
		});
	});
	it('returns itself for chaining', function () {
		expect(underTest.updateConnector()[0]).toEqual(underTest[0]);
	});
	it('draws a cubic curve between the centers of two nodes', function () {
		underTest.updateConnector();
		const path = underTest.find('path.mapjs-connector');
		expect(path.length).toBe(1);
		expect(path.attr('class')).toEqual('mapjs-connector');
		expect(path.attr('d')).toEqual('M50,20Q50,190 140,142');
	});
	it('draws a link-hit area with the same curve as the connector ', function () {
		underTest.updateConnector();
		const path = underTest.find('path.mapjs-link-hit');
		expect(path.length).toBe(1);
		expect(path.attr('d')).toEqual('M50,20Q50,190 140,142');
	});

	it('positions the connector to the upper left edge of the nodes, and expands it to the bottom right edge of the nodes', function () {
		underTest.updateConnector();
		expect(underTest[0].style.top).toBeFalsy();
		expect(underTest[0].style.left).toBeFalsy();
		expect(underTest[0].style.width).toEqual('142px');
		expect(underTest[0].style.height).toEqual('166px');
		expect(underTest[0].style.transform).toEqual('translate(200px, 100px)');
	});
	it('positions the connector using innerRect to the upper left edge of the nodes, and expands it to the bottom right edge of the nodes', function () {
		fromNode.data({innerRect: {dx: 10, dy: 5, width: 90, height: 35}});
		underTest.updateConnector();
		expect(underTest[0].style.top).toBeFalsy();
		expect(underTest[0].style.left).toBeFalsy();
		expect(underTest[0].style.width).toEqual('132px');
		expect(underTest[0].style.height).toEqual('161px');
		expect(underTest[0].style.transform).toEqual('translate(210px, 105px)');


	});
	it('updates the existing curve if one is present', function () {
		const path = createSVG('path').addClass('mapjs-connector').appendTo(underTest);
		underTest.updateConnector();
		expect(underTest.find('path.mapjs-connector').length).toBe(1);
		expect(underTest.find('path.mapjs-connector')[0]).toEqual(path[0]);
	});
	it('updates the existing hit-area if one is present', function () {
		const path = createSVG('path').addClass('mapjs-link-hit').appendTo(underTest);
		underTest.updateConnector();
		expect(underTest.find('path.mapjs-link-hit').length).toBe(1);
		expect(underTest.find('path.mapjs-link-hit')[0]).toEqual(path[0]);
	});

	it('updates multiple connectors at once', function () {
		jQuery('[data-role=test-connector]').updateConnector();
		expect(underTest.find('path').attr('d')).toEqual('M50,20Q50,190 140,142');
		expect(anotherConnector.find('path').attr('d')).toEqual('M50,20Q50,306 30,258');
	});
	describe('performance optimisations', function () {
		it('rounds coordinates', function () {
			anotherConnector.updateConnector();
			expect(anotherConnector.find('path').attr('d')).toEqual('M50,20Q50,306 30,258');
		});
		it('will not update if the shapes have not moved', function () {
			underTest.updateConnector();
			underTest.find('path').attr('d', '');

			underTest.updateConnector();
			expect(underTest.find('path').attr('d')).toBe('');
		});
		it('will update if the shapes did not move, but the theme changed', function () {
			underTest.updateConnector();
			underTest.find('path').attr('d', '');
			DOMRender.theme = new Theme({name: 'new'});

			underTest.updateConnector();
			expect(underTest.find('path').attr('d')).toBe('M50,20Q50,190 140,142');
		});
		it('will update if the shapes did not move, but the connector attributes changed', function () {
			underTest.data('attr', {color: 'red'});
			underTest.updateConnector();
			underTest.data('attr', {color: 'blue'});
			underTest[0].style.stroke = '';

			underTest.updateConnector();
			expect(underTest[0].style.stroke).toBe('blue');
		});

		it('will update if the shapes move', function () {
			underTest.updateConnector();
			underTest.find('path').attr('d', '');
			fromNode.css('top', '50px');

			underTest.updateConnector();
			expect(underTest.find('path').attr('d')).toBe('M50,20Q50,240 140,192');
		});

	});
	it('does not die if one of the shapes is no longer present', function () {
		fromNode.remove();
		expect(function () {
			underTest.updateConnector();
		}).not.toThrowError();
	});
	it('does not die if nodeFrom gets cleared out', function () {
		underTest.data('nodeFrom', false);
		underTest.updateLink();
		expect(underTest.is(':visible')).toBeFalsy();
	});
	it('does not die if nodeTo gets cleared out', function () {
		underTest.data('nodeTo', false);
		underTest.updateLink();
		expect(underTest.is(':visible')).toBeFalsy();
	});
	afterEach(function () {
		fromNode.remove();
		toNode.remove();
		underTest.remove();
		third.remove();
		anotherConnector.remove();
	});
});
