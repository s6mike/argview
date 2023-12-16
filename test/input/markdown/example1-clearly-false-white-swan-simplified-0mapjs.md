---
title: Example 1.0 - All swans are white.
# template: src/layouts/templates/pandoc-mapjs-main-html5.html
# TODO: These might be better in a defaults file:
#   https://workflowy.com/#/ee624e71f40c
# css: test/mapjs-default-styles.css
# mapjs-output-js: test/bundle.js
# lua-filter: "$PATH_LUA_ARGMAPdoc-argmap.lua"
# data-dir: "$PANDOC_DATA_DIR"
argmaps: true
---

This is a simplified version of the White Swan argument:

```{#argmap1 .argmap .yaml name="Example 1: All swans are white"}
"All swans are white":
  r1:
    "Every swan I've ever seen is white": []
    "These swans are representative of all swans": []
  o2:
    "Not all swans are white": []
```

And here it is again:

```{#argmap2 .argmap .yaml name="Example 1: All swans are white"}
"All swans are white":
  r1:
    "Every swan I've ever seen is white": []
    "These swans are representative of all swans": []
  o2:
    "Not all swans are white": []
```
