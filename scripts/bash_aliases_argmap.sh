#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# argmap Functions

chrome-mini() {
  # &suffix runs it in background so terminal not blocked
  google-chrome --no-default-browser-check --window-size=500,720 "$1" 2>/dev/null &
}

reset_repo() {
  echo 'Restoring output folder to match remote.'
  git checkout -- "$WORKSPACE/Output/"
  git checkout -- "$WORKSPACE/examples/"
}

clean_repo() {
  rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml"
  rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup"
  # rm "$INPUT_FILE_JSON"
}

# Checks `src/`` for lua files with leftover test/debug code.
check_repo() {
  grep -Frni "$WORKSPACE/src" -e 'logger:setLevel(logging.DEBUG)' -e 'require("lldebugger").start()'
}

save_env() {
  conda env export --from-history --name "$CONDA_ENV_ARGMAPS" >"$WORKSPACE/environment.yml"
  # TODO: Prepare Environment YAML For Distribution
  # https://workflowy.com/#/b0011d3b3ba1
}

# lua argmap2mup Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml > Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup
# TODO add option for .mup vs .json output
a2m() {                                    # a2m Output/Example1_simple.yml
  NAME=$(basename --suffix=".yml" "$1") && # && ensures error failure stops remaining commands.
    OUTPUT=${2:-$WORKSPACE/Output/$NAME.mup} &&
    argmap2mup "$1" >"$OUTPUT" &&
    # TODO: Should return $2 value so can be used by calling app e.g. a2mo or a2mj.
    echo "Generated: $OUTPUT"
}

a2mu() { # a2mu Output/Example1_simple.yml
  NAME=$(basename --suffix=".yml" "$1") &&
    argmap2mup --upload --name "$NAME.mup" --folder 1cSnE4jv5f1InNVgYg354xRwVPY6CvD0x "$1" &&
    echo "Uploaded: $1 to GDrive."
}

pack_mapjs() {
  # OUTPUT=$1 # Remove default so can test properly: ${1:-$MJS_WP_MAP}
  # First -- ensures rest is passed onto webpack call
  # TODO - adding --inspect should enable debug mode - but can't get to work.
  npm --prefix "$MJS_WP_HOME" run pack-js -- --env.input_map="$1"
}

a2mo() { # Deprecated, use a2jo instead.
  NAME=$(basename --suffix=".yml" "$1") &&
    OUTPUT=${2:-$WORKSPACE/Output/$NAME.json} &&
    a2m "$1" "$OUTPUT" &&
    pack_mapjs "$OUTPUT"
}

a2jo() { # m2a Output/Example1_simple.yml
  NAME=$(basename --suffix=".yml" "$1")
  OUTPUT=${2:-$WORKSPACE/Output/$NAME.json}
  #TODO: Is there a way to pipe a2m output directly into pack_mapjs?
  # Then pack_mapjs should ideally have been generated during install/init, so won't be needed to be called after, will just be referenced in js
  a2m "$1" "$OUTPUT" &&
    pack_mapjs "$OUTPUT"
}

