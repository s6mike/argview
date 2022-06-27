WORKSPACE=$(pwd)
echo "argmap aliases loaded from $WORKSPACE/scripts/bash_aliases_argmap.sh"

MJS_WP_HOME=~/git_projects/mapjs-webpack-example
MJS_WP_MAP=$MJS_WP_HOME/src/example-map.json

# argmap Functions

alias pack='npm --prefix $MJS_WP_HOME run pack-js'

a2m(){ # a2m Input/WhiteSwan_minus_inline_objections_restoring.yml
  NAME=$(filename $1) &&        # && ensures error doesn't execute remaining commands
  lua argmap2mup.lua $WORKSPACE/$1 > ${2:-$WORKSPACE/Output/$NAME.mup}
}
a2mo(){
  a2m $1 ${2:-$MJS_WP_MAP} &&
  pack &&
  chrome ~/git_projects/mapjs-webpack-example/index.html
}
m2a() { # m2a Output/Example1_simple.mup
  NAME=$(filename $1) &&
  lua mup2argmap.lua $WORKSPACE/$1 > $WORKSPACE/Output/${2:-$NAME.yml}
}

## Export functions for use in other scripts
export -f mappack saveenv a2m a2mu a2mo m2a clean

# argmap Aliases

alias argmm='a2m Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmo='a2mo Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
alias argmy='m2a Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup'
alias argmu='lua argmap2mup.lua -u $WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml'
