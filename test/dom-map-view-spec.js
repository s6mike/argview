/*global MAPJS, jQuery, describe, it, beforeEach, afterEach, _, expect, navigator, jasmine, Color*/
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
describe('updateConnector', function () {
	'use strict';
	var underTest, fromNode, toNode, third, anotherConnector;
	beforeEach(function () {
		fromNode = jQuery('<div>').attr('id', 'node_fr').css({ position: 'absolute', top: '100px', left: '200px', width: '100px', height: '40px'}).appendTo('body');
		toNode = jQuery('<div>').attr('id', 'node_to').css({ position: 'absolute', top: '220px', left: '330px', width: '12px', height: '44px'}).appendTo('body');
		underTest = MAPJS.createSVG().appendTo('body').css('position', 'absolute').attr('data-mapjs-node-from', 'node_fr').attr('data-mapjs-node-to', 'node_to');
		third = jQuery('<div>').attr('id', 'node_third').css({ position: 'absolute', top: '330px', left: '220px', width: '119px', height: '55px'}).appendTo('body');
		anotherConnector = MAPJS.createSVG().appendTo('body').css('position', 'absolute').attr('data-mapjs-node-from', 'node_fr').attr('data-mapjs-node-to', 'node_third');
	});
	it('returns itself for chaining', function () {
		expect(underTest.updateConnector()[0]).toEqual(underTest[0]);
		expect(jQuery('[data-mapjs-node-from=node_fr]').length).toBe(2);

	});
	it('draws a cubic curve between the centers of two nodes', function () {
		underTest.updateConnector();
		var path = underTest.find('path');
		expect(path.length).toBe(1);
		expect(path.attr('class')).toEqual('mapjs-connector');
		expect(path.attr('d')).toEqual('M50,20Q50,202 130,142');
	});
	it('positions the connector to the upper left edge of the nodes, and expands it to the bottom right edge of the nodes', function () {
		underTest.updateConnector();
		expect(underTest.css('top')).toEqual('100px');
		expect(underTest.css('left')).toEqual('200px');
		expect(underTest.css('height')).toEqual('164px');
		expect(underTest.css('width')).toEqual('142px');
	});
	it('updates the existing curve if one is present', function () {
		var path = MAPJS.createSVG('path').appendTo(underTest);
		underTest.updateConnector();
		expect(underTest.find('path').length).toBe(1);
		expect(underTest.find('path')[0]).toEqual(path[0]);
	});

	it('updates multiple connectors at once', function () {
		jQuery('[data-mapjs-node-from=node_fr]').updateConnector();
		expect(underTest.find('path').attr('d')).toEqual('M50,20Q50,202 130,142');
		expect(anotherConnector.find('path').attr('d')).toEqual('M50,20Q50,318 20,258');
	});
	describe('performance optimisations', function () {
		it('rounds coordinates', function () {
			anotherConnector.updateConnector();
			expect(anotherConnector.find('path').attr('d')).toEqual('M50,20Q50,318 20,258');
		});
		it('will not update if the shapes have not moved', function () {
			underTest.updateConnector();
			underTest.find('path').attr('d', '');

			underTest.updateConnector();
			expect(underTest.find('path').attr('d')).toBe('');
		});
		it('will update if the shapes move', function () {
			underTest.updateConnector();
			underTest.find('path').attr('d', '');
			fromNode.css('top', '50px');

			underTest.updateConnector();
			expect(underTest.find('path').attr('d')).toBe('M50,20Q50,252 130,192');
		});

	});
	it('does not die if one of the shapes is no longer present', function () {
		underTest.attr('data-mapjs-node-from', 'node_non_existent');
		underTest.updateConnector();
	});
	afterEach(function () {
		fromNode.detach();
		toNode.detach();
		underTest.detach();
		third.detach();
		anotherConnector.detach();
	});
});
describe('updateLink', function () {
	'use strict';
	var underTest, fromNode, toNode, third, anotherLink;
	beforeEach(function () {
		fromNode = jQuery('<div>').attr('id', 'node_fr').css({ position: 'absolute', top: '100px', left: '200px', width: '100px', height: '40px'}).appendTo('body');
		toNode = jQuery('<div>').attr('id', 'node_to').css({ position: 'absolute', top: '220px', left: '330px', width: '12px', height: '44px'}).appendTo('body');
		underTest = MAPJS.createSVG().appendTo('body').css('position', 'absolute').attr('data-mapjs-node-from', 'node_fr').attr('data-mapjs-node-to', 'node_to');
		third = jQuery('<div>').attr('id', 'node_third').css({ position: 'absolute', top: '330px', left: '220px', width: '119px', height: '55px'}).appendTo('body');
		anotherLink = MAPJS.createSVG().appendTo('body').css('position', 'absolute').attr('data-mapjs-node-from', 'node_fr').attr('data-mapjs-node-to', 'node_third');
	});
	it('returns itself for chaining', function () {
		expect(underTest.updateLink()[0]).toEqual(underTest[0]);
		expect(jQuery('[data-mapjs-node-from=node_fr]').length).toBe(2);
	});
	it('draws a straight between the borders of two nodes', function () {
		underTest.updateLink();
		var path = underTest.find('path');
		expect(path.length).toBe(1);
		expect(path.attr('class')).toEqual('mapjs-link');
		expect(path.attr('d')).toEqual('M100,20L136,120');
	});
	it('positions the link to the upper left edge of the nodes, and expands it to the bottom right edge of the nodes', function () {
		underTest.updateLink();
		expect(underTest.css('top')).toEqual('100px');
		expect(underTest.css('left')).toEqual('200px');
		expect(underTest.css('height')).toEqual('164px');
		expect(underTest.css('width')).toEqual('142px');
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
		/*jslint newcap:true*/
		underTest.data('color', 'blue').updateLink();
		// chrome and phantom return different forms for the same color, so explicit hex needed to make test repeatable
		expect(Color(underTest.find('path.mapjs-link').css('stroke')).hexString()).toBe('#0000FF');
	});

	it('updates the existing line if one is present', function () {
		var path = MAPJS.createSVG('path').attr('class', 'mapjs-link').appendTo(underTest);
		underTest.updateLink();
		expect(underTest.find('path.mapjs-link').length).toBe(1);
		expect(underTest.find('path.mapjs-link')[0]).toEqual(path[0]);
	});
	it('uses the arrow data attribute to draw an arrow', function () {
		underTest.data('arrow', 'true').updateLink();
		expect(underTest.find('path.mapjs-arrow').css('display')).toBe('inline');
	});
	it('updates an existing arrow if one is present', function () {
		var path = MAPJS.createSVG('path').attr('class', 'mapjs-arrow').appendTo(underTest);
		underTest.data('arrow', 'true').updateLink();
		expect(underTest.find('path.mapjs-arrow').length).toBe(1);
		expect(underTest.find('path.mapjs-arrow')[0]).toEqual(path[0]);
	});
	it('uses the color attribute to set the arrow fill', function () {
		/*jslint newcap:true*/
		underTest.data('arrow', 'true').data('color', '#FF7577').updateLink();
		// chrome and phantom return different forms for the same color, so explicit hex needed to make test repeatable
		expect(Color(underTest.find('path.mapjs-arrow').css('fill')).hexString()).toBe('#FF7577');
	});
	it('hides an existing arrow when the attribute is no longer present', function () {
		MAPJS.createSVG('path').attr('class', 'mapjs-arrow').appendTo(underTest);
		underTest.updateLink();
		expect(underTest.find('path.mapjs-arrow').css('display')).toBe('none');
	});

	it('updates multiple links at once', function () {
		jQuery('[data-mapjs-node-from=node_fr]').updateLink();
		expect(underTest.find('path').attr('d')).toEqual('M100,20L136,120');
		expect(anotherLink.find('path').attr('d')).toEqual('M50,40L80,230');
	});
	it('does not die if one of the shapes is no longer present', function () {
		underTest.attr('data-mapjs-node-from', 'node_non_existent');
		underTest.updateLink();
	});
	describe('performance optimisations', function () {
		it('rounds coordinates', function () {
			anotherLink.data('arrow', 'true').updateLink();
			expect(anotherLink.find('path.mapjs-link').attr('d')).toEqual('M50,40L80,230');
			expect(anotherLink.find('path.mapjs-arrow').attr('d')).toEqual('M82,216L80,230L73,218Z');
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
		fromNode.detach();
		toNode.detach();
		underTest.detach();
		third.detach();
		anotherLink.detach();
	});

});
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
		style = jQuery('<style type="text/css"> .test-padding { padding: 5px;}  .test-max-width { max-width:160px; display: block }</style>').appendTo('head');
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
		it('should not allow text to overflow when there are long words', function () {
			var textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest);
			nodeContent.title = 'first shouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshouldshould last';
			underTest.updateNodeContent(nodeContent);

			expect(parseInt(textBox.css('max-width'), 10)).toBeGreaterThan(160);
		});
		it('should not allow the box to shrink width if it is multiline', function () {
			var textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest).css('width', '100px');
			nodeContent.title = 'first should could would maybe not so much and so on go on';
			underTest.updateNodeContent(nodeContent);
			expect(textBox.css('min-width')).toBe('160px');
		});
		it('should not force expand narrow multi-line text', function () {
			var textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest).css('width', '100px');
			nodeContent.title = 'f\ns\nc';
			underTest.updateNodeContent(nodeContent);
			checkNoStyle(textBox, 'min-width');
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
			textBox = jQuery('<span data-mapjs-role="title" class="test-max-width"></span>').appendTo(underTest);
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
				expect(underTest.css('min-width')).toBe('5px');
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
				expect(textBox.css('margin-left')).toBe('120px');
			});
			it('positions bottom icons bottom of node text and horizontally centers the text', function () {
				nodeContent.attr.icon.position = 'bottom';
				underTest.updateNodeContent(nodeContent);

				if (!isHeadless()) {
					expect(underTest.css('background-position')).toBe('left 50% bottom 5px');
				}
				expect(underTest.css('padding-bottom')).toEqual('510px');
				expect(underTest.css('min-width')).toEqual('400px');
				expect(textBox.css('margin-left')).toBe('120px');
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
		var textBox;
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
					underTest.updateNodeContent(nodeContent);
					expect(textBox.text()).toEqual(testArgs[2]);
				});
			});
		describe('when there is a link', function () {
			beforeEach(function () {
				nodeContent.title = 'google http://www.google.com';
			});
			it('shows the link element', function () {
				underTest.updateNodeContent(nodeContent);
				expect(underTest.find('a.mapjs-link').is(':visible')).toBeTruthy();
			});
			it('sets the href with a blank target on the link element to the hyperlink in node', function () {
				underTest.updateNodeContent(nodeContent);
				expect(underTest.find('a.mapjs-link').attr('href')).toEqual('http://www.google.com');
				expect(underTest.find('a.mapjs-link').attr('target')).toEqual('_blank');
			});
			it('should reuse and show existing element', function () {
				jQuery('<a href="#" class="mapjs-link"></a>').appendTo(underTest).hide();
				underTest.updateNodeContent(nodeContent);
				expect(underTest.find('a.mapjs-link').length).toBe(1);
				expect(underTest.find('a.mapjs-link').is(':visible')).toBeTruthy();
			});
		});
		describe('when there is no link', function () {
			it('hides the link element', function () {
				underTest.updateNodeContent(nodeContent);
				expect(underTest.find('a.mapjs-link').is(':visible')).toBeFalsy();
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
			it('shows the paperclip element', function () {
				underTest.updateNodeContent(nodeContent);
				expect(underTest.find('a.mapjs-attachment').is(':visible')).toBeTruthy();
			});
			it('binds the paperclip click to dispatch a mapModel event (which one?)', function () {
				var listener = jasmine.createSpy('listener');
				underTest.on('attachment-click', listener);
				underTest.updateNodeContent(nodeContent);
				underTest.find('a.mapjs-attachment').click();
				expect(listener).toHaveBeenCalled();
			});
			it('should reuse and show existing element', function () {
				jQuery('<a href="#" class="mapjs-attachment">hello</a>').appendTo(underTest).hide();
				underTest.updateNodeContent(nodeContent);
				expect(underTest.find('a.mapjs-attachment').length).toBe(1);
				expect(underTest.find('a.mapjs-attachment').is(':visible')).toBeTruthy();
			});
		});
		describe('when there is no attachment', function () {
			it('hides the paperclip element', function () {
				underTest.updateNodeContent(nodeContent);
				expect(underTest.find('a.mapjs-attachment').is(':visible')).toBeFalsy();
			});
		});

	});
});
