/*global describe, it, beforeEach, afterEach, expect, require, jasmine */
const jQuery = require('jquery'),
	createSVG = require('../../src/browser/create-svg'),
	Theme = require('../../src/core/theme/theme');

require('../helpers/jquery-extension-matchers');
require('../../src/browser/update-connector');

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
	it('calls connectorBuilder with styles', function () {
		const builder = jasmine.createSpy().and.returnValue({'d': 'Z', color: 'black', width: 3.0, position: {top: 0}});
		underTest.updateConnector({ connectorBuilder: builder});
		expect(builder.calls.mostRecent().args[0].styles).toEqual(['funky']);
		expect(builder.calls.mostRecent().args[1].styles).toEqual(['bleak']);
	});
	describe('should set the path attributes', function () {
		let path, builder;
		beforeEach(function () {
			builder = jasmine.createSpy();
			builder.and.returnValue({'d': 'Z', color: 'black', width: 3.0, position: {top: 0}});
			underTest.updateConnector({connectorBuilder: builder});
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
			underTest.updateConnector({connectorBuilder: builder});
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
			underTest.updateConnector({connectorBuilder: builder});
			expect(path.attr('stroke-dasharray')).toEqual('8, 8');
		});
		it('sets the path fill to transparent', function () {
			expect(path.attr('fill')).toEqual('transparent');
		});
		describe('when the theme has connectorEditingContext flag', function () {
			let theme;
			describe('when has allowed', () => {
				beforeEach(function () {
					theme = new Theme({name: 'blocked', connectorEditingContext: {allowed: ['width']}});
				});
				it('still adds a connector path', function () {
					underTest.updateConnector({theme: theme, connectorBuilder: builder});
					expect(underTest.find('path.mapjs-connector').length).toBe(1);
				});
				it('adds a link-hit element', function () {
					underTest.updateConnector({theme: theme, connectorBuilder: builder});
					expect(underTest.find('path.mapjs-link-hit').length).toBe(1);
				});
			});
			describe('when not allowed', () => {
				beforeEach(function () {
					theme = new Theme({name: 'blocked', connectorEditingContext: {allowed: []}});
				});
				it('still adds a connector path', function () {
					underTest.updateConnector({theme: theme, connectorBuilder: builder});
					expect(underTest.find('path.mapjs-connector').length).toBe(1);
				});
				it('does not add a link-hit element', function () {
					underTest.updateConnector({theme: theme, connectorBuilder: builder});
					expect(underTest.find('path.mapjs-link-hit').length).toBe(0);
				});
				it('removes a pre-existing link-hit element', function () {
					createSVG('path').addClass('mapjs-link-hit').appendTo(underTest);
					underTest.updateConnector({theme: theme, connectorBuilder: builder});
					expect(underTest.find('path.mapjs-link-hit').length).toBe(0);
				});
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
		expect(path.attr('stroke-width')).toEqual('13');
	});
	it('adds a noTransition class to the link hit', () => {
		underTest.updateConnector();
		const path = underTest.find('path.mapjs-link-hit');
		expect(path.hasClass('noTransition')).toBeTruthy();
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
			underTest.updateConnector({theme: new Theme({name: 'old'})});
			underTest.find('path').attr('d', '');
			underTest.updateConnector({theme: new Theme({name: 'new'})});
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
	describe('painting labels', function () {
		let themePath,
			builder,
			customTheme;
		beforeEach(() => {
			customTheme = {
				label: {
					position: {
						ratio: 0.25
					},
					text: {
						font: {
							sizePx: 12,
							weight: 'bold'
						},
						color: 'rgb(10, 20, 30)'
					}
				}
			};
			themePath = {
				'd': 'M10,10L50,50',
				color: 'black',
				width: 3.0,
				position: {
					left: 101,
					top: 102,
					width: 50,
					height: 60
				}
			};
			builder = jasmine.createSpy().and.returnValue(themePath);
			underTest.data('attr', {label: 'blah blah blah'});

		});
		it('adds a text label if it is in the attributes', function () {
			underTest.updateConnector({connectorBuilder: builder});
			const textField = underTest.find('text');
			expect(textField.length).toEqual(1);
			expect(textField.text()).toEqual('blah blah blah');
			expect(textField[0].style.dominantBaseline).toEqual('hanging');
		});
		it('appends the active label theme to the attributes so they can be used for editor widgets', function () {
			themePath.theme = customTheme;
			underTest.updateConnector({connectorBuilder: builder});
			expect(underTest.data('theme')).toEqual(customTheme);

		});
		it('appends the connection position as data', function () {
			themePath.theme = customTheme;
			underTest.updateConnector({connectorBuilder: builder});
			expect(underTest.data('position')).toEqual({ left: 101, top: 102, width: 50, height: 60 });

		});
		it('paints the text label according to the default theme if no theme supplied', function () {
			underTest.updateConnector({connectorBuilder: builder});
			const textField = underTest.find('text'),
				textG = textField.parent(),
				textDims = textField[0].getClientRects()[0],
				expectedX = Math.round(30 - textDims.width / 2),
				expectedPadding = 2,
				expectedY = Math.round(30 - textDims.height) - expectedPadding;
			expect(parseInt(textField.attr('x'))).toEqual(0);
			expect(parseInt(textField.attr('y'))).toEqual(expectedPadding);
			expect(textG.attr('style')).toEqual(`transform: translate(${expectedX}px, ${expectedY}px);`);
			expect(textField[0].style.stroke).toEqual('none');
			expect(textField[0].style.fill).toEqual('rgb(79, 79, 79)');
			expect(textField[0].style.fontSize).toEqual('12px');
			expect(textField[0].style.fontWeight).toEqual('normal');
		});
		it('positions the text label according to the theme settings returned from themePath', function () {
			themePath.theme = customTheme;
			underTest.updateConnector({connectorBuilder: builder});
			const textField = underTest.find('text'),
				textG = textField.parent(),
				textDims = textField[0].getClientRects()[0],
				expectedX = Math.round(20 - textDims.width / 2),
				expectedPadding = 2,
				expectedY = Math.round(20 - textDims.height) - expectedPadding;
			expect(parseInt(textField.attr('x'))).toEqual(0);
			expect(parseInt(textField.attr('y'))).toEqual(expectedPadding);
			expect(textG.attr('style')).toEqual(`transform: translate(${expectedX}px, ${expectedY}px);`);

			expect(textField[0].style.fill).toEqual('rgb(10, 20, 30)');
			expect(textField[0].style.fontSize).toEqual('12px');
			expect(textField[0].style.fontWeight).toEqual('bold');
		});
		it('places the label above the end node if aboveEnd is set', function () {
			toNode.css({
				top: '120px', left: '130px', width: '30px', height: '40px'
			});
			fromNode.css({
				top: '120px', left: '70px', width: '30px', height: '40px'
			});
			customTheme.label.position = {aboveEnd: 10};
			themePath.theme = customTheme;
			underTest.updateConnector({connectorBuilder: builder});
			const textField = underTest.find('text'),
				textG = textField.parent(),
				textDims = textField[0].getClientRects()[0],
				relativeToNodeCenter = 130 + 30 * 0.5 - 101,
				expectedX = Math.round(relativeToNodeCenter - textDims.width / 2),
				expectedPadding = 2,
				expectedY = Math.round(8 - textDims.height) - expectedPadding;
			// cx = 130 - 101 + 30/2 = 44
			// cy = 120 - 102 - 10  = 8
			expect(parseInt(textField.attr('x'))).toEqual(0);
			expect(parseInt(textField.attr('y'))).toEqual(expectedPadding);
			expect(textG.attr('style')).toEqual(`transform: translate(${expectedX}px, ${expectedY}px);`);
		});
		it('places the label on the ratio between start and end node if both ratio and aboveEnd are set', function () {
			toNode.css({
				top: '120px', left: '130px', width: '30px', height: '40px'
			});
			fromNode.css({
				top: '120px', left: '111px', width: '20px', height: '40px'
			});
			customTheme.label.position = {aboveEnd: 10, ratio: 0.5};
			themePath.theme = customTheme;
			underTest.updateConnector({connectorBuilder: builder});
			const textField = underTest.find('text'),
				textG = textField.parent(),
				textDims = textField[0].getClientRects()[0],
				//relativeToNodeCenter = 130 + 30 * 0.5 - 101, // 44
				//relativeFromNodeCenter = 111 + 20 * 0.5 - 101, // 20
				//positionOnLine = 20 + (44 - 20) / 2 = 32
				expectedX = Math.round(32 - textDims.width / 2),
				expectedPadding = 2,
				expectedY = Math.round(8 - textDims.height) - expectedPadding;
			expect(parseInt(textField.attr('x'))).toEqual(0);
			expect(parseInt(textField.attr('y'))).toEqual(expectedPadding);
			expect(textG.attr('style')).toEqual(`transform: translate(${expectedX}px, ${expectedY}px);`);
		});
		it('paints the rect element 2 pixels above the text element', function () {
			customTheme.label.backgroundColor = 'rgb(1, 2, 3)';
			customTheme.label.borderColor = 'rgb(4, 5, 6)';
			themePath.theme = customTheme;
			underTest.updateConnector({connectorBuilder: builder});
			const textField = underTest.find('text'),
				textDims = textField[0].getClientRects()[0],
				textG = textField.parent(),
				rectField = textG.find('rect');

			expect(parseInt(rectField.attr('x'))).toEqual(0);
			expect(parseInt(rectField.attr('y'))).toEqual(0);
			expect(parseInt(rectField.attr('width'))).toEqual(Math.round(textDims.width));
			expect(parseInt(rectField.attr('height'))).toEqual(Math.round(textDims.height));
			expect(rectField[0].style.stroke).toEqual('rgb(4, 5, 6)');
			expect(rectField[0].style.fill).toEqual('rgb(1, 2, 3)');


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
		underTest.updateConnector();
		expect(underTest.is(':visible')).toBeFalsy();
	});
	it('does not die if nodeTo gets cleared out', function () {
		underTest.data('nodeTo', false);
		underTest.updateConnector();
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
