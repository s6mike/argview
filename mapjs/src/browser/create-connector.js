/*global require */
const jQuery = require('jquery'),
	createSVG = require('./create-svg'),
	connectorKey = require('../core/util/connector-key'),
	buildConnection = require('../browser/build-connection'),
	convertPositionToTransform = require('../core/util/convert-position-to-transform');

jQuery.fn.createConnector = function (connector, optional) {
	'use strict';
	const stage = this.parent('[data-mapjs-role=stage]'),
		element =  createSVG('g').data({'nodeFrom': stage.nodeWithId(connector.from), 'nodeTo': stage.nodeWithId(connector.to), attr: connector.attr}).attr({'id': connectorKey(connector), 'data-mapjs-role': 'connector'}),
		connection = buildConnection(element, optional);
	return element.css(Object.assign(convertPositionToTransform(connection.position), {stroke: connection.color}))
		.appendTo(this);
};

