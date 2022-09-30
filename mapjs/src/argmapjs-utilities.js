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
