/*global module, require */

require('./theme-css-widget');
require('./dom-map-widget');
require('./map-toolbar-widget');
require('./link-edit-widget');
require('./image-drop-widget');

module.exports = {
	MemoryClipboard: require('./clipboard'),
	MapModel: require('./map-model'),
	ImageInsertController: require('./image-insert-controller'),
	DOMRender: require('./dom-render'),
	version: 2
};
