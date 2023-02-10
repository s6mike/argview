/* Copyright 2013 Damjan Vujnovic, David de Florinier, Gojko Adzic; 2022 Michael Hayes; and the mapjs contributors 
   SPDX - License - Identifier: MIT */
/* mapjs entry point: Initialises mapjs obections, loads JSON and embeds visualisation into a container. */

/*global require, document, window, console, idea, PATH_FILE_CONFIG_MAPJS, process */
const Utilities = require('./core/util/mapjs-utilities'),
  MAPJS = require('./npm-main'),
  { default: CONFIG } = require(PATH_FILE_CONFIG_MAPJS),
  // TODO: Enable and merge this once mapjs_map.id needed
  // { default: CONFIG2 } = require(PATH_FILE_CONFIG_MAPJS_PROCESSED),
  // Might help:
  //   - https://stackoverflow.com/questions/63462577/how-to-load-multiple-yaml-files-at-once-in-javascript
  //   - https://github.com/survivejs/webpack-merge
  CONTAINER_CLASS = CONFIG.mapjs_map.class,
  INSTANCE_CLASS = CONFIG.mapjs_instance.class,
  MAPJS_SRC_CLASS = CONFIG.mapjs_src_data.class,
  trycatch = Utilities.trycatch;

Utilities.Logger.log(process.env.NODE_ENV + ' mode');

// QUESTION: Can I loop through these somehow instead without having to know the name of each one?
//   new MAPJS.Theme[x] ?
// To change, call e.g. changeTheme(map, MAPJS.v1)
MAPJS.arg = require('../src/themes/argmap-theme.json');
MAPJS.argumentMapping = require('../src/themes/mapjs-argument-mapping.json');
MAPJS.topdown = require('../src/themes/top-down-simple.json');
MAPJS.compact = require('../src/themes/compact.json');
MAPJS.v1 = require('../src/themes/v1.json');

