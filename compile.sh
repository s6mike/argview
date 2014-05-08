mkdir -p pub
cat src/mapjs.js src/observable.js src/url-helper.js src/content.js src/layout.js src/clipboard.js src/hammer-draggable.js src/map-model.js src/drag-and-drop.js src/map-toolbar-widget.js src/link-edit-widget.js src/image-drop-widget.js src/dom-map-view.js src/dom-map-widget.js > pub/mapjs-compiled.js
cat kinetic-src/kinetic-v4.5.4.min.js kinetic-src/jquery.mousewheel-3.1.3.js kinetic-src/kinetic.connector.js kinetic-src/kinetic.link.js kinetic-src/kinetic.clip.js kinetic-src/kinetic.idea.js kinetic-src/kinetic-mediator.js kinetic-src/map-widget.js > pub/kinetic-mapjs-compiled.js
if [ -d "../mindmup/public" ]; then
 cp pub/mapjs-compiled.js ../mindmup/public
 cp pub/kinetic-mapjs-compiled.js ../mindmup/public/e
fi
