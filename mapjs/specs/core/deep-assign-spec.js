/*global require, describe, it expect*/

const underTest = require('../../src/core/deep-assign');

describe('deepAssign', () => {
	'use strict';
	describe('should throw invalid-args', () => {
		it('when called without arguments', () => {
			expect(() => underTest()).toThrowError('invalid-args');
		});
		it('when called with non object arguments', () => {
			expect(() => underTest(1)).toThrowError('invalid-args');
		});
	});
	it('returns the object unchanged when called with one argument', () => {
		expect(underTest({})).toEqual({});
	});
	it('returns the first object with primitive assignments', () => {
		expect(underTest({a: 1, b: 1}, {a: 2}, {c: 3})).toEqual({a: 2, b: 1, c: 3});
	});
	it('mutates the first object with primitive assignments', () => {
		const assignee = {a: 1, b: 1};
		underTest(assignee, {a: 2}, {c: 3});
		expect(assignee).toEqual({a: 2, b: 1, c: 3});
	});
	it('creates copies of new assigned object attributes', () => {
		const assignee = {},
			assigner1 = {b: {c: '2'}};
		underTest(assignee, assigner1);
		assigner1.b.c = '2after';
		assigner1.c = 'newafter';
		expect(assignee).toEqual({b: {c: '2'}});

	});
	it('does not mutate the other objects with primitive assignments', () => {
		const assignee = {a: 1, b: 1},
			assigner1 = {b: {c: '2'}},
			assigner2 = {b: {d: '3'}};
		underTest(assignee, assigner1, assigner2);
		expect(assignee).toEqual({a: 1, b: {c: '2', d: '3'}});
		expect(assigner1).toEqual({b: {c: '2'}});
		expect(assigner2).toEqual({b: {d: '3'}});
	});
	it('replaces primitives with objects for the same key', () => {
		expect(underTest({a: 1, b: 1}, {a: {c: '2'}})).toEqual({a: {c: '2'}, b: 1});
	});
	it('replaces objects with primitive for the same key', () => {
		expect(underTest({a: {c: 2}, b: 1}, {a: 3})).toEqual({a: 3, b: 1});
	});
	it('recursively merges object for the same key', () => {
		const assignee = {
				a: 'a from assignee',
				b: {
					c: 'b.c from assignee',
					d: 'b.d from assignee',
					e: 'b.e from assignee'
				}
			},
			assigner1 = {
				b: {
					c: 'b.c from assigner1',
					e: 'b.e from assigner1'
				},
				c: 'c from assigner1',
				d: {
					a: 'd.a from assigner1'
				},
				e: 'e from assigner1'
			},
			assigner2 = {
				b: {
					e: 'b.e from assigner2',
					f: 'b.f from assigner2'
				},
				c: 'c from assigner2',
				d: {
					b: 'd.b from assigner2'
				},
				f: 'f from assigner2'

			};
		underTest(assignee, assigner1, assigner2);
		expect(assignee).toEqual({
			a: 'a from assignee',
			b: {
				c: 'b.c from assigner1',
				d: 'b.d from assignee',
				e: 'b.e from assigner2',
				f: 'b.f from assigner2'
			},
			c: 'c from assigner2',
			d: {
				a: 'd.a from assigner1',
				b: 'd.b from assigner2'
			},
			e: 'e from assigner1',
			f: 'f from assigner2'
		});
	});
});
