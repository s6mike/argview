/*global jQuery, describe, it, beforeEach, afterEach, _, expect, navigator*/
/*
describe('MapViewController', function () {
	'use strict';
	it('selects a node when focused', function () {

	});
	describe('onNodeCreated', function () {
		it('adds a node', function () {
		});
		it('positions the node', function () {

		});
		it('expands the stage if necessary and moves all other nodes down or right', function () {

		});
		it('adds a mapjs-node class to the node', function () {
			underTest.updateNodeContent(nodeContent);
			expect(underTest.hasClass('mapjs-node')).toBeTruthy();
		});
	});
	describe('onMapScaleChanged', function () {

	});
	describe('selection and activation', function () {
		it('adds a selected class when selected', function () {

		});
		it('focuses the node when selected', function () {

		});
		it('removes the selected class when unselected', function () {

		});
	});

});
*/
describe('updateNodeContent', function () {
	'use strict';
	var underTest, nodeContent, style,
		isHeadless = function () {
			return (navigator.userAgent.indexOf('PhantomJS')  !== -1);
		},
		checkNoStyle = function (element, style) {
			if (element.attr('style')) {
				if (_.isArray(style)) {
					_.each(style, function (aStyle) {
						checkNoStyle(element, aStyle);
					});
				} else {
					expect(element.attr('style').indexOf(style)).toBe(-1);
				}

			}

		};
	beforeEach(function () {
		style = jQuery('<style type="text/css"> .test-padding { padding: 5px} </style>').appendTo('head');
		underTest = jQuery('<span>').appendTo('body');
		nodeContent = {
			title: 'Hello World!',
			level: 3
		};
	});
	afterEach(function () {
		underTest.detach();
		style.detach();
	});
	it('returns itself to allow chaining', function () {
		expect(underTest.updateNodeContent(nodeContent)[0]).toEqual(underTest[0]);
	});
	describe('node text', function () {
		it('sets the node title as the DOM span text', function () {
			underTest.updateNodeContent(nodeContent);
			expect(underTest.find('[data-mapjs-role=title]').text()).toEqual(nodeContent.title);
		});
		it('reuses the existing span element if it already exists', function () {
			var existingSpan = jQuery('<span data-mapjs-role="title"></span>').appendTo(underTest);
			underTest.updateNodeContent(nodeContent);
			expect(existingSpan.text()).toEqual(nodeContent.title);
			expect(underTest.children().length).toBe(1);
		});
	});
	describe('setting the level', function () {
		it('sets the level attribute to the node content level', function () {
			underTest.updateNodeContent(nodeContent);
			expect(underTest.attr('mapjs-level')).toBe('3');
		});
	});
	describe('background', function () {
		it('uses the style from the background if specified', function () {
			nodeContent.attr = {
				style: {
					background: 'rgb(103, 101, 119)'
				}
			};
			underTest.updateNodeContent(nodeContent);
			expect(underTest.css('background-color')).toBe('rgb(103, 101, 119)');
		});
		it('sets the mapjs-node-dark class if the tinted background luminosity is < 0.5', function () {
			nodeContent.attr = { style: { background: 'rgb(3, 3, 3)' } };
			underTest.updateNodeContent(nodeContent);
			expect(underTest.hasClass('mapjs-node-dark')).toBeTruthy();

		});
		it('sets the mapjs-node-light class if the tinted background luminosity is 0.5< <0.9', function () {
			nodeContent.attr = { style: { background: 'rgb(0, 255, 0)' } };
			underTest.updateNodeContent(nodeContent);
			expect(underTest.hasClass('mapjs-node-light')).toBeTruthy();

		});
		it('sets the mapjs-node-white class if the tinted background luminosity is >0.9', function () {
			nodeContent.attr = { style: { background: 'rgb(255, 255, 255)' } };
			underTest.updateNodeContent(nodeContent);
			expect(underTest.hasClass('mapjs-node-white')).toBeTruthy();

		});
		it('clears background color and mapjs-node-* styles from the style if not specified', function () {
			underTest.css('background-color', 'blue').addClass('mapjs-node-dark mapjs-node-white mapjs-node-light');
			underTest.updateNodeContent(nodeContent);
			checkNoStyle(underTest, 'background-color');
			_.each(['mapsj-node-dark', 'mapjs-node-white', 'mapjs-node-light'], function (cls) {
				expect(underTest.hasClass(cls)).toBeFalsy();
			});
		});
	});
	describe('icon handling', function () {
		var textBox;
		beforeEach(function () {
			textBox = jQuery('<span data-mapjs-role="title"></span>').appendTo(underTest);
		});
		describe('when icon is set', function () {
			beforeEach(function () {
				nodeContent.attr = {
					icon: {
						url: 'http://iconurl/',
						width: 400,
						height: 500,
						position: 'center'
					}
				};
				nodeContent.title = 'AAAA';

				underTest.addClass('test-padding');
			});
			it('sets the generic background properties to the image which does not repeat', function () {
				underTest.updateNodeContent(nodeContent);
				expect(underTest.css('background-image')).toBe('url(http://iconurl/)');
				expect(underTest.css('background-repeat')).toBe('no-repeat');
				expect(underTest.css('background-size')).toBe('400px 500px');
			});
			it('positions center icons behind text and expands the node if needed to fit the image', function () {
				underTest.updateNodeContent(nodeContent);
				expect(underTest.css('background-position')).toBe('50% 50%');
				expect(underTest.css('min-width')).toEqual('400px');
				expect(underTest.css('min-height')).toEqual('500px');
				expect(textBox.css('margin-top')).toBe('241px');
			});
			it('positions center icons behind text and does not expand the node if not needed', function () {
				nodeContent.attr.icon.width = 5;
				nodeContent.attr.icon.height = 5;
				underTest.updateNodeContent(nodeContent);
				expect(underTest.css('background-position')).toBe('50% 50%');
				checkNoStyle(underTest, 'min-width');
				checkNoStyle(underTest, 'min-height');
				checkNoStyle(textBox, 'margin-top');
			});
			it('positions left icons left of node text and vertically centers the text', function () {
				nodeContent.attr.icon.position = 'left';
				underTest.updateNodeContent(nodeContent);
				if (!isHeadless()) {
					expect(underTest.css('background-position')).toBe('left 5px top 50%');
				}

				expect(underTest.css('padding-left')).toEqual('410px');
				expect(textBox.css('margin-top')).toBe('241px');
			});
			it('positions right icons right of node text and vertically centers the text', function () {
				nodeContent.attr.icon.position = 'right';
				underTest.updateNodeContent(nodeContent);

				if (!isHeadless()) {
					expect(underTest.css('background-position')).toBe('right 5px top 50%');
				}

				expect(underTest.css('padding-right')).toEqual('410px');
				expect(textBox.css('margin-top')).toBe('241px');
			});
			it('positions top icons top of node text and horizontally centers the text', function () {
				nodeContent.attr.icon.position = 'top';
				underTest.updateNodeContent(nodeContent);

				if (!isHeadless()) {
					expect(underTest.css('background-position')).toBe('left 50% top 5px');
				}
				expect(underTest.css('padding-top')).toEqual('510px');
				expect(underTest.css('min-width')).toEqual('400px');
			});
			it('positions bottom icons bottom of node text and horizontally centers the text', function () {
				nodeContent.attr.icon.position = 'bottom';
				underTest.updateNodeContent(nodeContent);

				if (!isHeadless()) {
					expect(underTest.css('background-position')).toBe('left 50% bottom 5px');
				}
				expect(underTest.css('padding-bottom')).toEqual('510px');
				expect(underTest.css('min-width')).toEqual('400px');
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
			underTest.updateNodeContent(nodeContent);
			checkNoStyle(underTest, ['background', 'padding', 'min-']);
			checkNoStyle(textBox, 'margin-top');

		});
	});
	describe('collapsed', function () {
		it('adds a collapsed class when collapsed', function () {
			nodeContent.attr = {collapsed: true};
			underTest.updateNodeContent(nodeContent);
			expect(underTest.hasClass('mapjs-collapsed')).toBeTruthy();
		});
		it('removes the collapsed class when uncollapsed', function () {
			underTest.addClass('mapjs-collapsed');
			underTest.updateNodeContent(nodeContent);
			expect(underTest.hasClass('mapjs-collapsed')).toBeFalsy();
		});
	});
	describe('hyperlink handling', function () {
		_.each([
				['removes the first link from text', 'google http://www.google.com', 'google'],
				['does not touch text without hyperlinks', 'google', 'google'],
				['removes only the first link', 'http://xkcd.com google http://www.google.com', 'google http://www.google.com'],
				['keeps link if there is no other text', 'http://xkcd.com', 'http://xkcd.com'],
				['truncates the link if it is too long and appends ...', 'http://google.com/search?q=onlylink', 'http://google.com/search?...']
			], function (testArgs) {
				it(testArgs[0], function () {

				});
			});
		describe('when there is a link', function () {
			it('shows the link element', function () {

			});
			it('sets the href on the link element to the hyperlink in node', function () {

			});
		});
		describe('when there is no link', function () {
			it('hides the link element', function () {

			});
		});
	});
	describe('attachment handling', function () {
		describe('when there is an attachment', function () {
			it('shows the paperclip element', function () {

			});
			it('binds the paperclip click to dispatch a mapModel event (which one?)', function () {

			});
		});
		describe('when there is no attachment', function () {
			it('hides the paperclip element', function () {

			});
		});

	});
});
