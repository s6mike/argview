/*global _, observable, beforeEach, content, describe, expect, it, jasmine, spyOn, MAPJS*/
describe('content aggregate', function () {
	'use strict';
	describe('content wapper', function () {
		it('automatically assigns IDs to ideas without IDs', function () {
			var wrapped = MAPJS.content({title: 'My Idea'});
			expect(wrapped.id).toBe(1);
		});
		it('appends session ID after ID when generating', function () {
			var wrapped = MAPJS.content({title: 'My Idea'}, 'sessionkey');
			expect(wrapped.id).toBe('1.sessionkey');
		});
		it('initialises missing titles with a blank string - so the rest of the code can always expect a string', function () {
			var wrapped = MAPJS.content({});
			expect(wrapped.title).not.toBeUndefined();
			expect(wrapped.title).toBe('');
		});
		it('does not touch any IDs already assigned', function () {
			var wrapped = MAPJS.content({id: 22, title: 'My Idea', ideas: { 1: {id: 23, title: 'My First Subidea'}}});
			expect(wrapped.ideas[1].id).toBe(23);
		});
		it('skips over any IDs already assigned while adding new IDs', function () {
			var wrapped = MAPJS.content({id: 55, title: 'My Idea', ideas: { 1: {title: 'My First Subidea'}}});
			expect(wrapped.ideas[1].id).toBe(56);
		});
		it('preserves any meta data stored in JSON while wrapping', function () {
			var wrapped = MAPJS.content({id: 55, title: 'My Idea', ideas: { 1: {title: 'My First Subidea', meta: {newAttr: 'new_val'}}}});
			expect(wrapped.ideas[1].meta.newAttr).toBe('new_val');
		});
		it('normalises all ranks to floats to avoid selection problems with x.0', function () {
			var wrapped = MAPJS.content({id: 55, ideas: { '2.0': {id: 2}, 3.0: {id: 3}, '-4.0': {id: 4}}});
			expect(wrapped.ideas[2.0].id).toBe(2);
			expect(wrapped.ideas[3].id).toBe(3);
			expect(wrapped.ideas[-4].id).toBe(4);
		});
		describe('path retrieval', function () {

			var wrapped, i111, i11;
			beforeEach(function () {
				i111 = {
					id: 111,
					ideas: {
						1: {
							id: 1111
						}
					}
				};
				i11 = {
					id: 11,
					ideas: {
						1: i111
					}
				};
				wrapped = MAPJS.content({
					id: 1,
					ideas: {
						1: i11,
						2: {
							id: 12
						}
					}
				});
			});
			describe('calculatePath', function () {
				it('should return single item for root node', function () {
					expect(wrapped.calculatePath(1)).toEqual([]);
				});
				it('should path to the root node', function () {
					expect(wrapped.calculatePath(11)).toEqual([wrapped]);
					expect(wrapped.calculatePath(111)).toEqual([i11, wrapped]);
					expect(wrapped.calculatePath(1111)).toEqual([i111, i11, wrapped]);
				});
				it('should return false if the node does not exist', function () {
					expect(wrapped.calculatePath(123)).toBeFalsy();
				});
			});
			describe('getSubTreeIds', function () {
				it('should return empty array for leaf nodes', function () {
					expect(wrapped.getSubTreeIds(1111)).toEqual([]);
				});
				it('should return IDs of all subideas and their subideas for non leaf nodes, depth-first and rank sorted', function () {
					expect(wrapped.getSubTreeIds(111)).toEqual([1111]);
					expect(wrapped.getSubTreeIds(11)).toEqual([1111, 111]);
					expect(wrapped.getSubTreeIds(1)).toEqual([1111, 111, 11, 12]);
				});
			});
		});

		describe('getAttr', function () {
			it('returns false if the attribute is not defined', function () {
				var wrapped = MAPJS.content({});
				expect(wrapped.getAttr('xx')).toBeFalsy();
			});
			it('returns the attribute if defined', function () {
				var wrapped = MAPJS.content({attr: {xx: 'yellow'}});
				expect(wrapped.getAttr('xx')).toBe('yellow');
			});
		});
		describe('findChildRankById', function () {
			var idea = MAPJS.content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2'}, 10: { id: 3, title: 'I3'}, 15: {id: 4, title: 'I4'}}});
			it('returns the key in the parent idea list of an idea by its id', function () {
				expect(idea.findChildRankById(2)).toEqual(5);
				expect(idea.findChildRankById(3)).toEqual(10);
				expect(idea.findChildRankById(4)).toEqual(15);
			});
			it('returns false/NaN if no such child exists', function () {
				expect(idea.findChildRankById('xxx')).toBeFalsy();
			});
		});
		describe('findParent', function () {
			var idea = MAPJS.content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2', ideas: {8: {id: 8}}}, 10: { id: 3, title: 'I3'}, 15 : {id: 4, title: 'I4'}}});
			it('returns the parent idea by child id', function () {
				expect(idea.findParent(2)).toBe(idea);
				expect(idea.findParent(8)).toPartiallyMatch({id: 2});
			});
			it('returns false if no such child exists', function () {
				expect(idea.findParent('xxx')).toBeFalsy();
			});
			it('returns false if no parent', function () {
				expect(idea.findParent(1)).toBeFalsy();
			});
		});
		describe('findSubIdeaById', function () {
			it('returns the idea reference for a direct child matching the ID', function () {
				var idea = MAPJS.content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2'}, 10: { id: 3, title: 'I3'}, 15 : {id: 4, title: 'I4'}}});
				expect(idea.findSubIdeaById(2).id).toBe(2);
			});
			it('returns the idea reference for any indirect child matching the ID', function () {
				var idea = MAPJS.content({id: 5, title: 'I0', ideas: {9: {id: 1, title: 'I1', ideas: { '-5': { id: 2, title: 'I2'}, '-10': { id: 3, title: 'I3'}, '-15': {id: 4, title: 'I4'}}}}});
				expect(idea.findSubIdeaById(2).id).toBe(2);
			});
			it('works with number.session keys', function () {
				var idea = MAPJS.content({id: 5, ideas: {9: {id: 1, ideas: { '-5': { id: '2.b'}, '-10': { id: 3}, '-15': {id: 4}}}}});
				expect(idea.findSubIdeaById('2.b').id).toBe('2.b');
			});
			it('returns undefined if it matches the ID itself - to avoid false positives in parent search', function () {
				var idea = MAPJS.content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2'}, 10: { id: 3, title: 'I3'}, 15 : {id: 4, title: 'I4'}}});
				expect(idea.findSubIdeaById(1)).toBeFalsy();
			});
			it('returns undefined if no immediate child or any indirect child matches the ID', function () {
				var idea = MAPJS.content({id: 1, title: 'I1', ideas: { 5: { id: 2, title: 'I2'}, 10: { id: 3, title: 'I3'}, 15 : {id: 4, title: 'I4'}}});
				expect(idea.findSubIdeaById(33)).toBeFalsy();
			});
		});
		describe('sameSideSiblingIds', function () {
			it('returns siblings with the same rank sign, excluding the argument idea', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: {id: 2}, '-10': {id: 3}, 15 : {id: 4}, '-20': {id: 5}, 20: {id:6}}});
				expect(idea.sameSideSiblingIds(2)).toEqual([4, 6]);
				expect(idea.sameSideSiblingIds(5)).toEqual([3]);
			});
		});
		describe('find', function () {
			it('returns an array of ideas that match a predicate, sorted by depth. It only returns ID and title', function () {
				var aggregate = MAPJS.content({id: 5, title: 'I0', ideas: {9: {id: 1, title: 'I1', ideas: { '-5': { id: 2, title: 'I2'}, '-10': { id: 3, title: 'I3'}, '-15': {id: 4, title: 'I4'}}}}});
				expect(aggregate.find(function (idea) { return idea.id < 3; })).toEqual([{id: 1, title: 'I1'}, {id: 2, title: 'I2'}]);
			});
			it('returns an empty array if nothing matches the predicate', function () {
				var aggregate = MAPJS.content({id: 5, title: 'I0', ideas: {9: {id: 1, title: 'I1', ideas: { '-5': { id: 2, title: 'I2'}, '-10': { id: 3, title: 'I3'}, '-15': {id: 4, title: 'I4'}}}}});
				expect(aggregate.find(function (idea) { return idea.id > 103; })).toEqual([]);
			});
		});
		describe('nextSiblingId', function () {
			it('returns the next sibling ID by rank within the parent', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15: {id: 4}}});
				expect(idea.nextSiblingId(2)).toBe(3);
			});
			it('for negative ranks, looks for the next rank by absolute value', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15': {id: 4}}});
				expect(idea.nextSiblingId(2)).toBe(3);
			});
			it('only looks within its rank group (positive/negative)', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, 15: {id: 4}}});
				expect(idea.nextSiblingId(2)).toBe(3);
			});
			it('returns false if there is no next sibling', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.nextSiblingId(4)).toBeFalsy();
				expect(idea.nextSiblingId(2)).toBeFalsy();
			});
			it('returns false if there is no such idea', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.nextSiblingId(22)).toBeFalsy();
			});
			it('returns false if there are no siblings', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}}});
				expect(idea.nextSiblingId(5)).toBeFalsy();
			});
		});
		describe('previousSiblingId', function () {
			it('returns the previous sibling ID by rank within the parent', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.previousSiblingId(3)).toBe(2);
			});
			it('for negative ranks, looks for the previous rank by absolute value', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}});
				expect(idea.previousSiblingId(3)).toBe(2);
			});
			it('only looks within its rank group (positive/negative)', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.previousSiblingId(4)).toBe(3);
			});
			it('returns false if there is no previous sibling', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.previousSiblingId(2)).toBeFalsy();
				expect(idea.previousSiblingId(3)).toBeFalsy();
			});
			it('returns false if there is no such idea', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.previousSiblingId(22)).toBeFalsy();
			});
			it('returns false if there are no siblings', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}}});
				expect(idea.previousSiblingId(5)).toBeFalsy();
			});
		});
		describe('clone', function () {
			var idea_to_clone = function () {return { id: 2, title: 'copy me', attr: {background: 'red'}, ideas: {'5': {id: 66, title: 'hey there'}}}; };
			it('returns a deep clone copy of a subidea by id', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': idea_to_clone(), '-10': { id: 3}, '-15' : {id: 4}}});
				expect(idea.clone(2)).toEqual(idea_to_clone());
				expect(idea.clone(2)).not.toBe(idea.ideas[-5]);
			});
			it('clones the aggregate if no subidea given', function () {
				var idea = MAPJS.content({id: 1, ideas: {'-10': { id: 3}, '-15' : {id: 4}}});
				expect(idea.clone().id).toBe(1);
			});
			it('clones the aggregate if aggregate ID given', function () {
				var idea = MAPJS.content({id: 1, ideas: {'-10': { id: 3}, '-15' : {id: 4}}});
				expect(idea.clone(1).id).toBe(1);
			});
		});
		describe('sortedSubIdeas', function () {
			it('sorts children by key, positive first then negative, by absolute value', function () {
				var aggregate = MAPJS.content({id: 1, title: 'root', ideas: {'-100': {title: '-100'}, '-1': {title: '-1'}, '1': {title: '1'}, '100': {title: '100'}}}),
					result = _.map(aggregate.sortedSubIdeas(), function (subidea) { return subidea.title; });
				expect(result).toEqual(['1', '100', '-1', '-100']);
			});
		});
		describe('getAttrById', function () {
			var wrapped;
			beforeEach(function () {
				wrapped = MAPJS.content({
					attr: {
						style: {
							background: 'red'
						}
					},
					id: 12
				});
			});
			it('returns false if the there is no idea for the id', function () {
				expect(wrapped.getAttrById(31412, 'style')).toBeFalsy();
			});
			it('returns false if the there is no attr matching', function () {
				expect(wrapped.getAttrById(12, 'xx')).toBeFalsy();
			});
			it('should return the attr from the matching node', function () {
				expect(wrapped.getAttrById(12, 'style')).toEqual({background: 'red'});
			});
		});
	});
	describe('command processing', function () {
		describe('execCommand', function () {
			it('executes updateTitle', function () {
				var idea = MAPJS.content({id: 1, title: 'abc'}),
					listener = jasmine.createSpy();
				idea.addEventListener('changed', listener);

				idea.execCommand('updateTitle', [1, 'new']);

				expect(listener).toHaveBeenCalledWith('updateTitle', [1, 'new']);
			});
			it('attaches a default session ID if provided during construction', function () {
				var idea = MAPJS.content({id: 1, title: 'abc'}, 'session'),
					listener = jasmine.createSpy();
				idea.addEventListener('changed', listener);

				idea.execCommand('updateTitle', [1, 'new']);

				expect(listener).toHaveBeenCalledWith('updateTitle', [1, 'new'], 'session');
			});
			it('attaches the provided session ID if provided in command', function () {
				var idea = MAPJS.content({id: 1, title: 'abc'}, 'session'),
					listener = jasmine.createSpy();
				idea.addEventListener('changed', listener);

				idea.execCommand('updateTitle', [1, 'new'], 'other');

				expect(listener).toHaveBeenCalledWith('updateTitle', [1, 'new'], 'other');
			});
		});
		describe('paste', function () {
			var idea, toPaste;
			beforeEach(function () {
				idea = MAPJS.content({id: 1, ideas: {'-10': { id: 3}, '-15' : {id: 4}}});
				toPaste = {title: 'pasted', id: 1};
			});
			it('should create a new child and paste cloned contents', function () {
				var result = idea.paste(3, toPaste);
				expect(result).toBeTruthy();
				expect(idea.ideas[-10].ideas[1]).toPartiallyMatch({title: 'pasted'});
			});
			describe('when no ID provided', function () {
				it('should reassign IDs based on next available ID in the aggregate', function () {
					var result = idea.paste(3, toPaste);
					expect(result).toBeTruthy();
					expect(idea.ideas[-10].ideas[1].id).toBe(5);
				});
				it('should append session key if given when re-assigning', function () {
					idea = MAPJS.content({id: 1, ideas: {'-10': { id: 3}, '-15' : {id: 4}}}, 'sess');
					var result = idea.paste(3, toPaste);
					expect(result).toBeTruthy();
					expect(idea.ideas[-10].ideas[1].id).toBe('5.sess');
				});
				it('should reassign IDs recursively based on next available ID in the aggregate', function () {
					var result = idea.paste(3, _.extend(toPaste, {ideas: {1: { id: 66, title: 'sub sub'}}}));
					expect(result).toBeTruthy();
					expect(idea.ideas[-10].ideas[1].id).toBe(5);
					expect(idea.ideas[-10].ideas[1].ideas[1].id).toBe(6);
				});
			});
			describe('when ID is provided', function () {
				it('should reassign IDs based on provided ID for the root of the pasted hierarchy', function () {
					var result = idea.paste(3, toPaste, 777);
					expect(result).toBeTruthy();
					expect(idea.ideas[-10].ideas[1].id).toBe(777);
				});
				it('should use session key from provided ID', function () {
					idea = MAPJS.content({id: 1, ideas: {'-10': { id: 3}, '-15' : {id: 4}}}, 'sess');
					var result = idea.paste(3, toPaste, '778.sess2');
					expect(result).toBeTruthy();
					expect(idea.ideas[-10].ideas[1].id).toBe('778.sess2');
				});
				it('should reassign IDs recursively based', function () {
					var result = idea.paste(3, _.extend(toPaste, {ideas: {1: { id: 66, title: 'sub sub'}}}), 779);
					expect(result).toBeTruthy();
					expect(idea.ideas[-10].ideas[1].id).toBe(779);
					expect(idea.ideas[-10].ideas[1].ideas[1].id).toBe(780);
				});
				it('should keep session ID when reassigning recursively', function () {
					var result = idea.paste(3, _.extend(toPaste, {ideas: {1: { id: 66, title: 'sub sub'}}}), '781.abc');
					expect(result).toBeTruthy();
					expect(idea.ideas[-10].ideas[1].id).toBe('781.abc');
					expect(idea.ideas[-10].ideas[1].ideas[1].id).toBe('782.abc');
				});
			});
			it('should reorder children by absolute rank, positive first then negative', function () {
				var result = idea.paste(3, _.extend(toPaste, {ideas: {
					77: {id: 10, title: '77'},
					1: { id: 11, title: '1'},
				    '-77': {id: 12, title: '-77'},
				    '-1': {id: 13, title: '-1'}
				}})),
					newChildren = idea.ideas[-10].ideas[1].ideas;
				expect(newChildren[1].title).toBe('1');
				expect(newChildren[2].title).toBe('77');
				expect(newChildren[3].title).toBe('-1');
				expect(newChildren[4].title).toBe('-77');
			});
			it('should paste to aggregate root if root ID is given', function () {
				var result = idea.paste(1, toPaste), newRank;
				expect(result).toBeTruthy();
				console.log(idea);
				newRank = idea.findChildRankById(5);
				expect(newRank).toBeTruthy();
				expect(idea.ideas[newRank]).toPartiallyMatch({title: 'pasted'});
			});
			it('should fail if invalid idea id', function () {
				var result = idea.paste(-3, toPaste);
				expect(result).toBeFalsy();
			});
			it('should fail if nothing pasted', function () {
				var spy = jasmine.createSpy('paste');
				idea.addEventListener('changed', spy);
				expect(idea.paste(1)).toBeFalsy();
				expect(spy).not.toHaveBeenCalled();
			});
			it('should fire a paste event when it succeeds, appending the new ID as the last', function () {
				var spy = jasmine.createSpy('paste');
				idea.addEventListener('changed', spy);
				idea.paste(3, toPaste);
				expect(spy).toHaveBeenCalledWith('paste', [3, toPaste, 5]);
			});
			it('event should contain session ID if provided', function () {
				var idea = MAPJS.content({id: 3}, 'sess'),
					spy = jasmine.createSpy('paste');
				idea.addEventListener('changed', spy);
				idea.paste(3, toPaste);
				expect(spy).toHaveBeenCalledWith('paste', [3, toPaste, '4.sess'], 'sess');
			});
			it('pushes an event on the undo stack if successful', function () {
				idea.paste(3, toPaste);
				idea.undo();
				expect(idea.ideas[-10].ideas).toEqual({});
			});
		});
		describe('updateAttr', function () {
			it('should allow an attribute to be set on the aggregate', function () {
				var aggregate = MAPJS.content({id: 71, title: 'My Idea'}),
					result = aggregate.updateAttr(71, 'newAttr', 'newValue');
				expect(result).toBeTruthy();
				expect(aggregate.getAttr('newAttr')).toBe('newValue');
			});
			it('should allow a set attr to be set on the child', function () {
				var aggregate = MAPJS.content({id: 1, ideas: { 5: { id: 2}}}),
					result = aggregate.updateAttr(2, 'newAttr', 'newValue');
				expect(result).toBeTruthy();
				expect(aggregate.ideas[5].getAttr('newAttr')).toBe('newValue');
			});
			it('clones attr when setting to a new object to prevent stale references', function () {
				var oldAttr = {},
					aggregate = MAPJS.content({id: 1, attr: oldAttr}),
					result = aggregate.updateAttr(1, 'newAttr', 'newValue');
				expect(oldAttr).toEqual({});
			});
			it('should remove attrs which have been set to false', function () {
				var aggregate = MAPJS.content({id: 1, attr: {keptAttr: 'oldValue', newAttr: 'value'}}),
					result = aggregate.updateAttr(1, 'newAttr', false);
				expect(result).toBeTruthy();
				expect(aggregate.attr.newAttr).toBeUndefined();
				expect(aggregate.attr.keptAttr).toBe('oldValue');
			});
			it('should remove attrs which have been set to false - as a string', function () {
				var aggregate = MAPJS.content({id: 1, attr: {keptAttr: 'oldValue', newAttr: 'value'}}),
					result = aggregate.updateAttr(1, 'newAttr', 'false');
				expect(result).toBeTruthy();
				expect(aggregate.attr.newAttr).toBeUndefined();
				expect(aggregate.attr.keptAttr).toBe('oldValue');
			});
			it('should remove attr hash when no attrs are left in the object', function () {
				var aggregate = MAPJS.content({id: 1, attr: {newAttr: 'value'}}),
					result = aggregate.updateAttr(1, 'newAttr', false);
				expect(result).toBeTruthy();
				expect(aggregate.attr).toBeUndefined();
			});
			it('fires an event matching the method call when the attr changes', function () {
				var listener = jasmine.createSpy('attr_listener'),
					wrapped = MAPJS.content({});
				wrapped.addEventListener('changed', listener);
				wrapped.updateAttr(1, 'new', 'yellow');
				expect(listener).toHaveBeenCalledWith('updateAttr', [1, 'new', 'yellow']);
			});
			it('fires an event with session if defined', function () {
				var listener = jasmine.createSpy('attr_listener'),
					wrapped = MAPJS.content({id: 1}, 'sess');
				wrapped.addEventListener('changed', listener);
				wrapped.updateAttr(1, 'new', 'yellow');
				expect(listener).toHaveBeenCalledWith('updateAttr', [1, 'new', 'yellow'], 'sess');
			});
			it('should fail if no such child exists', function () {
				var listener = jasmine.createSpy('attr_listener'),
					aggregate = MAPJS.content({id: 1, ideas: { 5: { id: 2}}}),
					result;
				aggregate.addEventListener('changed', listener);
				result = aggregate.updateAttr(100, 'newAttr', 'newValue');
				expect(result).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('should fail if old attr equals new one', function () {
				var listener = jasmine.createSpy('attr_listener'),
					aggregate = MAPJS.content({id: 1, attr: {'v': 'x'} }),
					result;
				aggregate.addEventListener('changed', listener);
				result = aggregate.updateAttr(1, 'v', 'x');
				expect(result).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('should fail if old attr equals new one as a complex object', function () {
				var listener = jasmine.createSpy('attr_listener'),
					aggregate = MAPJS.content({id: 1, attr: {'v': { sub: 'x'} } }),
					result;
				aggregate.addEventListener('changed', listener);
				result = aggregate.updateAttr(1, 'v', { sub : 'x'});
				expect(result).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('should fail if removing a non existent property', function () {
				var listener = jasmine.createSpy('attr_listener'),
					aggregate = MAPJS.content({id: 1, attr: {'v': 'x'} }),
					result;
				aggregate.addEventListener('changed', listener);
				result = aggregate.updateAttr(1, 'y', false);
				expect(result).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('should pop an undo function onto event stack if successful', function () {
				var aggregate = MAPJS.content({id: 71, attr: {'newAttr': 'oldValue'}});
				aggregate.updateAttr(71, 'newAttr', 'newValue');
				aggregate.undo();
				expect(aggregate.getAttr('newAttr')).toBe('oldValue');
			});
			it('should undo attr deletion if successful', function () {
				var aggregate = MAPJS.content({id: 71, attr: {'newAttr': 'oldValue'}});
				aggregate.updateAttr(71, 'newAttr', false);
				aggregate.undo();
				expect(aggregate.getAttr('newAttr')).toBe('oldValue');
			});
			it('deep clones complex objects to prevent outside changes', function () {
				var aggregate = MAPJS.content({id: 71}),
					attrOb = { background: 'yellow', sub: { subsub: 0 }};
				aggregate.updateAttr(71, 'new', attrOb);
				attrOb.background  = 'white';
				attrOb.sub.subsub = 1;
				expect(aggregate.getAttr('new').background).toBe('yellow');
				expect(aggregate.getAttr('new').sub.subsub).toBe(0);
			});
		});
		describe('updateTitle', function () {
			it('changes the title of the current idea only if it matches ID in command', function () {
				var first = MAPJS.content({id: 71, title: 'My Idea'}),
					first_succeeded = first.updateTitle(71, 'Updated');
				expect(first_succeeded).toBeTruthy();
				expect(first.title).toBe('Updated');
			});
			it('changes the title of the current idea only if it matches ID in command even if given as a string  (DOM/_.js quirk workaround)', function () {
				var first = MAPJS.content({id: 71.5, title: 'My Idea'}),
					first_succeeded = first.updateTitle('71.5', 'Updated');
				expect(first_succeeded).toBeTruthy();
				expect(first.title).toBe('Updated');
			});
			it('fails if the aggregate does not contain the target ID', function () {
				var second = MAPJS.content({id: 72, title: 'Untouched'}),
					listener = jasmine.createSpy('title_listener');
				second.addEventListener('changed', listener);
				expect(second.updateTitle(71, 'Updated')).toBeFalsy();
				expect(second.title).toBe('Untouched');
				expect(listener).not.toHaveBeenCalled();
			});
			it('fails if the title is the same', function () {
				var second = MAPJS.content({id: 1, title: 'Untouched'}),
					listener = jasmine.createSpy('title_listener');
				second.addEventListener('changed', listener);
				expect(second.updateTitle(1, 'Untouched')).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('propagates changes to child ideas if the ID does not match, succeeding if there is a matching child', function () {
				var ideas = MAPJS.content({id: 1, title: 'My Idea',
								ideas: {  1: {id: 2, title: 'My First Subidea', ideas: {1: {id: 3, title: 'My First sub-sub-idea'}}}}}),
					result = ideas.updateTitle(3, 'Updated');
				expect(result).toBeTruthy();
				expect(ideas.ideas[1].ideas[1].title).toBe('Updated');
				expect(ideas.updateTitle('Non Existing', 'XX')).toBeFalsy();
			});
			it('fires an event matching the method call when the title changes', function () {
				var listener = jasmine.createSpy('title_listener'),
					wrapped = MAPJS.content({title: 'My Idea', id: 2, ideas: {1: {id: 1, title: 'Old title'}}});
				wrapped.addEventListener('changed', listener);
				wrapped.updateTitle(1, 'New Title');
				expect(listener).toHaveBeenCalledWith('updateTitle', [1, 'New Title']);
			});
			it('fires an event with session ID if defined', function () {
				var listener = jasmine.createSpy('title_listener'),
					wrapped = MAPJS.content({id: 1}, 'sess');
				wrapped.addEventListener('changed', listener);
				wrapped.updateTitle(1, 'New Title');
				expect(listener).toHaveBeenCalledWith('updateTitle', [1, 'New Title'], 'sess');
			});
			it('puts a undo method on the stack when successful', function () {
				var wrapped = MAPJS.content({id: 71, title: 'My Idea'});
				wrapped.updateTitle(71, 'Updated');
				wrapped.undo();
				expect(wrapped.title).toBe('My Idea');
			});
		});
		describe('insertIntermediate', function () {
			var listener, idea;
			beforeEach(function () {
				idea = MAPJS.content({id: 1, ideas: {77: {id: 2, title: 'Moved'}}});
				listener = jasmine.createSpy('insert_listener');
				idea.addEventListener('changed', listener);
			});
			it('adds an idea between the argument idea and its parent, keeping the same rank for the new node and reassigning rank of 1 to the argument', function () {
				var result = idea.insertIntermediate(2, 'Steve');
				expect(result).toBeTruthy();
				expect(idea.ideas[77]).toPartiallyMatch({id: 3, title: 'Steve'});
				expect(_.size(idea.ideas)).toBe(1);
				expect(_.size(idea.ideas[77].ideas)).toBe(1);
				expect(idea.ideas[77].ideas[1]).toPartiallyMatch({id: 2, title: 'Moved'});
			});
			it('assigns an ID automatically if not provided', function () {
				var result = idea.insertIntermediate(2, 'Steve');
				expect(result).toBeTruthy();
				expect(idea.ideas[77].id).not.toBeNull();
			});
			it('assigns the provided ID if argument given', function () {
				var result = idea.insertIntermediate(2, 'Steve', 777);
				expect(result).toBeTruthy();
				expect(idea.ideas[77].id).toBe(777);
			});
			it('does not mess up automatic ID for nodes after operation when ID is provided', function () {
				idea.addSubIdea(2, 'x');
				idea.insertIntermediate(2, 'Steve', 777);
				idea.addSubIdea(2, 'y');
				expect(idea.findSubIdeaById(2).ideas[2].id).toBe(778);
			});
			it('fails if the ID is provided and it already exists', function () {
				var result = idea.insertIntermediate(2, 'Steve', 2);
				expect(result).toBeFalsy();
				expect(idea.ideas[77].id).toBe(2);
			});
			it('fires an event matching the method call when the operation succeeds', function () {
				idea.insertIntermediate(2, 'Steve');
				expect(listener).toHaveBeenCalledWith('insertIntermediate', [2, 'Steve', 3]);
			});
			it('fires an event with session ID if defined', function () {
				var idea = MAPJS.content({id: 1, ideas: {77: {id: 2, title: 'Moved'}}}, 'sess');
				listener = jasmine.createSpy('insert_listener');
				idea.addEventListener('changed', listener);
				idea.insertIntermediate(2, 'Steve');
				expect(listener).toHaveBeenCalledWith('insertIntermediate', [2, 'Steve', '3.sess'], 'sess');
			});
			it('fires the generated ID in the event if the ID was not supplied', function () {
				var result = idea.insertIntermediate(2, 'Steve'),
					newId = idea.ideas[77].id;
				expect(listener).toHaveBeenCalledWith('insertIntermediate', [2, 'Steve', newId]);
			});
			it('fails if argument idea does not exist', function () {
				expect(idea.insertIntermediate(22, 'Steve')).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('fails if idea has no parent', function () {
				expect(idea.insertIntermediate(1, 'Steve')).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('pops an event to undo stack if successful', function () {
				idea.insertIntermediate(2, 'Steve');
				idea.undo();
				expect(idea.ideas[77]).toPartiallyMatch({id: 2, title: 'Moved'});
			});
		});
		describe('addSubIdea', function () {
			it('adds a sub-idea to the idea in the argument', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'}),
					succeeded = idea.addSubIdea(71, 'New idea'),
					asArray = _.toArray(idea.ideas);
				expect(succeeded).toBeTruthy();
				expect(asArray.length).toBe(1);
				expect(asArray[0].title).toBe('New idea');
			});
			it('repeatedly adds only one idea (bug resurrection check)', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'});
				idea.addSubIdea(71, 'First idea');
				idea.addSubIdea(71, 'Second idea');
				expect(_.size(idea.ideas)).toBe(2);
			});
			it('assigns the next available ID to the new idea if the ID was not provided', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'});
				idea.addSubIdea(71);
				expect(_.toArray(idea.ideas)[0].id).toBe(72);
			});
			it('returns the assigned ID if successful', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'}),
					newId = idea.addSubIdea(71);
				expect(newId).toBe(72);
			});
			it('appends the session key if given', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'}, 'session');
				idea.addSubIdea(71);
				expect(_.toArray(idea.ideas)[0].id).toBe('72.session');
			});
			it('uses the provided ID if one is provided', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'});
				idea.addSubIdea(71, 'T', 555);
				expect(_.toArray(idea.ideas)[0].id).toBe(555);
			});
			it('does not mess up automatic ID for nodes after operation when ID is provided', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'});
				idea.addSubIdea(71, 'x');
				idea.addSubIdea(72, 'T', 555);
				idea.addSubIdea(555, 'y');
				expect(idea.findSubIdeaById(555).ideas[1].id).toBe(556);
			});
			it('fails if provided ID clashes with an existing ID', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'}),
					result = idea.addSubIdea(71, 'X', 71);
				expect(result).toBeFalsy();
				expect(_.size(idea.ideas)).toBe(0);
			});
			it('assigns the first subidea the rank of 1', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'});
				idea.addSubIdea(71);
				expect(idea.findChildRankById(72)).toBe(1);
			});
			it('when adding nodes to 2nd level items and more, adds a node at a rank greater than any of its siblings', function () {
				var idea = MAPJS.content({id: 1, ideas: {1: {id: 5, ideas: {5: {id: 2}, 10: { id: 3}, 15 : {id: 4}}}}});
				idea.addSubIdea(5, 'x');
				expect(idea.ideas[1].findChildRankById(6)).not.toBeLessThan(15);
			});
			it('propagates to children if it does not match the requested id, succeeding if any child ID matches', function () {
				var ideas = MAPJS.content({id: 1, title: 'My Idea',
					ideas: {1: {id: 2, title: 'My First Subidea', ideas: {1: {id: 3, title: 'My First sub-sub-idea'}}}}}),
					result = ideas.addSubIdea(3, 'New New');
				expect(result).toBeTruthy();
				expect(ideas.ideas[1].ideas[1].ideas[1].title).toBe('New New');
			});
			it('fails if no child ID in hierarchy matches requested id', function () {
				var ideas = MAPJS.content({id: 1, title: 'My Idea',
					ideas: {1: {id: 2, title: 'My First Subidea', ideas: {1: {id: 3, title: 'My First sub-sub-idea'}}}}});
				expect(ideas.addSubIdea(33, 'New New')).toBeFalsy();
			});
			it('fires an event matching the method call when a new idea is added', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'}),
					addedListener = jasmine.createSpy();
				idea.addEventListener('changed', addedListener);
				idea.addSubIdea(71, 'New Title');
				expect(addedListener).toHaveBeenCalledWith('addSubIdea', [71, 'New Title', 72]);
			});
			it('fires an event with session ID if provided', function () {
				var idea = MAPJS.content({id: 71, title: 'My Idea'}, 'sess'),
					addedListener = jasmine.createSpy();
				idea.addEventListener('changed', addedListener);
				idea.addSubIdea(71, 'New Title');
				expect(addedListener).toHaveBeenCalledWith('addSubIdea', [71, 'New Title', '72.sess'], 'sess');
			});
			it('pops an event on the undo stack if successful', function () {
				var idea = MAPJS.content({id: 4, ideas: {1: {id: 5, title: 'My Idea'}}});
				idea.addSubIdea(4, 'New');
				idea.undo();
				expect(idea.ideas[1]).toPartiallyMatch({id: 5, title: 'My Idea'});
				expect(_.size(idea.ideas)).toBe(1);
			});
			it('takes negative rank items as absolute while calculating new rank ID (bug resurrection test)', function () {
				var idea = MAPJS.content({id: 1, title: 'I1', ideas: {5: {id: 2, title: 'I2'}, 6: {id: 3, title: 'I3'}, '-16': {id: 4, title: 'I4'}}});
				idea.addSubIdea(1);
				expect(Math.abs(idea.findChildRankById(5))).not.toBeLessThan(16);
			});
			describe('balances positive/negative ranks when adding to aggegate root', function () {
				it('gives first child a positive rank', function () {
					var idea = MAPJS.content({id: 1});
					idea.addSubIdea(1, 'new');
					expect(idea.findChildRankById(2)).not.toBeLessThan(0);
				});
				it('gives second child a negative rank', function () {
					var idea = MAPJS.content({id: 1});
					idea.addSubIdea(1, 'new');
					idea.addSubIdea(1, 'new');
					expect(idea.findChildRankById(3)).toBeLessThan(0);
				});
				it('adds a negative rank if there are more positive ranks than negative', function () {
					var idea = MAPJS.content({id: 1, title: 'I1', ideas: {5: {id: 2, title: 'I2'}, 10: {id: 3, title: 'I3'}, '-15': {id: 4, title: 'I4'}}});
					idea.addSubIdea(1);
					expect(idea.findChildRankById(5)).toBeLessThan(0);
				});
				it('adds a positive rank if there are less or equal positive ranks than negative', function () {
					var idea = MAPJS.content({id: 1, title: 'I1', ideas: {5: {id: 2, title: 'I2'}, '-15': {id: 4, title: 'I4'}}});
					idea.addSubIdea(1);
					expect(idea.findChildRankById(5)).not.toBeLessThan(0);
				});
				it('when adding positive rank nodes, adds a node at a rank greater than any of its siblings', function () {
					var idea = MAPJS.content({id: 1, ideas: {'-3': {id: 5}, '-5': {id: 2}, 10: {id: 3}, 15 : {id: 4}}});
					idea.addSubIdea(1, 'x');
					expect(idea.findChildRankById(6)).not.toBeLessThan(15);
				});
				it('when adding negative rank nodes, adds a node at a rank lesser than any of its siblings', function () {
					var idea = MAPJS.content({id: 1, ideas: {'-3': {id: 5}, '-5': {id: 2}, 10: {id: 3}, 15: {id: 4}, 20: {id: 6}}});
					idea.addSubIdea(1, 'x');
					expect(idea.findChildRankById(7)).toBeLessThan(-5);
				});
			});
		});
		describe('changeParent', function () {
			var idea;
			beforeEach(function () {
				idea = MAPJS.content({id: 5, ideas: {9: {id: 1, ideas: { '-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}});
			});
			it('removes an idea from its parent and reassings to another parent', function () {
				var result = idea.changeParent(4, 5);
				expect(result).toBeTruthy();
				expect(idea.containsDirectChild(4)).toBeTruthy();
				expect(idea.ideas[9].containsDirectChild(4)).toBeFalsy();
			});
			it('fails if no such idea exists to remove', function () {
				expect(idea.changeParent(14, 5)).toBeFalsy();
			});
			it('fails if no such new parent exists', function () {
				expect(idea.changeParent(4, 11)).toBeFalsy();
				expect(idea.ideas[9].ideas[-15].id).toBe(4);
			});
			it('fires an event matching the method call when a parent is changed', function () {
				var listener = jasmine.createSpy('changeParent');
				idea.addEventListener('changed', listener);
				idea.changeParent(4, 5);
				expect(listener).toHaveBeenCalledWith('changeParent', [4, 5]);
			});
			it('fires an event with session ID if provided', function () {
				var idea = MAPJS.content({id: 5, ideas: {9: {id: 1, ideas: { '-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}, 'sess'),
					listener = jasmine.createSpy('changeParent');
				idea.addEventListener('changed', listener);
				idea.changeParent(4, 5);
				expect(listener).toHaveBeenCalledWith('changeParent', [4, 5], 'sess');
			});
			it('fails if asked to make a idea its own parent', function () {
				expect(idea.changeParent(2, 2)).toBeFalsy();
			});
			it('fails if asked to make a cycle (make a idea a child of its own child)', function () {
				expect(idea.changeParent(1, 2)).toBeFalsy();
			});
			it('should convert types passed as ids for parent and child nodes', function () {
				expect(idea.changeParent(1, '2')).toBeFalsy();
				expect(idea.changeParent('1', 2)).toBeFalsy();
			});
			it('fails if asked to put an idea in its current parent', function () {
				expect(idea.changeParent(1, 5)).toBeFalsy();
			});
			it('pushes an operation to the undo stack if it succeeds', function () {
				idea.changeParent(4, 5);
				idea.undo();
				expect(idea.containsDirectChild(4)).toBeFalsy();
				expect(idea.ideas[9].containsDirectChild(4)).toBeTruthy();
			});
		});
		describe('removeSubIdea', function () {
			it('removes a child idea matching the provided id', function () {
				var idea = MAPJS.content({id: 1, ideas: {5: {id: 2}, 10: {id: 3}, 15: {id: 4}}});
				expect(idea.removeSubIdea(2)).toBeTruthy();
				expect(_.size(idea.ideas)).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
			});
			it('delegates to children if no immediate child matches id', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}});
				expect(idea.removeSubIdea(3)).toBeTruthy();
				expect(_.size(idea.ideas[9].ideas)).toBe(2);
				expect(idea.ideas[9].ideas[-5].id).toBe(2);
				expect(idea.ideas[9].ideas[-15].id).toBe(4);
			});
			it('fails if no immediate child matches id', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}),
					listener = jasmine.createSpy();
				idea.addEventListener('changed', listener);
				expect(idea.removeSubIdea(13)).toBeFalsy();
				expect(listener).not.toHaveBeenCalled();
			});
			it('fires an event matching the method call if successful', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}),
					listener = jasmine.createSpy();
				idea.addEventListener('changed', listener);
				idea.removeSubIdea(3);
				expect(listener).toHaveBeenCalledWith('removeSubIdea', [3]);
			});
			it('fires an event with session ID if provided', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}, 'sess'),
					listener = jasmine.createSpy();
				idea.addEventListener('changed', listener);
				idea.removeSubIdea(3);
				expect(listener).toHaveBeenCalledWith('removeSubIdea', [3], 'sess');
			});
			it('pushes an event to undo stack if successful', function () {
				var idea = MAPJS.content({id: 1, ideas: {5: {id: 2}, 10: {id: 3}, 15: {id: 4}}});
				idea.removeSubIdea(2);
				idea.undo();
				expect(idea.ideas[5]).toPartiallyMatch({id: 2});
			});
		});
		describe('flip', function () {
			it('assigns the idea the largest positive rank if the current rank was negative', function () {
				var idea = MAPJS.content({id: 1, ideas: {'-5': {id: 2}, 10: {id: 3}, 15: {id: 4}}}),
					result = idea.flip(2);
				expect(result).toBeTruthy();
				expect(idea.ideas[10].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.findChildRankById(2)).not.toBeLessThan(15);
			});
			it('assigns the idea the smallest negative rank if the current rank was positive', function () {
				var idea = MAPJS.content({id: 1, ideas: {'-5': {id: 2}, 10: {id: 3}, 15: {id: 4}}}),
					result = idea.flip(3);
				expect(result).toBeTruthy();
				expect(idea.ideas['-5'].id).toBe(2);
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.findChildRankById(3)).toBeLessThan(-5);
			});
			it('fails if called on idea that was not a child of the aggregate root', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}});
				spyOn(idea, 'dispatchEvent');
				expect(idea.flip(2)).toBeFalsy();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fails if called on non-existing idea that was not a child of the aggregate root', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15' : {id: 4}}}}});
				spyOn(idea, 'dispatchEvent');
				expect(idea.flip(99)).toBeFalsy();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fires a flip event with arguments matching function call if successful', function () {
				var idea = MAPJS.content({id: 1, ideas: {'-5': {id: 2}, 10: {id: 3}, 15: {id: 4}}});
				spyOn(idea, 'dispatchEvent');
				idea.flip(2);
				expect(idea.dispatchEvent).toHaveBeenCalledWith('changed', 'flip', [2]);
			});
			it('fires an event with session ID if provided', function () {
				var idea = MAPJS.content({id: 1, ideas: {'-5': {id: 2}, 10: {id: 3}, 15: {id: 4}}}, 'sess');
				spyOn(idea, 'dispatchEvent');
				idea.flip(2);
				expect(idea.dispatchEvent).toHaveBeenCalledWith('changed', 'flip', [2], 'sess');
			});
			it('pushes an undo function on the event stack', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}}}), newRank;
				idea.flip(2);
				newRank = idea.findChildRankById(2);
				idea.undo();
				expect(idea.findChildRankById(2)).toBe(-5);
				expect(idea.ideas[newRank]).toBeUndefined();
			});
		});
		describe('moveRelative', function () {
			it('if movement is negative, moves an idea relative to its immediate previous siblings', function () {
				var idea = MAPJS.content({id: 1, ideas: {5: {id: 2}, 10: {id: 3}, 15 : {id: 4}}}),
					result = idea.moveRelative(4, -1),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				new_key = idea.findChildRankById(4);
				expect(new_key).toBeLessThan(10);
				expect(new_key).not.toBeLessThan(5);
			});
			it('moves an idea before its immediate previous sibling for negative nodes', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}}),
					result = idea.moveRelative(4, -1),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[-5].id).toBe(2);
				expect(idea.ideas[-10].id).toBe(3);
				new_key = idea.findChildRankById(4);
				expect(new_key).toBeLessThan(-5);
				expect(new_key).not.toBeLessThan(-10);
			});
			it('if movement is positive, moves an idea relative to its immediate following siblings', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}),
					result = idea.moveRelative(2, 1),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.ideas[10].id).toBe(3);
				new_key = idea.findChildRankById(2);
				expect(new_key).toBeLessThan(15);
				expect(new_key).not.toBeLessThan(10);
			});
			it('moves an idea before its immediate following sibling for negative nodes', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}}),
					result = idea.moveRelative(2, 1),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[-15].id).toBe(4);
				expect(idea.ideas[-10].id).toBe(3);
				new_key = idea.findChildRankById(2);
				expect(new_key).toBeLessThan(-10);
				expect(new_key).not.toBeLessThan(-15);
			});
			it('moves to top', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.moveRelative(3, -1)).toBeTruthy();
				expect(idea.findChildRankById(3)).toBeLessThan(5);
			});

			it('does nothing if already on top and movement negative', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.moveRelative(2, -1)).toBeFalsy();
				expect(idea.findChildRankById(2)).toBe(5);
			});
			it('fails if no idea', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.moveRelative(10, 1)).toBeFalsy();
			});
			it('moves to bottom', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}});
				expect(idea.moveRelative(3, 1)).toBeTruthy();
				expect(idea.findChildRankById(3)).toBeGreaterThan(15);
			});
		});
		describe('positionBefore', function () {
			it('prevents a node to be reordered into itself, if is it already in the right position (production bugcheck)', function () {
				var idea = MAPJS.content({id: 1, ideas: {1: {id: 2}, 2: {id: 4}, 3: {id: 6}, 4: {id: 8}, '-1': {id: 3}, '-2': {id: 5}, '-3': {id: 7}, '-4': {id: 9}}});
				expect(idea.positionBefore(5, 7)).toBeFalsy();
				expect(_.size(idea.ideas)).toBe(8);
			});
			it('ignores different sign ranks when ordering', function () {
				var idea = MAPJS.content({id: 1, ideas: {'-0.25': {id: 24}, '-10.25': {id: 32}, '0.0625': {id: 5}, '0.03125': {id: 6}, '1.0625': {id: 7}}});
				spyOn(idea, 'dispatchEvent');
				expect(idea.positionBefore(24, 32)).toBeFalsy();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('reorders immediate children by changing the rank of an idea to be immediately before the provided idea', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}),
					result = idea.positionBefore(4, 3),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				new_key = idea.findChildRankById(4);
				expect(new_key).toBeLessThan(10);
				expect(new_key).not.toBeLessThan(5);
			});
			it('fails if the idea should be ordered before itself', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 12: { id: 3}, 15 : {id: 4}}}),
					result;
				spyOn(idea, 'dispatchEvent');
				result = idea.positionBefore(3, 3);
				expect(result).toBeFalsy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[12].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fails if the idea should be ordered in the same place', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 12: { id: 3}, 15 : {id: 4}}}),
					result;
				spyOn(idea, 'dispatchEvent');
				result = idea.positionBefore(3, 4);
				expect(result).toBeFalsy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[12].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fails if it cannot find appropriate idea to reorder', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}),
					result = idea.positionBefore(12, 3);
				expect(result).toBeFalsy();
			});
			it('fails if idea should be ordered before non-sibling', function () {
				var idea = MAPJS.content({
					id: 1,
					ideas: {
						5: {
							id: 2,
							ideas: {
								5: {
									id: 3
								},
								10: {
									id: 4
								}
							}
						},
						10: {
							id: 5,
							ideas: {
								5: {
									id: 6
								},
								10: {
									id: 7
								}
							}
						}
					}
				}),
					result;
				spyOn(idea, 'dispatchEvent');
				result = idea.positionBefore(6, 3);
				expect(result).toBe(false);
				expect(idea.ideas[10].ideas.NaN).not.toBeDefined();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('orders negative ideas as negative ranks', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}}),
					result = idea.positionBefore(4, 3),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[-5].id).toBe(2);
				expect(idea.ideas[-10].id).toBe(3);
				new_key = idea.findChildRankById(4);
				expect(new_key).not.toBeLessThan(-10);
				expect(new_key).toBeLessThan(-5);
			});
			it('puts the child in the first rank if the boundary idea was the first', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}),
					result = idea.positionBefore(4, 2),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				new_key = idea.findChildRankById(4);
				expect(new_key).toBeLessThan(5);
			});
			it('gives the idea the largest positive rank if the boundary idea was not defined and current rank was positive', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}),
					result = idea.positionBefore(2),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[10].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				new_key = idea.findChildRankById(2);
				expect(new_key).not.toBeLessThan(15);
			});
			it('fails if the boundary idea was not defined and child was already last', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}),
					result;
				spyOn(idea, 'dispatchEvent');
				result = idea.positionBefore(4);
				expect(result).toBeFalsy();
				expect(idea.ideas[5].id).toBe(2);
				expect(idea.ideas[10].id).toBe(3);
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('puts the child closest to zero from the - side if the boundary idea was the smallest negative', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}}),
					result = idea.positionBefore(4, 2),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[-5].id).toBe(2);
				expect(idea.ideas[-10].id).toBe(3);
				new_key = idea.findChildRankById(4);
				expect(new_key).not.toBeLessThan(-5);
				expect(new_key).toBeLessThan(0);
			});
			it('puts the child in the last negative rank if the boundary idea was not defined but current rank is negative', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}}),
					result = idea.positionBefore(2),
					new_key;
				expect(result).toBeTruthy();
				expect(idea.ideas[-10].id).toBe(3);
				expect(idea.ideas[-15].id).toBe(4);
				new_key = idea.findChildRankById(2);
				expect(new_key).toBeLessThan(-15);
			});
			it('fails if the boundary idea was not defined and child was already last with negative ranks', function () {
				var idea = MAPJS.content({id: 1, ideas: { '-5': { id: 2}, '-10': { id: 3}, '-15' : {id: 4}}}),
					result;
				spyOn(idea, 'dispatchEvent');
				result = idea.positionBefore(4);
				expect(result).toBeFalsy();
				expect(idea.ideas[-5].id).toBe(2);
				expect(idea.ideas[-10].id).toBe(3);
				expect(idea.ideas[-15].id).toBe(4);
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('fails if the boundary idea was not defined and child was already last in its group (positive/negative)', function () {
				var idea = MAPJS.content({id: 1, ideas: {5: { id: 2}, 8: {id: 5}, '-10': {id: 3}, '-15': {id: 4}}});
				spyOn(idea, 'dispatchEvent');
				expect(idea.positionBefore(4)).toBeFalsy();
				expect(idea.positionBefore(5)).toBeFalsy();
				expect(idea.dispatchEvent).not.toHaveBeenCalled();
			});
			it('delegates to children if it does not contain the requested idea, succeeding if any child does', function () {
				var idea = MAPJS.content({id: 0, title: 'I0', ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}),
					result = idea.positionBefore(4, 2),
					child,
					new_key;
				expect(result).toBeTruthy();
				child = idea.ideas[9];
				expect(child.ideas[-5].id).toBe(2);
				expect(child.ideas[-10].id).toBe(3);
				new_key = child.findChildRankById(4);
				expect(new_key).toBeLessThan(10);
				expect(new_key).not.toBeLessThan(-5);
				expect(new_key).toBeLessThan(0);
			});
			it('fails if none of the children contain the requested idea either', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}),
					result = idea.positionBefore(-4, 2);
				expect(result).toBeFalsy();
			});
			it('fires an event matching the method call if it succeeds', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}),
					childRankSpy = jasmine.createSpy();
				idea.addEventListener('changed', childRankSpy);
				idea.positionBefore(4, 2);
				expect(childRankSpy).toHaveBeenCalledWith('positionBefore', [4, 2]);
			});
			it('fires an event with session ID if defined', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}, 'sess'),
					childRankSpy = jasmine.createSpy();
				idea.addEventListener('changed', childRankSpy);
				idea.positionBefore(4, 2);
				expect(childRankSpy).toHaveBeenCalledWith('positionBefore', [4, 2], 'sess');
			});
			it('triggers correct session in a multi-session scenario when reordering children - bug resurrection check', function () {
				var idea = MAPJS.content({id: 0, ideas: {9: {id: 1, ideas: {'-5': {id: 2}, '-10': {id: 3}, '-15': {id: 4}}}}}, 'sess'),
					childRankSpy = jasmine.createSpy();
				idea.addEventListener('changed', childRankSpy);
				idea.execCommand('positionBefore', [4, 2], 'second');
				expect(childRankSpy).toHaveBeenCalledWith('positionBefore', [4, 2], 'second');
			});
			it('should work for negative ranks', function () {
				var idea = MAPJS.content({
					'title': '1',
					'id': 1,
					'ideas': {
						'-3': {
							'title': '4',
							'id': 4
						},
						'-2': {
							'title': '3',
							'id': 3
						},
						'-1': {
							'title': '2',
							'id': 2
						}
					}
				});
				expect(idea.positionBefore(2, 4)).toBe(true);
			});
			it('pushes an undo function onto the event stack if successful', function () {
				var idea = MAPJS.content({id: 1, ideas: { 5: { id: 2}, 10: { id: 3}, 15 : {id: 4}}}),
					newKey;
				idea.positionBefore(4, 3);
				newKey = idea.findChildRankById(4);
				idea.undo();
				expect(idea.ideas[15].id).toBe(4);
				expect(idea.ideas[newKey]).toBeUndefined();
				expect(_.size(idea.ideas)).toBe(3);
			});
		});
	});
	describe('redo', function () {
		it('succeeds if there is something to redo', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}), result;
			wrapped.updateTitle(1, 'First');
			wrapped.undo();
			result = wrapped.redo();
			expect(result).toBeTruthy();
			expect(wrapped.title).toBe('First');
		});
		it('fails if there is nothing to undo', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}), result;
			wrapped.updateTitle(1, 'First');
			result = wrapped.redo();
			expect(result).toBeFalsy();
		});
		it('cancels the top undo from the stack', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}), result;
			wrapped.updateTitle(1, 'First');
			wrapped.updateTitle(1, 'Second');
			wrapped.undo();
			result = wrapped.redo();
			expect(result).toBeTruthy();
			expect(wrapped.title).toBe('Second');
		});
		it('fires a change event if it succeeds', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}),
				spy = jasmine.createSpy('change');
			wrapped.updateTitle(1, 'First');
			wrapped.undo();
			wrapped.addEventListener('changed', spy);
			wrapped.redo();
			expect(spy).toHaveBeenCalledWith('redo', undefined, undefined);
		});
		it('fires an event with session ID if dedined', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}, 'sess'),
				spy = jasmine.createSpy('change');
			wrapped.updateTitle(1, 'First');
			wrapped.undo();
			wrapped.addEventListener('changed', spy);
			wrapped.redo();
			expect(spy).toHaveBeenCalledWith('redo', undefined, 'sess');
		});
		it('does not leave trailing redos if the last action was not caused by an undo/redo', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'});
			wrapped.updateTitle(1, 'First');
			wrapped.undo();
			wrapped.updateTitle(1, 'Second');
			wrapped.redo();
			expect(wrapped.title).toBe('Second');
		});
		it('shortcut method only redos undos from current session', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}, 'session1');
			wrapped.updateTitle(1, 'First');
			wrapped.execCommand('addSubIdea', [1], 'session2');
			wrapped.undo();
			wrapped.execCommand('undo', [1], 'session2');
			wrapped.redo();
			expect(wrapped.title).toBe('First');
			expect(_.size(wrapped.ideas)).toBe(0);
		});
		it('command processor redos undos from the given session', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}, 'session1');
			wrapped.updateTitle(1, 'First');
			wrapped.execCommand('addSubIdea', [1], 'session2');
			wrapped.execCommand('undo', [1], 'session2');
			wrapped.undo();
			wrapped.execCommand('redo', [], 'session2');
			expect(wrapped.title).toBe('Original');
			expect(_.size(wrapped.ideas)).toBe(1);
		});
	});
	describe('undo', function () {
		it('succeeds if there is something to undo', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'});
			wrapped.updateTitle(1, 'First');
			expect(wrapped.undo()).toBeTruthy();
			expect(wrapped.title).toBe('Original');
		});
		it('undos the top event from the stack', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'});
			wrapped.updateTitle(1, 'First');
			wrapped.updateTitle(1, 'Second');
			wrapped.undo();
			expect(wrapped.title).toBe('First');
		});
		
		it('multiple changes stack on the undo stack in the order of recency', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'});
			wrapped.updateTitle(1, 'First');
			wrapped.updateTitle(1, 'Second');
			wrapped.undo();
			wrapped.undo();
			expect(wrapped.title).toBe('Original');
		});
		it('fires a change event if it succeeds', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}),
				spy = jasmine.createSpy('change');
			wrapped.updateTitle(1, 'First');
			wrapped.addEventListener('changed', spy);
			wrapped.undo();
			expect(spy).toHaveBeenCalledWith('undo', [], undefined);
		});
		it('fires an event with session ID if defined', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}, 'sess'),
				spy = jasmine.createSpy('change');
			wrapped.updateTitle(1, 'First');
			wrapped.addEventListener('changed', spy);
			wrapped.undo();
			expect(spy).toHaveBeenCalledWith('undo', [], 'sess');
		});
		it('fails if there is nothing to undo', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}),
				spy = jasmine.createSpy('change');
			wrapped.addEventListener('changed', spy);
			expect(wrapped.undo()).toBeFalsy();
			expect(spy).not.toHaveBeenCalled();
		});
		it('shortcut method only undos events caused by the default session', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}, 'session1');
			wrapped.updateTitle(1, 'First');
			wrapped.execCommand('addSubIdea', [1], 'session2');
			wrapped.undo();
			expect(wrapped.title).toBe('Original');
			expect(_.size(wrapped.ideas)).toBe(1);
		});
		it('command processor undos events caused by the provided session', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}, 'session1');
			wrapped.execCommand('addSubIdea', [1], 'session2');
			wrapped.updateTitle(1, 'First');
			wrapped.execCommand('undo', [1], 'session2');
			wrapped.undo();
			expect(wrapped.title).toBe('Original');
			expect(_.size(wrapped.ideas)).toBe(0);
		});
	});
	describe('command batching', function () {
		it('executes a batch as a shortcut method', function () {
			var wrapped = MAPJS.content({id: 1, title: 'Original'}),
				listener = jasmine.createSpy();
			wrapped.addEventListener('changed', listener);
			wrapped.batch(function () {
				wrapped.updateTitle(1, 'Mix');
				wrapped.updateTitle(1, 'Max');
			});
			expect(listener.callCount).toBe(1);
			expect(listener).toHaveBeenCalledWith('batch', [
				['updateTitle', 1, 'Mix' ],
				['updateTitle', 1, 'Max' ]
			]);
		});
		describe('in local session', function () {
			var wrapped, listener;
			beforeEach(function () {
				wrapped = MAPJS.content({id: 1, title: 'Original'});
				listener = jasmine.createSpy();
				wrapped.addEventListener('changed', listener);
				wrapped.startBatch();
				wrapped.updateTitle(1, 'Mix');
				wrapped.updateTitle(1, 'Max');
			});
			it('sends out a single event for the entire batch', function () {
				wrapped.endBatch();
				expect(listener.callCount).toBe(1);
				expect(listener).toHaveBeenCalledWith('batch', [
					['updateTitle', 1, 'Mix' ],
					['updateTitle', 1, 'Max' ]
				]);
			});
			it('will open a new batch if starting and there is an open one', function () {
				wrapped.startBatch();
				wrapped.updateTitle(1, 'Nox');
				wrapped.updateTitle(1, 'Vox');
				wrapped.endBatch();

				expect(listener.callCount).toBe(2);
				expect(listener).toHaveBeenCalledWith('batch', [
					['updateTitle', 1, 'Mix'],
					['updateTitle', 1, 'Max']
				]);
				expect(listener).toHaveBeenCalledWith('batch', [
					['updateTitle', 1, 'Nox'],
					['updateTitle', 1, 'Vox']
				]);
			});
			it('will not send out an empty batch', function () {
				wrapped = MAPJS.content({id: 1, title: 'Original'});
				listener = jasmine.createSpy();
				wrapped.addEventListener('changed', listener);
				wrapped.startBatch();
				wrapped.endBatch();

				expect(listener).not.toHaveBeenCalled();
			});
			it('will not send out an undefined batch', function () {
				wrapped = MAPJS.content({id: 1, title: 'Original'});
				listener = jasmine.createSpy();
				wrapped.addEventListener('changed', listener);
				wrapped.endBatch();

				expect(listener).not.toHaveBeenCalled();
			});
			it('supports mixing batched and non batched commands', function () {
				wrapped.endBatch();
				wrapped.addSubIdea(1);
				expect(listener.callCount).toBe(2);
				expect(listener.calls[0].args[0]).toBe('batch');
				expect(listener.calls[1].args[0]).toBe('addSubIdea');
			});
			it('does not confuse non batched commands after an empty batch', function () {
				wrapped.endBatch();
				wrapped.startBatch();
				wrapped.endBatch();
				wrapped.addSubIdea(1);
				expect(listener.callCount).toBe(2);
				expect(listener.calls[0].args[0]).toBe('batch');
				expect(listener.calls[1].args[0]).toBe('addSubIdea');
			});
			it('will send the event directly instead of a batch with a single event', function () {
				wrapped = MAPJS.content({id: 1, title: 'Original'});
				listener = jasmine.createSpy();
				wrapped.addEventListener('changed', listener);
				wrapped.startBatch();
				wrapped.updateTitle(1, 'New');
				wrapped.endBatch();

				expect(listener).toHaveBeenCalledWith('updateTitle', [1, 'New']);
			});
			it('undos an entire batch', function () {
				wrapped.endBatch();

				wrapped.undo();

				expect(wrapped.title).toBe('Original');
				expect(listener.callCount).toBe(2);
			});
			it('undos an open batch as a separate event', function () {
				wrapped.undo();

				expect(wrapped.title).toBe('Original');
				expect(listener.callCount).toBe(2);
			});
			it('redos an entire batch', function () {
				wrapped.endBatch();
				wrapped.undo();

				wrapped.redo();

				expect(wrapped.title).toBe('Max');
			});
			it('redos an open batch', function () {
				wrapped.undo();

				wrapped.redo();

				expect(wrapped.title).toBe('Max');
			});
			it('redos in correct order', function () {
				var newId = wrapped.addSubIdea(1, 'Hello World');
				wrapped.updateTitle(newId, 'Yello World');
				wrapped.endBatch();
				wrapped.undo();
				wrapped.redo();

				expect(wrapped.findSubIdeaById(newId).title).toBe('Yello World');
			});
		});
		describe('with sessions', function () {
			var wrapped, listener;
			beforeEach(function () {
				wrapped = MAPJS.content({id: 1, title: 'Original'}, 'session1');
				listener = jasmine.createSpy();
				wrapped.addEventListener('changed', listener);
				wrapped.execCommand('batch', [
					['updateTitle', 1, 'Mix' ],
					['updateTitle', 1, 'Max' ]
				], 'session2');
			});
			it('sends out a single event for the entire batch', function () {
				expect(listener.callCount).toBe(1);
				expect(listener).toHaveBeenCalledWith('batch', [
					['updateTitle', 1, 'Mix' ],
					['updateTitle', 1, 'Max' ]
				], 'session2');
			});
			it('undos an entire batch as a single event', function () {
				wrapped.execCommand('undo', [], 'session2');

				expect(wrapped.title).toBe('Original');
				expect(listener.callCount).toBe(2);
			});
			it('redos an entire batch as a single event', function () {
				wrapped.execCommand('undo', [], 'session2');

				wrapped.execCommand('redo', [], 'session2');

				expect(wrapped.title).toBe('Max');
				expect(listener.callCount).toBe(3);
			});
		});
		describe('across sessions', function () {
			var wrapped;
			beforeEach(function () {
				wrapped = MAPJS.content({id: 1, title: 'Original'}, 'session1');
				wrapped.startBatch();
				wrapped.addSubIdea(1);
				wrapped.execCommand('batch', [
					['updateTitle', 1, 'Mix' ],
					['updateTitle', 1, 'Max' ]
				], 'session2');
				wrapped.addSubIdea(1);
				wrapped.endBatch();
			});
			describe('tracks batches for each session separately', function () {
				it('undos local batches without messing up remote batches', function () {
					wrapped.undo();
					expect(_.size(wrapped.ideas)).toBe(0);
					expect(wrapped.title).toBe('Max');
				});
				it('undos remote batches without messing up local batches', function () {
					wrapped.execCommand('undo', [], 'session2');
					expect(_.size(wrapped.ideas)).toBe(2);
					expect(wrapped.title).toBe('Original');
				});
			});
		});
	});
	describe('links', function () {
		var idea;
		beforeEach(function () {
			idea = MAPJS.content({
				id: 1,
				title: 'Node 1',
				ideas: {
					1: {
						id: 2,
						title: 'Node 2'
					},
					2: {
						id: 3,
						title: 'Node 3'
					}
				}
			});
		});
		it('should add a link between two ideas when addLink method is called', function () {
			var result = idea.addLink(2, 3);

			expect(result).toBe(true);
		});
		it('should remove link when start node is removed', function () {
			idea.addLink(2, 3);
			idea.removeSubIdea(2);
			expect(_.size(idea.links)).toBe(0);
		});
		it('should remove link when end node is removed', function () {
			idea.addLink(2, 3);
			idea.removeSubIdea(3);
			expect(_.size(idea.links)).toBe(0);
		});
		it('should put link removal into undo stack when node is removed', function () {
			idea.addLink(2, 3);
			idea.removeSubIdea(3);
			idea.undo();
			expect(_.size(idea.links)).toBe(1);
		});
		it('should dispatch a changed event when addLink method is called', function () {
			var changedListener = jasmine.createSpy();
			idea.addEventListener('changed', changedListener);

			idea.addLink(2, 3);

			expect(changedListener).toHaveBeenCalledWith('addLink', [2, 3]);
		});
		it('should dispatch a changed event with session ID if dedined', function () {
			var idea = MAPJS.content({id: 1, ideas: {1: {id: 2}, 2: { id: 3}}}, 'sess'),
				changedListener = jasmine.createSpy();
			idea.addEventListener('changed', changedListener);

			idea.addLink(2, 3);

			expect(changedListener).toHaveBeenCalledWith('addLink', [2, 3], 'sess');
		});
		it('should not be able to add link if both nodes don\'t exist', function () {
			var result, changedListener = jasmine.createSpy();
			idea.addEventListener('changed', changedListener);

			result = idea.addLink(1, 22);

			expect(result).toBe(false);
			expect(idea.links).not.toBeDefined();
			expect(changedListener).not.toHaveBeenCalled();
		});
		it('should not be able to create a link between same two nodes', function () {
			var result, changedListener = jasmine.createSpy();
			idea.addEventListener('changed', changedListener);

			result = idea.addLink(2, 2);

			expect(result).toBe(false);
			expect(idea.links).not.toBeDefined();
			expect(changedListener).not.toHaveBeenCalledWith('addLink', 2, 2);
		});
		it('should not be able to create a link between a parent and a child', function () {
			var result, changedListener = jasmine.createSpy();
			idea.addEventListener('changed', changedListener);

			result = idea.addLink(1, 2);

			expect(result).toBe(false);
			expect(idea.links).not.toBeDefined();
			expect(changedListener).not.toHaveBeenCalledWith('addLink', 1, 2);
		});
		it('should not be able to add the same link twice', function () {
			var result, changedListener = jasmine.createSpy();
			idea.addLink(2, 3);
			idea.addEventListener('changed', changedListener);

			result = idea.addLink(2, 3);

			expect(result).toBe(false);
			expect(idea.links.length).toBe(1);
			expect(idea.links[0]).toPartiallyMatch({
				ideaIdFrom: 2,
				ideaIdTo: 3
			});
			expect(changedListener).not.toHaveBeenCalled();
		});
		it('should not be able to add the link in the opposite direction of an already existing link', function () {
			var result, changedListener = jasmine.createSpy();
			idea.addLink(2, 3);
			idea.addEventListener('changed', changedListener);

			result = idea.addLink(3, 2);

			expect(result).toBe(false);
			expect(idea.links.length).toBe(1);
			expect(idea.links[0]).toPartiallyMatch({
				ideaIdFrom: 2,
				ideaIdTo: 3
			});
			expect(changedListener).not.toHaveBeenCalled();
		});
		it('should remove a link when removeLink method is invoked', function () {
			var result, changedListener = jasmine.createSpy();
			idea.addLink(2, 3);
			idea.addEventListener('changed', changedListener);

			result = idea.removeLink(2, 3);

			expect(result).toBe(true);
			expect(idea.links).toEqual([]);
			expect(changedListener).toHaveBeenCalledWith('removeLink', [2, 3]);
		});
		it('should fire an event with session ID if provided when remove link is invoked', function () {
			var idea = MAPJS.content({id: 1, ideas: {1: {id: 2}, 2: { id: 3}}}, 'sess'),
				result,
				changedListener = jasmine.createSpy();
			idea.addLink(2, 3);
			idea.addEventListener('changed', changedListener);

			idea.removeLink(2, 3);

			expect(changedListener).toHaveBeenCalledWith('removeLink', [2, 3], 'sess');
		});
		it('should not be able to remove link that does not exist', function () {
			var result, changedListener = jasmine.createSpy();
			idea.addLink(2, 3);
			idea.addEventListener('changed', changedListener);

			result = idea.removeLink(1, 1);

			expect(result).toBe(false);
			expect(idea.links.length).toBe(1);
			expect(idea.links[0]).toPartiallyMatch({
				ideaIdFrom: 2,
				ideaIdTo: 3
			});
			expect(changedListener).not.toHaveBeenCalled();
		});
		it('should allow a link attribute to be set on the aggregate', function () {
			var result, changedListener = jasmine.createSpy();
			idea.addEventListener('changed', changedListener);
			idea.addLink(2, 3);

			result = idea.updateLinkAttr(2, 3, 'newAttr', 'newValue');

			expect(result).toBe(true);
			expect(idea.getLinkAttr(2, 3, 'newAttr')).toBe('newValue');
			expect(changedListener).toHaveBeenCalledWith('updateLinkAttr', [2, 3, 'newAttr', 'newValue']);
		});
		it('should return false when trying to set the attribute of a non-existing link', function () {
			var result;

			result = idea.updateLinkAttr(2, 3, 'newAttr', 'newValue');

			expect(result).toBe(false);
		});
	});
	describe('support for multiple versions', function () {
		it('should append current format version', function () {
			var wrapped = MAPJS.content({title: 'My Idea'});
			expect(wrapped.formatVersion).toBe(2);
		});
		it('should upgrade from version 1 by splitting background and collapsed', function () {
			var wrapped = MAPJS.content({title: 'My Idea', style: {background: 'black', collapsed: true}});

			expect(wrapped.style).toBeUndefined();
			expect(wrapped.attr.style.background).toBe('black');
			expect(wrapped.attr.style.collapsed).toBeUndefined();
			expect(wrapped.attr.collapsed).toBe(true);
		});
		it('should upgrade recursively', function () {
			var wrapped = MAPJS.content({title: 'asdf', ideas: { 1: {title: 'My Idea', style: {background: 'black', collapsed: true}}}});

			expect(wrapped.ideas[1].style).toBeUndefined();
			expect(wrapped.ideas[1].attr.style.background).toBe('black');
			expect(wrapped.ideas[1].attr.style.collapsed).toBeUndefined();
			expect(wrapped.ideas[1].attr.collapsed).toBe(true);
		});
		it('should not upgrade if formatVersion is 2', function () {
			var wrapped = MAPJS.content({title: 'My Idea', attr: { style: {background: 'black'}, collapsed: true }, formatVersion: 2});

			expect(wrapped.attr.style).toEqual({background: 'black'});
			expect(wrapped.attr.collapsed).toEqual(true);
		});
	});
});
