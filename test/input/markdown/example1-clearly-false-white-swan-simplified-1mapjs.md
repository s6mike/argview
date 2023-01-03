---
title: Example 1.1 - All swans are white.
template: pandoc-templates/mapjs/mapjs-main-html5.html
# TODO: These might be better in a defaults file:
#   https://workflowy.com/#/ee624e71f40c
# css: mapjs/site/mapjs-default-styles.css
# mapjs-output-js: mapjs/site/js/bundle.js
# lua-filter: "$PATH_DIR_ARGMAP_LUA/pandoc-argmap.lua"
# data-dir: "$PANDOC_DATA_DIR"
argmaps: true
---

This is a simplified version of the White Swan argument:

```{#argmap1 .argmap .yml name="Example 1: All swans are white."}
"Map 1: All swans are white.":
  r1:
    "Every swan I've ever seen is white.": []
    "These swans are representative of all swans.": []
  o2:
    "Not all swans are white.": []
```

And here it is in mapjs format:

```{#argmap2 .argmap .yml name="Example 1: All swans are white." to="js"}
"Map 2: All swans are white.":
  r1:
    "Every swan I've ever seen is white.": []
    "These swans are representative of all swans.": []
  o2:
    "Not all swans are white.": []
```
