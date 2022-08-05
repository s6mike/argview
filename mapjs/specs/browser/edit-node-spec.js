/*global describe, it, beforeEach, afterEach, expect, spyOn, document, require */
const jQuery = require('jquery'),
	_ = require('underscore');

require('../../src/browser/edit-node');
require('../helpers/jquery-extension-matchers');

describe('editNode', function () {
	'use strict';
	let textBox, node, result;
	const triggerBlur = function (element) {
		const e = document.createEvent('Event');
		e.initEvent('blur', true, true);
		element.dispatchEvent(e);
	};
	beforeEach(function () {
		node = jQuery('<div>').data('title', 'some title').appendTo('body');
		textBox = jQuery('<div>').attr('data-mapjs-role', 'title').text('some old text').appendTo(node);
		spyOn(jQuery.fn, 'focus').and.callThrough();
		spyOn(jQuery.fn, 'shadowDraggable').and.callThrough();
		spyOn(jQuery.fn, 'placeCaretAtEnd').and.callThrough();
		result = node.editNode();
	});
	it('makes the text box content editable', function () {
		expect(textBox.attr('contenteditable')).toBeTruthy();
	});
	it('fills the text box with the data title attribute', function () {
		expect(textBox.text()).toEqual('some title');
	});
	describe('break word control', function () {
		it('sets the word break to break-all if the original title is different from the text in the box  - this is to avoid long text normally hidden (eg links) messing up the layuot', function () {
			expect(textBox.css('word-break')).toBe('break-all');
		});

		it('clears the word break when the editing is completed', function () {
			//textBox.trigger('blur'); // complete previous edit
			triggerBlur(textBox[0]);
			expect(textBox).not.toHaveOwnStyle('word-break');

		});
		it('clears the word break when the editing is canceled', function () {
			textBox.trigger(jQuery.Event('keydown', { which: 27 }));
			expect(textBox).not.toHaveOwnStyle('word-break');
		});
		it('does not set the word break if the original title and the node text are the same', function () {
			triggerBlur(textBox[0]);
			textBox.text('some title');
			node.editNode();
			expect(textBox).not.toHaveOwnStyle('word-break');
		});
	});

	it('focuses on the text box', function () {
		expect(jQuery.fn.focus).toHaveBeenCalledOnJQueryObject(textBox);
	});
	it('deactivates dragging on the node', function () {
		expect(jQuery.fn.shadowDraggable).toHaveBeenCalledOnJQueryObject(node);
		expect(jQuery.fn.shadowDraggable).toHaveBeenCalledWith({disable: true});
	});
	it('puts the caret at the end of the textbox', function () {
		expect(jQuery.fn.placeCaretAtEnd).toHaveBeenCalledOnJQueryObject(textBox);
	});
	describe('event processing', function () {
		let options, event;
		beforeEach(function () {
			textBox.text('changed text');
		});
		it('completes editing when focus is lost', function (done) {
			result.then((txt) => {
				expect(txt).toEqual('changed text');
				expect(textBox.attr('contenteditable')).toBeFalsy();
			}).then(done, done.fail);
			triggerBlur(textBox[0]);
		});
		it('consumes multi-line text', function (done) {
			textBox.html('changed\ntext');
			result.then((txt) => {
				expect(txt).toEqual('changed\ntext');
			}).then(done, done.fail);
			triggerBlur(textBox[0]);
		});
		it('consumes broken firefox contenteditable multi-line text', function (done) {
			textBox.html('changed<br>text');
			result.then((txt) => {
				expect(txt).toEqual('changed\ntext');
			}).then(done, done.fail);
			triggerBlur(textBox[0]);
		});
		it('converts text box content to text using innerText', function (done) {
			spyOn(jQuery.fn, 'innerText').and.returnValue('hello there');
			result.then((txt) => {
				expect(txt).toEqual('hello there');
			}).then(done, done.fail);
			triggerBlur(textBox[0]);
		});
		it('reactivates dragging when focus is lost', function () {
			node.attr('mapjs-level', 2);
			jQuery.fn.shadowDraggable.calls.reset();
			triggerBlur(textBox[0]);
			expect(jQuery.fn.shadowDraggable).toHaveBeenCalledOnJQueryObject(node);
			expect(jQuery.fn.shadowDraggable.calls.mostRecent().args).toEqual([]);
		});
		it('completes editing when enter is pressed and prevents further keydown event propagation', function (done) {
			event = jQuery.Event('keydown', { which: 13 });
			result.then(txt => {
				expect(textBox.attr('contenteditable')).toBeFalsy();
				expect(txt).toEqual('changed text');
				expect(event.isPropagationStopped()).toBeTruthy();
			}).then(done, done.fail);
			textBox.trigger(event);

		});
		it('completes editing when tab is pressed, prevents the default to avoid focusing out, but does not prevents event propagation so stage can add a new node', function (done) {
			event = jQuery.Event('keydown', { which: 9 });
			result.then(txt => {
				expect(textBox.attr('contenteditable')).toBeFalsy();
				expect(txt).toEqual('changed text');
				expect(event.isPropagationStopped()).toBeFalsy();
				expect(event.isDefaultPrevented()).toBeTruthy();
			}).then(done, done.fail);
			textBox.trigger(event);
		});
		it('does not complete editing or prevent propagation if shift+enter is pressed - instead it lets the document handle the line break', function (done) {
			event = jQuery.Event('keydown', { which: 13, shiftKey: true });
			textBox.on('keydown-complete', () => {
				expect(textBox.attr('contenteditable')).toBeTruthy();
				expect(event.isPropagationStopped()).toBeFalsy();
				done();
			});
			result.then(done.fail, done.fail);

			textBox.trigger(event);
		});
		it('cancels editing when escape is pressed, restoring original text and stops event propagation', function (done) {
			event = jQuery.Event('keydown', { which: 27 });
			result.then(done.fail).catch(() => {
				expect(textBox.attr('contenteditable')).toBeFalsy();
				expect(event.isPropagationStopped()).toBeTruthy();
				expect(textBox.text()).toBe('some old text');
			}).then(done, done.fail);

			textBox.trigger(event);
		});
		it('cancels editing if the text is not modified, even if the user did not press escape', function (done) {
			textBox.text('some title');
			result.then(done.fail).catch(() => {
				expect(textBox.attr('contenteditable')).toBeFalsy();
				expect(textBox.text()).toBe('some old text');
			}).then(done, done.fail);

			triggerBlur(textBox[0]);
		});
		_.each(['ctrl', 'meta'], function (specialKey) {
			it('stops editing but lets events propagate when ' + specialKey + ' +s is pressed so map can be saved', function (done) {
				options = { which: 83 };
				options[specialKey + 'Key'] = true;
				event = jQuery.Event('keydown', options);
				result.then(txt => {
					expect(textBox.attr('contenteditable')).toBeFalsy();
					expect(txt).toEqual('changed text');
					expect(event.isPropagationStopped()).toBeFalsy();
					expect(event.isDefaultPrevented()).toBeTruthy();
				}).then(done, done.fail);
				textBox.trigger(event);


			});
			it('does not cancel editing if text has changed and ' + specialKey + '+z pressed, but cancels propagation so the map does not get this keyclick as well', function (done) {
				options = { which: 90 };
				options[specialKey + 'Key'] = true;
				event = jQuery.Event('keydown', options);
				result.then(done.fail, done.fail);
				textBox.on('keydown-complete', () => {
					expect(textBox.attr('contenteditable')).toBeTruthy();
					expect(event.isPropagationStopped()).toBeTruthy();
					done();
				});
				textBox.trigger(event);
			});
			it('cancels editing if text has not changed and ' + specialKey + '+z pressed, also cancels propagation so the map does not get this keyclick as well', function (done) {
				options = { which: 90 };
				options[specialKey + 'Key'] = true;
				textBox.text('some title');
				event = jQuery.Event('keydown', options);
				result.then(done.fail).catch(() => {
					expect(textBox.attr('contenteditable')).toBeFalsy();
					expect(event.isPropagationStopped()).toBeTruthy();
				}).then(done, done.fail);
				textBox.trigger(event);


			});
		});
	});
	afterEach(function () {
		node.remove();
	});
});

