# Mapjs Project Change Log

## mapjs-webpack-example 4.0.0

- Version 4.0.0 because latest mapjs tag is 3.3.5.
- Align with argmap changes (v4.3.0): BREAKING
  - Restructure folder so inputs and outputs logically separated:
    - `mapjs/test/`:
    - Move website dependencies to `site/`:
      - Move `/mapjs-default-styles.css`
        - `mapjs/scripts/mapjs.env`: Update env variable for css location.
      - Move all svg files to `site/svg/`.
    - Move js source files to `src/`:
      - Move `theme.js` and `themes/`.
        - `mapjs/src/start.js`: Update reference to `theme.js`.
    - `mapjs/webpack.config.js`: Create bundle.js in `site/js/` instead.
  - Delete `mapjs/test/index.html` - no longer needed.
  - Move `test/start.js` to `src/start.js` since it's a source file.
  - `package.json`: Add  "type": "commonjs".
  - Remove references to `src/example-map.json` from `src/start.js`
  - Delete `test/example-map.json`
  - Update .gitignore
- Import commits from: garlic0708/mapjs.git
  - Modify attach, delete and rename actions to require 'standard' source
    45ce477c400d5d8a67c86758bc8d0643e2f8828b
- Add `package-lock.json`.
- Add package_garlic.json for reference.
- Include commits from previous changes I made, on top of the upstream master.

## mapjs-webpack-example 2.0.1

- Update .gitignore paths to include `mapjs` folder.
- [`mapjs/README.md`](../README.md):
  - Add step for navigating to correct folder.
  - Reference [argmap](https://github.com/s6mike/argmap/tree/master) project.
  - Add symbolic link from root to see if linked version shows up in github.
- Change Log:
  - Rename to distinguish from Change Log in merged project.
  - Add references to previous update.

## mapjs-webpack-example 2.0.0 BREAKING

- BREAKING CHANGE: Prepare to integrate with argmap as part of new argmapjs prototype:
  - Move everything except .gitignore into `mapjs` sub folder for merge with argmap git repo.
  - `webpack.config.js`:
    - Read env variables in from command line calls to webpack (e.g. `npm run pack-js -- --env.input_map=../examples/example-map.json`).
        See these guides: [javascript - Passing environment-dependent variables in webpack - Stack Overflow](https://stackoverflow.com/questions/30030031/passing-environment-dependent-variables-in-webpack), [Environment Variables | webpack](https://webpack.js.org/guides/environment-variables/).
    - Add DefinePlugin to pass env variable to `src/start` entry file.
  - `src/start.js`: Get map input from command line call instead of `src/example-map.json`.
    - Delete `src/example-map.json`, leaving `src/example-map.json-backup.json`.
  - `package.json`: Update to webpack 3.12.0 to support env variables in `webpack.config.js`.
- Rename this `NEWS.md` file to `mapjs/docs/CHANGELOG.md` for consistency with my other projects.
- Fix lint issues on [README.md](../README) and `docs/CHANGELOG.md` (using [markdownlint - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)).

## mapjs-webpack-example 1.1.0

- Add this NEWS.md file.
- Update [README.md](../README) install instructions.

## mapjs-webpack-example 1.0.0

- Fork of [mindmup/mapjs-webpack-example: simple example how to pack mapjs 2 with webpack](https://github.com/mindmup/mapjs-webpack-example)
- Renamed example-map.json as example-map-backup.json
- Add .gitignore and package-lock.json

----------------

Uses [Semantic Versioning 2.0.0](https://semver.org/) and [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).