const jQuery = require('jquery'),
  themeProvider = require('../src/theme'),
  content = MAPJS.content,
  mapInstance = {}, // New object for keeping data for keeping various mapjs objects separate

  // Injects Theme CSS into page
  // So can't easily make themes independent for each container without making css directives container independent
  layoutThemeStyle = function (themeJson) {
    'use strict';
    const themeCSS = themeJson && new MAPJS.ThemeProcessor().process(themeJson).css;
    if (!themeCSS) {
      return false;
    }

    // Used to only apply if there wasn't already a theme, but now we want to replace it
    if (window.themeCSS) {
      jQuery('#themeCSS')[0].remove();
    }
    jQuery('<style id="themeCSS" type="text/css"></style>').appendTo('head').text(themeCSS);

    return true;
  },

  // Changes theme of all maps on page
  //   To change, call e.g. changeTheme(map, MAPJS.v1)
  //   TODO: Move to mapModel.changeTheme() in map-model.js
  //   TODO: Make this apply to a specific map only
  // eslint-disable-next-line strict
  changeTheme = function (map, themeJson = themeProvider.default) {
    // QUESTION: Should I build this into function in case themeJson invalid?
    //   themeJson = themeProvider.default || MAPJS.defaultTheme;
    // QUESTION: Should I add getTheme to map?
    const theme = new MAPJS.Theme(themeJson),
      getTheme = () => theme;
    map.mapModel.setThemeSource(getTheme);
    layoutThemeStyle(themeJson);

    // Can't reset map with setIdea if domMapController hasn't been defined yet
    //   This is run at start of init(), so why is it undefined on first run?
    //     let domMapController = false;
    // Could check for whether mapModel has a layoutCalculator function instead
    if (map && typeof map.domMapController !== 'undefined') {
      // ISSUE: This call breaks on second map, I guess since layout calculator wasn't set for new domMapController
      // So really need to check for layout calculator
      map.mapModel.setIdea(idea);
    }

    return getTheme;
  },

  // Add a (ideally) separate map to each container div on the page.
  addMap = function (instanceElement, mapJson) {
    'use strict';
    const containerElement = Utilities.getElementMJS(CONTAINER_CLASS, instanceElement),
      // QUESTION: Do we need a separate mapModel for each map?
      //   Or are there generic methods I can separate out from object ones?
      map = mapInstance[containerElement.id] = {};
    map.mapModel = new MAPJS.MapModel([]);
    // So it's easier to look up containerElement from mapModel:
    //  Useful because unfortunately, element ids only unique per container
    map.mapModel.containerElement = containerElement;

    // Hacky solution so that I can call content from map-model.js: loadMap
    map.mapModel.content = content;

    // eslint-disable-next-line one-var
    const jQcontainer = jQuery(containerElement),
      JQinstance = jQuery(instanceElement),
      // Do I need one of these for each container?
      imageInsertController = new MAPJS.ImageInsertController('http://localhost:4999?u='),
      idea = content(mapJson),
      touchEnabled = false,

      // Easier to maintain theme file so making that default:
      themeJson = MAPJS.arg || idea.theme || themeProvider.default || MAPJS.defaultTheme,
      getTheme = changeTheme(map, themeJson),

      // Set up Widgets
      containerInstance = containerElement.parentElement,
      // TODO define both config variables at top
      toolbarElement = trycatch(
        () => Utilities.getElementMJS(CONFIG.toolbar_main.class, containerInstance),
      ),
      linkEditWidgetElement = trycatch(
        () => Utilities.getElementMJS(CONFIG.toolbar_edit_links.class, containerInstance),
      );
    ;

    // TODO: Might only need one of these for the whole page, rather than for each container:
    jQuery.fn.attachmentEditorWidget = function (mapModel) {
      return this.each(function () {
        mapModel.addEventListener('attachmentOpened', function (nodeId, attachment) {
          mapModel.setAttachment(
            'attachmentEditorWidget',
            nodeId, {
              contentType: 'text/html',
              content: window.prompt('attachment', attachment && attachment.content)
            });
        });
      });
    };

    JQinstance.domMapWidget(console, map.mapModel, touchEnabled, imageInsertController);

    // different stage for each container so need to have one for each container
    // Using container.id as index for relevant controller
    map.domMapController = new MAPJS.DomMapController(
      map.mapModel,
      jQcontainer.find('[data-mapjs-role=stage]'),
      touchEnabled,
      imageInsertController,
      undefined, // resourceTranslator
      getTheme
    );

    // QUESTION: Do I need to store mapToolbarWidget and linkEditWidget?
    map.mapToolbarWidget = new MAPJS.MapToolbarWidget(map.mapModel, toolbarElement);
    // TODO: Do this without jQcontainer
    jQcontainer.attachmentEditorWidget(map.mapModel);
    map.linkEditWidget = new MAPJS.LinkEditWidget(map.mapModel, linkEditWidgetElement);

    // Draw map
    map.mapModel.setIdea(idea);

    jQuery('.arrow').click(function () {
      jQuery(this).toggleClass('active');
    });

    imageInsertController.addEventListener('imageInsertError', function (reason) {
      Utilities.Logger.error('image insert error', reason);
    });

    jQcontainer.on('drop', function (e) {
      // QUESTION: Should maybe separate this into a callable function so that it can be used as general file import function?
      const current_map = mapInstance[this.id],
        current_mapModel = current_map.mapModel,
        dataTransfer = e.originalEvent.dataTransfer;

      // QUESTION: What happens if I comment these out?
      e.stopPropagation();
      e.preventDefault();

      if (current_mapModel.getInputEnabled()) {
        if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
          const fileInfo = dataTransfer.files[0];
          if (/\.(json|mup)$/.test(fileInfo.name)) {
            const oFReader = new window.FileReader();
            oFReader.onload = function (oFREvent) {
              // const current_map = mapInstance[this.target_container_id],
              // current_mapModel = current_map.mapModel,
              const container_idea = current_mapModel.getIdea(),
                // Borrowed from image-drop-widget.js
                // TODO: Should combine into one function
                stageDropCoordinates = current_map.domMapController.stagePositionForPointEvent(e),
                // QUESTION: why return node id and not reference to node in getNodeIdAtPosition()?
                // Would avoid issues with ambiguous node IDs
                nodeAtDrop = stageDropCoordinates && current_mapModel.getNodeIdAtPosition(stageDropCoordinates.x, stageDropCoordinates.y),
                pasteNode = (typeof (nodeAtDrop) !== 'undefined') ? nodeAtDrop : 'root';   // This is where new map will get pasted

              // Less destructive to paste JSON file data into container as new map(s), instead of replacing existing map.
              // TODO: However, paste doesn't include links, themes etc
              //   Or is that just because we use parse().ideas only?
              // QUESTION: worth returning a result value from pasteMultiple?
              container_idea.pasteMultiple(pasteNode, JSON.parse(oFREvent.target.result).ideas);
            };
            // This passes the target container's id to the File Reader window:
            //  QUESTION: Is there a better way of doing this?
            oFReader.target_container_id = e.delegateTarget.id;
            oFReader.readAsText(fileInfo, 'UTF-8');
          }
        };
      }
    });
  },

  init = function () {
    'use strict';

    const instanceElements = Utilities.getElementMJS(INSTANCE_CLASS, document, true);

    if (instanceElements.length > 0) { // Checks there are mapjs requests
      for (const instanceElement of instanceElements) {
        // TODO: check for 0 > script > 1
        //  See https://stackoverflow.com/questions/1474089/how-to-select-a-single-child-element-using-jquery#answer-1474103
        const script_src = Utilities.getElementMJS(MAPJS_SRC_CLASS, instanceElement).getAttribute('src');

        // TODO: switch to await/async for simpler code and debugging.
        // QUESTION: How does drag and drop solution (window.FileReader()) compare to this one? Or do I have to use fetch here because source is not necessarily local?
        fetch(script_src)
          .then(response => response.json())
          .then(data => addMap(instanceElement, data))
          .catch(error => Utilities.Logger.error(error));
      }
      window.onerror = Utilities.Logger.error;
      window.jQuery = jQuery;
      window.mapInstance = mapInstance;
    } else { // If no mapjs requests:
      Utilities.Logger.warn("No mapjs containers found in web page's source html.");
    };
  };

document.addEventListener('DOMContentLoaded', init);

// // Hacky way to test
// window.setTimeout(function () {
//   b = document.getElementById("submit");
//   if (b) {
//     // Automatically click button to speed up testing
//     b.click();
//   }
// }, 400 /* but after 400 ms */);

