/*global describe, it, beforeEach, afterEach, expect, require */

const jQuery = require('jquery'),
	createSVG = require('../src/create-svg'),
	colorToRGB = require('mindmup-mapjs-layout').colorToRGB;

require('../src/update-link');

describe('updateLink', function () {
	'use strict';
	let path, underTest, fromNode, toNode, third, anotherLink;
	beforeEach(function () {
		fromNode = jQuery('<div>').attr('id', 'node_fr').css({ position: 'absolute', top: '100px', left: '200px', width: '100px', height: '40px'}).appendTo('body');
		toNode = jQuery('<div>').attr('id', 'node_to').css({ position: 'absolute', top: '220px', left: '330px', width: '12px', height: '44px'}).appendTo('body');
		underTest = createSVG().appendTo('body').attr('data-role', 'test-link').css('position', 'absolute').data({'nodeFrom': fromNode, 'nodeTo': toNode});
		third = jQuery('<div>').attr('id', 'node_third').css({ position: 'absolute', top: '330px', left: '220px', width: '119px', height: '55px'}).appendTo('body');
		anotherLink = createSVG().appendTo('body').attr('data-role', 'test-link').css('position', 'absolute').data({'nodeFrom': fromNode, 'nodeTo': third});
	});
	it('returns itself for chaining', function () {
		expect(underTest.updateLink()[0]).toEqual(underTest[0]);
	});
	it('draws a straight between the borders of two nodes', function () {
		underTest.updateLink();
		path = underTest.find('path');
		expect(path.length).toBe(2);
		expect(path.filter('.mapjs-link').attr('d')).toEqual('M100,20L136,120');
		expect(path.filter('.mapjs-link-hit').attr('d')).toEqual('M100,20L136,120');
	});
	it('positions the link to the upper left edge of the nodes, and expands it to the bottom right edge of the nodes', function () {
		underTest.updateLink();

		expect(underTest[0].style.top).toBeFalsy();
		expect(underTest[0].style.left).toBeFalsy();
		expect(underTest[0].style.width).toEqual('142px');
		expect(underTest[0].style.height).toEqual('164px');
		expect(underTest[0].style.transform).toEqual('translate(200px, 100px)');


	});
	it('uses the lineStyle data attribute to control the dashed styling', function () {
		underTest.data('lineStyle', 'dashed').updateLink();
		expect(underTest.find('path.mapjs-link').attr('stroke-dasharray')).toBe('8, 8');
	});
	it('clears the dashes if not provided in the lineStyle data attribute', function () {
		underTest.find('path').attr('stroke-dasharray', '1, 1');
		underTest.data('lineStyle', '').updateLink();
		expect(underTest.find('path.mapjs-link').attr('stroke-dasharray')).toBeFalsy();
	});
	it('uses the color attribute to set the line stroke', function () {
		underTest.data('color', 'blue').updateLink();
		// chrome and phantom return different forms for the same color, so explicit hex needed to make test repeatable
		expect(colorToRGB(underTest.css('stroke'))).toEqual(colorToRGB('#0000FF'));
	});

	it('updates the existing line if one is present', function () {
		path = createSVG('path').attr('class', 'mapjs-link').appendTo(underTest);
		underTest.updateLink();
		expect(underTest.find('path.mapjs-link').length).toBe(1);
		expect(underTest.find('path.mapjs-link')[0]).toEqual(path[0]);
	});
	it('uses the arrow data attribute to draw an arrow', function () {
		underTest.data('arrow', 'true').updateLink();
		expect(underTest.find('path.mapjs-arrow').css('display')).toBe('inline');
	});
	it('updates an existing arrow if one is present', function () {
		path = createSVG('path').attr('class', 'mapjs-arrow').appendTo(underTest);
		underTest.data('arrow', 'true').updateLink();
		expect(underTest.find('path.mapjs-arrow').length).toBe(1);
		expect(underTest.find('path.mapjs-arrow')[0]).toEqual(path[0]);
	});
	it('uses the color attribute to set the arrow fill', function () {
		/*jslint newcap:true*/
		underTest.data('arrow', 'true').data('color', '#FF7577').updateLink();
		// chrome and phantom return different forms for the same color, so explicit hex needed to make test repeatable
		expect(colorToRGB(underTest.find('path.mapjs-arrow').css('fill'))).toEqual(colorToRGB('#FF7577'));
	});
	it('hides an existing arrow when the attribute is no longer present', function () {
		createSVG('path').attr('class', 'mapjs-arrow').appendTo(underTest);
		underTest.updateLink();
		expect(underTest.find('path.mapjs-arrow').css('display')).toBe('none');
	});

	it('updates multiple links at once', function () {
		jQuery('[data-role=test-link]').updateLink();
		expect(underTest.find('path').attr('d')).toEqual('M100,20L136,120');
		expect(anotherLink.find('path').attr('d')).toEqual('M50,40L80,230');
	});
	it('does not die if one of the shapes is no longer present', function () {
		fromNode.remove();
		expect(function () {
			underTest.updateLink();
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
	describe('performance optimisations', function () {
		it('rounds coordinates', function () {
			anotherLink.data('arrow', 'true').updateLink();
			expect(anotherLink.find('path.mapjs-link').attr('d')).toEqual('M50,40L80,230');
			expect(anotherLink.find('path.mapjs-arrow').attr('d')).toEqual('M83,216L80,230L73,218Z');
		});
		it('will not update if the shapes have not moved and attributes have not changed', function () {
			underTest.updateLink();
			underTest.find('path').attr('d', '');

			underTest.updateLink();
			expect(underTest.find('path').attr('d')).toBe('');
		});
		it('will update if the shapes move', function () {
			underTest.updateLink();
			underTest.find('path').attr('d', '');
			fromNode.css('top', '50px');

			underTest.updateLink();
			expect(underTest.find('path').attr('d')).toBe('M100,20L136,170');
		});
		it('will update if the attributes change', function () {
			underTest.updateLink();
			underTest.find('path').attr('d', '');
			underTest.data('lineStyle', 'solid').updateLink();
			expect(underTest.find('path').attr('d')).toBe('M100,20L136,120');

		});
	});
	afterEach(function () {
		fromNode.remove();
		toNode.remove();
		underTest.remove();
		third.remove();
		anotherLink.remove();
	});
});
