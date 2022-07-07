#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# argmap Functions
reset_repo() {
  echo 'Restoring output folder to match remote.'
  git checkout -- "$WORKSPACE/Output/"
  git checkout -- "$WORKSPACE/examples/"
  rm "$MJS_WP_MAP"
}

clean_repo() {
  rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml"
  rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup"
  rm "$MJS_WP_MAP"
}

mappack() {
  npm --prefix "$MJS_WP_HOME" run pack-js
}

saveenv() {
  conda env export --from-history --name "$CONDA_ENV_ARGMAPS" >"$WORKSPACE/environment.yml"
  # TODO: Prepare Environment YAML For Distribution
  # https://workflowy.com/#/b0011d3b3ba1
}

# lua argmap2mup Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml > Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup
a2m() {                                    # a2m Input/WhiteSwan_minus_inline_objections_restoring.yml
  NAME=$(basename --suffix=".yml" "$1") && # && ensures error failure stops remaining commands.
    argmap2mup "$1" >"${2:-$WORKSPACE/Output/$NAME.mup}" &&
    echo "Generated: ${2:-$WORKSPACE/Output/$NAME.mup}"
}

a2mu() {
  NAME=$(basename --suffix=".yml" "$1") &&
    argmap2mup --upload --name "$NAME.mup" --folder 1cSnE4jv5f1InNVgYg354xRwVPY6CvD0x "$1" &&
    echo "Uploaded: $1 to GDrive."
}

a2mo() {
  a2m "$1" "${2:-$MJS_WP_MAP}" &&
    mappack >/dev/null
  open "$MJS_WP_HOME/index.html" 2>/dev/null &
}

m2a() { # m2a Output/Example1_simple.mup
  NAME=$(basename --suffix=".mup" "$1") &&
    mup2argmap "$1" >"${2:-$WORKSPACE/Output/$NAME.yml}" &&
    echo "Generated: ${2:-$WORKSPACE/Output/$NAME.yml}"
}

md2h() { # md2h Input/example.md
  NAME=$(basename --suffix=".md" "$1") &&
    pandoc "$1" -o "${2:-$WORKSPACE/Output/$NAME.html}" --lua-filter pandoc-argmap.lua --data-dir="/opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/share/pandoc" >/dev/null &&
    echo "Generated: ${2:-$WORKSPACE/Output/$NAME.html}"
  mv "$WORKSPACE"/*.png Output/
}

a2t() {
  NAME=$(basename --suffix=".yml" "$1") &&
    argmap2tikz "$1" >"${2:-$WORKSPACE/Output/$NAME.tex}" &&
    echo "Generated: ${2:-$WORKSPACE/Output/$NAME.tex}"
}

export -f clean_repo mappack saveenv a2m a2mu a2mo m2a md2h a2t ## Mark functions for export to use in other scripts:

# argmap Aliases

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fix name

alias argmm='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup; a2m $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmu='a2mu $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmo='rm $MJS_WP_MAP; a2mo $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmy='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml; m2a $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.mup'
alias argmt='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.tex; a2t $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmp='rm $WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.html; rm $WORKSPACE/12ff0311ebc308e94fe0359b761fa405b605f126.png; rm $WORKSPACE/Output/12ff0311ebc308e94fe0359b761fa405b605f126.png; md2h Input/Example1_ClearlyFalse_WhiteSwan_simplified.md'
alias argt='$WORKSPACE/scripts/tests.sh'
