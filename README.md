MindMup MapJs
=============

[![Build Status](https://api.travis-ci.org/mindmup/mapjs.png)](http://travis-ci.org/mindmup/mapjs)

MindMup is a zero-friction mind map canvas. Our aim is to create the most productive mind mapping environment out there, removing all the distractions and providing powerful editing shortcuts. 

This project is the JavaScript visualisation portion of MindMup. It provides a canvas for users to create and edit
mind maps in a browser. You can see an example of this live at [mindmup.com](http://www.mindmup.com), or play with the library directly in the browser using `test/index.html` from this project..

This project is relatively stand alone and you can use it to create a nice mind map visualisation separate from the 
[MindMup Server](http://github.com/mindmup/mindmup).

#Using MAPJS in your projects

## Without dependencies

Use [mindmup-mapjs.min.js](dist/mindmup-mapjs.min.js) from the [dist](dist) folder. This includes no third-party scripts, so make sure you're including the [dependencies](#dependencies) separately as well.

## With all the dependencies

Grab the module

    npm install mindmup-mapjs

Export the library with all the dependencies into a single file for your browser

    browserify -r mindmup-mapjs > mapjs.js

You can now include MAPJS into HTML files simply by using 

    var MAPJS = require('mindmup-mapjs')

#Testing

To run the unit tests, execute

    npm test

To debug and try things out visually, grab the dependencies using:

    npm run pretest

Then open test/index.html in a browser.

#Dependencies

This library depends on the following projects:

- [JQuery](http://jquery.com/)
- [Underscore.Js](http://underscorejs.org/)
- [JQuery HotKeys](http://jquery.com/)
- [Hammer.JS JQuery Plugin](http://eightmedia.github.com/hammer.js)
- [Color JS](https://github.com/harthur/color)

They are automatically downloaded using NPM and can be converted to a single file, `lib/dependencies.js` using the following command:

    npm run pretest
    
If you don't yet have the (required) grunt executable on your path, you can get one as follows:

    sudo npm install -g grunt-cli

