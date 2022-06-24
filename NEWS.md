Argmap Project News
===================

# argmap 2.1.0
- Install lualogging to help with debugging.
    - Add debug logging to mup2argmap.
- Add launch.json to repo to track debugging tests.
- Fix mup2argmap:
    - Fix global variable which could be local, relates to #5, #6.
    - Fix need check nil, relates to #7.
- Fix argmap2mup:
    - Close #3 Static analyser errors.
- Comment out line 1 #! directive, so actboy168's lua debug extension
    can handle breakpoints:
    (see https://github.com/actboy168/lua-debug/issues/153).
    - Call explicitly with lua instead.
- Fix formatting based on sumneko's vscode lua extension.
- Add my own reference examples, in Input and Output folders.
- Readme: add github compatible syntax highlighting directives.

# argmap 0.1.0
- Fork of https://github.com/dsanson/argmap
- argmap2mup fixes:
    - Close #1 starts file with nil
    - Close #2 gdrive upload fails
    - Close #3 Static analyser errors
- Comment out line 1 #! directive, so actboy168's lua debug extension could handle breakpoints.
    - Call explicitly with lua instead.
- Minor formatting fixes based on sumneko's vscode lua extension.
- Add my own reference examples, in Input and Output folders.
- Update license and readme.
- Add conda export: environment.yml, .gitignore and this NEWS.md file.

Uses Semantic Versioning: http://semver.org/