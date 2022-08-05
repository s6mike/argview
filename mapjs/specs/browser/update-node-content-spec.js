/*global describe, it, beforeEach, afterEach, expect, jasmine, require */

const jQuery = require('jquery'),
	_ = require('underscore'),
	Theme = require('../../src/core/theme/theme');

require('../../src/browser/update-node-content');
require('../helpers/jquery-extension-matchers');

describe('updateNodeContent', function () {
	'use strict';
	let underTest, nodeContent, style, theme;
	beforeEach(function () {
		style = jQuery('<style type="text/css"> .test-padding { padding: 5px;}  .test-max-width { max-width:160px; display: block }</style>').appendTo('head');
		underTest = jQuery('<span>').appendTo('body');
		nodeContent = {
			title: 'Hello World!',
			level: 3,
			x: 10,
			y: 20,
			width: 30,
			textWidth: 32,
			height: 40,
			id: 44
		};
		theme = new Theme({node: [{name: 'default', text: {margin: 5, maxWidth: 160}}]});
	});
	afterEach(function () {
		underTest.remove();
		style.remove();
	});
	it('returns itself to allow chaining', function () {
		expect(underTest.updateNodeContent(nodeContent, theme)[0]).toEqual(underTest[0]);
	});
	describe('styles', function () {
		it('sets the data styles from the theme', function () {
			nodeContent.attr = { group: 'blue' };
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.data('styles')).toEqual(['attr_group_blue', 'attr_group', 'level_3', 'default']);
		});
		it('sets the data styles from the styleNames', () => {
			nodeContent.attr = {styleNames: ['perfect'] };
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.data('styles')).toEqual(['perfect', 'level_3', 'default']);
		});
		it('sets the data styles from the styleNames before the group if both are present', () => {
			nodeContent.attr = { group: 'blue', styleNames: ['perfect'] };
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.data('styles')).toEqual(['perfect', 'attr_group_blue', 'attr_group', 'level_3', 'default']);
		});
	});
	describe('font size', function () {
		it('sets a font size on the node if there is a fontMultiplier', () => {
			nodeContent.attr = {
				style: {
					fontMultiplier: 2
				}
			};
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest[0].style['font-size']).toEqual('18pt');
		});
	});
	describe('text alignment', function () {
		it('sets a text-align on the node if there is a text.alignment', () => {
			nodeContent.attr = {
				style: {
					textAlign: 'left'
				}
			};
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest[0].style['text-align']).toEqual('left');
		});
	});
	describe('dimensions', function () {
		it('sets the x, y, width, height properties according to node values', function () {
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.data('x')).toBe(10);
			expect(underTest.data('y')).toBe(20);
			expect(underTest.data('width')).toBe(30);
			expect(underTest.data('height')).toBe(40);
			expect(underTest.data('innerRect').dx).toBe(0);
			expect(underTest.data('innerRect').dy).toBe(0);
			expect(underTest.data('innerRect').width).toBe(30);
			expect(underTest.data('innerRect').height).toBe(40);
		});
		it('rounds x, y, width and height to improve performance', function () {
			nodeContent = {id: '12', title: 'zeka', x: 10.02, y: 19.99, width: 30.2, height: 40.3};
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.data('x')).toBe(10);
			expect(underTest.data('y')).toBe(20);
			expect(underTest.data('width')).toBe(30);
			expect(underTest.data('height')).toBe(40);
		});
		it('tags the node with a cache mark', function () {
			underTest.updateNodeContent(nodeContent, new Theme({name: 'blue'}));
			expect(underTest.data('nodeCacheMark')).toEqual({ level: 3, width: undefined, styles: ['level_3', 'default'], title: 'Hello World!', theme: 'blue', icon: undefined, note: false, collapsed: undefined, fontMultiplier: undefined});
		});
	});
	describe('parentConnector', function () {
		it('sets the parentConnector attribute in the node data', function () {
			nodeContent.attr = {
				parentConnector: {
					color: 'blue',
					lineStyle: 'dashed'
				}
			};
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.data('parentConnector')).toEqual(nodeContent.attr.parentConnector);
		});
		it('sets the parentConnector to falsy if attr missing', function () {
			delete nodeContent.attr;
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.data('parentConnector')).toBeFalsy();
		});
	});
	describe('node text', function () {
		it('sets the node title as the DOM span text', function () {
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.find('[data-mapjs-role=title]').text()).toEqual(nodeContent.title);
		});
		it('sets the node title as the data attribute', function () {
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.data('title')).toEqual(nodeContent.title);
		});
		it('reuses the existing span element if it already exists', function () {
			const existingSpan = jQuery('<span data-mapjs-role="title"></span>').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(existingSpan.text()).toEqual(nodeContent.title);
			expect(underTest.children().length).toBe(1);
		});
		it('should not allow text to overflow when there are long words', function () {
			const textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest);
			nodeContent.title = 'first shouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshould last';
			underTest.updateNodeContent(nodeContent, theme);

			expect(parseInt(textBox.css('max-width'), 10)).toBeGreaterThan(160);
		});
		it('should use the text width if provided', function () {
			const textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest).css('width', '100px');
			nodeContent.title = 'first should could would maybe not so much and so on go on';
			nodeContent.textWidth = 200;
			underTest.updateNodeContent(nodeContent, theme);
			expect(textBox.css('min-width')).toBe('200px');
		});
		it('should not allow the box to shrink width if it is multiline', function () {
			const textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest).css('width', '100px');
			nodeContent.title = 'first should could would maybe not so much and so on go on';
			delete nodeContent.textWidth;
			underTest.updateNodeContent(nodeContent, theme);
			expect(textBox.css('min-width')).toBe('160px');
		});
		it('should not force expand narrow multi-line text', function () {
			const textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest).css('width', '100px');
			nodeContent.title = 'f\ns\nc';
			underTest.updateNodeContent(nodeContent, theme);
			expect(textBox).not.toHaveOwnStyle('min-width');

		});

	});
	describe('setting the styles', function () {
		it('sets the level attribute to the node content level', function () {
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.attr('mapjs-level')).toBe('3');
		});
		it('sets the group attributes', function () {
			nodeContent.attr = { group: 'blue'};
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.hasClass('attr_group_blue')).toBeTruthy();
		});
		it('removes old attr classes', function () {
			nodeContent.attr = { group: 'blue'};
			underTest.updateNodeContent(nodeContent, theme);
			nodeContent.attr = { group: 'red'};
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.hasClass('attr_group_blue')).toBeFalsy();
			expect(underTest.hasClass('attr_group_red')).toBeTruthy();
		});
		it('sets the level class to the node content level', function () {
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.hasClass('level_3')).toBeTruthy();
		});
		it('updates the level class to the forcred level', function () {
			underTest.updateNodeContent(nodeContent, theme);
			underTest.updateNodeContent(nodeContent, theme, {level: 2});
			expect(underTest.hasClass('level_3')).toBeFalsy();
			expect(underTest.hasClass('level_2')).toBeTruthy();
		});
	});
	describe('setting the colortext attribute', function () {
		it('sets the mapjs-node-colortext class if the border is underline', function () {
			const theme = new Theme({
				node: [{
					name: 'default',
					border: {
						type: 'underline'
					}
				}
				]
			});
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.hasClass('mapjs-node-colortext')).toBeTruthy();
		});
		it('clears the colortext class if the border is not underline', function () {
			const theme = new Theme({
				node: [{
					name: 'default',
					border: {
					}
				}
				]
			});
			underTest.addClass('mapjs-node-colortext');
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.hasClass('mapjs-node-colortext')).toBeFalsy();
		});
	});
	describe('background', function () {
		it('uses the style from the background if specified', function () {
			nodeContent.attr = {
				style: {
					background: 'rgb(103, 101, 119)'
				}
			};
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('background-color')).toBe('rgb(103, 101, 119)');
		});
		it('uses the style from the background as a text color if the border style is underlined', function () {
			nodeContent.attr = {
				style: {
					background: 'rgb(103, 101, 119)'
				}
			};
			const theme = new Theme({
				node: [{
					name: 'default',
					border: {
						type: 'underline'
					},
					'backgroundColor': 'transparent'
				}
				]
			});
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('color')).toBe('rgb(103, 101, 119)');
			expect(underTest.css('background-color')).toBe('rgba(0, 0, 0, 0)');
		});
		it('sets the them lightColor class if the tinted background luminosity is < 0.5', function () {
			nodeContent.attr = { style: { background: 'rgb(3, 3, 3)' } };
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('color')).toEqual('rgb(238, 238, 238)');
		});
		it('sets the theme color if the tinted background luminosity is 0.5< <0.9', function () {
			nodeContent.attr = { style: { background: 'rgb(0, 255, 0)' } };
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('color')).toEqual('rgb(79, 79, 79)');
		});
		it('sets the theme darkColor class if the tinted background luminosity is >0.9', function () {
			nodeContent.attr = { style: { background: 'rgb(255, 255, 255)' } };
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('color')).toEqual('rgb(0, 0, 0)');

		});
	});
	describe('icon handling', function () {
		let textBox;
		beforeEach(function () {
			textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest);
		});
		describe('when icon is set', function () {
			beforeEach(function () {
				nodeContent.attr = {
					icon: {
						url: 'http://iconurl/',
						width: 400,
						textWidth: 390,
						height: 500,
						position: 'center'
					}
				};
				nodeContent.title = 'AAAA';

			});
			it('sets the generic background properties to the image which does not repeat', function () {
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.css('background-image')).toMatch(/url\("?http:\/\/iconurl\/"?\)/);
				expect(underTest.css('background-repeat')).toBe('no-repeat');
				expect(underTest.css('background-size')).toBe('400px 500px');
			});
			it('translates the URL using the resource translator if provided', function () {
				const translator = jasmine.createSpy('translator');
				translator.and.returnValue('data:xxx');
				underTest.updateNodeContent(nodeContent, theme, { resourceTranslator: translator});
				expect(translator).toHaveBeenCalledWith('http://iconurl/');
				expect(underTest.css('background-image')).toMatch(/url\("?data:xxx"?\)/);
			});
			it('positions center icons behind text and expands the node if needed to fit the image', function () {
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.css('background-position')).toBe('50% 50%');
				expect(underTest.css('min-width')).toEqual('400px');
				expect(underTest.css('min-height')).toEqual('500px');
				expect(textBox.css('margin-top')).toBe('241px');
			});
			it('positions center icons behind text and does not expand the node if not needed', function () {
				nodeContent.attr.icon.width = 5;
				nodeContent.attr.icon.height = 5;
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.css('background-position')).toBe('50% 50%');
				expect(underTest.css('min-width')).toBe('5px');
				expect(underTest).not.toHaveOwnStyle('min-height');
				expect(textBox).not.toHaveOwnStyle('margin-top');
			});
			it('positions left icons left of node text and vertically centers the text', function () {
				nodeContent.attr.icon.position = 'left';
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.css('background-position')).toBe('5px 50%');
				expect(underTest.css('padding-left')).toEqual('410px');
				expect(textBox.css('margin-top')).toBe('241px');
			});
			it('positions right icons right of node text and vertically centers the text', function () {
				nodeContent.attr.icon.position = 'right';
				underTest.updateNodeContent(nodeContent, theme);

				expect(underTest.css('background-position')).toBe('right 5px 50%');

				expect(underTest.css('padding-right')).toEqual('410px');
				expect(textBox.css('margin-top')).toBe('241px');
			});
			it('positions right icons right of node text and vertically centers the text for a fixed layouts', function () {
				nodeContent.attr.icon.position = 'right';
				underTest.updateNodeContent(nodeContent, theme, {fixedLayout: true});
				expect(underTest.css('background-position')).toBe('170px 50%');
				expect(underTest.css('padding-right')).toEqual('410px');
				expect(textBox.css('margin-top')).toBe('241px');
			});
			it('positions top icons top of node text and horizontally centers the text', function () {
				nodeContent.attr.icon.position = 'top';
				underTest.updateNodeContent(nodeContent, theme);

				expect(underTest.css('background-position')).toBe('50% 5px');
				expect(underTest.css('padding-top')).toEqual('510px');
				expect(underTest.css('min-width')).toEqual('400px');
				expect(textBox.css('max-width')).toEqual('400px');
			});
			it('positions bottom icons bottom of node text and horizontally centers the text', function () {
				nodeContent.attr.icon.position = 'bottom';
				underTest.updateNodeContent(nodeContent, theme);

				expect(underTest.css('background-position')).toBe('50% bottom 5px');
				expect(underTest.css('padding-bottom')).toEqual('510px');
				expect(underTest.css('min-width')).toEqual('400px');
				expect(textBox.css('max-width')).toEqual('400px');
			});
			it('positions bottom icons bottom of node text and horizontally centers the text for fixed layout', function () {
				nodeContent.attr.icon.position = 'bottom';
				underTest.updateNodeContent(nodeContent, theme, {fixedLayout: true});
				expect(underTest.css('background-position')).toBe('50% 23px');
				expect(underTest.css('padding-bottom')).toEqual('510px');
				expect(underTest.css('min-width')).toEqual('400px');
				expect(textBox.css('max-width')).toEqual('400px');
			});

		});
		it('removes background image settings and narrows the node if no icon set', function () {
			underTest.css({
				'min-height': '200px',
				'min-width': '20px',
				'background-image': 'url(http://iconurl/)',
				'background-repeat': 'no-repeat',
				'background-size': '20px 20px',
				'background-position': 'center center',
				'padding': '10px 20px 30px 40px'
			});
			textBox.css('margin-top', '20px');
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest).not.toHaveOwnStyle(['background-image', 'background-repeat', 'background-size', 'background-position', 'padding', 'min-']);
			expect(textBox).not.toHaveOwnStyle('margin-top');

		});
	});
	describe('collapsed', function () {
		it('adds a collapsed class when collapsed', function () {
			nodeContent.attr = {collapsed: true};
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.hasClass('collapsed')).toBeTruthy();
		});
		it('removes the collapsed class when uncollapsed', function () {
			underTest.addClass('collapsed');
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.hasClass('collapsed')).toBeFalsy();
		});
	});
	describe('groups', function () {
		it('forces width and height', function () {
			nodeContent.attr = {group: true};
			nodeContent.width = 400;
			nodeContent.height = 200;
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest[0].style.width).toEqual('400px');
			expect(underTest[0].style.height).toEqual('200px');
		});
		it('clears the content', function () {
			const textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest);
			textBox.text('bla bla');
			underTest.children('span').text('bla bla');
			nodeContent.attr = {group: true};
			nodeContent.width = 400;
			nodeContent.height = 200;
			underTest.updateNodeContent(nodeContent, theme);
			expect(textBox.text()).toEqual('');
		});
	});
	describe('hyperlink handling', function () {
		let textBox;
		beforeEach(function () {
			textBox = jQuery('<span data-mapjs-role="title"></span>').appendTo(underTest);
		});

		_.each([
			['removes the first link from text', 'google http://www.google.com', 'google'],
			['does not touch text without hyperlinks', 'google', 'google'],
			['removes only the first link', 'http://xkcd.com google http://www.google.com', 'google http://www.google.com'],
			['keeps link if there is no other text', 'http://xkcd.com', 'http://xkcd.com'],
			['truncates the link if it is too long and appends ...', 'http://google.com/search?q=onlylink', 'http://google.com/search?...']
		], function (testArgs) {
			it(testArgs[0], function () {
				nodeContent.title = testArgs[1];
				underTest.updateNodeContent(nodeContent, theme);
				expect(textBox.text()).toEqual(testArgs[2]);
			});
		});
		describe('when there is a link', function () {
			beforeEach(function () {
				nodeContent.title = 'google http://www.google.com';
			});
			it('shows the link element', function () {
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('[data-mapjs-role=decorations] a.mapjs-hyperlink').css('display')).not.toBe('none');
			});
			['mousedown', 'click'].forEach(function (eventName) {
				it('prevents ' + eventName + ' propagation outside the decorations element -- firefox bug fix', function () {
					const event = jQuery.Event(eventName);
					underTest.updateNodeContent(nodeContent, theme);
					underTest.find('[data-mapjs-role=decorations]').trigger(event);
					expect(event.isDefaultPrevented()).toBeFalsy();
					expect(event.isPropagationStopped()).toBeTruthy();
					expect(event.isImmediatePropagationStopped()).toBeTruthy();
				});
			});
			it('sets the href with a blank target on the link element to the hyperlink in node', function () {
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('a.mapjs-hyperlink').attr('href')).toEqual('http://www.google.com');
				expect(underTest.find('a.mapjs-hyperlink').attr('target')).toEqual('_blank');
			});
			it('should reuse and show existing element', function () {
				jQuery('<a href="#" class="mapjs-hyperlink"></a>').appendTo(underTest).hide();
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('a.mapjs-hyperlink').length).toBe(1);
				expect(underTest.find('a.mapjs-hyperlink').css('display')).not.toBe('none');
			});
			it('sets the whole text with the link as the data title', function () {
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.data('title')).toEqual('google http://www.google.com');
			});
		});
		describe('when there is no link', function () {
			it('hides the link element', function () {
				jQuery('<a href="#" class="mapjs-hyperlink"></a>').appendTo(underTest).show();
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('a.mapjs-hyperlink').css('display')).toBe('none');
			});
		});
	});
	describe('attachment handling', function () {
		describe('when there is an attachment', function () {
			beforeEach(function () {
				nodeContent.attr = {
					'attachment': {
						'contentType': 'text/html',
						'content': 'aa'
					}
				};
			});
			it('dispatches an attachment-link-created event for the node id', done => {
				underTest.on('attachment-link-created', e => {
					const eventTarget = jQuery(e.target);
					expect(e.target.nodeName).toEqual('A');
					expect(e.nodeId).toEqual(44);
					expect(eventTarget.hasClass('mapjs-attachment')).toBeTruthy();
					expect(eventTarget.parent().attr('data-mapjs-role')).toEqual('decorations');
					done();
				});
				underTest.updateNodeContent(nodeContent, theme);
			});
			it('shows the paperclip element', function () {
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('[data-mapjs-role=decorations] a.mapjs-attachment').css('display')).not.toBe('none');
			});
			it('binds the paperclip click to dispatch an attachment-click event', function () {
				const listener = jasmine.createSpy('listener');
				underTest.on('attachment-click', listener);
				underTest.updateNodeContent(nodeContent, theme);
				underTest.find('a.mapjs-attachment').click();
				expect(listener).toHaveBeenCalled();
			});
			it('should reuse and show existing element', function () {
				let eventCalled = false;
				underTest.on('attachment-link-created', () => {
					eventCalled = true;
				});
				jQuery('<a href="#" class="mapjs-attachment">hello</a>').appendTo(underTest).hide();
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('a.mapjs-attachment').length).toBe(1);
				expect(underTest.find('a.mapjs-attachment').css('display')).not.toBe('none');
				expect(eventCalled).toEqual(false);
			});
		});
		describe('when there is no attachment', function () {
			it('hides the paperclip element', function () {
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('a.mapjs-attachment').is(':visible')).toBeFalsy();
			});
		});
	});
	describe('note handling', function () {
		describe('when there is a note', function () {
			beforeEach(function () {
				nodeContent.attr = {
					note: {
						index: 1,
						text: 'aaaa'
					}
				};
			});
			it('shows the note decoration element', function () {
				jQuery('<a href="#" class="mapjs-note"></a>').appendTo(underTest).show();
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('[data-mapjs-role=decorations] a.mapjs-note').css('display')).not.toBe('none');
			});
			it('binds the note decoration to dispatch an note-click event', function () {
				const listener = jasmine.createSpy('listener');
				underTest.on('decoration-click', listener);
				underTest.updateNodeContent(nodeContent, theme);
				underTest.find('a.mapjs-note').click();
				expect(listener).toHaveBeenCalled();
				expect(listener.calls.argsFor(0)[1]).toEqual('note');
			});
			it('should reuse and show existing element', function () {
				jQuery('<a href="#" class="mapjs-note">hello</a>').appendTo(underTest).hide();
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('a.mapjs-note').length).toBe(1);
				expect(underTest.find('a.mapjs-note').is(':visible')).toBeTruthy();
			});
		});
		describe('when there is no note', function () {
			it('hides the note element', function () {
				jQuery('<a href="#" class="mapjs-note">hello</a>').appendTo(underTest).hide();
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('a.mapjs-note').is(':visible')).toBeFalsy();
			});
		});
	});


	describe('label handling', function () {
		describe('when there is a label', function () {
			beforeEach(function () {
				nodeContent.label = 'foo';
			});
			it('shows the label element', function () {
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('[data-mapjs-role=decorations] .mapjs-label').is(':visible')).toBeTruthy();
				expect(underTest.find('.mapjs-label').text()).toEqual('foo');
			});
			it('should reuse and show existing element', function () {
				jQuery('<span class="mapjs-label">hello</span>').appendTo(underTest).hide();
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('.mapjs-label').length).toBe(1);
				expect(underTest.find('.mapjs-label').is(':visible')).toBeTruthy();
				expect(underTest.find('.mapjs-label').text()).toEqual('foo');
			});
		});
		describe('when there is no label', function () {
			it('hides the label element', function () {
				jQuery('<span class="mapjs-label">hello</span>').appendTo(underTest);
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('.mapjs-label').is(':visible')).toBeFalsy();
			});
		});
		describe('when label is equal to numeric 0', function () {
			it('hides the label element', function () {
				nodeContent.label = 0;
				underTest.updateNodeContent(nodeContent, theme);
				expect(underTest.find('.mapjs-label').is(':visible')).toBeTruthy();
				expect(underTest.find('.mapjs-label').text()).toEqual('0');
			});
		});
	});
	describe('decoration margin handling', function () {
		it('adds a left margin for decorations when they are on the left', function () {
			const theme = new Theme(
				{
					node: [{
						name: 'default',
						decorations: {
							height: 32,
							edge: 'left',
							position: 'center'
						}
					}]
				}
			);
			jQuery('<div data-mapjs-role=decorations>').css('width', '16px').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('margin-left')).toEqual('16px');
			expect(underTest.data('innerRect').dx).toBe(16);
			expect(underTest.data('innerRect').dy).toBe(0);
			expect(underTest.data('innerRect').width).toBe(14);
			expect(underTest.data('innerRect').height).toBe(40);
		});
		it('adds a right margin for decorations when they are on the right', function () {
			const theme = new Theme(
				{
					node: [{
						name: 'default',
						decorations: {
							height: 32,
							edge: 'right',
							position: 'center'
						}
					}]
				}
			);
			jQuery('<div data-mapjs-role=decorations>').css('width', '16px').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('margin-right')).toEqual('16px');
			expect(underTest.data('innerRect').dx).toBe(0);
			expect(underTest.data('innerRect').dy).toBe(0);
			expect(underTest.data('innerRect').width).toBe(14);
			expect(underTest.data('innerRect').height).toBe(40);
		});

		it('does not add a top margin for decorations', function () {
			const theme = new Theme(
				{
					node: [{
						name: 'default',
						decorations: {
							height: 32,
							edge: 'top',
							position: 'center'
						}
					}]
				}
			);
			jQuery('<div data-mapjs-role=decorations>').css('height', '21px').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('margin-top')).toEqual('0px');
			expect(underTest.data('innerRect').dx).toBe(0);
			expect(underTest.data('innerRect').dy).toBe(0);
			expect(underTest.data('innerRect').width).toBe(30);
			expect(underTest.data('innerRect').height).toBe(40);

		});
		it('clears a top margin for decorations when the node does not have decorations', function () {
			const theme = new Theme(
				{
					node: [{
						name: 'default',
						decorations: {
							height: 0,
							edge: 'top',
							position: 'center'
						}
					}]
				}
			);
			jQuery('<div data-mapjs-role=decorations>').css('height', '0').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.attr('style')).toEqual('opacity: 1; color: rgb(79, 79, 79); background-color: rgb(224, 224, 224);');
			expect(underTest.data('innerRect').dx).toBe(0);
			expect(underTest.data('innerRect').dy).toBe(0);
			expect(underTest.data('innerRect').width).toBe(30);
			expect(underTest.data('innerRect').height).toBe(40);

		});

		it('does not add a top margin for decorations', function () {
			const theme = new Theme(
				{
					node: [{
						name: 'default',
						decorations: {
							height: 32,
							edge: 'top',
							overlap: true,
							position: 'center'
						}
					}]
				}
			);
			jQuery('<div data-mapjs-role=decorations>').css('height', '22px').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('margin-top')).toEqual('0px');
			expect(underTest.data('innerRect').dx).toBe(0);
			expect(underTest.data('innerRect').dy).toBe(0);
			expect(underTest.data('innerRect').width).toBe(30);
			expect(underTest.data('innerRect').height).toBe(40);

		});


		it('adds a bottom margin for decorations when they are on the bottom', function () {
			const theme = new Theme(
				{
					node: [{
						name: 'default',
						decorations: {
							height: 32,
							edge: 'bottom',
							position: 'center'
						}
					}]
				}
			);
			jQuery('<div data-mapjs-role=decorations>').css('height', '21px').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('margin-bottom')).toEqual('21px');
			expect(underTest.data('innerRect').dx).toBe(0);
			expect(underTest.data('innerRect').dy).toBe(0);
			expect(underTest.data('innerRect').width).toBe(30);
			expect(underTest.data('innerRect').height).toBe(19);

		});

		it('adds a bottom margin for decorations when they are on the bottom with overlap', function () {
			const theme = new Theme(
				{
					node: [{
						name: 'default',
						decorations: {
							height: 32,
							overlap: true,
							edge: 'bottom',
							position: 'center'
						}
					}]
				}
			);
			jQuery('<div data-mapjs-role=decorations>').css('height', '22px').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('margin-bottom')).toEqual('11px');
			expect(underTest.data('innerRect').dx).toBe(0);
			expect(underTest.data('innerRect').dy).toBe(0);
			expect(underTest.data('innerRect').width).toBe(30);
			expect(underTest.data('innerRect').height).toBe(29);

		});

		it('clears the other margins to ensure stale theme changes are reverted', function () {
			underTest.css('margin-top', '10px');
			const theme = new Theme(
				{
					node: [{
						name: 'default',
						decorations: {
							height: 32,
							overlap: true,
							edge: 'bottom',
							position: 'center'
						}
					}]
				}
			);
			jQuery('<div data-mapjs-role=decorations>').css('height', '100px').appendTo(underTest);
			underTest.updateNodeContent(nodeContent, theme);
			expect(underTest.css('margin-bottom')).toEqual('50px');
			expect(underTest.css('margin-top')).toEqual('0px');
		});

	});
});
