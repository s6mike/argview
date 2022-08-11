#!/usr/bin/env bash

# For running casual tests and checks.
# These aliases are not considered part of a public API, and therefore updates may change them without warning.

echo "Running ${BASH_SOURCE[0]}"

# argmap test Aliases

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fixed name

alias argmm='rm $INPUT_FILE_MUP; a2m $INPUT_FILE_YML'
alias argmy='rm $WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.yml; m2a $INPUT_FILE_MUP'
alias argmt='rm $WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.tex; a2t $INPUT_FILE_YML'
alias argmu='a2mu $WORKSPACE/test/input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'

#TODO: need to delete previous file, best way? Separate output folder or just delete all .json in test/output folder?
alias argmo='rm $WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.mup; a2mo $INPUT_FILE_YML'
# alias argmj='rm $WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.json; a2jo $INPUT_FILE_YML'
alias argmh0='rm $MJS_WP_HOME/Example1_ClearlyFalse_WhiteSwan_simplified_0mapjs.html; rm $MJS_WP_HOME/12ff0311ebc308e94fe0359b761fa405b605f126.png; md2hf $INPUT_FILE_MD0'
alias argmh='rm $MJS_WP_HOME/Example1_ClearlyFalse_WhiteSwan_simplified_1mapjs.html; rm $MJS_WP_HOME/12ff0311ebc308e94fe0359b761fa405b605f126.png; md2hf $INPUT_FILE_MD'
alias argmh2='rm $MJS_WP_HOME/Example1_ClearlyFalse_WhiteSwan_simplified_2mapjs.html; md2hf $INPUT_FILE_MD2'
alias argmhmeta='rm $MJS_WP_HOME/Example1_ClearlyFalse_WhiteSwan_simplified_meta_mapjs.html; md2hf $INPUT_FILE_MD_META'
alias argmp='rm $WORKSPACE/test/output/Example1_ClearlyFalse_WhiteSwan_simplified.pdf; md2pdf $INPUT_FILE_MD'
alias argmph='rm $WORKSPACE/test/output/example.pdf; rm $WORKSPACE/test/output/header.tex; $WORKSPACE/src/argmap2tikz.lua -i > $WORKSPACE/test/output/header.tex; pandoc $INPUT_FILE_MD -o $WORKSPACE/test/output/example.pdf --lua-filter pandoc-argmap.lua --pdf-engine lualatex --include-in-header $WORKSPACE/test/output/header.tex --data-dir=$CONDA_PREFIX/share/pandoc; echo "Generated: $WORKSPACE/test/output/example.pdf"'
alias argt='$WORKSPACE/test/tests.sh'
alias argth='$WORKSPACE/test/tests.sh html'
