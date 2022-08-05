/*global beforeEach, describe, afterEach, expect, it,jasmine, spyOn, require */
const jQuery = require('jquery');
require('../../src/browser/node-resize-widget');
require('../helpers/jquery-extension-matchers');
describe('nodeResizeWidget', function () {
	'use strict';
	let element, mapModel, stagePositionForPointEvent, underTest, textElement;
	const eventForX = function (x) {
		return {
			x: x,
			stopPropagation: jasmine.createSpy('stopPropagation'),
			gesture: {
				stopPropagation: jasmine.createSpy('stopGesturePropagation')
			}
		};
	};
	beforeEach(function () {
		mapModel = jasmine.createSpyObj('mapModel', ['selectNode', 'isEditingEnabled']);
		mapModel.isEditingEnabled.and.returnValue(true);

		stagePositionForPointEvent = jasmine.createSpy('stagePositionForPointEvent').and.callFake(function (evt) {
			return {x: evt.x};
		});

		element = jQuery(
			'<div>' +
				'<span id="content" data-mapjs-role="title">Some</span>' +
				'<span id="another">else</span>' +
			'</div>'
		).css({'min-width': 150});
		textElement = element.find('#content');
		textElement.css({'min-width': 120, 'max-width': 120, 'display': 'inline-block'});
		spyOn(jQuery.fn, 'shadowDraggable').and.callThrough();
		element.appendTo('body');
		underTest = element.nodeResizeWidget('1.a', mapModel, stagePositionForPointEvent);

	});
	afterEach(function () {
		element.detach();
	});
	it('should be used as a jquery plugin', function () {
		expect(underTest).toBe(element);
	});
	describe('should create a drag handle', function () {
		let dragHandle;
		beforeEach(function () {
			dragHandle = underTest.find('div.resize-node');
		});
		it('appended to the element', function () {
			expect(dragHandle.length).toBe(1);
		});
		it('should make the drag handle a shadowDraggable widget', function () {
			expect(jQuery.fn.shadowDraggable).toHaveBeenCalledOnJQueryObject(dragHandle);
		});
		describe('after the dragHandle has been dragged', function () {
			beforeEach(function () {
				dragHandle.trigger(jQuery.Event('mm:start-dragging-shadow', eventForX(120)));
			});
			it('should alter the node min-width when the node is dragged right', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', eventForX(130)));
				expect(underTest.css('min-width')).toEqual('130px');
			});
			it('should not alter the node min-width if the map editing is disabled', function () {
				mapModel.isEditingEnabled.and.returnValue(false);
				expect(underTest.css('min-width')).toEqual('150px');
			});

			it('should alter the text area min-width when the node is dragged right', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', eventForX(130)));
				expect(textElement.css('min-width')).toEqual('130px');
			});
			it('should not modify any other text spans when the node is dragged right', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', eventForX(130)));
				expect(element.find('#another').attr('style')).toBeFalsy();
			});
			it('should alter the text area max-width when the node is dragged right', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', eventForX(130)));
				expect(textElement.css('max-width')).toEqual('130px');
			});
			it('should alter the node min-width when the node is dragged left', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', eventForX(110)));
				expect(textElement.css('min-width')).toEqual('110px');
			});
			it('should alter the text area min-width when the node is dragged left', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', eventForX(110)));
				expect(textElement.css('min-width')).toEqual('110px');
			});
			it('should alter the text area max-width when the node is dragged left', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', eventForX(110)));
				expect(textElement.css('max-width')).toEqual('110px');
			});
			describe('should enforce a minimum width', function () {
				it('should alter the node min-width to 50 when the node is dragged left', function () {
					dragHandle.trigger(jQuery.Event('mm:drag', eventForX(20)));
					expect(textElement.css('min-width')).toEqual('50px');
				});
				it('should alter the text area min-width to 50 when the node is dragged left', function () {
					dragHandle.trigger(jQuery.Event('mm:drag', eventForX(20)));
					expect(textElement.css('min-width')).toEqual('50px');
				});
				it('should alter the text area max-width to 50 when the node is dragged left', function () {
					dragHandle.trigger(jQuery.Event('mm:drag', eventForX(20)));
					expect(textElement.css('max-width')).toEqual('50px');
				});
			});
			describe('should enforce min-width when node text is a very long unwrappable word', function () {
				beforeEach(function () {
					textElement.text('WWWWWWWWW');
				});
				it('should alter the node min-width  when the node is dragged left', function () {
					dragHandle.trigger(jQuery.Event('mm:drag', eventForX(20)));
					expect(underTest.css('min-width')).toEqual('136px');
				});
				it('should alter the text area min-width when the node is dragged left', function () {
					dragHandle.trigger(jQuery.Event('mm:drag', eventForX(20)));
					expect(textElement.css('min-width')).toEqual('136px');
				});
				it('should alter the text area max-width when the node is dragged left', function () {
					dragHandle.trigger(jQuery.Event('mm:drag', eventForX(20)));
					expect(textElement.css('max-width')).toEqual('136px');
				});
			});
			it('should call event stopPropagation', function () {
				const evt = eventForX(20);
				dragHandle.trigger(jQuery.Event('mm:drag', evt));
				expect(evt.stopPropagation).toHaveBeenCalled();
			});
			it('should call event gesture stopPropagation', function () {
				const evt = eventForX(20);
				dragHandle.trigger(jQuery.Event('mm:drag', evt));
				expect(evt.gesture.stopPropagation).toHaveBeenCalled();
			});
		});
		[
			['mm:stop-dragging', 'stopped'],
			['mm:cancel-dragging', 'cancelled']
		].forEach(function (args) {
			describe('when dragging is ' + args[1], function () {
				let evtX20;
				beforeEach(function () {
					evtX20 = eventForX(20);
					dragHandle.trigger(jQuery.Event('mm:start-dragging-shadow', eventForX(120)));
					dragHandle.trigger(jQuery.Event('mm:drag', eventForX(130)));
				});
				it('should call event stopPropagation', function () {
					dragHandle.trigger(jQuery.Event(args[0], evtX20));
					expect(evtX20.stopPropagation).toHaveBeenCalled();
				});
				it('should call event gesture stopPropagation', function () {
					dragHandle.trigger(jQuery.Event(args[0], evtX20));
					expect(evtX20.gesture.stopPropagation).toHaveBeenCalled();
				});
				it('should reset the node min-width to its initial value', function () {
					dragHandle.trigger(jQuery.Event(args[0], evtX20));
					expect(underTest.css('min-width')).toEqual('150px');
				});
				it('should reset the text area to its initial value', function () {
					dragHandle.trigger(jQuery.Event(args[0], evtX20));
					expect(textElement.css('min-width')).toEqual('120px');
				});
				it('should reset the text area max-width to its initial value', function () {
					dragHandle.trigger(jQuery.Event(args[0], evtX20));
					expect(textElement.css('max-width')).toEqual('120px');
				});
				it('should select node', function () {
					dragHandle.trigger(jQuery.Event(args[0], eventForX(140)));
					expect(mapModel.selectNode).toHaveBeenCalledWith('1.a');
				});
				it('should trigger an mm:resize event', function () {
					const listener = jasmine.createSpy('listener');
					underTest.on('mm:resize', listener);
					dragHandle.trigger(jQuery.Event(args[0], eventForX(130)));
					expect(listener).toHaveBeenCalled();
					expect(listener.calls.mostRecent().args[0].nodeWidth).toEqual(130);
				});
				it('should not trigger mm:resize if editing is disabled', () => {
					const listener = jasmine.createSpy('listener'),
						evt = eventForX(130);
					underTest.on('mm:resize', listener);
					mapModel.isEditingEnabled.and.returnValue(false);
					dragHandle.trigger(jQuery.Event(args[0], evt));
					expect(listener).not.toHaveBeenCalled();
					expect(evt.stopPropagation).toHaveBeenCalled();
					expect(evt.gesture.stopPropagation).toHaveBeenCalled();
				});
			});

		});
	});
});
