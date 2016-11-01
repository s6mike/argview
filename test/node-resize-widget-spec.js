/*global beforeEach, describe, afterEach, expect, it, jQuery, jasmine, spyOn*/
describe('nodeResizeWidget', function () {
	'use strict';
	var element, mapModel, stagePositionForPointEvent, underTest;
	beforeEach(function () {
		mapModel = jasmine.createSpyObj('mapModel', ['selectNode']);
		stagePositionForPointEvent = jasmine.createSpy('stagePositionForPointEvent').and.callFake(function (evt) {
			return {x: evt.x};
		});

		element = jQuery(
			'<div>' +
				'<span>Some</span>' +
			'</div>'
		).css({'min-width': 100});
		element.find('span').css({'min-width': 50, 'max-width': 60, 'display': 'inline-block'});

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
		var dragHandle;
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
			var textElement;
			beforeEach(function () {
				textElement = element.find('span');
				dragHandle.trigger(jQuery.Event('mm:start-dragging-shadow', {x: 10}));
			});
			it('should alter the min-width when the node is dragged right', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', {x: 20}));
				expect(textElement.css('min-width')).toEqual('60px');
			});
			it('should alter the min-width when the node is dragged right', function () {
				dragHandle.trigger(jQuery.Event('mm:drag', {x: 30}));
				expect(textElement.css('max-width')).toEqual('70px');
			});
		});
	});
});
