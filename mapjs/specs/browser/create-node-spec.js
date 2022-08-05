/*global require, describe, it, expect, beforeEach, afterEach*/
const jQuery = require('jquery');
require('../../src/browser/create-node');

describe('createNode', () => {
	'use strict';
	let template, node;
	beforeEach(() => {
		template = jQuery('<div>').appendTo('body');
		node = {
			id: 121,
			x: 111.1,
			y: 221.9
		};
	});
	afterEach(() => template.remove());
	it('should return a div', () => {
		const created = template.createNode(node);
		expect(created[0].tagName).toEqual('DIV');
	});
	it('should set the id', () => {
		const created = template.createNode(node);
		expect(created.attr('id')).toEqual('node_121');
	});
	it('should set the tab index', () => {
		const created = template.createNode(node);
		expect(created.attr('tabindex')).toEqual('0');
	});
	it('should set the mapjs-role to node ', () => {
		const created = template.createNode(node);
		expect(created.data('mapjs-role')).toEqual('node');
	});
	it('should set the display style to block', () => {
		const created = template.createNode(node);
		expect(created.css('display')).toEqual('block');
	});
	it('should set the position style to absolute', () => {
		const created = template.createNode(node);
		expect(created.css('position')).toEqual('absolute');
	});
	it('should set the top style to rounded node y', () => {
		const created = template.createNode(node);
		expect(created.css('top')).toEqual('222px');
	});
	it('should set the top style to 0 if node y is falsy', () => {
		delete node.y;
		const created = template.createNode(node);
		expect(created.css('top')).toEqual('0px');
	});
	it('should set the left style to rounded node x', () => {
		const created = template.createNode(node);
		expect(created.css('left')).toEqual('111px');
	});
	it('should set the left style to 0 if node x is falsy', () => {
		delete node.x;
		const created = template.createNode(node);
		expect(created.css('left')).toEqual('0px');
	});
	it('should add a mapjs-node class', () => {
		const created = template.createNode(node);
		expect(created.hasClass('mapjs-node')).toBeTruthy();
	});
	it('should append the node', () => {
		const created = template.createNode(node);
		expect(created.parent()[0]).toEqual(template[0]);
	});
});
