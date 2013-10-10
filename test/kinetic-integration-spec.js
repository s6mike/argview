/*global Kinetic, MAPJS, spyOn, beforeEach, expect, describe, it, afterEach, _*/
describe('Kinetic dimension provider', function () {
	'use strict';
	describe('MAPJS.Kinetic.dimensionProvider', function () {
		var oldIdea, initCounter, nextKIdea, fakeIdea = function (w, h) {
			return {
				getWidth: function () {
					return w - 16;
				},
				getHeight: function () {
					return h - 16;
				},
				setText: function () {
				},
				setX: function () {},
				setY: function () {},
				setFill: function () {}
			};
		};
		beforeEach(function () {
			oldIdea = Kinetic.Text;
			initCounter = 0;
			Kinetic.Text = function (idea) {
				initCounter++;
				_.extend(this, nextKIdea);
			};
			nextKIdea = fakeIdea(100, 200);
		});
		afterEach(function () {
			Kinetic.Text = oldIdea;
		});
		it('creates a Kinetic idea and returns its dimensions', function () {
			var result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'x'}));
			expect(result).toEqual({width: 100, height: 200});
		});
		it('caches the results by title', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same'}));
			nextKIdea = fakeIdea(20, 20);
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same'}));
			expect(initCounter).toBe(1);
			expect(result).toEqual({width: 100, height: 200});
		});
		it('does not cache different titles', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'not same'}));
			nextKIdea = fakeIdea(20, 20);
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'different'}));
			expect(initCounter).toBe(2);
			expect(result).toEqual({width: 20, height: 20});
		});
		describe('icon layouts', function () {
			it('(center) overlays icon over text and uses maximum dimensions for the node', function () {
				var iconBigger = MAPJS.content({title: 'icon bigger', attr: {icon: {url: 'x', width: 1000, height: 500, position: 'center' }}}),
					textWider = MAPJS.content({title: 'textWider', attr: {icon: {url: 'x', width: 1, height: 500, position: 'center' }}}),
					textTaller = MAPJS.content({title: 'textWider', attr: {icon: {url: 'x', width: 1000, height: 5, position: 'center' }}}),
					textBigger = MAPJS.content({title: 'textWider', attr: {icon: {url: 'x', width: 1, height: 5, position: 'center' }}});
				expect(MAPJS.KineticMediator.dimensionProvider(iconBigger)).toEqual({width: 1000, height: 500});
				expect(MAPJS.KineticMediator.dimensionProvider(textWider)).toEqual({width: 100, height: 500});
				expect(MAPJS.KineticMediator.dimensionProvider(textTaller)).toEqual({width: 1000, height: 200});
				expect(MAPJS.KineticMediator.dimensionProvider(textBigger)).toEqual({width: 100, height: 200});
			});
			it('(bottom) icon goes below text and uses maximum width for the node', function () {
				var iconWider = MAPJS.content({title: 'iconWider', attr: {icon: {url: 'x', width: 1000, height: 500, position: 'bottom' }}}),
					textWider = MAPJS.content({title: 'textWider', attr: {icon: {url: 'x', width: 1, height: 500, position: 'bottom' }}});
				expect(MAPJS.KineticMediator.dimensionProvider(iconWider)).toEqual({width: 1000, height: 700});
				expect(MAPJS.KineticMediator.dimensionProvider(textWider)).toEqual({width: 100, height: 700});
			});
			it('(left) icon goes left of the text and uses maximum height for the node', function () {
				var iconTaller = MAPJS.content({title: 'iconTaller', attr: {icon: {url: 'x', width: 333, height: 500, position: 'left' }}}),
					textTaller = MAPJS.content({title: 'textTaller', attr: {icon: {url: 'x', width: 333, height: 50, position: 'left' }}});
				expect(MAPJS.KineticMediator.dimensionProvider(iconTaller)).toEqual({width: 433, height: 500});
				expect(MAPJS.KineticMediator.dimensionProvider(textTaller)).toEqual({width: 433, height: 200});
			});
			it('(top) icon goes above text and uses maximum width for the node', function () {
				var iconWider = MAPJS.content({title: 'iconWider', attr: {icon: {url: 'x', width: 1000, height: 500, position: 'top' }}}),
					textWider = MAPJS.content({title: 'textWider', attr: {icon: {url: 'x', width: 1, height: 500, position: 'top' }}});
				expect(MAPJS.KineticMediator.dimensionProvider(iconWider)).toEqual({width: 1000, height: 700});
				expect(MAPJS.KineticMediator.dimensionProvider(textWider)).toEqual({width: 100, height: 700});
			});
			it('(right) icon goes right of the text and uses maximum height for the node', function () {
				var iconTaller = MAPJS.content({title: 'iconTaller', attr: {icon: {url: 'x', width: 333, height: 500, position: 'right' }}}),
					textTaller = MAPJS.content({title: 'textTaller', attr: {icon: {url: 'x', width: 333, height: 50, position: 'right' }}});
				expect(MAPJS.KineticMediator.dimensionProvider(iconTaller)).toEqual({width: 433, height: 500});
				expect(MAPJS.KineticMediator.dimensionProvider(textTaller)).toEqual({width: 433, height: 200});
			});
		});
		it('does not mix memoization of nodes with the same title but with/without icons', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same2'}));
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same2', attr: { icon: {url: 'x', width: 1000, height: 300, position: 'center' } } }));
			expect(result).toEqual({width: 1000, height: 300});
		});
		it('does not mix memoization of nodes with the same title but with different icon size', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same3', attr: { icon: { url: 'x', width: 1000, height: 500, position: 'center' } } }));
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same3', attr: { icon: { url: 'x', width: 1000, height: 300, position: 'center' } } }));
			expect(result).toEqual({width: 1000, height: 300});
		});
		it('does not mix memoization of nodes with the same title but with different icon layout', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same4', attr: { icon: { url: 'x', width: 1000, height: 500, position: 'center' } } }));
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same4', attr: { icon: { url: 'x', width: 1000, height: 500, position: 'bottom' } } }));
			expect(result).toEqual({width: 1000, height: 700});
		});
	});
});
