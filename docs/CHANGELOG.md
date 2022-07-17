# Argmap Project Change Log

## argmap 3.5.0 Release Version

- Add `scripts/qa_rockspec`: lints and makes rockspec to ensure validity.
- Update rockspec for release, and to include external yaml dependency.

## argmap 3.4.0

- New script function: check_repo: Checks `src/` for lua files with leftover test/debug code.

## argmap 3.3.1

- New conda env argmap:
  - Clean up `LUA_PATH` and `LUA_CPATH`, which both had invalid paths.
  - Remove extra dependencies so only deliberate installs included. Should be more platform independent.
  - Rename relevant variables in vscode settings etc.
  - Update `scripts/install.sh` to use `$CONDA_PREFIX`.
  - `.vscode/settings.json`:
    - Add missing $ to variables, must have been wrong for a while.
    - Added variable to [MPE](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) extension setting.

## argmap 3.3.0

- Use more variables to reduce duplicate paths etc:
  - `.vscode/launch.json`
  - `.vscode/settings.json`
  - Add `src/config_argmap.lua` to ensure LUA_PATH etc available to VSCode extensions.
  - Update scripts:
    - Including symbolic link in `scripts/install.sh` to ensure `src/config_argmap.lua` available in `~/.local/share`.
- Fix missing image issue: relates to #20:
  - Update bash aliases to move image file for `tests.sh`
  - Add Input/12ff...png to repo for VSCode extension html output tests.

## argmap 3.2.2

`src/pandoc-argmap`:

- Fix crash on 2 README md to pdf examples, close #19.
  - Add first one to test file to ensure no regressions.
  - Add second to aliases.

`src/argmap2tikz.lua`:

- Fix lint errors: close #6, #7, #8.

## argmap 3.2.1

- [README.md](../README.md): Update sections: fork details and installation.
- Update `.vscode/launch.json` to use more settings variables for portability.
- Add workspace settings.json to repo to track these settings.
- Add failing md to pdf test to argmap aliases script.
- Add `.mup` Input file to repo for tests.
- `.gitignore`: Add examples and Input to keep stable. Plus archive folder for reference files.
- Minor formatting updates.

## argmap 3.2.0 Release Version

- Lua Code:
  - Move to src folder.
  - Restore line 1 #! shebang directive to lua scripts ([Local Lua Debugger - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=tomblind.local-lua-debugger-vscode) works with them).
  - [README.md](../README.md): update examples to correctly call lua files.
  - Add src folder to LUA_PATH in conda environment.yml.
  - Fix pandoc-argmap so it works.
  - Updated rockspec and `scripts/install.sh` to reflect new rockspec dependency.
- Pandoc:
  - Downgrade pandoc to v2.6:
    - [README.md](../README.md): update to reference this version.
    - `environment.yml`: Downgrade pandoc to v2.6, which was hopefully version used to develop pandoc-argmap.lua
  - `src/pandoc-argmap.lua`:
    - Fix references to local .lua commands (argmap2mup etc).
    - Fix 'need check nil' and undefined globals lint warnings, relates to #7, #8.
    - Make formatting consistent.
    - Add debug logging.
    - Fix launch.json debug configurations.
- Scripts:
  - Add `md2h` command to convert markdown with embedded argmaps to html, using filter `src/pandoc-argmap.lua`.
  - And `a2t` command to convert argmap yml into tex, using argmap2tikz.
    - Add aliases to run both of them.
    - Add them both to tests script.
  - Make scripts more portable with env variables: can change folder locations and conda env.
  - Move environment variable definitions from bash aliases, to conda env, init_script and conda.env
  - Add `scripts/install.sh` for symbolic links to lua files, to help reproduce install config consistently and avoid recent path issues.
  - No longer use lua or .lua in calls due to above lua code changes plus use of symbolic links.
  - Add `conda.env` to set conda env name variable so it's easy for pre-commit hook to access.
  - Add pandoc bash completions to init script.
- Add some additional Input and Output examples.
- Add Input and example folders to .gitignore now sufficient examples in repo.

## argmap 3.1.11

- [CONTRIBUTIONS.md](../CONTRIBUTIONS.md): Update for clarity.

## argmap 3.1.10

