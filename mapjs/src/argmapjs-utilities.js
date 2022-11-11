// TODO: switch to lodash and test
const _ = require('underscore');

idea_pp = function (idea, level = -1, key = []) {
  if (idea) {
    const type = idea.attr ? (idea.attr.group ? `${idea.attr.group}` : "") : "";
    rank = key && key != "" ? ` ${key}: ` : "";
    indent = level > 0 ? "  ".repeat(level) : ""
    parseInt(key) > 0 ? indent += " " : null // So ranks with minus sign align
    // TODO FIX: when running as script, _.pick causes an issue if underscore.js not available
    console.debug(`${indent}${rank}`, _.pick(idea, 'id', 'title', 'ideas'), `${type}`);
    if (idea.ideas) {
      ideas_pp(idea.ideas, level, Object.keys(idea.ideas))
    }
  }
  level -= 1;
  return;
}

ideas_pp = function (ideas, level = -1, keys = []) {
  // Want to start with extra line break, but it doesn't appear where I expect.
  // level == -1 ? console.debug('') : null;
  level += 1
  if (!ideas) {
    level -= 1;
    return
  } else if (ideas.id !== undefined) {
    idea_pp(ideas, level, keys);
  } else if (ideas.constructor === Array) {
    ideas.forEach(function (idea, n) {
      idea_pp(idea, level, keys[n]);
    });
  } else if (ideas.constructor === Object) {
    level -= 1;
    ideas_pp(Object.values(ideas), level, Object.keys(ideas));
  }
  level -= 1;
  return;
}

// ideas_pp(idea);

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
