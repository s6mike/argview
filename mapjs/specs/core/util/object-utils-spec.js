/*global describe, require, it, expect, beforeEach */

const underTest = require('../../../src/core/util/object-utils');

describe('objectUtils', () => {
	'use strict';
	describe('getValue', () => {
		let obj, components;
		beforeEach(() => {
			obj = {
				foo: {
					bar: 'foobar'
				}
			};
			components = ['foo', 'bar'];
		});
		it('should return a leaf value', () => {
			expect(underTest.getValue(obj, components)).toEqual('foobar');
		});
		it('should return a non leaf value', () => {
			components = [components[0]];
			expect(underTest.getValue(obj, components)).toEqual({bar: 'foobar'});
		});
		describe('should return false', () => {
			it('when object is missing', () => {
				expect(underTest.getValue(undefined, components)).toBeFalsy();
			});
			it('when object is not an object', () => {
				expect(underTest.getValue('object', components)).toBeFalsy();
			});
			it('when object does not contain first key', () => {
				delete obj.foo;
				expect(underTest.getValue('object', components)).toBeFalsy();
			});
			it('when object does not contain further key', () => {
				delete obj.foo.bar;
				expect(underTest.getValue('object', components)).toBeFalsy();
			});
			it('when components are missing', () => {
				expect(underTest.getValue(obj)).toBeFalsy();
			});
			it('when components is not an array', () => {
				expect(underTest.getValue(obj, 'components')).toBeFalsy();
			});
			it('when components is an empty array', () => {
				expect(underTest.getValue(obj, [])).toBeFalsy();
			});
		});
	});
	describe('setValue', () => {
		let obj;
		beforeEach(() => {
			obj = {
				bar: {
					foo: 'bar'
				}
			};
		});
		it('should set a simple value', () => {
			underTest.setValue(obj, ['foo'], 'bar');
			expect(obj).toEqual({
				foo: 'bar',
				bar: {
					foo: 'bar'
				}
			});
		});
		it('should set a object value', () => {
			underTest.setValue(obj, ['foo'], {bar: 'bar'});
			expect(obj).toEqual({
				foo: {
					bar: 'bar'
				},
				bar: {
					foo: 'bar'
				}
			});
		});
		it('should delete a value', () => {
			underTest.setValue(obj, ['bar'], false);
			expect(obj).toEqual({
			});
		});
		it('should set a sub value', () => {
			underTest.setValue(obj, ['bar', 'bar'], 'bar');
			expect(obj).toEqual({
				bar: {
					foo: 'bar',
					bar: 'bar'
				}
			});
		});
		it('should delete a sub value', () => {
			underTest.setValue(obj, ['bar', 'foo'], false);
			expect(obj).toEqual({
				bar: {}
			});
		});
		it('should create intervening objects', () => {
			underTest.setValue(obj, ['foobar', 'bar', 'foo'], 'bar');
			expect(obj).toEqual({
				foobar: {
					bar: {
						foo: 'bar'
					}
				},
				bar: {
					foo: 'bar'
				}
			});
		});
	});
	describe('keyComponentsWithValue', () => {
		let obj;
		beforeEach(() => {
			obj = {
				bar: 'foobar',
				barbar: undefined,
				foofoo: false,
				foo: {
					barbar: undefined,
					foofoo: false,
					bar: 'foobar',
					foobar: {
						barbar: undefined,
						foofoo: false,
						barfoo: 'foobar'
					}
				}
			};
		});
		it('should return components of all keys with search value', () => {
			expect(underTest.keyComponentsWithValue(obj, 'foobar')).toEqual([
				['bar'],
				['foo', 'bar'],
				['foo', 'foobar', 'barfoo']
			]);
		});
		it('should return components of all keys with a false search value', () => {
			expect(underTest.keyComponentsWithValue(obj, false)).toEqual([
				['foofoo'],
				['foo', 'foofoo'],
				['foo', 'foobar', 'foofoo']
			]);
		});
		it('should return components of all keys with an undefined search value', () => {
			expect(underTest.keyComponentsWithValue(obj)).toEqual([
				['barbar'],
				['foo', 'barbar'],
				['foo', 'foobar', 'barbar']
			]);
		});
		describe('should throw search-type-not-supported when search value is', () => {
			it('an object', () => {
				expect(() => underTest.keyComponentsWithValue(obj, {foo: 'foobar'})).toThrow('search-type-not-supported');
			});
			it('an array', () => {
				expect(() => underTest.keyComponentsWithValue(obj, ['foobar'])).toThrow('search-type-not-supported');
			});
		});
		describe('should return an empty array', () => {
			it('when search value is not found', () => {
				expect(underTest.keyComponentsWithValue(obj, 'barfoo')).toEqual([]);
			});
			it('when object to be searched is not found', () => {
				expect(underTest.keyComponentsWithValue(undefined, 'foo')).toEqual([]);
			});
			it('when object to be searched is not an object', () => {
				expect(underTest.keyComponentsWithValue('foo', 'foo')).toEqual([]);
			});
		});
	});
});
