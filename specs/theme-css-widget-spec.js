/*global describe, it, expect, beforeEach, jasmine, require */
const $ = require('jquery'),
	observable = require('mindmup-mapjs-model').observable,
	DOMRender = require('../src/dom-render');
require('../src/theme-css-widget');
describe('themeCssWidget', function () {
	'use strict';
	const template = '<span></span>';
	let underTest, mapModel, themeProvider, themeProcessor;
	beforeEach(function () {
		mapModel = observable({});
		themeProcessor = jasmine.createSpyObj('themeProcessor', ['process']);
		themeProvider = {
			default: {name: 'default'},
			compact: {name: 'compact'}
		};
		themeProcessor.process.and.returnValue({css: 'old css'});
		underTest = $(template).themeCssWidget(themeProvider, themeProcessor, mapModel);
	});
	it('should activate default theme when initialised', function () {
		expect(DOMRender.theme.name).toEqual('default');
		expect(themeProcessor.process).toHaveBeenCalledWith({name: 'default'});
		expect(underTest.text()).toEqual('old css');
	});
	it('should activate the requested theme when mapModel dispatches themeChanged', function () {
		themeProcessor.process.and.returnValue({css: 'new css'});
		mapModel.dispatchEvent('themeChanged', 'compact');
		expect(DOMRender.theme.name).toEqual('compact');
		expect(themeProcessor.process).toHaveBeenCalledWith({name: 'compact'});
		expect(underTest.text()).toEqual('new css');
	});

});
