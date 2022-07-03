#!/usr/bin/env bash

WORKSPACE=$(pwd)
echo "argmap aliases loaded from $WORKSPACE/scripts/bash_aliases_argmap.sh"

MJS_WP_HOME=~/git_projects/mapjs-webpack-example
MJS_WP_MAP=$MJS_WP_HOME/src/example-map.json

## Export variables for use in other scripts
export WORKSPACE MJS_WP_HOME MJS_WP_MAP

# argmap Functions

clean_repo() {
  echo 'Restoring output folder to match remote.'
  git checkout -- /home/s6mike/git_projects/argmap/Output/
}

mappack() {
  npm --prefix $MJS_WP_HOME run pack-js
}

saveenv() {
  conda env export --name argmaps >"$WORKSPACE/environment.yml"
}

a2m() {                    # a2m Input/WhiteSwan_minus_inline_objections_restoring.yml
  NAME=$(filename "$1") && # && ensures error doesn't execute remaining commands
    lua argmap2mup.lua "$WORKSPACE/$1" >"${2:-$WORKSPACE/Output/$NAME.mup}"
}

a2mu() {
  NAME=$(filename "$1") &&
    lua argmap2mup.lua --upload --name "$NAME.mup" --folder 1cSnE4jv5f1InNVgYg354xRwVPY6CvD0x "$WORKSPACE/$1"
}

a2mo() {
  a2m "$1" "${2:-$MJS_WP_MAP}" &&
    mappack &&
    chrome ~/git_projects/mapjs-webpack-example/index.html
}

m2a() { # m2a Output/Example1_simple.mup
  NAME=$(filename "$1") &&
    lua mup2argmap.lua "$WORKSPACE/$1" >"$WORKSPACE/Output/${2:-$NAME.yml}"
}

## Export functions for use in other scripts
export -f clean_repo mappack saveenv a2m a2mu a2mo m2a

# argmap Aliases

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fix name

alias argmm='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup; a2m Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmu='a2mu Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmo='a2mo Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmy='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml; m2a Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup'
alias argt='scripts/tests.sh'
