/*global describe, it, beforeEach, afterEach, expect, require, jasmine */

const jQuery = require('jquery'),
	_ = require('underscore'),
	createSVG = require('../../src/browser/create-svg'),
	Theme = require('../../src/core/theme/theme'),
	colorToRGB = require('../../src/core/theme/color-to-rgb');

require('../../src/browser/update-link');

describe('updateLink', function () {
	'use strict';
	let path, underTest, fromNode, toNode, third, anotherLink, theme;
	const setAttr = function (attrName, attrVal) {
		let attrs = underTest.data('attr') || {};
		if (typeof attrName === 'string') {
			attrs[attrName] = attrVal;
		} else {
			attrs = _.extend(attrs, attrName);
		}
		return underTest.data('attr', attrs).updateLink();
	};
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
	it('adds a noTransition class to the link hit', () => {
		underTest.updateLink();
		const path = underTest.find('path.mapjs-link-hit');
		expect(path.hasClass('noTransition')).toBeTruthy();
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
		setAttr('lineStyle', 'dashed');
		expect(underTest.find('path.mapjs-link').attr('stroke-dasharray')).toBe('4, 4');
	});
	it('uses the lineStyle data attribute to control the stroke linecap', function () {
		setAttr('lineStyle', 'solid');
		expect(underTest.find('path.mapjs-link').attr('stroke-linecap')).toBe('square');
	});
	it('clears the dashes if lineStyle is solid', function () {
		underTest.find('path').attr('stroke-dasharray', '1, 1');
		setAttr('lineStyle', 'solid');
		expect(underTest.find('path.mapjs-link').attr('stroke-dasharray')).toBeFalsy();
	});
	it('uses the color attribute to set the line stroke', function () {
		setAttr('color', 'blue');
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
		setAttr('arrow', 'true');
		expect(underTest.find('path.mapjs-arrow').css('display')).toBe('inline');
	});
	it('updates an existing arrow if one is present', function () {
		path = createSVG('path').attr('class', 'mapjs-arrow').appendTo(underTest);
		setAttr('arrow', 'true');
		expect(underTest.find('path.mapjs-arrow').length).toBe(1);
		expect(underTest.find('path.mapjs-arrow')[0]).toEqual(path[0]);
	});
	it('uses the width attribute to set the arrow stroke width', function () {
		setAttr({arrow: 'true', color: '#FF7577', width: 10});
		// chrome and phantom return different forms for the same color, so explicit hex needed to make test repeatable
		expect(parseInt(underTest.find('path.mapjs-arrow').attr('stroke-width'))).toEqual(10);
	});
	it('uses the color attribute to set the arrow fill', function () {
		setAttr({arrow: 'true', color: '#FF7577'});
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
			anotherLink.data({attr: {arrow: true}}).updateLink();
			expect(anotherLink.find('path.mapjs-link').attr('d')).toEqual('M50,40L80,230');
			expect(anotherLink.find('path.mapjs-arrow').attr('d')).toEqual('M83,216L80,230L73,218Z');
		});
		it('will not update if the shapes have not moved and attributes have not changed', function () {
			underTest.updateLink();
			underTest.find('path').attr('d', '');

			underTest.updateLink();
			expect(underTest.find('path').attr('d')).toBe('');
		});
		it('will update if the shapes did not move, but the theme changed', function () {
			underTest.updateLink({theme: theme});
			underTest.find('path').attr('d', '');
			underTest.updateLink({theme: new Theme({name: 'another'})});
			expect(underTest.find('path').attr('d')).toBe('M100,20L136,120');
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
			setAttr('lineStyle', 'solid');
			expect(underTest.find('path').attr('d')).toBe('M100,20L136,120');

		});
	});


	describe('painting labels', function () {
		let linkPath,
			textField,
			builder,
			rectField;
		beforeEach(() => {
			linkPath = {
				'd': 'M10,10L50,50',
				lineProps: {
					color: 'black',
					width: 3.0
				},
				theme: {
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
				},
				position: {
					left: 101,
					top: 102,
					width: 50,
					height: 60
				}
			};
			builder = jasmine.createSpy('linkBuilder').and.returnValue(linkPath);
			underTest.data('attr', {label: 'blah blah blah'});

		});
		it('uses the color attribute to set the line stroke', function () {
			underTest.updateLink({linkBuilder: builder});
			textField = underTest.find('text');
			expect(textField.length).toEqual(1);
			expect(textField.text()).toEqual('blah blah blah');
			expect(textField[0].style.dominantBaseline).toEqual('hanging');
			expect(textField[0].style.fill).toEqual('rgb(10, 20, 30)');
			expect(textField[0].style.fontSize).toEqual('12px');
			expect(textField[0].style.fontWeight).toEqual('bold');
		});
		it('positions the label according to the center point', function () {
			underTest.updateLink({linkBuilder: builder});
			const textField = underTest.find('text'),
				textG = textField.parent(),
				textDims = textField[0].getClientRects()[0],
				expectedX = Math.round(20 - textDims.width / 2),
				expectedPadding = 2,
				expectedY = Math.round(20 - textDims.height) - expectedPadding;
			expect(parseInt(textField.attr('x'))).toEqual(0);
			expect(parseInt(textField.attr('y'))).toEqual(expectedPadding);
			expect(textG.attr('style')).toEqual(`transform: translate(${expectedX}px, ${expectedY}px);`);

		});
		it('appends the active label theme to the attributes so they can be used for editor widgets', function () {
			underTest.updateLink({linkBuilder: builder});
			expect(underTest.data('theme')).toEqual(linkPath.theme);
		});
		it('appends the connector position so it can be used by widgets', function () {
			underTest.updateLink({linkBuilder: builder});
			expect(underTest.data('position')).toEqual({left: 101, top: 102, width: 50, height: 60 });
		});
		it('paints the rect element 2 pixels above the text element', function () {
			linkPath.theme.label.backgroundColor = 'rgb(1, 2, 3)';
			linkPath.theme.label.borderColor = 'rgb(4, 5, 6)';
			underTest.updateLink({linkBuilder: builder});
			textField = underTest.find('text');
			const textDims = textField[0].getClientRects()[0];
			rectField = underTest.find('rect');

			expect(parseInt(rectField.attr('x'))).toEqual(parseInt(textField.attr('x')));
			expect(parseInt(rectField.attr('y'))).toEqual(parseInt(textField.attr('y') - 2));
			expect(parseInt(rectField.attr('width'))).toEqual(Math.round(textDims.width));
			expect(parseInt(rectField.attr('height'))).toEqual(Math.round(textDims.height));
			expect(rectField[0].style.stroke).toEqual('rgb(4, 5, 6)');
			expect(rectField[0].style.fill).toEqual('rgb(1, 2, 3)');
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
