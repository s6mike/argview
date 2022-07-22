# How to use MapJS 2 with WebPack

1. Navigate to `mapjs` folder, which is where files have been moved to, to simplify merging with argmap repo.
2. Run `npm install` to grab the dependencies.
3. Run `npm run pack-js -- --env.input_map=[path to map.json file]` to package MAPJS and all the dependencies into a single JS file which displays the chosen map.json file as a mindmap. This `.json` file could be a mindmup export or an output from `argmap2mup` (see [s6mike/argmap: Tools for working with argument maps represented in YAML - forked bugfixes and customisation](https://github.com/s6mike/argmap/tree/master)).
4. Open `index.html` in your browser.

## How it works

Check out [src/start.js](src/start.js) to see how the page is wired up and initialised.