- [CONTRIBUTIONS.md](../CONTRIBUTIONS.md): Update for clarity.

## argmap 3.1.9

- Update tests.sh to work when called from pre-commit hook:
  - Exit code set to fail when a test fails.
  - Don't use ANSI colour escape code when dumb terminal.

## argmap 3.1.8

- Docs:
  - Add Tables of Contents.
  - Refine collapsible section formatting, default to open so ToC links work.
  - Improve formatting using markdown linter suggestions.
  - Update for clarity.

## argmap 3.1.7

- Shell scripts:
  - Fix lint issues using shellcheck and shell-format suggestions.
  - Make tests.sh output command success cleanly.
- Update environment.yml to include more dependencies.
- Change Log: Improve formatting using markdown linter suggestions.

## argmap 3.1.6

- [README.md](../README.md):
  - Make collapsible sections more obvious.
  - Fix broken code example.
- [CONTRIBUTING.md](../CONTRIBUTING.md): Improve formatting, layout and wording.

## argmap 3.1.5

- [README.md](../README.md):
  - Fix headline map link to link to published version (should be available until Jan 2023).
  - Make some sections collapsible: Installation, Syntax Rules and pandoc-argmap.lua
  - Add reference to issue 11: generated .mup files don't always work on mindmup, but can be used with legacy mindmup.
- example/example.yml: Update to match documentation.

## argmap 3.1.4

- launch.json:
  - Update filenames to include .lua extension.
  - Comment out sourcemap references, since unnecessary.

## argmap 3.1.3

- [CONTRIBUTING.md](../CONTRIBUTING.md): Fix broken links and typos.

## argmap 3.1.2 Release Version

- Update test.sh script to delete output files directly before test.
- Update clean function:
  - Rename as clean_repo.
  - Update to revert Output folder to match remote branch.

## argmap 3.1.1

- Docs:
  - Add docs folder.
  - Rename change log from NEWS.md to docs/CHANGELOG.md.
  - Add [CONTRIBUTING.md](../CONTRIBUTING.md).
  - Fix readme examples: now commands have .lua file extension.
- Fix rockspec to use correct version number.
- Add luarocks library clean-up file to simplify install testing.

## argmap 3.1.0

- Add rockspec file.
- Replace dependency json.lua with rxi-json-lua.lua for simpler install.
- Update conda env with values from luarocks path.
- Update readme install instructions.
  - Rename to [README.md](../README.md): simplifies rockspec generation.
- Add tests.sh file to do minimal testing.

## argmap 3.0.1

- Update bash aliases:
  - Add bash function for uploading to gdrive.
  - Upload to GDrive folder 'argmap_uploads'.
  - Use input filename as upload filename.

## argmap 3.0.0 BREAKING

- BREAKING: Add .lua file extension to lua app files to ensure correct syntax highlighting. Readme examples still need updating.
- Add argmap_init_script.sh and bash_aliases_argmap.sh to keep bash config and convenience functions in sync with code.

## argmap 2.1.0 Release Version

- Install lualogging to help with debugging.
  - Add debug logging to mup2argmap.
- Add launch.json to repo to track debugging tests.
- Fix mup2argmap:
  - Fix global variable which could be local, relates to #5, #6.
  - Fix need check nil, relates to #7.
- Fix argmap2mup:
  - Close #3 Static analyser errors.
- Comment out line 1 #! directive, so actboy168's lua debug extension can handle breakpoints: (see <https://github.com/actboy168/lua-debug/issues/153>).
  - Call explicitly with lua instead.
- Fix formatting based on sumneko's vscode lua extension.
- Add my own reference examples, in Input and Output folders.
- Readme: add github compatible syntax highlighting directives.

## argmap 1.1.0

- Fork of <https://github.com/dsanson/argmap>
- argmap2mup fix (potentially caused by different lua version):
  - Close #1 output file start with 'nil'.
  - Close #2 gdrive upload fails.
- Update license and readme.
- Add .gitignore, conda export: environment.yml

## argmap 1.0.1

- Update [README](README.md), [license](LICENSE).
- Add this CHANGELOG.md file.

## argmap 1.0.0

Original <https://github.com/dsanson/argmap>

Uses Semantic Versioning: <http://semver.org/> and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
