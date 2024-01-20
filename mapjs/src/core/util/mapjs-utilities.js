/* Copyright 2022 Michael Hayes
   SPDX - License - Identifier: MIT */
/* mapjs utility functions */

/*eslint strict: ["error", "function"]*/
/*global PATH_FILE_CONFIG_MAPJS,PATH_FILE_CONFIG_MAPJS_PROCESSED*/
// TODO: switch to lodash and test

// function getvar(varname, config_file) {
//   const { default: CONFIG } = require(path_file_config),
//     result = CONFIG.varname;
//   Logger.log("Result: " + result);

//   return result;
// }

/* eslint-disable strict */

function MyLogger(console_original, environment = process.env.NODE_ENV) {
  const new_logger = Object.create(console_original);

  // Override some console functions based on environment
  if (environment === 'production') {
    // Disables console.log and console.debug in production mode.
    //   QUESTION: change so that it logs the data elsewhere?
    new_logger.debug = () => { };
    new_logger.log = () => { };
  } else {
    // QUESTION: Add a min level so that the logging level can be easily changed
    //  See https://www.npmjs.com/package/picolog for ideas
    new_logger.log = (message, level = 'log') => {
      console[level](message);
    };
  }

  return new_logger;
}
/* eslint-enable strict */

let { default: CONFIG } = require('Mapjs/' + PATH_FILE_CONFIG_MAPJS);
const _ = require('underscore'),
  { default: CONFIG_P } = require('Mapjs/' + PATH_FILE_CONFIG_MAPJS_PROCESSED),
  // Setting this up here so it's ready for idea_pp
  //  TODO: If I move idea_pp to MyLogger then I can be more flexible with where I initialise it
  Logger = new MyLogger(console),
  CONTAINER_CLASS = CONFIG.mapjs_map.class;
CONFIG = Object.assign(CONFIG, CONFIG_P); // Assigning processed file second means it overwrites unprocessed values.

