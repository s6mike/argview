Argmap Project News
===================

# argmap 0.1.0
- Fork of https://github.com/dsanson/argmap
- Install with lua 5.3.4
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