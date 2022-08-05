/*global describe, it, beforeEach, afterEach, expect, require */
const jQuery = require('jquery');

require('../../src/browser/update-reorder-bounds');


describe('updateReorderBounds', function () {
	'use strict';
	let underTest;
	beforeEach(function () {
		underTest = jQuery('<div>').css({position: 'absolute', width: 6, height: 16}).appendTo('body');
	});
	afterEach(function () {
		underTest.remove();
	});
	it('hides the element if the border is not defined', function () {
		underTest.updateReorderBounds(false, {});
		expect(underTest.css('display')).toEqual('none');
	});
	it('shows the element if the border is defined', function () {
		underTest.css('display', 'none');
		underTest.updateReorderBounds({edge: 'top', minY: 10}, {}, {x: 10});
		expect(underTest.css('display')).not.toEqual('none');
	});
	it('shows the top border at drop coordinates x', function () {
		underTest.updateReorderBounds({edge: 'top', minY: 33}, {}, {x: 10});
		expect(underTest.attr('mapjs-edge')).toEqual('top');
		expect(underTest.css('left')).toEqual('7px');
		expect(underTest.css('top')).toEqual('33px');
	});
	it('shows the left border at drop coords (-chevron width, Y)', function () {
		underTest.updateReorderBounds({edge: 'left', x: 33}, {}, {y: 10});
		expect(underTest.attr('mapjs-edge')).toEqual('left');
		expect(underTest.css('top')).toEqual('2px');
		expect(underTest.css('left')).toEqual('27px');
	});
	it('shows the right border at drop coords (0, Y)', function () {
		underTest.updateReorderBounds({edge: 'right', x: 33}, {}, {y: 10});
		expect(underTest.attr('mapjs-edge')).toEqual('right');
		expect(underTest.css('top')).toEqual('2px');
		expect(underTest.css('left')).toEqual('33px');
	});
});

