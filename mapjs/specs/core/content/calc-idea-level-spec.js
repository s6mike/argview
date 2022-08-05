/*global require, describe, it , expect, beforeEach*/

const content = require('../../../src/core/content/content'),
	underTest = require('../../../src/core/content/calc-idea-level');

describe('calcIdeaLevel', () => {
	'use strict';
	let activeContent;
	beforeEach(() => {
		activeContent = content({
			id: 1,
			ideas: {
				1: {
					id: 11,
					ideas: {
						1: {
							id: 111
						}
					}
				}
			}
		});
	});
	it('should throw invalid-args when missing activeContent', () => {
		expect(() => underTest(undefined, 1)).toThrow('invalid-args');
	});
	it('should return level 0 for idea root', () => {
		expect(underTest(activeContent, 'root')).toEqual(0);
	});

	it('should return level 1 for root nodes', () => {
		expect(underTest(activeContent, 1)).toEqual(1);
	});
	it('should return level 1 when nodId is falsy', () => {
		expect(underTest(activeContent)).toBeUndefined();
	});
	it('should return levels for nodes down the tree', () => {
		expect(underTest(activeContent, 11)).toEqual(2);
		expect(underTest(activeContent, 111)).toEqual(3);
	});
	it('should return undefined for non existent node ids', () => {
		expect(underTest(activeContent, 2)).toBeUndefined();
	});
	it('should return 1 for non existent songle node', () => {
		activeContent = content({
			id: 1
		});
		expect(underTest(activeContent, 1)).toEqual(1);
	});
});
