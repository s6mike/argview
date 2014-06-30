mkdir -p pub
cat src/mapjs.js src/observable.js src/url-helper.js src/content.js src/layout.js src/clipboard.js src/hammer-draggable.js src/map-model.js src/map-toolbar-widget.js src/link-edit-widget.js src/image-drop-widget.js src/dom-map-view.js src/dom-map-widget.js > pub/mapjs-compiled.js
if [ -d "../mindmup/public" ]; then
 cp pub/mapjs-compiled.js ../mindmup/public
fi
