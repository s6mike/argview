#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# argmap Functions
reset_repo() {
  echo 'Restoring output folder to match remote.'
  git checkout -- "$WORKSPACE/Output/"
  git checkout -- "$WORKSPACE/examples/"
}

clean_repo() {
  rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml"
  rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup"
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
a2m() {                                    # a2m Input/WhiteSwan_minus_inline_objections_restoring.yml
  NAME=$(basename --suffix=".yml" "$1") && # && ensures error failure stops remaining commands.
    OUTPUT=${2:-$WORKSPACE/Output/$NAME.mup} &&
    argmap2mup "$1" >"$OUTPUT" &&
    # TODO: Should return $2 value so can be used by calling app e.g. a2mo or a2mj.
    echo "Generated: $OUTPUT"
}

a2mu() {
  NAME=$(basename --suffix=".yml" "$1") &&
    argmap2mup --upload --name "$NAME.mup" --folder 1cSnE4jv5f1InNVgYg354xRwVPY6CvD0x "$1" &&
    echo "Uploaded: $1 to GDrive."
}

#TODO add way to disable redirect to /dev/null
pack_mapjs() {
  # OUTPUT=$1 # Remove default so can test properly: ${1:-$MJS_WP_MAP}
  # First -- ensures rest is passed onto webpack call
  # TODO - adding --inspect should enable debug mode - but can't get to work.
  npm --prefix "$MJS_WP_HOME" run pack-js -- --env.input_map="$1"
}

# LEGACY, use a2jo instead.
a2mo() {
  NAME=$(basename --suffix=".yml" "$1") &&
    OUTPUT=${2:-$WORKSPACE/Output/$NAME.json} &&
    a2m "$1" "$OUTPUT" &&
    pack_mapjs "$OUTPUT"
  google-chrome --no-default-browser-check --window-size=500,720 "$MJS_WP_HOME/index.html" 2>/dev/null &
}

a2jo() {
  NAME=$(basename --suffix=".yml" "$1")
  OUTPUT=${2:-$WORKSPACE/Output/$NAME.json}
  #TODO: Is there a way to pipe a2m output to pack_mapjs?
  a2m "$1" "$OUTPUT" &&
    pack_mapjs "$OUTPUT" &&
    google-chrome --no-default-browser-check --window-size=500,720 "$MJS_WP_HOME/index.html" 2>/dev/null &
}

m2a() { # m2a Output/Example1_simple.mup
  OUTPUT=${2:-$WORKSPACE/Output/$NAME.yml}
  NAME=$(basename --suffix=".mup" "$1")
  mup2argmap "$1" >"$OUTPUT" &&
    echo "Generated: $OUTPUT"
}

a2t() {
  NAME=$(basename --suffix=".yml" "$1") &&
    argmap2tikz "$1" >"${2:-$WORKSPACE/Output/$NAME.tex}" &&
    echo "Generated: ${2:-$WORKSPACE/Output/$NAME.tex}"
}

md2htm() { # md2h Input/example.md
  NAME=$(basename --suffix=".md" "$1") &&
    pandoc "$1" -o "${2:-$WORKSPACE/Output/$NAME.html}" --lua-filter="$WORKSPACE/src/pandoc-argmap.lua" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "Generated: ${2:-$WORKSPACE/Output/$NAME.html}"
  wait # waits for png to appear
  mv ./*.png "$WORKSPACE/Output/"
}

md2pdf() { # md2h Input/example.md
  NAME=$(basename --suffix=".md" "$1") &&
    pandoc "$1" -o "${2:-$WORKSPACE/Output/$NAME.pdf}" --lua-filter="$WORKSPACE/src/pandoc-argmap.lua" --pdf-engine lualatex --template examples/example-template.latex --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "Generated: ${2:-$WORKSPACE/Output/$NAME.pdf}"
}

## Mark functions for export to use in other scripts:
export -f reset_repo clean_repo check_repo pack_mapjs save_env a2m m2a a2t a2mu a2mo a2jo md2htm md2pdf

# argmap Aliases

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fixed name

alias argmm='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup; a2m $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmy='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml; m2a $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.mup'
alias argmt='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.tex; a2t $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmu='a2mu $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'

#TODO: need to delete previous file, best way? Separate output folder or just delete all .json in Output folder?
alias argmo='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup; a2mo $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmj='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.json; a2jo $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmh='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.html; rm $WORKSPACE/12ff0311ebc308e94fe0359b761fa405b605f126.png; rm $WORKSPACE/Output/12ff0311ebc308e94fe0359b761fa405b605f126.png; md2htm $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.md'
alias argmp='rm $WORKSPACE/Output/example.pdf; md2pdf $WORKSPACE/examples/example.md'
alias argmph='rm $WORKSPACE/Output/example.pdf; rm $WORKSPACE/Output/header.tex; $WORKSPACE/src/argmap2tikz.lua -i > $WORKSPACE/Output/header.tex; pandoc $WORKSPACE/examples/example.md -o $WORKSPACE/Output/example.pdf --lua-filter pandoc-argmap.lua --pdf-engine lualatex --include-in-header $WORKSPACE/Output/header.tex --data-dir=$CONDA_PREFIX/share/pandoc; echo "Generated: $WORKSPACE/Output/example.pdf"'
alias argt='$WORKSPACE/scripts/tests.sh'