md2hf() { # md2h Input/example.md
  NAME=$(basename --suffix=".md" "$1")
  OUTPUT=${2:-$MJS_WP_HOME/index.html}
  # QUESTION: Is it worth putting some of these settings into a meta-data or defaults file?
  # If so, how would I easily update it? Or just put it in relevant root of mapjs folder?
  # Needed? --metadata=curdir:"$MJS_WP_HOME"
  # css here overrides the template value, which may not be what I want. Not sure best way to handle.
  # TODO: lua filter should create container html fragment, with $NAME.json attribute
  # TODO: Could use a defaults file:
  # https://workflowy.com/#/ee624e71f40c
  pandoc "$1" --template "$WORKSPACE/pandoc-templates/mapjs/mapjs-main-html5.html" --metadata=mapjs-output-js:"$MJS_OUTPUT_FILE" --metadata=css:"$MJS_CSS" -o "$OUTPUT" --lua-filter="$WORKSPACE/src/pandoc-argmap.lua" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "Generated: $OUTPUT"
  wait # waits for png to appear
  mv ./*.png "$(dirname "$OUTPUT")"

  # TODO: Shouldn't need this part, but will need to run pack_mapjs after updating start.js.
  # call a2jo?
  # pack_mapjs "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.json"
  chrome-mini "$OUTPUT"
}

m2a() { # m2a Output/Example1_simple.mup
  NAME=$(basename --suffix=".mup" "$1")
  OUTPUT=${2:-$WORKSPACE/Output/$NAME.yml}
  mup2argmap "$1" >"$OUTPUT" &&
    echo "Generated: $OUTPUT"
}

a2t() { # a2t Output/Example1_simple.yml
  NAME=$(basename --suffix=".yml" "$1") &&
    argmap2tikz "$1" >"${2:-$WORKSPACE/Output/$NAME.tex}" &&
    echo "Generated: ${2:-$WORKSPACE/Output/$NAME.tex}"
}

# TODO: fix, this currently creates html output in Output folder: e.g. file:///home/s6mike/git_projects/argmap/Output/example-updated.html
# Which breaks links to webpack output js, looks in: file:///home/s6mike/git_projects/argmap/Output/site/main.js
# Probably because I'm now using a relative link to the js file, so that I can view in main chrome browser.
md2htm() { # md2htm Input/example-updated.md
  NAME=$(basename --suffix=".md" "$1")
  OUTPUT=${2:-$WORKSPACE/Output/$NAME.html}

  # TODO: Put this into new function?
  # Or use a defaults file:
  # https://workflowy.com/#/ee624e71f40c
  pandoc "$1" --template "$WORKSPACE/pandoc-templates/mapjs/mapjs-main-html5.html" --metadata=mapjs-output-js:"$MJS_OUTPUT_FILE" --metadata=css:"$MJS_CSS" -o "$OUTPUT" --lua-filter="$WORKSPACE/src/pandoc-argmap.lua" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "Generated: $OUTPUT"
  wait # waits for png to appear
  mv ./*.png "$WORKSPACE/Output/"
  chrome-mini "$OUTPUT"
}

md2pdf() { # md2pdf Input/example.md
  NAME=$(basename --suffix=".md" "$1")
  OUTPUT=${2:-$WORKSPACE/Output/$NAME.pdf}
  pandoc "$1" -o "$OUTPUT" --lua-filter="$WORKSPACE/src/pandoc-argmap.lua" --pdf-engine lualatex --template examples/example-template.latex --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "Generated: $OUTPUT"
  chrome-mini "$OUTPUT"
}

## Mark functions for export to use in other scripts:
export -f reset_repo clean_repo check_repo chrome-mini save_env pack_mapjs a2m m2a a2t a2mu a2mo a2jo md2htm md2hf md2pdf

# argmap Aliases

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fixed name

alias argmm='rm $INPUT_FILE_MUP; a2m $INPUT_FILE_YML'
alias argmy='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml; m2a $INPUT_FILE_MUP'
alias argmt='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.tex; a2t $INPUT_FILE_YML'
alias argmu='a2mu $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'

#TODO: need to delete previous file, best way? Separate output folder or just delete all .json in Output folder?
alias argmo='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup; a2mo $INPUT_FILE_YML'
alias argmj='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.json; a2jo $INPUT_FILE_YML'
alias argmh='rm $MJS_WP_HOME/index.html; rm $WORKSPACE/Output/12ff0311ebc308e94fe0359b761fa405b605f126.png; md2hf $INPUT_FILE_MD'
alias argmp='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.pdf; md2pdf $INPUT_FILE_MD'
alias argmph='rm $WORKSPACE/Output/example.pdf; rm $WORKSPACE/Output/header.tex; $WORKSPACE/src/argmap2tikz.lua -i > $WORKSPACE/Output/header.tex; pandoc $INPUT_FILE_MD -o $WORKSPACE/Output/example.pdf --lua-filter pandoc-argmap.lua --pdf-engine lualatex --include-in-header $WORKSPACE/Output/header.tex --data-dir=$CONDA_PREFIX/share/pandoc; echo "Generated: $WORKSPACE/Output/example.pdf"'
alias argt='$WORKSPACE/scripts/tests.sh'
