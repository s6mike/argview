---
title: Example 1.2 - All swans are white.
# template: src/layouts/templates/pandoc-mapjs-main-html5.html5.html
argmaps: true
# TODO: These might be better in a defaults file:
#   https://workflowy.com/#/ee624e71f40c
# css: test/mapjs-default-styles.css
# mapjs-output-js: test/bundle.js
# lua-filter: "$PATH_LUA_ARGMAPdoc-argmap.lua"
# data-dir: "$PANDOC_DATA_DIR"
---

This is a simplified version of the White Swan argument in mapjs format:

```{#argmap1 .argmap .yaml name="Example 1: All swans are white" to="js"}
"Map 1: All swans are white":
  r1:
    "Every swan I've ever seen is white": []
    "These swans are representative of all swans": []
  o2:
    "Not all swans are white": []
```

And here is the Brunellus argument:

```{#argmap2 .argmap .yaml name="An argument about a donkey" to="js"}
"Map 2: Brunellus is irrational":
  r1:
    "Brunellus is a donkey":
    "All donkeys are irrational":
  o1:
    "Brunellus studied in Paris":
    "-Most who study in Paris are rational":
```
