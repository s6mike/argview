#!/usr/bin/env bash

# Functions beginning with __ are not considered part of a public API, and therefore may change during patch updates without warning.

echo "Running ${BASH_SOURCE[0]}"

# argmap Functions

# For opening html pages containing mapjs files
__open-mapjs() {
  # QUESTION: Is --allow-file-access-from-files a temp solution?
  #   Alternatives:
  #     Embed JSON directly in html
  #     https://stackoverflow.com/questions/64140887/how-to-solve-cors-origin-issue-when-trying-to-get-data-of-a-json-file-from-local
  #     Set it up as a client-server app
  google-chrome --allow-file-access-from-files --no-default-browser-check --window-size=500,720 "$1" 2>/dev/null &
  disown # stops browser blocking terminal and allows all tabs to open in single window.
}

# Used by pre-commit hook
__reset_repo() {
  echo 'Restoring output folder to match remote.'
  # May need to update this once json export folder is in WORKSPACE.
  git checkout -- "$WORKSPACE/examples/"
  git checkout -- "$WORKSPACE/Output/"
  git checkout -- "$WORKSPACE/test/output"
}

# Checks `src/`` for lua files with leftover test/debug code.
# Used by pre-commit hook
__check_repo() {
  grep -Frni "$WORKSPACE/src" -e 'logger:setLevel(logging.DEBUG)' -e 'require("lldebugger").start()'
}

__save_env() {
  conda env export --from-history --name "$CONDA_ENV_ARGMAPS" >"$ENV_FILE"
  # TODO: Prepare Environment YAML For Distribution
  # https://workflowy.com/#/b0011d3b3ba1
}

__clean_repo() {
  rm "$WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.yml"
  rm "$WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.mup"
  rm "$WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.json"
  rm "$WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.tex"
  rm "$WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified_0mapjs.pdf"
  rm "$MJS_WP_HOME/Example1_ClearlyFalse_WhiteSwan_simplified_0mapjs.html"
  rm "$MJS_WP_HOME/Example1_ClearlyFalse_WhiteSwan_simplified_1mapjs.html"
  rm "$MJS_WP_HOME/Example1_ClearlyFalse_WhiteSwan_simplified_2mapjs.html"
  rm "$MJS_WP_HOME/Example1_ClearlyFalse_WhiteSwan_simplified_meta_mapjs.html"
  rm "$MJS_WP_HOME/f54eea6ed0c060c9d27e1fe3507bfdd75e3e60d4.png"
  # rm "$INPUT_FILE_JSON"
}

__build_mapjs() {
  # TODO - adding --inspect should enable debug mode - but can't get to work.
  # First -- ensures rest is passed onto webpack call
  npm --prefix "$MJS_WP_HOME" run pack-js
}

alias bmj='__build_mapjs'

# lua argmap2mup test/input/Example1_ClearlyFalse_WhiteSwan_simplified.yml > test/output/Example1_ClearlyFalse_WhiteSwan_simplified.mup
# TODO add option for .mup vs .json output
a2m() {                                    # a2m test/output/Example1_simple.yml
  NAME=$(basename --suffix=".yml" "$1") && # && ensures error failure stops remaining commands.
    OUTPUT=${2:-$WORKSPACE/test/output/$NAME.mup} &&
    argmap2mup "$1" >"$OUTPUT" &&
    # TODO: Should return $2 value so can be used by calling app e.g. a2mo or a2mj.
    echo "Generated: $OUTPUT"
}

a2mu() { # a2mu test/output/Example1_simple.yml
  NAME=$(basename --suffix=".yml" "$1") &&
    argmap2mup --upload --name "$NAME.mup" --folder 1cSnE4jv5f1InNVgYg354xRwVPY6CvD0x "$1" &&
    echo "Uploaded: $1 to GDrive."
}

# Deprecated, use a2m() for converting argmap to .mup/.json and use __build_mapjs to rebuild app
a2jo() { # m2a output/mapjs-json-input/Example1_simple.yml
  NAME=$(basename --suffix=".yml" "$1")
  OUTPUT=${2:-$WORKSPACE/test/output/$NAME.json}
  a2m "$1" "$OUTPUT" # &&
  # Now only needed during install or after updating mapjs source code.
  # __build_mapjs # "$OUTPUT"
}

