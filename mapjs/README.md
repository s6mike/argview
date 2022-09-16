# MindMup MapJs

MindMup is a zero-friction mind map canvas. Our aim is to create the most productive mind mapping environment out there, removing all the distractions and providing powerful editing shortcuts.

This project is the JavaScript visualisation portion of MindMup. It provides a canvas for users to create and edit
mind maps in a browser. You can see an example of this live at [mindmup.com](http://www.mindmup.com), or play with the library directly in the browser using `test/index.html` from this project.

This project is relatively stand alone and you can use it to create a nice mind map visualisation separate from the [MindMup Server](https://www.mindmup.com).

## Using MAPJS standalone

To run the dev server, execute:

`npm run start`

Then open <http://localhost:9000/> to view the example map.

## Using MAPJS in your projects

MapJS 2 works well with WebPack. Check out the [MAPJS Webpack Example](https://github.com/mindmup/mapjs-webpack-example) project.

Or just use: `npm run pack`

## Using MAPJS with argmap

argmap integrates with MAPJS:

[argmap](https://github.com/s6mike/argmap/tree/master)

Though currently, most of this integration is not on the main branch.

## Testing

To run the unit tests, execute

    `npm test`

To debug and try things out visually, grab the dependencies using:

    `npm run pretest`

## Dependencies

This library depends on the following projects:

- [JQuery](http://jquery.com/)
- [Underscore.Js](http://underscorejs.org/)
- [JQuery HotKeys](http://jquery.com/)
- [Hammer.JS JQuery Plugin](http://eightmedia.github.com/hammer.js)
- [Color JS](https://github.com/harthur/color)

## Keyboard Shortcuts

You can only select one node at a time, selected nodes have a drop shadow. When you add nodes they are added relative to the selected node.
You can activate multiple nodes at once, these are highlighted with a dotted line. When you delete or toggle nodes, you affect all the active nodes.

|Key Combination|Effect|
|----------------|---|
`space` `f2` | Edit node text
`del` `backspace` | Remove active nodes
`return`| Add node below
`shift+return`| Add node above
`shift+tab`| Add node left
`tab` `insert` | Add node right
`ctrl+click` | Select clicked node
`shift+click` | Activate clicked node
`alt+click` | Add link to clicked node
`down`| Select node below
`up`| Select node above
`left`| Select node left
`right`| Select node right
`shift+down`| Activate node below
`shift+up`| Activate node above
`shift+left`| Activate node left
`shift+right`| Activate node right
`meta+down` `ctrl+down` | Move active nodes below
`meta+up` `ctrl+up`| Move active nodes above
`meta+right` `ctrl+right` | Move active nodes right
`meta+left` `ctrl+left` | Move active nodes left
`c meta+x ctrl+x` | Cut
`p meta+v ctrl+v` | Paste
`y meta+c ctrl+c` | Copy
`ctrl+shift+v meta+shift+v` | Paste Style (custom colours)
`f` `/` | Toggle collapse / reveal
`u` `meta+z` `ctrl+z` | Undo
`r` `meta+shift+z` `ctrl+shift+z` `meta+y` `ctrl+y`| Redo
`meta+plus ctrl+plus z` | Zoom in
`meta+minus ctrl+minus shift+z` | Zoom out
`Esc 0 meta+0 ctrl+0` | Reset view / zoom
`[`| Activate children
`{`| Activate node and children
`=`| Activate sibling nodes
`.`| Deactivate all but selected node
`a`| Add / Open attachment
`i`| Edit icon
