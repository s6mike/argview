/*global require, describe, it, beforeEach, expect*/

const underTest = require('../../../src/core/content/auto-themed-idea-utils'),
	content = require('../../../src/core/content/content'),
	Theme = require('../../../src/core/theme/theme');

describe('autoThemedIdeaUtils', () => {
	'use strict';
	let activeContent, theme, idea, themeObj;
	beforeEach(() => {
		theme = {
			autoColors: ['red', 'green', 'blue'],
			name: 'test',
			layout: 'portrait',
			node: [
				{
					name: 'default'
				},
				{
					name: 'level_2',
					connections: {
						style: 'level_2',
						childstyle: 'level_2'
					}
				}
			],
			connector: {
				default: {
					line: {
						color: 'theme_inherit'
					}
				},
				level_2: {
					line: {
						color: 'theme-auto-color'
					}
				}

			}
		};
		themeObj = new Theme(theme);
		idea = {
			id: 1,
			title: 'single root node'
		};
		activeContent = content(idea);
	});
	describe('addSubIdea', () => {
		it('should add a root node child with theme configured color', () => {
			const newId = underTest.addSubIdea(activeContent, themeObj, 1, 'first child');
			expect(activeContent.findSubIdeaById(newId).attr).toEqual({
				parentConnector: {
					color: 'red',
					themeAutoColor: 'red'
				}
			});
		});
		it('should not add a root node child with theme configured color when themeObj is not supplied', () => {
			const newId = underTest.addSubIdea(activeContent, undefined, 1, 'first child');
			expect(activeContent.findSubIdeaById(newId).attr).toBeFalsy();
		});
		it('should add a sub node child without a theme configured color', () => {
			const newId1 = underTest.addSubIdea(activeContent, themeObj, 1, 'first child'),
				newId2 = underTest.addSubIdea(activeContent, themeObj, newId1, 'first sub child');
			expect(activeContent.findSubIdeaById(newId2).attr).toBeFalsy();
		});
		it('should add a root node without a theme configured color', () => {
			const newId = underTest.addSubIdea(activeContent, themeObj, 'root', 'second root');
			expect(activeContent.findSubIdeaById(newId).attr).toBeFalsy();
		});
	});

	describe('insertIntermediateMultiple', () => {
		let nodeIds;
		beforeEach(() => {
			nodeIds = [];
			nodeIds.push(underTest.addSubIdea(activeContent, themeObj, 1, 'first root'));
			const id = underTest.addSubIdea(activeContent, themeObj, 1, 'second root');
			nodeIds.push(underTest.addSubIdea(activeContent, themeObj, id, 'second root child 1'));
			nodeIds.push(underTest.addSubIdea(activeContent, themeObj, id, 'second root child 2'));
		});
		it('should add a root node child with theme configured auto color', () => {
			const newId = underTest.insertIntermediateMultiple(activeContent, themeObj, nodeIds, {title: 'first intermediate'});
			expect(activeContent.findSubIdeaById(newId).attr).toEqual({
				parentConnector: {
					color: 'red',
					themeAutoColor: 'red'
				}
			});
		});
		it('should not copy non themed attributes to the inserted node', () => {
			activeContent.updateAttr(nodeIds[0], 'foo', 'bar');
			const newId = underTest.insertIntermediateMultiple(activeContent, themeObj, nodeIds, {title: 'first intermediate'});
			expect(activeContent.findSubIdeaById(newId).attr.foo).toBeFalsy();

		});
		it('should not add a root node child with theme configured auto color when themeObj is not supplied', () => {
			const newId = underTest.insertIntermediateMultiple(activeContent, undefined, nodeIds, {title: 'first intermediate'});
			expect(activeContent.findSubIdeaById(newId).attr).toBeFalsy();
		});

		it('should add a root node child with theme configured auto color when no attributes are supplied', () => {
			const newId = underTest.insertIntermediateMultiple(activeContent, themeObj, nodeIds);
			expect(activeContent.findSubIdeaById(newId).attr).toEqual({
				parentConnector: {
					color: 'red',
					themeAutoColor: 'red'
				}
			});
		});

		it('should remove theme configured auto color from the moved down a level node if is no longer auto colored, preserving other attributes', () => {
			activeContent.updateAttr(nodeIds[0], 'foo', 'bar');
			underTest.insertIntermediateMultiple(activeContent, themeObj, nodeIds, {title: 'first intermediate'});
			expect(activeContent.findSubIdeaById(nodeIds[0]).attr).toEqual({
				foo: 'bar'
			});
			expect(activeContent.findSubIdeaById(nodeIds[1]).attr).toEqual({});
			expect(activeContent.findSubIdeaById(nodeIds[2]).attr).toEqual({});
		});
	});
	describe('changeParent', () => {
		let nodeId1, nodeId2;
		beforeEach(() => {
			nodeId1 = underTest.addSubIdea(activeContent, themeObj, 1);
			nodeId2 = underTest.addSubIdea(activeContent, themeObj, nodeId1);
		});
		it('should not update node attr when node is moved if themeObj not supplied', () => {
			underTest.changeParent(activeContent, undefined, nodeId2, 1);
			expect(activeContent.findSubIdeaById(nodeId2).attr).toEqual({});
		});
		it('should update node attr when node is moved', () => {
			underTest.changeParent(activeContent, themeObj, nodeId2, 1);
			expect(activeContent.findSubIdeaById(nodeId2).attr).toEqual({
				parentConnector: {
					color: 'green',
					themeAutoColor: 'green'
				}
			});
		});
		it('should update node attr when node becomes a root node', () => {
			underTest.changeParent(activeContent, themeObj, nodeId1, 'root');
			expect(activeContent.findSubIdeaById(nodeId1).attr).toBeFalsy();
		});
		it('should update child node attr when node becomes a root node', () => {
			underTest.changeParent(activeContent, themeObj, nodeId1, 'root');
			expect(activeContent.findSubIdeaById(nodeId2).attr).toEqual({
				parentConnector: {
					color: 'red',
					themeAutoColor: 'red'
				}
			});
		});
	});
	describe('recalcIdeasAutoNodeAttrs', () => {
		beforeEach(() => {
			idea = {
				id: 1,
				title: '1 node',
				ideas: {
					11: {
						id: 11,
						title: '11 node',
						ideas: {
							111: {
								id: 111,
								title: '111 node'
							}
						}
					},
					12: {
						id: 12,
						title: '22 node'
					}
				}
			};
			activeContent = content(idea);
		});
		it('applies autoColors to all applicable nodes', () => {
			underTest.recalcIdeasAutoNodeAttrs(activeContent, themeObj, activeContent, 0, 0);
			expect(activeContent.findSubIdeaById(11).attr).toEqual({
				parentConnector: {
					color: 'red',
					themeAutoColor: 'red'
				}
			});
			expect(activeContent.findSubIdeaById(12).attr).toEqual({
				parentConnector: {
					color: 'green',
					themeAutoColor: 'green'
				}
			});

		});
		it('does not apply autoColors to all non-applicable nodes', () => {
			underTest.recalcIdeasAutoNodeAttrs(activeContent, themeObj, activeContent, 0, 0);
			expect(activeContent.findSubIdeaById(1).attr).toEqual({});
			expect(activeContent.findSubIdeaById(111).attr).toBeFalsy();
		});
		it('should remove auto color attributes when theme does not have autoColors', () => {
			underTest.recalcIdeasAutoNodeAttrs(activeContent, themeObj, activeContent, 0, 0);
			underTest.recalcIdeasAutoNodeAttrs(activeContent, new Theme({}), activeContent, 0, 0);
			expect(activeContent.findSubIdeaById(11).attr).toBeFalsy();
			expect(activeContent.findSubIdeaById(12).attr).toBeFalsy();
		});
	});
	describe('pasteMultiple', () => {
		let toPaste;
		beforeEach(() => {
			idea = {
				id: 1,
				title: '1 node',
				ideas: {
					11: {
						id: 11,
						title: '11 node'
					}
				}
			};
			toPaste = [{id: 1, title: 'new1'}, {id: 2, title: 'new2'}];
			activeContent = content(idea);
		});
		it('should paste to root node', () => {
			const result = underTest.pasteMultiple(activeContent, themeObj, 'root', toPaste);
			expect(result.length).toEqual(2);
		});
		it('should autocolor pasted nodes', () => {
			const result = underTest.pasteMultiple(activeContent, themeObj, 1, toPaste);
			expect(activeContent.findSubIdeaById(result[0]).attr).toEqual({
				parentConnector: {
					color: 'green',
					themeAutoColor: 'green'
				}
			});
			expect(activeContent.findSubIdeaById(result[1]).attr).toEqual({
				parentConnector: {
					color: 'blue',
					themeAutoColor: 'blue'
				}
			});
		});
		it('should replace autoColors', () => {
			toPaste[0].attr = {
				parentConnector: {
					color: 'yellow',
					themeAutoColor: 'yellow'
				}
			};
			const result = underTest.pasteMultiple(activeContent, themeObj, 1, toPaste);
			expect(activeContent.findSubIdeaById(result[0]).attr).toEqual({
				parentConnector: {
					color: 'green',
					themeAutoColor: 'green'
				}
			});
			expect(activeContent.findSubIdeaById(result[1]).attr).toEqual({
				parentConnector: {
					color: 'blue',
					themeAutoColor: 'blue'
				}
			});

		});
		it('should remove autoColors', () => {
			toPaste[0].attr = {
				parentConnector: {
					color: 'yellow',
					themeAutoColor: 'yellow'
				}
			};
			const result = underTest.pasteMultiple(activeContent, themeObj, 11, toPaste);
			expect(activeContent.findSubIdeaById(result[0]).attr).toEqual({});
			expect(activeContent.findSubIdeaById(result[1]).attr).toEqual({});

		});
	});

});
