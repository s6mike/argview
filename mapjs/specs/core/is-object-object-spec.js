/*global require, describe, it, expect*/

const underTest = require('../../src/core/is-object-object');

describe('isObjectObject', () => {
	'use strict';
	describe('returns truthy for', () => {
		[
			['empty map', {}],
			['non empty map', {a: 1, b: 'c'}]
		].forEach(args => {
			it(args[0], () => {
				expect(underTest(args[1])).toBeTruthy();
			});
		});
	});
	describe('returns falsy for', () => {
		[
			['undefined', undefined],
			['false', false],
			['true', true],
			['integer', 1],
			['float', 1],
			['Date', new Date()],
			['string', 'hello'],
			['String', new String('hello')],
			['array', ['hello']]
		].forEach(args => {
			it(args[0], () => {
				expect(underTest(args[1])).toBeFalsy();
			});
		});
	});

});
