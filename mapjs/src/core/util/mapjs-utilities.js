/*global module*/
// TODO: switch to lodash and test
const _ = require('underscore'),
  // { default: config } = require('../../config-mapjs.yml'),
  { default: config } = require('yaml-loader!../../config-mapjs.yml'),
  CONTAINER_CLASS = config.mapjs_map.class;

function MyLogger(console_original, environment = process.env.NODE_ENV) {
  const new_logger = Object.create(console_original);

  // Override some console functions based on environment
  if (environment === 'production') {
    // Disables console.log and console.debug in production mode.
    // 	QUESTION: change so that it logs the data elsewhere?
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

// Setting this up here so it's ready for idea_pp
//  TODO: If I move idea_pp to MyLogger then I can be more flexible with where I initialise it
Logger = new MyLogger(console);

module.exports = {
  // QUESTION: How to move above constructor definition into module.exports object?
  Logger,

  // Parameterized try catch function
  //  Simplifies environment based catching
  //  Allows use of constants with try-catch
  trycatch: (t, c) => {
    // Set default exception here:
    c = (exception) => {
      if (process.env.NODE_ENV === 'production') {
        Logger.error('Caught: ' + exception);
      } else {
        throw exception;
      }
    };

    try {
      return t()
    } catch (exception) {
      return c(exception)
    };
  },

  // Get element from class and optional parent element
  getElementMJS: (className, parentElement = document) => {
    const elements = parentElement.getElementsByClassName(className);
    if (elements.length) {
      return elements[0];
    }
    throw new Error('getElementMJS(): Element of class ' + className + ' not found in ' + parentElement.tagName + '.' + parentElement.classList[0]);
  },

  // Can pass element or event
  getContainerID: (elementOrEvent) => {
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

  // May not be compatible with all modern browsers
  downloadToFile: (content, filename, contentType) => {
    const file = new Blob([content], { type: contentType }),
      download_anchor = document.createElement('a');

    download_anchor.href = URL.createObjectURL(file);
    download_anchor.download = filename;
    download_anchor.click();

    URL.revokeObjectURL(download_anchor.href);
  },

  // TODO: Only run all this is logging is enabled.
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

  // Commented out since not needed any longer:

  // Two different ways of combining two theme files, see which one works best
  // order matters in both merge types, better results from having idea.theme as second argument.
  // 	Assume that value of second used where there is a clash.
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
