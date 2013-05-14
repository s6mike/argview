mkdir -p pub
cat src/mapjs.js src/observable.js src/url-helper.js src/content.js src/layout.js src/layout-compressor.js src/map-model.js src/kinetic.connector.js src/kinetic.link.js src/kinetic.clip.js src/kinetic.idea.js src/kinetic.idea.proxy.js src/kinetic-mediator.js src/map-toolbar-widget.js src/png-exporter.js src/map-widget.js > pub/mapjs-compiled.js
if [ -d "../mindmup/public" ]; then
 cp pub/mapjs-compiled.js ../mindmup/public
fi
