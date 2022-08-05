/*global require, describe, beforeEach, it, expect, jasmine*/

const underTest = require('../../../src/core/layout/node-attribute-utils');

describe('nodeAttributeUtils', () => {
	'use strict';
	let nodes;
	beforeEach(() => {
		nodes = {
			1: {
				attr: {
					foo: {
						bar: 'actual bar value'
					}
				}
			},
			2: {
				attr: {
					foo: {
						bar: underTest.INHERIT_MARKER,
						foo: underTest.INHERIT_MARKER,
						foobar: 'actual foobar value'
					}
				},
				parentId: 1
			},
			3: {
				attr: {
					foo: {
						bar: underTest.INHERIT_MARKER,
						foo: underTest.INHERIT_MARKER,
						foobar: underTest.INHERIT_MARKER
					}
				},
				parentId: 2
			}
		};
	});
	describe('inheritAttributeKeysFromParentNode', () => {
		let keysToInherit;
		beforeEach(() => {
			keysToInherit = [
				['foo', 'bar'],
				['foo', 'foo']
			];
		});
		it('should inherit values from the parent node', () => {
			underTest.inheritAttributeKeysFromParentNode(nodes[1], nodes[2], keysToInherit);
			expect(nodes[2].attr.foo.bar).toEqual('actual bar value');
		});
		it('should leave values missing from the parent node', () => {
			underTest.inheritAttributeKeysFromParentNode(nodes[1], nodes[2], keysToInherit);
			expect(nodes[2].attr.foo.foo).toEqual(underTest.INHERIT_MARKER);
		});
		it('should return keys not resolved', () => {
			expect(underTest.inheritAttributeKeysFromParentNode(nodes[1], nodes[2], keysToInherit)).toEqual([['foo', 'foo']]);
		});
		it('should return all keys if parent does not have attr', () => {
			delete nodes[1].attr;
			expect(underTest.inheritAttributeKeysFromParentNode(nodes[1], nodes[2], keysToInherit)).toEqual(keysToInherit);
		});
	});
	describe('inheritAttributeKeys', () => {
		let keysToInherit;
		beforeEach(() => {
			keysToInherit = [
				['foo', 'bar'],
				['foo', 'foo'],
				['foo', 'foobar']
			];
		});
		it('should inherit all possible attributes', () => {
			underTest.inheritAttributeKeys(nodes, nodes[3], keysToInherit);
			expect(nodes[3].attr).toEqual({
				foo: {
					bar: 'actual bar value',
					foo: underTest.INHERIT_MARKER,
					foobar: 'actual foobar value'
				}
			});
		});
		it('should inherit all attributes in intermediate parents', () => {
			underTest.inheritAttributeKeys(nodes, nodes[3], keysToInherit);
			expect(nodes[2].attr).toEqual({
				foo: {
					bar: 'actual bar value',
					foo: underTest.INHERIT_MARKER,
					foobar: 'actual foobar value'
				}
			});
		});
	});
	describe('inheritAttributes', () => {
		it('should inherit all marked attributes for leaf nodes', () => {
			underTest.inheritAttributes(nodes, nodes[3]);
			expect(nodes[3].attr).toEqual({
				foo: {
					bar: 'actual bar value',
					foo: underTest.INHERIT_MARKER,
					foobar: 'actual foobar value'
				}
			});
		});
		it('should inherit all attributes in intermediate nodes', () => {
			underTest.inheritAttributes(nodes, nodes[3]);
			expect(nodes[2].attr).toEqual({
				foo: {
					bar: 'actual bar value',
					foo: underTest.INHERIT_MARKER,
					foobar: 'actual foobar value'
				}
			});
		});

	});
	describe('setThemeAttributes', () => {
		let theme, nodes;
		beforeEach(() => {
			theme = jasmine.createSpyObj('theme', ['nodeStyles', 'getLayoutConnectorAttributes']);
			theme.nodeStyles.and.callFake((level) => {
				return ['level_' + level, 'default'];
			});
			theme.getLayoutConnectorAttributes.and.callFake((styles) => {
				const color = styles[0] === 'level_1' ? 'red' : underTest.INHERIT_MARKER;
				return {
					parentConnector: {
						color: color
					}
				};
			});
			nodes = {
				1: {id: 1, level: 1, attr: {foo: 'bar1'}},
				2: {id: 2, level: 2, parentId: 1},
				3: {id: 3, level: 3, parentId: 2},
				4: {id: 4, level: 3, parentId: 2, attr: {parentConnector: {color: 'blue'}}}
			};
		});
		it('should append node styles to each node', () => {
			underTest.setThemeAttributes(nodes, theme);
			expect(theme.nodeStyles).toHaveBeenCalledWith(1, {foo: 'bar1'});
			expect(theme.nodeStyles).toHaveBeenCalledWith(2, undefined);
			expect(theme.nodeStyles).toHaveBeenCalledWith(3, undefined);
			expect(theme.nodeStyles.calls.count()).toEqual(4);

			expect(nodes[1].styles).toEqual(['level_1', 'default']);
			expect(nodes[2].styles).toEqual(['level_2', 'default']);
			expect(nodes[3].styles).toEqual(['level_3', 'default']);
			expect(nodes[4].styles).toEqual(['level_3', 'default']);
		});
		it('should append the theme layout attributes to the node when not overriden in the node already and inherited from parent', () => {
			underTest.setThemeAttributes(nodes, theme);
			expect(nodes[1].attr).toEqual({foo: 'bar1', parentConnector: {color: 'red'}});
			expect(nodes[2].attr).toEqual({parentConnector: {color: 'red'}});
			expect(nodes[3].attr).toEqual({parentConnector: {color: 'red'}});
			expect(nodes[4].attr).toEqual({parentConnector: {color: 'blue'}});
		});
	});
});