# Deprecated, use a2jo instead.
a2mo() {
  NAME=$(basename --suffix=".yml" "$1") &&
    OUTPUT=${2:-$WORKSPACE/test/output/$NAME.json} &&
    a2m "$1" "$OUTPUT" # &&
  # __build_mapjs # "$OUTPUT"
}

m2a() { # m2a test/output/Example1_simple.mup
  NAME=$(basename --suffix=".mup" "$1")
  OUTPUT=${2:-$WORKSPACE/test/output/$NAME.yml}
  mup2argmap "$1" >"$OUTPUT" &&
    echo "Generated: $OUTPUT"
}

a2t() { # a2t test/output/Example1_simple.yml
  NAME=$(basename --suffix=".yml" "$1") &&
    argmap2tikz "$1" >"${2:-$WORKSPACE/test/output/$NAME.tex}" &&
    echo "Generated: ${2:-$WORKSPACE/test/output/$NAME.tex}"
}

md2hf() { # md2h test/input/example.md
  NAME=$(basename --suffix=".md" "$1")
  # TODO: Export to test/output, but will first need to update paths to main.js and mapjs-default-styles.css
  # OUTPUT=${2:-$WORKSPACE/test/output/$NAME.html}
  OUTPUT=${2:-$MJS_WP_HOME/$NAME.html}
  # QUESTION: Is it worth putting some of these settings into a metadata or defaults file?
  # If so, how would I easily update it?
  # Needed? --metadata=curdir:X
  # css here overrides the template value, which may not be what I want. Not sure best way to handle.
  # TODO: lua filter should create container html fragment, with JSON file url etc
  # TODO: Could use a defaults file:
  # https://workflowy.com/#/ee624e71f40c
  pandoc "$1" --template "$WORKSPACE/pandoc-templates/mapjs/mapjs-main-html5.html" --metadata=mapjs-output-js:"$MJS_OUTPUT_FILE" --metadata=css:"$MJS_CSS" -o "$OUTPUT" --lua-filter="$WORKSPACE/src/pandoc-argmap.lua" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "Generated: $OUTPUT"
  wait # waits for png to appear
  mv ./*.png "$(dirname "$OUTPUT")"
  __open-mapjs "$OUTPUT"
}

# This is meant to output an html doc fragment rather than full doc, so removing template.
# TODO: fix, this currently creates html output in test/output folder: e.g. file:///home/s6mike/git_projects/argmap/test/output/example-updated.html
# Which breaks links to webpack output js, looks in: file:///home/s6mike/git_projects/argmap/test/output/site/main.js
# Probably because I'm now using a relative link to the js file, so that I can view in main chrome browser.
md2htm() { # md2htm test/input/example-updated.md
  NAME=$(basename --suffix=".md" "$1")
  OUTPUT=${2:-$WORKSPACE/test/output/$NAME.html}

  # TODO: Put this into new function?
  # Or use a defaults file:
  # https://workflowy.com/#/ee624e71f40c
  pandoc "$1" -o "$OUTPUT" --lua-filter="$WORKSPACE/src/pandoc-argmap.lua" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "Generated: $OUTPUT"
  wait # waits for png to appear
  mv ./*.png "$WORKSPACE/test/output/"
  __open-mapjs "$OUTPUT"
}

md2pdf() { # md2pdf test/input/example.md
  NAME=$(basename --suffix=".md" "$1")
  OUTPUT=${2:-$WORKSPACE/test/output/$NAME.pdf}
  pandoc "$1" -o "$OUTPUT" --lua-filter="$WORKSPACE/src/pandoc-argmap.lua" --pdf-engine lualatex --template examples/example-template.latex --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "Generated: $OUTPUT"
  __open-mapjs "$OUTPUT"
}

## Mark functions for export to use in other scripts:
export -f __reset_repo __clean_repo __check_repo __open-mapjs __save_env __build_mapjs
export -f a2m m2a a2t a2mu md2htm md2hf md2pdf
