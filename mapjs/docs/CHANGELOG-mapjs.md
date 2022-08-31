# Mapjs Project Change Log

## mapjs 4.0.0

- Align with argmap changes (v4.3.0): BREAKING
  - Restructure folder so inputs and outputs logically separated:
    - `mapjs/test/`:
    - Move website dependencies to `site/`:
      - Move `/mapjs-default-styles.css`
        - `mapjs/scripts/mapjs.env`: Update env variable for css path.
      - Move all svg files to `site/svg/`.
    - Move js source files to `src/`:
      - Move `theme.js` and `themes/`.
        - `mapjs/src/start.js`:
          - Update reference to `theme.js`.
          - Also change console.log to console.error for catching JSON load errors.
    - `mapjs/webpack.config.js`: Create bundle.js in `site/js/` instead.
  - Move `test/start.js` to `src/start.js` since it's a source file.
  - `package.json`: Add  "type": "commonjs".
  - Remove references to `src/example-map.json` from `src/start.js`
  - Delete since no longer needed:
    - `test/example-map.json`
    - `mapjs/test/index.html`
- Using VSCode defaults for file formatting: many whitespace changes.

## mapjs 3.3.9

- `src/core/map-model.js`: Fix left click on node to select (introduced in commit 'moved addLinkMode out of mapModel' 354071624edb6c257441fcdfcb3f11ab92ad395e).
  - Relevant function `clickNode` triggered by `mouseup`: `button` value wasn't used, so test `which` value instead.

## mapjs 3.3.8

- Merge fixes from stash 'All mapjs fixes up to toolbar': just a settings.json with bash terminal init file.
- Add 'scripts/mapsjs.env' to hold new environment variables: PATH_LOG_FILE_EXPECT, PATH_REPLAY_SCRIPT, PATH_REPLAY_SCRIPT_ADD_IDEA, PATH_BISECT_PATCH_FILE

## mapjs 3.3.7

- `docs/CHANGELOG-mapjs.md`: Clean up history.

## mapjs 3.3.6

- Version 3.4.0 because latest mapjs tag is 3.3.6
- Add this Change Log file.
- Add cumulative mapjs bugfixes:
  - Fix add parent reason issue.
  - `test/start.js`: Errors sent to console.error, rather than alert which was incredibly annoying!
  - Fix toolbar buttons by restoring `src/browser/map-toolbar-widget` related code which was removed in commit 'initial jquery 3 migration' (`b2768ac`).
  - `src/core/content/content.js`: Fix reject call syntax which caused unrecognised function '_' error.
- `package.json`:
  - Add TestCafe module for automated testing using chrome devtools recordings.
  - Add alias script keys to align with npm lifecycle as described in: <https://docs.npmjs.com/cli/v8/using-npm/scripts>
- Update .gitignore
- Add `package-lock.json` to repo.

## mapjs 3.3.5

- Fork of [mindmup/mapjs](https://github.com/mindmup/mapjs)

----------------

Uses [Semantic Versioning 2.0.0](https://semver.org/) and [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
