/*global describe, it, expect, require */
const underTest = require('../../../src/core/content/format-note-to-html');

describe('formatNoteToHtml', () => {
	'use strict';
	it('returns a blank string for falsy content',	() => {
		expect(underTest()).toBe('');
		expect(underTest('')).toBe('');
		expect(underTest(undefined)).toBe('');
		expect(underTest(false)).toBe('');
	});
	it('throws an error', () => {
		expect(() => underTest({a: 1})).toThrow('invalid-args');
	});
	it('escapes HTML', () => {
		expect(underTest('abc <script>xyz</script>')).toEqual('abc &lt;script&gt;xyz&lt;/script&gt;');
	});
	it('formats links as HTML after escaping', () => {
		expect(underTest('abc https://www.google.com <script>xyz</script>')).toEqual('abc <a target="_blank" href="https://www.google.com">https://www.google.com</a> &lt;script&gt;xyz&lt;/script&gt;');
	});
});
