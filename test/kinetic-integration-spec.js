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
				setX: function (v) { this.x = v; },
				setY: function (v) { this.y = v; },
				getX: function () { return this.x; },
				getY: function () { return this.y; },
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
		describe('memoization', function () {
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
			it('does not mix memoization of nodes with the same title but with/without icons', function () {
				var result;
				MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same2'}));
				result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same2', attr: { icon: {url: 'x', width: 1000, height: 300, position: 'center' } } }));
				expect(result).toEqual({width: 1016, height: 316});
			});
			it('does not mix memoization of nodes with the same title but with different icon size', function () {
				var result;
				MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same3', attr: { icon: { url: 'x', width: 1000, height: 500, position: 'center' } } }));
				result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same3', attr: { icon: { url: 'x', width: 1000, height: 300, position: 'center' } } }));
				expect(result).toEqual({width: 1016, height: 316});
			});
			it('does not mix memoization of nodes with the same title but with different icon layout', function () {
				var result;
				MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same4', attr: { icon: { url: 'x', width: 1000, height: 500, position: 'center' } } }));
				result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same4', attr: { icon: { url: 'x', width: 1000, height: 500, position: 'bottom' } } }));
				expect(result).toEqual({width: 1016, height: 708});
			});
		});
		describe('icon layouts', function () {
			var dim = function (content) {
				var shape = new Kinetic.Idea({
					text: content.title,
					mmAttr: content.attr
				});
				return {
					width: shape.getWidth(),
					height: shape.getHeight(),
					tX: shape.text.getX(),
					tY: shape.text.getY(),
					iX: shape.icon.getX(),
					iY: shape.icon.getY()
				};
			};
			it('(center) overlays icon and text, adding padding, and uses maximum dimensions for the node, centering both text and icon', function () {
				var iconBigger = MAPJS.content({title: 'icon bigger', attr: {icon: {url: 'x', width: 1000, height: 500, position: 'center' }}}),
					textWider = MAPJS.content({title: 'textWider', attr: {icon: {url: 'x', width: 2, height: 500, position: 'center' }}}),
					textTaller = MAPJS.content({title: 'textTaller', attr: {icon: {url: 'x', width: 1000, height: 10, position: 'center' }}}),
					textBigger = MAPJS.content({title: 'textBigger', attr: {icon: {url: 'x', width: 2, height: 10, position: 'center' }}});
				expect(dim(iconBigger)).toEqual({width: 1016, height: 516, tX: 466, tY: 166, iX: 8, iY: 8});
				expect(dim(textWider)).toEqual({width: 100, height: 516, tX: 8, tY: 166, iX: 49, iY: 8});
				expect(dim(textTaller)).toEqual({width: 1016, height: 200, tX: 466, tY: 8, iX: 8, iY: 95});
				expect(dim(textBigger)).toEqual({width: 100, height: 200, tX: 8, tY: 8, iX: 49, iY: 95});
			});
			it('(bottom) icon goes below text and uses maximum width for the node, padding twice for width and three times by height', function () {
				var iconWider = MAPJS.content({title: 'iconWider', attr: {icon: {url: 'x', width: 1000, height: 500, position: 'bottom' }}}),
					textWider = MAPJS.content({title: 'textWider', attr: {icon: {url: 'x', width: 2, height: 500, position: 'bottom' }}});
				expect(dim(iconWider)).toEqual({width: 1016, height: 708, tX: 466, tY: 8, iX: 8, iY: 200 });
				expect(dim(textWider)).toEqual({width: 100, height: 708, tX: 8, tY: 8, iX: 49, iY: 200});
			});
			it('(left) icon goes left of the text and uses maximum height for the node, padding three times for width and twice for height', function () {
				var iconTaller = MAPJS.content({title: 'iconTaller', attr: {icon: {url: 'x', width: 332, height: 500, position: 'left' }}}),
					textTaller = MAPJS.content({title: 'textTaller', attr: {icon: {url: 'x', width: 332, height: 50, position: 'left' }}});
				expect(dim(iconTaller)).toEqual({width: 440, height: 516, tX: 332 + 16, tY: 166, iX: 8, iY: 8});
				expect(dim(textTaller)).toEqual({width: 440, height: 200, tX: 332 + 16, tY: 8, iX: 8, iY: 75});
			});
			it('(top) icon goes above text and uses maximum width for the node, padding three times for height and twice for width', function () {
				var iconWider = MAPJS.content({title: 'iconWider', attr: {icon: {url: 'x', width: 1000, height: 500, position: 'top' }}}),
					textWider = MAPJS.content({title: 'textWider', attr: {icon: {url: 'x', width: 2, height: 500, position: 'top' }}});
				expect(dim(iconWider)).toEqual({width: 1016, height: 708, tX: 466, tY: 516, iX: 8, iY: 8 });
				expect(dim(textWider)).toEqual({width: 100, height: 708, tX: 8, tY: 516, iX: 49, iY: 8});
			});
			it('(right) icon goes right of the text and uses maximum height for the node, padding two times for height and three times for width', function () {
				var iconTaller = MAPJS.content({title: 'iconTaller', attr: {icon: {url: 'x', width: 332, height: 500, position: 'right' }}}),
					textTaller = MAPJS.content({title: 'textTaller', attr: {icon: {url: 'x', width: 332, height: 50, position: 'right' }}});
				expect(dim(iconTaller)).toEqual({width: 440, height: 516, tX: 8, tY: 166, iX: 100, iY: 8});
				expect(dim(textTaller)).toEqual({width: 440, height: 200, tX: 8, tY: 8, iX: 100, iY: 75});
			});
		});

	});
});