module.exports = {
  // QUESTION: How to move above constructor definition into module.exports object?
  Logger,
  // Parameterized try catch function
  //  Simplifies environment based catching
  //  Allows use of constants with try-catch
  trycatch: (t, c) => {
    'use strict';
    // Set default exception here:
    c = (exception) => {
      if (process.env.NODE_ENV === 'production') {
        Logger.error('Caught: ' + exception);
      } else {
        throw exception;
      }
    };
    try {
      return t();
    } catch (exception) {
      return c(exception);
    };
  },
  loadJson: async function (script_src) {
    'use strict';

    try { // QUESTION: Use trycatch here?
      const response = await fetch(script_src);
      if (!response.ok) {
        throw new Error('`Load map` server HTTP error: ' + response.status);
      }
      return await response.json();
    } catch (error) {
      Logger.error(error);
      throw error;
    };
  },
  getMapTitle: function (mapJson) {
    'use strict';
    return mapJson.ideas[1].title;
  },
  setOriginalMapTitle: function (mapJson) {
    'use strict';
    if (mapJson.original_root_node_title === undefined) {
      mapJson.original_root_node_title = this.getMapTitle(mapJson);
    }
    return mapJson.original_root_node_title;
  },
  //  ISSUE: instanceElement is whole container section, just need to ensure right part of doc
  //    Simpler solution?
  getMap: async function (index, instanceElement, map_id, original_root_node_title, script_src, final, keep_original) {
    'use strict';
    let request_url, originalMap, mapJson;
    if (map_id) {
      request_url = '/gm?map_id=' + map_id;
    } else if (original_root_node_title) {
      request_url = '/gm?ornt=' + original_root_node_title;
    } else if (script_src) {
      request_url = script_src;
    } else {
      const MAPJS_SRC_CLASS = CONFIG.mapjs_src_data.class;
      request_url = this.getElementMJS(MAPJS_SRC_CLASS, instanceElement).getAttribute('src');
      originalMap = true; // Store original_root_node_title and then check for more recent version
    }

    // QUESTION: Can I simplify all try/catches here?
    Logger.log('Attempting to retrieve map ' + index + ' from ' + request_url);
    try {
      mapJson = await this.loadJson(request_url);
      if (originalMap && keep_original !== '' && (keep_original === 'false' || !keep_original)) {
        const originalMapTitle = this.setOriginalMapTitle(mapJson);
        Logger.log('Checking for more recent version of map ' + index + ': ' + originalMapTitle);
        try {
          const newMapJson = await this.getMap(index, instanceElement, undefined, originalMapTitle, undefined, 'final'); // Final stops infinite checks for newer version if this call fails
          // Not necessarily different. TODO: Check?
          //   Can I check metadata timestamp? or content hash? #QUESTION
          map_id = newMapJson.map_id;
          Logger.info('Have loaded latest version of ' + request_url + ' (map_id: ' + map_id + ') as map ' + index);
          mapJson = newMapJson; // Use the updated map data
        } catch (error) {
          Logger.error('Failed to update map ' + index + ': ' + originalMapTitle + '. Keeping original data.');
        }
      } else {
        Logger.info('Have loaded original version of ' + request_url + ' as map ' + index);
      }
      return mapJson;
      // this.addMap(instanceElement, mapJson);
    } catch (error) {
      Logger.error('Attempt to load remote map ' + index + ' failed, using url: ' + request_url);
      if (!originalMap && !final) { // Final check stops infinite loop
        Logger.log('Attempting to retrieve original map ' + index + ' instead.');
        // QUESTION: Better to go id > title > element?
        try {
          mapJson = await this.getMap(index, instanceElement);
          Logger.info('Retrieved original map ' + index);
          return mapJson;
        } catch (error) {
          throw error;
        }
      }
      throw error;
    }
  },
  // Can pass element or event
  getContainerID: (elementOrEvent) => {
    'use strict';
    const containers = document.getElementsByClassName(CONTAINER_CLASS);

    switch (containers.length) {
      case 0:
        return false;
      case 1:
        return containers[0].id;
      default: // If more than 1 container, then see if it's an event with a currentTarget
        const currentTarget = elementOrEvent.currentTarget;
        if (currentTarget) { // If elementOrEvent is an event
          // if current target is container then get id, else set the element to the target.
          if (currentTarget.class === CONTAINER_CLASS) {
            return currentTarget.id;
          } else {
            elementOrEvent = elementOrEvent.target; // elementOrEvent is now an element;
          }
        }
        // elementOrEvent is an element:
        return (elementOrEvent.closest) ? elementOrEvent.closest('.' + CONTAINER_CLASS).id : false;
    }
    return false; // Should never be called
  },
  updateDataPreSave: function (map_data) {
    'use strict';
    const save_timestamp = new Date().toISOString();

    // Remove superfluous data
    map_data.theme = undefined;
    map_data.attr.theme = undefined;
    map_data.title = undefined;
    Logger.info('Custom theme removed from saved map');

    // TODO: Should first check json is compatible with $schema, then, if necessary, update it.
    if (!map_data.$schema) {
      map_data.$schema = CONFIG.mapjs_schema.uri_current; // Saves current $schema reference to map
    }

    if (!map_data.original_root_node_title) {
      map_data.original_root_node_title = (map_data.ideas[1] && map_data.ideas[1].title) || 'default title'; // Adds original_root_node_title to map
    }

    if (!map_data.original_save_time) {
      map_data.original_save_time = map_data.original_upload_time || save_timestamp;
    }
    map_data.original_upload_time = undefined;
    map_data.last_save_time = save_timestamp;

    return map_data;
  },
  saveFile: function (map_data) {
    'use strict';

    const updated_map_data = this.updateDataPreSave(map_data),
      body = JSON.stringify(updated_map_data),
      target_url = '/sm';
    Logger.log('mapjs json: ' + body);

    fetch(target_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    }).then(response => {
      if (!response.ok) {
        throw new Error('`Save Map` server HTTP error: ' + response.status);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {  // Check if content-type is JSON
        if (typeof response === 'object') {
          return response.json();
        } else {
          const response_text = response.text();
          throw new Error('`Save map` server response not in JSON format: ' + response_text);
        };
      }
    }).catch(error => {
      Logger.error('Server response error: ' + error);
      // Handle network errors or other exceptions
    });
  },

  // May not be compatible with all modern browsers
  downloadToFile: (content, filename, contentType) => {
    'use strict';
    const file = new Blob([content], { type: contentType }),
      download_anchor = document.createElement('a');

    download_anchor.href = URL.createObjectURL(file);
    download_anchor.download = filename;
    download_anchor.click();

    URL.revokeObjectURL(download_anchor.href);
  },

  /* eslint-disable strict */

  // Get element from class and optional parent element
  //  TODO: Rename as getElementsMJS now it can return multiple results
  getElementMJS: (className, parentElement = document, asCollection = false) => {
    const elements = parentElement.getElementsByClassName(className),
      result_count = elements.length;
    if (result_count > 1) { // multiple elements
      return elements;
    } else if (result_count === 1) { // Only 1 element
      if (asCollection) {
        return elements;
      }
      return elements[0];
    } else {
      Logger.warn('getElementMJS(): Element of class ' + className + ' not found on page.');
    }
  },

  // TODO: Only run all this if logging is enabled.
  //  QUESTION: What's best way to check?
  // IDEA: Could add this and ideas_pp() to MyLogger instead. Or possibly override existing console pretty print
  idea_pp: (idea, level = -1, key = []) => {
    // Quick fix to avoid wasting time doing this in production mode.
    //  TODO: Add this to Logging object and set it to {} in production mode.
    if (process.env.NODE_ENV !== 'production') {
      if (idea) {
        const type = idea.attr ? (idea.attr.group ? `${idea.attr.group}` : '') : '',
          rank = key && key !== '' ? ` ${key}: ` : '';
        let indent = level > 0 ? '  '.repeat(level) : '';
        parseInt(key) > 0 ? indent += ' ' : null; // So ranks with minus sign align
        // TODO FIX: when running as script, _.pick causes an issue if underscore.js not available
        Logger.debug(`${indent}${rank}`, _.pick(idea, 'id', 'title', 'ideas'), `${type}`);
        if (idea.ideas) {
          // eslint-disable-next-line no-use-before-define
          module.exports.ideas_pp(idea.ideas, level, Object.keys(idea.ideas));
        }
      }
      level -= 1;
    }
    return;
  },

  // Call with ideas_pp(idea);
  ideas_pp: (ideas, level = -1, keys = []) => {
    // Want to start with extra line break, but it doesn't appear where I expect.
    // level == -1 ? Logger.debug('') : null;
    level += 1;
    if (!ideas) {
      level -= 1;
      return;
    } else if (ideas.id !== undefined) {
      module.exports.idea_pp(ideas, level, keys);
    } else if (ideas.constructor === Array) {
      ideas.forEach(function (idea, n) {
        module.exports.idea_pp(idea, level, keys[n]);
      });
    } else if (ideas.constructor === Object) {
      level -= 1;
      module.exports.ideas_pp(Object.values(ideas), level, Object.keys(ideas));
    }
    level -= 1;
    return;
  }

  /* eslint-enable strict */

  // Commented out since not needed any longer:

  // Two different ways of combining two theme files, see which one works best
  // order matters in both merge types, better results from having idea.theme as second argument.
  //   Assume that value of second used where there is a clash.
  // const mergeObjects = function (theme1 = themeProvider.default, theme2 = idea.theme, method = "lodash") {
  //   switch (method) {

  //     case "lodash":
  //       const deep_merge = require('lodash/merge');
  //       var merged_theme = deep_merge(theme1, theme2);
  //       break;

  //     default:
  //       // QUESTION: This spread operator (...x) worked before: maybe debugger uses ES6 but webpack doesn't?
  //       // var merged_theme = { ...theme1, ...theme1 };
  //       var merged_theme = Object.assign({}, theme1, theme2);

  //   }
  //   return merged_theme
  // };
};
