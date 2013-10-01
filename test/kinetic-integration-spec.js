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
	});
});
