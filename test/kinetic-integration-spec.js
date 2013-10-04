/*global Kinetic, MAPJS, spyOn, beforeEach, expect, describe, it, afterEach, _*/
describe('Kinetic dimension provider', function () {
	'use strict';
	describe('MAPJS.Kinetic.dimensionProvider', function () {
		var oldIdea, initCounter, nextKIdea;
		beforeEach(function () {
			oldIdea = Kinetic.Idea;
			initCounter = 0;
			Kinetic.Idea = function (idea) {
				initCounter++;
				_.extend(this, nextKIdea);
			};
			nextKIdea = {
				getWidth: function () {
					return 100;
				},
				getHeight: function () {
					return 200;
				}
			};
		});
		afterEach(function () {
			Kinetic.Idea = oldIdea;
		});
		it('creates a Kinetic idea and returns its dimensions', function () {
			var result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'x'}));
			expect(result).toEqual({width: 100, height: 200});
		});
		it('caches the results by title', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same'}));
			nextKIdea = {
				getWidth: function () {
					return 20;
				},
				getHeight: function () {
					return 20;
				}
			};
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same'}));
			expect(initCounter).toBe(1);
			expect(result).toEqual({width: 100, height: 200});
		});
		it('does not cache different titles', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'not same'}));
			nextKIdea = {
				getWidth: function () {
					return 20;
				},
				getHeight: function () {
					return 20;
				}
			};
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'different'}));
			expect(initCounter).toBe(2);
			expect(result).toEqual({width: 20, height: 20});
		});
		describe('icon layouts', function () {
			it('(center) overlays icon over text and uses maximum dimensions for the node', function () {
				var iconBigger = MAPJS.content({title: 'icon bigger', attr: {icon: {width: 1000, height: 500, position: 'center' }}}),
					textWider = MAPJS.content({title: 'textWider', attr: {icon: {width: 1, height: 500, position: 'center' }}}),
					textTaller = MAPJS.content({title: 'textWider', attr: {icon: {width: 1000, height: 5, position: 'center' }}}),
					textBigger = MAPJS.content({title: 'textWider', attr: {icon: {width: 1, height: 5, position: 'center' }}});
				expect(MAPJS.KineticMediator.dimensionProvider(iconBigger)).toEqual({width: 1000, height: 500});
				expect(MAPJS.KineticMediator.dimensionProvider(textWider)).toEqual({width: 100, height: 500});
				expect(MAPJS.KineticMediator.dimensionProvider(textTaller)).toEqual({width: 1000, height: 200});
				expect(MAPJS.KineticMediator.dimensionProvider(textBigger)).toEqual({width: 100, height: 200});
			});
			it('(bottom) icon goes below text and uses maximum width for the node', function () {
				var iconWider = MAPJS.content({title: 'iconWider', attr: {icon: {width: 1000, height: 500, position: 'bottom' }}}),
					textWider = MAPJS.content({title: 'textWider', attr: {icon: {width: 1, height: 500, position: 'bottom' }}});
				expect(MAPJS.KineticMediator.dimensionProvider(iconWider)).toEqual({width: 1000, height: 700});
				expect(MAPJS.KineticMediator.dimensionProvider(textWider)).toEqual({width: 100, height: 700});
			});
		});
		it('does not mix memoization of nodes with the same title but with/without icons', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same2'}));
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same2', attr: { icon: { width: 1000, height: 300, position: 'center' } } }));
			expect(result).toEqual({width: 1000, height: 300});
		});
		it('does not mix memoization of nodes with the same title but with different icon size', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same3', attr: { icon: { width: 1000, height: 500, position: 'center' } } }));
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same3', attr: { icon: { width: 1000, height: 300, position: 'center' } } }));
			expect(result).toEqual({width: 1000, height: 300});
		});
		it('does not mix memoization of nodes with the same title but with different icon layout', function () {
			var result;
			MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same4', attr: { icon: { width: 1000, height: 500, position: 'center' } } }));
			result = MAPJS.KineticMediator.dimensionProvider(MAPJS.content({title: 'same4', attr: { icon: { width: 1000, height: 500, position: 'bottom' } } }));
			expect(result).toEqual({width: 1000, height: 700});
		});
	});
});
