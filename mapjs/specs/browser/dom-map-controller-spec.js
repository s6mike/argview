/*global describe, it, beforeEach, afterEach, expect, jasmine, spyOn, require */
const jQuery = require('jquery'),
	_ = require('underscore'),
	createSVG = require('../../src/browser/create-svg'),
	nodeCacheMark = require('../../src/browser/node-cache-mark'),
	Theme = require('../../src/core/theme/theme'),
	observable = require('../../src/core/util/observable'),
	DomMapController = require('../../src/browser/dom-map-controller');

require('../helpers/jquery-extension-matchers');



describe('DomMapController', function () {
	'use strict';
	let stage,
		viewPort,
		themeFromSource,
		mapModel,
		domMapController,
		resourceTranslator,
		themeSource;

	const setTheme = (newTheme) => themeFromSource = newTheme;

	beforeEach(function () {
		mapModel = observable(jasmine.createSpyObj('mapModel', ['setLayoutCalculator', 'selectConnector', 'getReorderBoundary', 'dropImage', 'clickNode', 'positionNodeAt', 'dropNode', 'openAttachment', 'toggleCollapse', 'undo', 'editNode', 'isEditingEnabled', 'editNode', 'setInputEnabled', 'getInputEnabled', 'updateTitle', 'getNodeIdAtPosition', 'selectNode', 'getCurrentlySelectedIdeaId', 'requestContextMenu', 'setNodeWidth']));
		mapModel.getInputEnabled.and.returnValue(true);
		mapModel.isEditingEnabled.and.returnValue(true);
		viewPort = jQuery('<div>').appendTo('body');
		stage = jQuery('<div>').css('overflow', 'scroll').appendTo(viewPort);
		resourceTranslator = jasmine.createSpy('resourceTranslator');

		themeSource = () => themeFromSource;
		domMapController = new DomMapController(mapModel, stage, false, resourceTranslator, themeSource);
	});
	afterEach(function () {
		viewPort.remove();
	});

	describe('dimensionProvider', function () {
		let newElement, oldUpdateNodeContent, idea;
		beforeEach(function () {
			themeFromSource = new Theme({name: 'test'});

			oldUpdateNodeContent = jQuery.fn.updateNodeContent;
			idea = {id: 'foo.1', title: 'zeka'};
		});
		afterEach(function () {
			if (newElement) {
				newElement.remove();
			}
			jQuery.fn.updateNodeContent = oldUpdateNodeContent;
		});
		it('calculates the width and height of node by drawing an invisible box with .mapjs-node and detaching it after', function () {
			newElement = jQuery('<style type="text/css">.mapjs-node { width:456px !important; min-height:788.3px !important}</style>').appendTo(stage);
			expect(domMapController.dimensionProvider(idea)).toEqual({width: 456, textWidth: 29, height: 789});
			expect(jQuery('.mapjs-node').length).toBe(0);
		});
		describe('when ideas has a width attribute', function () {
			beforeEach(function () {
				newElement = jQuery('<style type="text/css">.mapjs-node span { min-height:789px; display: inline-block;}</style>').appendTo(stage);
			});
			it('should use the width if greater than than the text width', function () {
				idea.attr = {
					style: {
						width: 499.2
					}
				};
				expect(domMapController.dimensionProvider(idea)).toEqual({width: 500, textWidth: 500, height: 789});
			});
			it('should use the width if greater than than the max unwrappable text width', function () {
				idea.attr = {
					style: {
						width: 500
					}
				};
				idea.title = 'some short words are in this title that is still a quite long piece of text';
				expect(domMapController.dimensionProvider(idea)).toEqual({width: 500, textWidth: 500, height: 789});
			});
			it('should use max unwrappable text width if greater than the prefferred width', function () {
				idea.attr = {
					style: {
						width: 500
					}
				};
				idea.title = 'someWshortWwordsWareWinWthisWtitleWthatWisWstillWaWquiteWlongWpieceWofWtext';
				expect(domMapController.dimensionProvider(idea).width).toBeGreaterThan(500);
			});
		});
		it('takes level into consideration when calculating node dimensions', function () {
			newElement = jQuery('<style type="text/css">' +
				'.mapjs-node { width:356px !important; min-height:389px !important} ' +
				'.mapjs-node[mapjs-level="1"] { width:456px !important; min-height:789px !important} ' +
				'</style>').appendTo(stage);
			expect(domMapController.dimensionProvider(idea, 1)).toEqual({width: 456, textWidth: 29, height: 789});
			expect(domMapController.dimensionProvider(idea, 2)).toEqual({width: 356, textWidth: 29, height: 389});

		});
		it('applies the updateNodeContent function while calculating dimensions', function () {
			jQuery.fn.updateNodeContent = function () {
				this.css('width', '654px');
				this.css('height', '786px');
				jQuery('<div>').attr('data-mapjs-role', 'title').css('width', '123px').appendTo(this);
				return this;
			};
			expect(domMapController.dimensionProvider(idea)).toEqual({width: 654, textWidth: 123, height: 786});
		});
		describe('caching', function () {
			beforeEach(function () {
				jQuery.fn.updateNodeContent = jasmine.createSpy();
				jQuery.fn.updateNodeContent.and.callFake(function () {
					this.css('width', '654px');
					this.css('height', '786px');
					jQuery('<div>').attr('data-mapjs-role', 'title').css('width', '123px').appendTo(this);
					return this;
				});
				newElement = jQuery('<div>').data({width: 111, textWidth: 132, height: 222}).attr('id', 'node_foo_1').appendTo(stage);
			});
			it('looks up a DOM object with the matching node ID and if the node cache mark matches, returns the DOM width without re-applying content', function () {
				newElement.data('nodeCacheMark', nodeCacheMark(idea, {theme: themeFromSource}));
				expect(domMapController.dimensionProvider(idea)).toEqual({width: 111, textWidth: 132, height: 222});
				expect(jQuery.fn.updateNodeContent).not.toHaveBeenCalled();
			});
			it('ignores DOM objects where the cache mark does not match', function () {
				newElement.data('nodeCacheMark', nodeCacheMark(idea, {theme: themeFromSource}));
				expect(domMapController.dimensionProvider(_.extend(idea, {title: 'not zeka'}))).toEqual({width: 654, textWidth: 123, height: 786});
				expect(jQuery.fn.updateNodeContent).toHaveBeenCalled();
			});
			it('passes the level as an override when finding the cache mark', function () {
				idea.level = 5;
				newElement.data('nodeCacheMark', nodeCacheMark(idea, {theme: themeFromSource}));
				idea.level = undefined;
				expect(domMapController.dimensionProvider(idea, 5)).toEqual({width: 111, textWidth: 132, height: 222});
				expect(jQuery.fn.updateNodeContent).not.toHaveBeenCalled();
			});
		});
	});
	describe('event actions', function () {
		describe('nodeCreated', function () {
			describe('adds a DIV for the node to the stage', function () {
				let underTest, node;

				beforeEach(function () {
					node = {id: '11.12^13#AB-c', title: 'zeka', x: 10, y: 20, width: 30, height: 40};
					spyOn(jQuery.fn, 'updateNodeContent').and.callFake(function () {
						this.data(node);
						this.css('height', 40);
						this.css('width', 30);
						return this;
					});
					stage.data('offsetX', 200);
					stage.data('offsetY', 100);
					stage.data('scale', 3);

					mapModel.dispatchEvent('nodeCreated', node);
					underTest = stage.children('[data-mapjs-role=node]').first();
				});
				it('sanitises the ID by replacing non alphanumeric chars with underscores', function () {
					expect(underTest.attr('id')).toBe('node_11_12_13_AB-c');
				});
				it('makes the node focusable by adding a tabindex', function () {
					expect(underTest.attr('tabIndex')).toBe('0');
				});
				it('assigns the node role', function () {
					expect(underTest.attr('data-mapjs-role')).toBe('node');
				});
				it('adds an absolute position so it can move and have width', function () {
					expect(underTest.css('display')).toBe('block');
					expect(underTest.css('position')).toBe('absolute');
				});
				it('assigns a mapjs-node css class', function () {
					expect(underTest.hasClass('mapjs-node')).toBeTruthy();
				});
				it('updates the node content', function () {
					expect(jQuery.fn.updateNodeContent).toHaveBeenCalledWith(node, themeFromSource, {resourceTranslator: resourceTranslator});
					expect(jQuery.fn.updateNodeContent).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.updateNodeContent.calls.count()).toBe(1);
				});
				it('connects the node tap event to mapModel clickNode', function () {
					const event = jQuery.Event('tap');
					underTest.trigger(event);
					expect(mapModel.clickNode).toHaveBeenCalledWith('11.12^13#AB-c', event);
				});
				it('does not forward right-click events to the mapModel clickNode to avoid double processing', function () {
					const event = jQuery.Event('tap', {gesture: { stopPropagation: jasmine.createSpy(), srcEvent: { button: 1}}});
					underTest.trigger(event);
					expect(mapModel.clickNode).not.toHaveBeenCalled();
				});
				it('selects the node and forwards the contextMenu event by dispatching it for the mapModel', function () {
					mapModel.requestContextMenu.and.returnValue(true);
					const event = jQuery.Event('contextmenu', {pageX: 111, pageY: 112});
					underTest.trigger(event);
					expect(mapModel.selectNode).toHaveBeenCalledWith('11.12^13#AB-c');
					expect(mapModel.requestContextMenu).toHaveBeenCalledWith(111, 112);
					expect(event.isDefaultPrevented()).toBeTruthy();
					expect(event.result).toBe(false);
				});
				it('does not prevent the default on context menu if mapModel returns false from the context menu request', function () {
					mapModel.requestContextMenu.and.returnValue(false);
					const event = jQuery.Event('contextmenu', {pageX: 111, pageY: 112});
					underTest.trigger(event);
					expect(mapModel.selectNode).toHaveBeenCalledWith('11.12^13#AB-c');
					expect(mapModel.requestContextMenu).toHaveBeenCalledWith(111, 112);
					expect(event.isDefaultPrevented()).toBeFalsy();
					expect(event.result).toBeUndefined();
				});
				it('connects the node double-tap event to toggleCollapse if editing is disabled', function () {
					mapModel.isEditingEnabled.and.returnValue(false);
					underTest.trigger('doubletap');
					expect(mapModel.toggleCollapse).toHaveBeenCalledWith('mouse');
					expect(mapModel.editNode).not.toHaveBeenCalled();
				});
				it('connects the node double-tap event to node editing if editing is enabled', function () {
					mapModel.isEditingEnabled.and.returnValue(true);
					underTest.trigger('doubletap');
					expect(mapModel.toggleCollapse).not.toHaveBeenCalled();
					expect(mapModel.editNode).toHaveBeenCalledWith('mouse');
				});
				it('connects attachment-click with openAttachment even when editing is disabled', function () {
					mapModel.isEditingEnabled.and.returnValue(false);
					underTest.trigger('attachment-click');
					expect(mapModel.openAttachment).toHaveBeenCalledWith('mouse', '11.12^13#AB-c');
				});
				it('fixes the width of the node so it does not condense on movements', function () {
					expect(underTest.css('min-width')).toBe('30px');
				});
				it('sets the screen coordinates according to data attributes, ignoring stage zoom and transformations', function () {
					expect(underTest.css('top')).toBe('20px');
					expect(underTest.css('left')).toBe('10px');
				});
			});
			describe('grows the stage if needed to fit in', function () {
				beforeEach(function () {
					stage.data({offsetX: 200, offsetY: 100, width: 300, height: 150});
					spyOn(jQuery.fn, 'updateStage').and.callThrough();
				});

				it('grows the stage from the top if y would be negative', function () {
					mapModel.dispatchEvent('nodeCreated', {x: 20, y: -120, width: 20, height: 10, title: 'zeka', id: 1});
					expect(stage.data('offsetY')).toBe(120);
					expect(stage.data('height')).toBe(170);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
				it('grows the stage from the left if x would be negative', function () {
					mapModel.dispatchEvent('nodeCreated', {x: -230, y: 20, width: 20, height: 10, title: 'zeka', id: 1});
					expect(stage.data('offsetX')).toBe(230);
					expect(stage.data('width')).toBe(330);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
				it('expands the stage min width without touching the offset if the total width would be over the current boundary', function () {
					mapModel.dispatchEvent('nodeCreated', {x: 80, y: 20, width: 40, height: 10, title: 'zeka', id: 1});
					expect(stage.data('width')).toBe(320);
					expect(stage.data('offsetX')).toBe(200);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
				it('expands the stage min height without touching the offset if the total height would be over the current boundary', function () {
					mapModel.dispatchEvent('nodeCreated', {x: 80, y: 20, width: 40, height: 60, title: 'zeka', id: 1});
					expect(stage.data('height')).toBe(180);
					expect(stage.data('offsetY')).toBe(100);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
				it('does not expand the stage or call updateStage if the node would fit into current bounds', function () {
					mapModel.dispatchEvent('nodeCreated', {x: -10, y: -10, width: 20, height: 20, title: 'zeka', id: 1});
					expect(stage.data('width')).toBe(300);
					expect(stage.data('height')).toBe(150);
					expect(stage.data('offsetX')).toBe(200);
					expect(stage.data('offsetY')).toBe(100);
					expect(jQuery.fn.updateStage).not.toHaveBeenCalled();
				});
			});
			describe('holding node action', function () {
				let underTest, holdEvent;
				beforeEach(function () {
					mapModel = observable(jasmine.createSpyObj('mapModel', ['setLayoutCalculator', 'selectConnector', 'getReorderBoundary', 'dropImage', 'clickNode', 'positionNodeAt', 'dropNode', 'openAttachment', 'toggleCollapse', 'undo', 'editNode', 'isEditingEnabled', 'editNode', 'setInputEnabled', 'getInputEnabled', 'updateTitle', 'getNodeIdAtPosition', 'selectNode', 'getCurrentlySelectedIdeaId', 'requestContextMenu', 'setNodeWidth']));
					holdEvent = jQuery.Event('hold',
						{
							gesture: {
								center: {pageX: 70, pageY: 50},
								preventDefault: jasmine.createSpy(),
								stopPropagation: jasmine.createSpy(),
								srcEvent: 'the real event'
							}
						});
				});
				it('is not applicable to non touch devices', function () {
					mapModel.dispatchEvent('nodeCreated', {x: 20, y: -120, width: 20, height: 10, title: 'zeka', id: 1});
					underTest = stage.children('[data-mapjs-role=node]').first();
					spyOn(mapModel, 'dispatchEvent').and.callThrough();

					underTest.trigger(holdEvent);

					expect(mapModel.dispatchEvent).not.toHaveBeenCalled();
					expect(mapModel.clickNode).not.toHaveBeenCalled();
				});
				it('on touch devices sends clickNode message to map model and requests the context menu to be shown', function () {
					stage.remove();
					stage = jQuery('<div>').css('overflow', 'scroll').appendTo(viewPort);
					domMapController = new DomMapController(mapModel, stage, true, undefined, themeSource);
					mapModel.dispatchEvent('nodeCreated', {x: 20, y: -120, width: 20, height: 10, title: 'zeka', id: 1});
					underTest = stage.children('[data-mapjs-role=node]').first();

					underTest.trigger(holdEvent);

					expect(mapModel.clickNode).toHaveBeenCalledWith(1, 'the real event');
					expect(mapModel.requestContextMenu).toHaveBeenCalledWith(70, 50);
				});

			});
			describe('drag and drop features', function () {
				let underTest, noShift, withShift, outsideViewport, reorderBoundary;
				beforeEach(function () {
					mapModel.dispatchEvent('nodeCreated', {x: 20, y: -120, width: 20, level: 2, height: 10, title: 'zeka', id: 1});
					mapModel.dispatchEvent('nodeCreated', {x: 20, y: -120, width: 20, level: 1, height: 10, title: 'zeka', id: 2});
					mapModel.dispatchEvent('nodeCreated', {x: 20, y: -120, width: 20, level: 2, height: 10, title: 'zeka', id: 3});
					jQuery('#node_3').addClass('droppable');
					underTest = jQuery('#node_1');
					reorderBoundary = [{
						edge: 'left',
						maxY: 130,
						minY: 120,
						x: 110,
						margin: 10
					}];
					mapModel.getReorderBoundary.and.returnValue(reorderBoundary);
					underTest.trigger(jQuery.Event('mm:start-dragging', {relatedTarget: underTest[0]}));
					viewPort.css({'width': '1000px', 'height': '500px', 'overflow': 'scroll', 'top': '10px', 'left': '10px', 'position': 'absolute'});
					stage.data({offsetX: 200, offsetY: 100, width: 3000, height: 1500, scale: 2}).updateStage();

					viewPort.scrollLeft(20);
					viewPort.scrollTop(10);
					noShift = {gesture: {center: {pageX: 70, pageY: 50}, deltaX: -30, deltaY: -20}, finalPosition: {left: 614, top: 446} };
					withShift = {gesture: {srcEvent: {shiftKey: true}, center: {pageX: 70, pageY: 50}}, finalPosition: {left: 614, top: 446}};
					outsideViewport = {gesture: {srcEvent: {shiftKey: true}, center: {pageX: 1100, pageY: 446}}};
				});
				it('should set node width when resized', function () {
					underTest.trigger(jQuery.Event('mm:resize', {nodeWidth: 120}));
					expect(mapModel.setNodeWidth).toHaveBeenCalledWith('mouse', 1, 120);
				});
				describe('when dragging', function () {
					it('assigns a dragging class', function () {
						expect(underTest.hasClass('dragging')).toBeTruthy();
					});

					it('clears the current droppable if drag event does not have a scrieen position', function () {
						underTest.trigger('mm:drag');
						expect(jQuery('#node_3').hasClass('droppable')).toBeFalsy();
					});
					it('works out the stage position from the page drop position and calls mapModel.getNodeIdAtPosition', function () {
						underTest.trigger(jQuery.Event('mm:drag', noShift));
						expect(mapModel.getNodeIdAtPosition).toHaveBeenCalledWith(-160, -75);
					});
					describe('when over a node', function () {
						beforeEach(function () {
							mapModel.getNodeIdAtPosition.and.returnValue(2);
						});
						it('sets draggable class on the node', function () {
							underTest.trigger(jQuery.Event('mm:drag', noShift));
							expect(jQuery('#node_2').hasClass('droppable')).toBeTruthy();
							expect(jQuery('#node_3').hasClass('droppable')).toBeFalsy();
						});
						it('hides reorder bounds even when the drag object is within reorder bounds', function () {
							noShift.currentPosition = noShift.finalPosition;
							underTest.trigger(jQuery.Event('mm:drag', noShift));
							expect(stage.find('[data-mapjs-role=reorder-bounds]').length).toBeTruthy();
							expect(stage.find('[data-mapjs-role=reorder-bounds]').css('display')).toBe('none');
						});
					});
					describe('when over the background', function () {
						beforeEach(function () {
							mapModel.getNodeIdAtPosition.and.returnValue(false);
						});
						it('removes the draggable class from all nodes', function () {
							underTest.trigger(jQuery.Event('mm:drag', noShift));
							expect(jQuery('#node_2').hasClass('droppable')).toBeFalsy();
							expect(jQuery('#node_3').hasClass('droppable')).toBeFalsy();
						});
						describe('when reorder boundary set with x and margin', function () {
							it('hides the reorder boundary if current position is above the bounds', function () {
								noShift.currentPosition = noShift.finalPosition;
								noShift.currentPosition.top -= 30;
								underTest.trigger(jQuery.Event('mm:drag', noShift));
								expect(stage.find('[data-mapjs-role=reorder-bounds]').length).toBeTruthy();
								expect(stage.find('[data-mapjs-role=reorder-bounds]').css('display')).toBe('none');
							});
							it('shows the reorder boundary if current position is within the bounds', function () {
								noShift.currentPosition = noShift.finalPosition;
								underTest.trigger(jQuery.Event('mm:drag', noShift));
								expect(stage.find('[data-mapjs-role=reorder-bounds]').length).toBeTruthy();
								expect(stage.find('[data-mapjs-role=reorder-bounds]').css('display')).not.toBe('none');
							});
						});
						describe('when reorder boundary set with minX and maxX', function () {
							beforeEach(function () {
								/* box position is 112, 123 */
								reorderBoundary[0] = {
									edge: 'top',
									maxY: 130,
									minY: 120,
									minX: 110,
									maxX: 120
								};
							});
							it('hides the reorder boundary if current position is above the bounds', function () {
								noShift.currentPosition = noShift.finalPosition;
								noShift.currentPosition.top -= 30;
								underTest.trigger(jQuery.Event('mm:drag', noShift));
								expect(stage.find('[data-mapjs-role=reorder-bounds]').length).toBeTruthy();
								expect(stage.find('[data-mapjs-role=reorder-bounds]').css('display')).toBe('none');
							});
							it('shows the reorder boundary if current position is within the bounds', function () {
								noShift.currentPosition = noShift.finalPosition;
								underTest.trigger(jQuery.Event('mm:drag', noShift));
								expect(stage.find('[data-mapjs-role=reorder-bounds]').length).toBeTruthy();
								expect(stage.find('[data-mapjs-role=reorder-bounds]').css('display')).not.toBe('none');
							});

						});
						it('hides the reorder boundary if shift is pressed', function () {
							withShift.currentPosition = noShift.finalPosition;
							underTest.trigger(jQuery.Event('mm:drag', withShift));
							expect(stage.find('[data-mapjs-role=reorder-bounds]').length).toBeTruthy();
							expect(stage.find('[data-mapjs-role=reorder-bounds]').css('display')).toBe('none');
						});
					});
					describe('when over itself', function () {
						beforeEach(function () {
							mapModel.getNodeIdAtPosition.and.returnValue(1);
						});
						it('removes the draggable class from all nodes', function () {
							underTest.trigger(jQuery.Event('mm:drag', noShift));
							expect(jQuery('#node_1').hasClass('droppable')).toBeFalsy();
						});
					});
				});
				describe('when dragging is cancelled', function () {
					beforeEach(function () {
						stage.find('[data-mapjs-role=reorder-bounds]').show();
						underTest.trigger('mm:cancel-dragging');
					});
					it('removes the dragging class', function () {
						expect(underTest.hasClass('dragging')).toBeFalsy();
					});
					it('removes the dropppable class', function () {
						expect(jQuery('#node_3').hasClass('droppable')).toBeFalsy();
					});
					it('hides reorder bounds', function () {
						expect(stage.find('[data-mapjs-role=reorder-bounds]').css('display')).toBe('none');
					});
				});
				describe('when dragging stops', function () {
					it('hides reorder bounds', function () {
						stage.find('[data-mapjs-role=reorder-bounds]').show();
						underTest.trigger('mm:stop-dragging');
						expect(stage.find('[data-mapjs-role=reorder-bounds]').css('display')).toBe('none');
					});
					it('removes the dragging class', function () {
						underTest.trigger('mm:stop-dragging');
						expect(underTest.hasClass('dragging')).toBeFalsy();
					});
					it('removes the droppable class', function () {
						underTest.trigger('mm:stop-dragging');
						expect(jQuery('#node_3').hasClass('droppable')).toBeFalsy();
					});

					it('calls getNodeIdAtPosition to work out if it got dropped on a node', function () {
						underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
						expect(mapModel.getNodeIdAtPosition).toHaveBeenCalledWith(-160, -75);
					});
					describe('when dropped on a node', function () {
						beforeEach(function () {
							mapModel.getNodeIdAtPosition.and.returnValue(2);
						});
						it('calls dropNode and passes the dropped node ID', function () {
							underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
							expect(mapModel.dropNode).toHaveBeenCalledWith(1, 2, false);
						});
						it('passes shiftKey status', function () {
							underTest.trigger(jQuery.Event('mm:stop-dragging', withShift));
							expect(mapModel.dropNode).toHaveBeenCalledWith(1, 2, true);
						});
						it('does not set event result to false by default', function () {
							const e = jQuery.Event('mm:stop-dragging', withShift);
							underTest.trigger(e);
							expect(e.result).toBeUndefined();
						});
						it('sets the result to false if dropNode returns false', function () {
							mapModel.dropNode.and.returnValue(false);
							const e = jQuery.Event('mm:stop-dragging', withShift);
							underTest.trigger(e);
							expect(e.result === false).toBeTruthy();
						});
					});
					describe('when level > 1 dropped on background', function () {
						beforeEach(function () {
							mapModel.getNodeIdAtPosition.and.returnValue(false);
						});
						it('calls positionNode and passes the current drop position if not manual', function () {
							underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
							expect(mapModel.positionNodeAt).toHaveBeenCalledWith(1, -160, -75, /*112, 123, */ false);
						});
						it('calls positionNode and passes the current DOM position if  manual', function () {
							underTest.trigger(jQuery.Event('mm:stop-dragging', withShift));
							expect(mapModel.positionNodeAt).toHaveBeenCalledWith(1, 112, 123, true);
						});
						describe('reorder or manual position check', function () {
							it('does not position manually inside reorder bounds', function () {
								underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
								expect(mapModel.positionNodeAt.calls.mostRecent().args[3]).toBeFalsy();
							});
							it('forces manual position right of reorder bounds', function () {
								noShift.finalPosition.left += 60;
								underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
								expect(mapModel.positionNodeAt.calls.mostRecent().args[3]).toBeTruthy();
							});
							it('forces manual position left of reorder bounds', function () {
								noShift.finalPosition.left -= 60;
								underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
								expect(mapModel.positionNodeAt.calls.mostRecent().args[3]).toBeTruthy();
							});
							it('forces manual position top of reorder bounds', function () {
								noShift.finalPosition.top -= 30;
								underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
								expect(mapModel.positionNodeAt.calls.mostRecent().args[3]).toBeTruthy();
							});
							it('forces manual position below of reorder bounds', function () {
								noShift.finalPosition.top += 30;
								underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
								expect(mapModel.positionNodeAt.calls.mostRecent().args[3]).toBeTruthy();
							});
							it('forces manual positioning if shift is pressed even within bounds', function () {
								underTest.trigger(jQuery.Event('mm:stop-dragging', withShift));
								expect(mapModel.positionNodeAt.calls.mostRecent().args[3]).toBeTruthy();
							});
						});
						it('does not set event result to false by default', function () {
							const e = jQuery.Event('mm:stop-dragging', withShift);
							underTest.trigger(e);
							expect(e.result).toBeUndefined();
						});
						it('sets the result to false if dropNode returns false', function () {
							mapModel.positionNodeAt.and.returnValue(false);
							const e = jQuery.Event('mm:stop-dragging', withShift);
							underTest.trigger(e);
							expect(e.result === false).toBeTruthy();
						});
					});
					it('manually positions level 1 nodes when dropped on a background', function () {

						underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
						mapModel.positionNodeAt.calls.reset();

						underTest = jQuery('#node_2');
						mapModel.getReorderBoundary.and.returnValue(false);
						underTest.trigger('mm:start-dragging');

						const e = jQuery.Event('mm:stop-dragging', noShift);
						mapModel.positionNodeAt.and.returnValue(true);
						underTest.trigger(e);
						expect(mapModel.positionNodeAt).toHaveBeenCalledWith(2, 112, 123, true);
						expect(e.result).toBe(true);
					});
					it('does not position node and does not returns false when dropped outside viewport', function () {
						mapModel.getNodeIdAtPosition.and.returnValue(false);
						const e = jQuery.Event('mm:stop-dragging', outsideViewport);
						underTest.trigger(e);
						expect(mapModel.positionNodeAt).not.toHaveBeenCalled();
						expect(e.result).toBeUndefined();
					});
					describe('when dropped on itself', function () {
						beforeEach(function () {
							mapModel.getNodeIdAtPosition.and.returnValue(1);
							underTest.css({position: 'absolute', top: '123px', left: '112px'});
						});
						it('triggers automatic positioning to drop coordinates if within reorder bounds', function () {
							underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
							expect(mapModel.positionNodeAt).toHaveBeenCalledWith(1, -160, -75, /*112, 123,*/ false);
							expect(mapModel.dropNode).not.toHaveBeenCalled();
						});
						it('triggers manual positioning to DOM coordinates outside of reorder bounds', function () {
							noShift.finalPosition.left += 60;
							underTest.trigger(jQuery.Event('mm:stop-dragging', noShift));
							expect(mapModel.positionNodeAt).toHaveBeenCalledWith(1, 142, 123, true);
							expect(mapModel.dropNode).not.toHaveBeenCalled();
						});
						it('triggers manual positioning if shift is pressed', function () {
							underTest.trigger(jQuery.Event('mm:stop-dragging', withShift));
							expect(mapModel.positionNodeAt).toHaveBeenCalledWith(1, 112, 123, true);
							expect(mapModel.dropNode).not.toHaveBeenCalled();
						});
					});
				});
			});

		});
		describe('activatedNodesChanged', function () {
			let nodes;
			beforeEach(function () {
				nodes = [];
				for (let i = 0; i < 4; i++) {
					nodes.push(jQuery('<div>').attr('id', 'node_' + i).appendTo(stage));
				}
			});
			it('adds the activated class to all the activated nodes', function () {
				mapModel.dispatchEvent('activatedNodesChanged', [1, 2], []);
				expect(nodes[0].hasClass('activated')).toBeFalsy();
				expect(nodes[1].hasClass('activated')).toBeTruthy();
				expect(nodes[2].hasClass('activated')).toBeTruthy();
				expect(nodes[3].hasClass('activated')).toBeFalsy();
			});
			it('removes the activated class from all deactivated nodes', function () {
				nodes[2].addClass('activated');
				nodes[3].addClass('activated');
				mapModel.dispatchEvent('activatedNodesChanged', [], [2, 3]);
				expect(nodes[0].hasClass('activated')).toBeFalsy();
				expect(nodes[1].hasClass('activated')).toBeFalsy();
				expect(nodes[2].hasClass('activated')).toBeFalsy();
				expect(nodes[3].hasClass('activated')).toBeFalsy();
			});
			it('applies both operations at the same time', function () {
				nodes[2].addClass('activated');
				nodes[3].addClass('activated');
				mapModel.dispatchEvent('activatedNodesChanged', [1], [2, 3]);
				expect(nodes[0].hasClass('activated')).toBeFalsy();
				expect(nodes[1].hasClass('activated')).toBeTruthy();
				expect(nodes[2].hasClass('activated')).toBeFalsy();
				expect(nodes[3].hasClass('activated')).toBeFalsy();
			});
		});
		describe('nodeSelectionChanged', function () {
			let underTest;
			beforeEach(function () {
				const node = {id: '11.12', title: 'zeka', x: -80, y: -35, width: 30, height: 20};
				spyOn(jQuery.fn, 'updateNodeContent').and.callFake(function () {
					this.css('height', 40);
					this.css('width', 30);
					this.data(node);
					return this;
				});
				viewPort.css({'width': '200', 'height': '100', 'overflow': 'scroll'});
				stage.data({
					'offsetX': 100,
					'offsetY': 50,
					'scale': 2,
					'width': 500,
					'height': 500
				});
				stage.updateStage();
				viewPort.scrollLeft(180);
				viewPort.scrollTop(80);

				mapModel.dispatchEvent('nodeCreated', node);
				underTest = stage.children('[data-mapjs-role=node]').first();
				spyOn(jQuery.fn, 'focus').and.callThrough();
				spyOn(jQuery.fn, 'animate');
			});
			describe('when deselected', function () {
				beforeEach(function () {
					underTest.addClass('selected');
					mapModel.dispatchEvent('nodeSelectionChanged', '11.12', false);
				});
				it('removes the selected class', function () {
					expect(underTest.hasClass('selected')).toBeFalsy();
				});
				it('does not move the viewport', function () {
					expect(viewPort.scrollLeft()).toBe(180);
					expect(viewPort.scrollTop()).toBe(80);
				});
				it('does not request focus or animate', function () {
					expect(jQuery.fn.focus).not.toHaveBeenCalled();
					expect(jQuery.fn.animate).not.toHaveBeenCalled();
				});
			});
			describe('when selected', function () {
				describe('when node is visible', function () {
					beforeEach(function () {
						viewPort.scrollLeft(5);
						viewPort.scrollTop(3);
						mapModel.getCurrentlySelectedIdeaId.and.returnValue('11.12');
						mapModel.dispatchEvent('nodeSelectionChanged', '11.12', true);
					});
					it('adds the selected class immediately', function () {
						expect(underTest.hasClass('selected')).toBeTruthy();
					});

					it('does not animate', function () {
						expect(jQuery.fn.animate).not.toHaveBeenCalled();
					});
				});

				_.each([
					['left', -80, 0, {scrollLeft: 30}],
					['top', 0, -20, {scrollTop: 50}],
					['left', -80, 0, {scrollLeft: 30}],
					['top left', -80, -20, {scrollLeft: 30, scrollTop: 50}],
					['right', 90, 0, {scrollLeft: 250}],
					['bottom', 0, 80, {scrollTop: 210}],
					['bottom right', 90, 80, {scrollTop: 210, scrollLeft: 250}]
				], function (testArgs) {
					const caseName = testArgs[0],
						nodeX = testArgs[1],
						nodeY = testArgs[2],
						expectedAnimation = testArgs[3];
					describe('when ' + caseName + ' of viewport', function () {
						beforeEach(function () {
							underTest.data('x', nodeX);
							underTest.data('y', nodeY);
							mapModel.getCurrentlySelectedIdeaId.and.returnValue('11.12');
							mapModel.dispatchEvent('nodeSelectionChanged', '11.12', true);
						});
						it('immediately adds the selected class', function () {
							expect(underTest.hasClass('selected')).toBeTruthy();
						});
						it('animates scroll movements to show selected node', function () {
							expect(jQuery.fn.animate).toHaveBeenCalledOnJQueryObject(viewPort);
							expect(jQuery.fn.animate.calls.first().args[0]).toEqual(expectedAnimation);
						});
					});
				});
			});
		});
		describe('nodeVisibilityRequested', function () {
			let underTest;
			beforeEach(function () {
				const node = {id: '11.12', title: 'zeka', x: -80, y: -35, width: 30, height: 20};
				spyOn(jQuery.fn, 'updateNodeContent').and.callFake(function () {
					this.css('height', 40);
					this.css('width', 30);
					this.data(node);
					return this;
				});
				viewPort.css({'width': '200', 'height': '100', 'overflow': 'scroll'});
				stage.data({
					'offsetX': 100,
					'offsetY': 50,
					'scale': 2,
					'width': 500,
					'height': 500
				});
				stage.updateStage();
				viewPort.scrollLeft(180);
				viewPort.scrollTop(80);
				mapModel.dispatchEvent('nodeCreated', node);
				underTest = stage.children('[data-mapjs-role=node]').first();
				spyOn(jQuery.fn, 'animate').and.callThrough();
			});
			it('should animate scroll movement to show the node', function () {
				underTest.data('x', -80);
				underTest.data('y', -20);
				mapModel.getCurrentlySelectedIdeaId.and.returnValue('11.12');
				mapModel.dispatchEvent('nodeVisibilityRequested', '11.12');
				expect(jQuery.fn.animate).toHaveBeenCalledOnJQueryObject(viewPort);
				expect(jQuery.fn.animate.calls.first().args[0]).toEqual({scrollLeft: 30, scrollTop: 50});
			});
		});

		describe('nodeRemoved', function () {
			let underTest, node;
			beforeEach(function () {
				node = {id: '11', title: 'zeka', x: -80, y: -35, width: 30, height: 20};
				mapModel.dispatchEvent('nodeCreated', node);
				underTest = stage.children('[data-mapjs-role=node]').first();
				spyOn(jQuery.fn, 'queueFadeOut');
			});
			it('animates a fade-out', function () {
				const theme = new Theme({name: 'test'});
				setTheme(theme);
				mapModel.dispatchEvent('nodeRemoved', node);
				expect(jQuery.fn.queueFadeOut).toHaveBeenCalledOnJQueryObject(underTest);
				expect(jQuery.fn.queueFadeOut.calls.mostRecent().args).toEqual([theme]);
			});
		});
		describe('nodeMoved', function () {
			let underTest, node;
			beforeEach(function () {
				node = {id: 1, title: 'zeka', x: 0, y: 0, width: 20, height: 10};
				stage.data({offsetX: 200, offsetY: 100, width: 300, height: 150});
				mapModel.dispatchEvent('nodeCreated', node);
				underTest = stage.children('[data-mapjs-role=node]').first();

				spyOn(jQuery.fn, 'updateStage').and.callThrough();
			});
			it('sets the new data coordinates', function () {
				mapModel.dispatchEvent('nodeMoved', {x: 20, y: -120, width: 200, height: 100, title: 'zeka', id: 1});
				expect(underTest.data('x')).toBe(20);
				expect(underTest.data('y')).toBe(-120);
				expect(underTest.data('width')).toBe(200);
				expect(underTest.data('height')).toBe(100);
			});
			it('rounds the coordinates for performance', function () {
				mapModel.dispatchEvent('nodeMoved', {x: 20.11, y: -119.99, width: 200.4, height: 99.8, title: 'zeka', id: 1});
				expect(underTest.data('x')).toBe(20);
				expect(underTest.data('y')).toBe(-120);
				expect(underTest.data('width')).toBe(200);
				expect(underTest.data('height')).toBe(100);
			});
			describe('expands the stage if needed - using a margin', function () {
				beforeEach(function () {
					domMapController.setStageMargin({top: 10, left: 11, bottom: 12, right: 13});
				});
				it('grows the stage from the top if y would be negative', function () {
					mapModel.dispatchEvent('nodeMoved', {x: 20, y: -120, width: 20, height: 10, title: 'zeka', id: 1});
					expect(stage.data('offsetY')).toBe(130);
					expect(stage.data('height')).toBe(180);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
				it('grows the stage from the left if x would be negative', function () {
					mapModel.dispatchEvent('nodeMoved', {x: -230, y: 20, width: 20, height: 10, title: 'zeka', id: 1});
					expect(stage.data('offsetX')).toBe(241);
					expect(stage.data('width')).toBe(341);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
				it('expands the stage min width without touching the offset if the total width would be over the current boundary', function () {
					mapModel.dispatchEvent('nodeMoved', {x: 90, y: 20, width: 20, height: 10, title: 'zeka', id: 1});
					expect(stage.data('width')).toBe(323);
					expect(stage.data('offsetX')).toBe(200);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
				it('expands the stage min height without touching the offset if the total height would be over the current boundary', function () {
					mapModel.dispatchEvent('nodeMoved', {x: 20, y: 45, width: 20, height: 10, title: 'zeka', id: 1});
					expect(stage.data('height')).toBe(167);
					expect(stage.data('offsetY')).toBe(100);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
				it('does not expand the stage or call updateStage if the node would fit into current bounds', function () {
					mapModel.dispatchEvent('nodeMoved', {x: -10, y: -10, width: 20, height: 10, title: 'zeka', id: 1});
					expect(stage.data('width')).toBe(300);
					expect(stage.data('height')).toBe(150);
					expect(stage.data('offsetX')).toBe(200);
					expect(stage.data('offsetY')).toBe(100);
					expect(jQuery.fn.updateStage).not.toHaveBeenCalled();
				});
			});

			describe('viewport interactions', function () {
				let moveListener, animateMoveListener;
				beforeEach(function () {
					viewPort.css({'width': '200', 'height': '100', 'overflow': 'scroll'});
					stage.data({ 'offsetX': 100, 'offsetY': 50, 'scale': 2, 'width': 500, 'height': 500 });
					stage.updateStage();
					viewPort.scrollLeft(180);
					viewPort.scrollTop(80);
					moveListener = jasmine.createSpy('mapjs:move');
					animateMoveListener = jasmine.createSpy('mapjs:animatemove');
					underTest.on('mapjs:move', moveListener).on('mapjs:animatemove', animateMoveListener);
					spyOn(jQuery.fn, 'animate').and.returnValue(underTest);
				});
				_.each([
					['above', 20, -30],
					['below', 20, 45],
					['left of', -35, 10],
					['right of', 95, 10],
					['on left edge of', -20, 10],
					['on right edge of', 80, 10],
					['on top edge of', 20, -15],
					['on bottom edge of', 20, 35],
					['inside', 20, 10]
				], function (testArgs) {
					const caseName = testArgs[0], nodeX = testArgs[1], nodeY = testArgs[2];
					describe('when ' + caseName + ' viewport', function () {
						beforeEach(function () {
							mapModel.dispatchEvent('nodeMoved', {x: nodeX, y: nodeY, width: 20, height: 10, id: 1});
						});
						it('updates screen coordinates immediately', function () {
							expect(underTest.css('left')).toBe(nodeX + 'px');
							expect(underTest.css('top')).toBe(nodeY + 'px');
						});
						it('fires the moved event immediately', function () {
							expect(moveListener).toHaveBeenCalled();
						});
						it('does not fire the moveanimate event', function () {
							expect(animateMoveListener).not.toHaveBeenCalled();
						});
						it('does not schedule an animation', function () {
							expect(jQuery.fn.animate).not.toHaveBeenCalled();
						});
					});
				});
			});
		});
		_.each(['nodeTitleChanged', 'nodeAttrChanged', 'nodeLabelChanged'], function (eventType) {

			describe(eventType, () => {
				let underTest, node, theme;
				beforeEach(() => {
					stage.data({offsetX: 200, offsetY: 100, width: 300, height: 150});
					spyOn(jQuery.fn, 'updateStage').and.callThrough();

					node = {id: '11', title: 'zeka', x: -80, y: -35, width: 30, height: 20};
					theme = new Theme({name: 'test'});
					setTheme(theme);
					mapModel.dispatchEvent('nodeCreated', node);
					spyOn(jQuery.fn, 'updateNodeContent').and.callThrough();
				});
				it('updates node content on ' + eventType, function () {

					underTest = stage.children('[data-mapjs-role=node]').first();
					mapModel.dispatchEvent(eventType, node);
					expect(jQuery.fn.updateNodeContent).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.updateNodeContent).toHaveBeenCalledWith(node,
						themeFromSource,
						{
							resourceTranslator: resourceTranslator
						});
				});
				it('grows the stage', function () {
					node = {id: '11', title: 'zeka', x: -220, y: -350, width: 700, height: 900};
					mapModel.dispatchEvent(eventType, node);
					expect(stage.data('offsetX')).toBe(220);
					expect(stage.data('width')).toBe(700);
					expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
				});
			});
		});
		describe('nodeEditRequested', function () {
			let underTest, node, editPromise, editResolve, editReject;
			beforeEach(function () {
				node = {id: '11', title: 'zeka', x: -80, y: -35, width: 30, height: 20};
				mapModel.dispatchEvent('nodeCreated', node);
				underTest = stage.children('[data-mapjs-role=node]').first();
				editPromise = new Promise((resolve, reject) => {
					editResolve = resolve;
					editReject = reject;
				});
				spyOn(jQuery.fn, 'focus');
				spyOn(jQuery.fn, 'finish');
				spyOn(jQuery.fn, 'editNode').and.returnValue(editPromise);
			});
			describe('options', function () {
				describe('inlineEditingDisabled', function () {
					beforeEach(function () {
						viewPort.remove();
						spyOn(mapModel, 'addEventListener');
						viewPort = jQuery('<div>').appendTo('body');
						stage = jQuery('<div>').css('overflow', 'scroll').appendTo(viewPort);
						resourceTranslator = jasmine.createSpy('resourceTranslator');
					});
					it('should subscribe to mapModel nodeEditRequested event when no options supplied', function () {
						domMapController = new DomMapController(mapModel, stage, false, resourceTranslator, themeSource);
						expect(mapModel.addEventListener).toHaveBeenCalledWith('nodeEditRequested', jasmine.any(Function));
					});
					it('should subscribe to mapModel nodeEditRequested event when no options.inlineEditingDisabled is false', function () {
						domMapController = new DomMapController(mapModel, stage, false, resourceTranslator, themeSource, {inlineEditingDisabled: false});
						expect(mapModel.addEventListener).toHaveBeenCalledWith('nodeEditRequested', jasmine.any(Function));
					});
					it('should not subscribe to mapModel nodeEditRequested event when true', function () {
						domMapController = new DomMapController(mapModel, stage, false, resourceTranslator, themeSource, {inlineEditingDisabled: true});
						expect(mapModel.addEventListener).not.toHaveBeenCalledWith('nodeEditRequested', jasmine.any(Function));
					});
				});

			});
			describe('when editing an existing node', function () {
				beforeEach(function () {
					mapModel.dispatchEvent('nodeEditRequested', '11', false, false);
				});

				it('disables input on mapModel', function () {
					expect(mapModel.setInputEnabled).toHaveBeenCalledWith(false);
				});
				it('completes all viewport scrolling animations immediately - required to prevent loss of focus when viewport is scrolling', function () {
					expect(jQuery.fn.finish).toHaveBeenCalledOnJQueryObject(viewPort);
				});
				it('puts the node into edit mode', function () {
					expect(jQuery.fn.editNode).toHaveBeenCalledOnJQueryObject(underTest);
				});
				describe('when editing completes', function () {
					beforeEach(function (done) {
						mapModel.setInputEnabled.calls.reset();
						editPromise.then(done);
						editResolve('new text');
					});
					it('re-enables input on map model', function () {
						expect(mapModel.setInputEnabled).toHaveBeenCalledWith(true);
					});
					it('updates the node title', function () {
						expect(mapModel.updateTitle).toHaveBeenCalledWith('11', 'new text', false);
					});
					it('sets the focus back on the node', function () {
						expect(jQuery.fn.focus).toHaveBeenCalledOnJQueryObject(underTest);
					});
				});
				describe('when editing fails', function () {
					beforeEach(function () {
						mapModel.setInputEnabled.calls.reset();
					});
					it('re-enables input on map model', function (done) {
						editPromise.then(done.fail).catch(() => {
							expect(mapModel.setInputEnabled).toHaveBeenCalledWith(true);
						}).then(done, done.fail);
						editReject();
					});
					it('does not undo the last action', function (done) {
						editPromise.then(done.fail).catch(() => {
							expect(mapModel.undo).not.toHaveBeenCalled();
						}).then(done, done.fail);
						editReject();
					});
					it('sets the focus back on the node', function (done) {
						editPromise.then(done.fail).catch(() => {
							expect(jQuery.fn.focus).toHaveBeenCalledOnJQueryObject(underTest);
						}).then(done, done.fail);
						editReject();
					});
				});
			});
			describe('when editing an existing node', function () {
				beforeEach(function () {
					mapModel.dispatchEvent('nodeEditRequested', '11', false, true);
				});
				it('passes the editNew correctly to mapModel when updating the title', function (done) {
					editPromise.then(() => {
						expect(mapModel.updateTitle).toHaveBeenCalledWith('11', 'new text', true);
					}).then(done, done.fail);
					editResolve('new text');
				});
				it('calls undo to drop the newly added node when editing is cancelled', function (done) {
					editPromise.then(done.fail).catch(() => {
						expect(mapModel.undo).toHaveBeenCalled();
					}).then(done, done.fail);
					editReject();
				});
			});
		});
		describe('connector events', function () {
			let nodeFrom, nodeTo, underTest, connector, svgContainer, theme;
			beforeEach(function () {
				svgContainer = createSVG().attr({
					'data-mapjs-role': 'svg-container',
					'class': 'mapjs-draw-container'
				});
				stage.append(svgContainer);
				theme = new Theme({name: 'fromTest'});
				setTheme(theme);
				stage.attr('data-mapjs-role', 'stage');
				connector = {type: 'connector', from: '1.from', to: '1.to', attr: {lovely: true}};
				mapModel.dispatchEvent('nodeCreated', {id: '1.from', title: 'zeka', x: -80, y: -35, width: 30, height: 20});
				mapModel.dispatchEvent('nodeCreated', {id: '1.to', title: 'zeka2', x: 80, y: 35, width: 50, height: 34});
				nodeFrom = jQuery('#node_1_from');
				nodeTo = jQuery('#node_1_to');
				spyOn(jQuery.fn, 'createConnector').and.callThrough();
				spyOn(jQuery.fn, 'updateConnector').and.callThrough();
				mapModel.dispatchEvent('connectorCreated', connector);
				underTest = svgContainer.children('[data-mapjs-role=connector]').first();

			});
			describe('connectorCreated', function () {
				it('invokes createConnector with the theme options', () => {
					expect(jQuery.fn.createConnector).toHaveBeenCalledOnJQueryObject(svgContainer);
					expect(jQuery.fn.createConnector.calls.mostRecent().args).toEqual([connector, {theme: theme}]);
				});
				it('adds a connector element to the stage', function () {
					expect(underTest.length).toBe(1);
					expect(underTest.parent()[0]).toEqual(svgContainer[0]);
				});
				it('creates a SVG mapjs-draw-container class', function () {
					expect(underTest.prop('tagName')).toBe('g');
				});
				it('assigns the DOM Id by sanitising node IDs', function () {
					expect(underTest.prop('id')).toBe('connector_1_from_1_to');
				});
				it('maps the from and to nodes as jQuery objects to data properties', function () {
					expect(underTest.data('nodeFrom')[0]).toEqual(nodeFrom[0]);
					expect(underTest.data('nodeTo')[0]).toEqual(nodeTo[0]);
				});
				it('updates the connector content', function () {
					expect(jQuery.fn.updateConnector).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.updateConnector.calls.mostRecent().args).toEqual([{theme: theme}]);
				});
				it('sets the connector attributes as data', function () {
					expect(underTest.data('attr')).toEqual({lovely: true});
				});
				it('wires a link hit event to mapModel selectConnector', function () {
					const evt = new jQuery.Event('tap');
					underTest.find('path.mapjs-link-hit').trigger(evt);
					expect(mapModel.selectConnector).toHaveBeenCalledWith('mouse', connector, undefined);
					expect(evt.isPropagationStopped()).toBeTruthy();
				});
				it('wires a link hit event to mapModel selectConnector if the theme has connectorEditingContext set with allowed values', () => {
					theme = new Theme({name: 'fromTest', connectorEditingContext: {allowed: ['width']}});
					setTheme(theme);
					const evt = new jQuery.Event('tap');
					underTest.find('path.mapjs-link-hit').trigger(evt);
					expect(mapModel.selectConnector).toHaveBeenCalledWith('mouse', connector, undefined);
					expect(evt.isPropagationStopped()).toBeTruthy();
				});
				it('should ignore the link hit event if the theme has connectorEditingContext set with no allowed values', () => {
					theme = new Theme({name: 'fromTest', connectorEditingContext: {allowed: []}});
					setTheme(theme);
					const evt = new jQuery.Event('tap');
					underTest.find('path.mapjs-link-hit').trigger(evt);
					expect(mapModel.selectConnector).not.toHaveBeenCalled();
					expect(evt.isPropagationStopped()).toBeTruthy();
				});
				it('sends the gesture page coordinates if the gesture is supplied with the event', function () {
					const stopProp = jasmine.createSpy('stopProp'),
						evt = new jQuery.Event('tap', { gesture: {stopPropagation: stopProp, center: { pageX: 100, pageY: 200} } });

					underTest.find('path.mapjs-link-hit').trigger(evt);
					expect(mapModel.selectConnector).toHaveBeenCalledWith('mouse', connector, {x: 100, y: 200});
					expect(stopProp).toHaveBeenCalled();
				});
			});
			describe('connectorRemoved', function () {
				it('queues fadeout for the element', function () {
					spyOn(jQuery.fn, 'queueFadeOut').and.callThrough();
					mapModel.dispatchEvent('connectorRemoved', connector);
					expect(jQuery.fn.queueFadeOut).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.queueFadeOut.calls.mostRecent().args).toEqual([theme]);
				});
			});

			describe('connectorAttrChanged', function () {
				beforeEach(function () {
					connector.attr = {lovely: false};
				});
				it('updates the connector', function () {
					jQuery.fn.updateConnector.calls.reset();
					mapModel.dispatchEvent('connectorAttrChanged', connector);
					expect(jQuery.fn.updateConnector).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.updateConnector.calls.mostRecent().args).toEqual([{theme: theme}]);
				});
				it('updates the connector data attributes', function () {
					mapModel.dispatchEvent('connectorAttrChanged', connector);
					expect(underTest.data('attr')).toEqual({lovely: false});
				});
			});
			describe('connectorMoved', function () {
				beforeEach(function () {
					connector.attr = {lovely: false};
				});
				it('updates the connector', function () {
					jQuery.fn.updateConnector.calls.reset();
					mapModel.dispatchEvent('connectorMoved', connector);
					expect(jQuery.fn.updateConnector).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.updateConnector.calls.mostRecent().args).toEqual([{theme: theme}]);
				});
				it('does not update the connector data attributes', function () {
					mapModel.dispatchEvent('connectorMoved', connector);
					expect(underTest.data('attr')).toEqual({lovely: true});
				});
			});

		});


		describe('link events', function () {
			let nodeFrom, nodeTo, underTest, link, svgContainer, theme;
			beforeEach(function () {
				svgContainer = createSVG().attr({
					'data-mapjs-role': 'svg-container',
					'class': 'mapjs-draw-container'
				});
				theme = new Theme({name: 'new'});
				setTheme(theme);
				stage.append(svgContainer);
				stage.attr('data-mapjs-role', 'stage');
				link = {type: 'link', ideaIdFrom: '1.from', ideaIdTo: '1.to', attr: {style: {color: 'blue', lineStyle: 'solid', arrow: true}}};
				mapModel.dispatchEvent('nodeCreated', {id: '1.from', title: 'zeka', x: -80, y: -35, width: 30, height: 20});
				mapModel.dispatchEvent('nodeCreated', {id: '1.to', title: 'zeka2', x: 80, y: 35, width: 50, height: 34});
				nodeFrom = jQuery('#node_1_from');
				nodeTo = jQuery('#node_1_to');
				spyOn(jQuery.fn, 'updateLink').and.callThrough();
				spyOn(jQuery.fn, 'createLink').and.callThrough();
				mapModel.dispatchEvent('linkCreated', link);
				underTest = svgContainer.children('[data-mapjs-role=link]').first();

			});
			describe('linkCreated', function () {
				it('calls createLink with theme options', function () {
					expect(jQuery.fn.createLink).toHaveBeenCalledOnJQueryObject(svgContainer);
					expect(jQuery.fn.createLink.calls.mostRecent().args).toEqual([link, {theme: theme}]);
				});

				it('adds a link element to the stage', function () {
					expect(underTest.length).toBe(1);
					expect(underTest.parent()[0]).toEqual(svgContainer[0]);
				});
				it('creates a SVG mapjs-draw-container class', function () {
					expect(underTest.prop('tagName')).toBe('g');
				});
				it('assigns the DOM Id by sanitising node IDs', function () {
					expect(underTest.prop('id')).toBe('link_1_from_1_to');
				});
				it('maps the from and to nodes as jQuery objects to data properties', function () {
					expect(underTest.data('nodeFrom')[0]).toEqual(nodeFrom[0]);
					expect(underTest.data('nodeTo')[0]).toEqual(nodeTo[0]);
				});
				it('updates the link content', function () {
					expect(jQuery.fn.updateLink).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.updateLink.calls.mostRecent().args).toEqual([{theme: theme}]);
				});
				it('passes the style properties as data attributes to the DOM object', function () {
					expect(underTest.data('attr')).toEqual({
						'lineStyle': 'solid',
						'color': 'blue',
						'arrow': true
					});
				});
				describe('event wiring for node updates', function () {

					beforeEach(function () {
						jQuery.fn.updateLink.calls.reset();

					});
					['from', 'to'].forEach(node => {
						['mapjs:move', 'mm:drag',  'mapjs:resize'].forEach(evt => {
							it(evt + ' node ' + node + 'updates link', function () {
								jQuery('#node_1_' + node).trigger(evt);
								expect(jQuery.fn.updateLink).toHaveBeenCalledOnJQueryObject(underTest);
								expect(jQuery.fn.updateLink.calls.mostRecent().args).toEqual([{theme: theme}]);
							});
						});
					});
				});
			});
			describe('linkRemoved', function () {
				it('schedules a fade out animation', function () {
					spyOn(jQuery.fn, 'queueFadeOut').and.callThrough();
					mapModel.dispatchEvent('linkRemoved', link);
					expect(jQuery.fn.queueFadeOut).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.queueFadeOut.calls.mostRecent().args).toEqual([theme]);

				});
			});
			describe('linkAttrChanged', function () {

				it('passes the style properties as data attributes to the DOM object', function () {
					mapModel.dispatchEvent('linkAttrChanged', {type: 'link', ideaIdFrom: '1.from', ideaIdTo: '1.to', attr: {style: {color: 'yellow', lineStyle: 'dashed', arrow: true}}});
					expect(underTest.data('attr')).toEqual({
						lineStyle: 'dashed',
						color: 'yellow',
						arrow: true
					});
				});
				it('removes arrow if not set', function () {
					mapModel.dispatchEvent('linkAttrChanged', {type: 'link', ideaIdFrom: '1.from', ideaIdTo: '1.to', attr: {style: {color: 'yellow', lineStyle: 'dashed'}}});
					expect(underTest.data('arrow')).toBeFalsy();
					expect(underTest.data('attr')).toEqual({
						lineStyle: 'dashed',
						color: 'yellow'
					});
				});
				it('calls updateLink', function () {
					jQuery.fn.updateLink.calls.reset();
					mapModel.dispatchEvent('linkAttrChanged', {type: 'link', ideaIdFrom: '1.from', ideaIdTo: '1.to', attr: {style: {color: 'yellow', lineStyle: 'dashed'}}});
					expect(jQuery.fn.updateLink).toHaveBeenCalledOnJQueryObject(underTest);
					expect(jQuery.fn.updateLink.calls.mostRecent().args).toEqual([{theme: theme}]);
				});
			});
		});
		describe('mapScaleChanged', function () {
			beforeEach(function () {
				spyOn(jQuery.fn, 'updateStage').and.callThrough();
				spyOn(jQuery.fn, 'animate');
				viewPort.css({'width': '200', 'height': '100', 'overflow': 'scroll'});
				stage.data({ 'offsetX': 100, 'offsetY': 50, 'scale': 1, 'width': 1000, 'height': 1000 });
				stage.updateStage();
				viewPort.scrollLeft(180);
				viewPort.scrollTop(80);

				stage.updateStage.calls.reset();
				mapModel.dispatchEvent('mapScaleChanged', 2);
			});
			it('updates stage data property and calls updateStage to set CSS transformations', function () {
				expect(stage.data('scale')).toBe(2);
				expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
			});
			it('applies scale factors successively', function () {
				mapModel.dispatchEvent('mapScaleChanged', 2.5);
				expect(stage.data('scale')).toBe(5);
			});
			it('keeps the center point in the same position in the new scale', function () {
				expect(viewPort.scrollLeft()).toBe(460);
				expect(viewPort.scrollTop()).toBe(210);
			});
			it('does not allow scaling by more than factor of 5', function () {
				mapModel.dispatchEvent('mapScaleChanged', 10);
				expect(stage.data('scale')).toBe(5);
			});
			it('does not allow scaling by a factor of less than 0.2', function () {
				mapModel.dispatchEvent('mapScaleChanged', 0.0001);
				expect(stage.data('scale')).toBe(0.2);
			});
		});
		describe('mapViewResetRequested', function () {
			let theme;
			beforeEach(function () {
				theme = new Theme({name: 'new'});
				setTheme(theme);

				spyOn(jQuery.fn, 'updateStage').and.callThrough();
				spyOn(jQuery.fn, 'updateConnector').and.callThrough();
				spyOn(jQuery.fn, 'updateLink').and.callThrough();
				viewPort.css({'width': '200', 'height': '100', 'overflow': 'scroll'});
				stage.data({ 'offsetX': 100, 'offsetY': 50, 'scale': 1, 'width': 400, 'height': 300 }).updateStage();
				viewPort.scrollLeft(10).scrollTop(10);
				mapModel.dispatchEvent('nodeCreated', {id: '11.12', title: 'zeka2', x: 100, y: 50, width: 20, height: 10});
				mapModel.dispatchEvent('nodeCreated', {id: '12.12', title: 'zeka3', x: 200, y: 150, width: 20, height: 10});
				mapModel.dispatchEvent('nodeCreated', {id: '13.12', title: 'zeka3', x: 300, y: 250, width: 20, height: 10});
				mapModel.dispatchEvent('connectorCreated', {from: '11.12', to: '12.12'});
				mapModel.dispatchEvent('connectorCreated', {from: '12.12', to: '13.12'});
				mapModel.dispatchEvent('linkCreated', {ideaIdFrom: '11.12', ideaIdTo: '13.12', attr: {style: {color: 'blue', lineStyle: 'solid', arrow: true}}});
				mapModel.getCurrentlySelectedIdeaId.and.returnValue('11.12');
				jQuery.fn.updateStage.calls.reset();
			});

			it('resets stage scale', function () {
				stage.data({scale: 2}).updateStage();
				stage.updateStage.calls.reset();
				mapModel.dispatchEvent('mapViewResetRequested');
				expect(stage.data('scale')).toBe(1);
				expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
			});
			it('resets stage data to contain all nodes and put the focused node in the center', function () {
				stage.data({'scale': 1, 'height': 500, 'width': 1000, 'offsetX': 20, 'offsetY': 500}).updateStage();
				mapModel.dispatchEvent('mapViewResetRequested');
				expect(stage.data()).toEqual({'scale': 1, 'height': 260, 'width': 320, 'offsetX': 0, 'offsetY': 0});
			});
			it('should update Connectors', function () {
				jQuery.fn.updateConnector.calls.reset();
				mapModel.dispatchEvent('mapViewResetRequested');
				expect(jQuery.fn.updateConnector).toHaveBeenCalledOnJQueryObject(jQuery('[data-mapjs-role=connector]'));
				expect(jQuery.fn.updateConnector.calls.mostRecent().args).toEqual([{theme: theme}]);
			});
			it('should update Links', function () {
				jQuery.fn.updateLink.calls.reset();
				mapModel.dispatchEvent('mapViewResetRequested');
				expect(jQuery.fn.updateLink).toHaveBeenCalledOnJQueryObject(jQuery('[data-mapjs-role=link]'));
				expect(jQuery.fn.updateLink.calls.mostRecent().args).toEqual([{theme: theme}]);
			});
			it('centers the view', function () {
				mapModel.dispatchEvent('mapViewResetRequested');
				expect(viewPort.scrollLeft()).toBe(10);
				expect(viewPort.scrollTop()).toBe(5);
			});
		});
		describe('nodeFocusRequested', function () {
			beforeEach(function () {
				spyOn(jQuery.fn, 'updateStage').and.callThrough();
				spyOn(jQuery.fn, 'animate').and.callFake(function () {
					return this;
				});
				viewPort.css({'width': '200', 'height': '100', 'overflow': 'scroll'});
				stage.data({ 'offsetX': 100, 'offsetY': 50, 'scale': 1, 'width': 400, 'height': 300 });
				stage.updateStage();
				viewPort.scrollLeft(180);
				viewPort.scrollTop(80);
				mapModel.dispatchEvent('nodeCreated', {id: '11.12', title: 'zeka2', x: 100, y: 50, width: 20, height: 10});
				jQuery.fn.animate.calls.reset();
				jQuery.fn.updateStage.calls.reset();
			});
			it('resets stage scale', function () {
				stage.data({scale: 2}).updateStage();
				stage.updateStage.calls.reset();
				mapModel.dispatchEvent('nodeFocusRequested', '11.12');
				expect(stage.data('scale')).toBe(1);
				expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);
			});
			it('does not immediately change viewport', function () {
				mapModel.dispatchEvent('nodeFocusRequested', '11.12');
				expect(viewPort.scrollLeft()).toBe(180);
				expect(viewPort.scrollTop()).toBe(80);
			});
			it('schedules an animation for the viewport', function () {
				mapModel.dispatchEvent('nodeFocusRequested', '11.12');
				expect(jQuery.fn.animate.calls.count()).toBe(1);
				expect(jQuery.fn.animate).toHaveBeenCalledWith({scrollLeft: 110, scrollTop: 55}, {duration: 400});
				expect(jQuery.fn.animate).toHaveBeenCalledOnJQueryObject(viewPort);
			});
			it('does not expand the stage if not needed', function () {
				mapModel.dispatchEvent('nodeFocusRequested', '11.12');
				expect(stage.data()).toEqual({ 'offsetX': 100, 'offsetY': 50, 'scale': 1, 'width': 400, 'height': 300 });
				expect(jQuery.fn.updateStage).not.toHaveBeenCalled();
			});
			describe('expands the stage to enable scrolling to the node point when the node is ', function () {
				[
					['left', -50, 50, 140, 50, 440, 300],
					['top', 100, -40, 100, 85, 400, 335],
					['right', 270, 50, 100, 50, 480, 300],
					['bottom', 100, 230, 100, 50, 400, 335]
				].forEach(function (testCase) {
					const testName = testCase[0],
						nodeX = testCase[1],
						nodeY = testCase[2],
						expectedStageOffsetX = testCase[3],
						expectedStageOffsetY = testCase[4],
						expectedStageWidth = testCase[5],
						expectedStageHeight = testCase[6];

					it(testName, function () {
						jQuery('#node_11_12').data({x: nodeX, y: nodeY});
						mapModel.dispatchEvent('nodeFocusRequested', '11.12');
						expect(jQuery.fn.updateStage).toHaveBeenCalledOnJQueryObject(stage);

						expect(stage.data('offsetX')).toEqual(expectedStageOffsetX);
						expect(stage.data('offsetY')).toEqual(expectedStageOffsetY);
						expect(stage.data('width')).toEqual(expectedStageWidth);
						expect(stage.data('height')).toEqual(expectedStageHeight);
					});
				});
			});
		});
	});
});
