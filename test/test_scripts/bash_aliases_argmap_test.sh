#!/usr/bin/env bash

# TODO: Rename file as bash_test_functions.lib.sh

# For running casual tests and checks.
# These aliases are not considered part of a public API, and therefore updates may change them without warning.

echo "Running ${BASH_SOURCE[0]}"

# argmap test Aliases

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fixed name
alias argmm='rm $INPUT_FILE_JSON; a2m $INPUT_FILE_YML'
alias argmy='rm $PATH_OUTPUT_LOCAL/example1-clearly-false-white-swan-simplified.yaml; m2a $INPUT_FILE_JSON'
alias argmt='rm $PATH_OUTPUT_LOCAL/example1-clearly-false-white-swan-simplified.tex; a2t $INPUT_FILE_YML'
alias argmu='a2mu $INPUT_FILE_YML'
alias argmup='__chrome-attach https://drive.mindmup.com/map/1FY98eeanu9vAhIqBG1rDKFs3QyM1uQyY'

#TODO: need to delete previous file, best way? Separate output folder or just delete all .json in test/output folder?
alias argmo='rm $PATH_OUTPUT_LOCAL/example1-clearly-false-white-swan-simplified.mup; a2mo $INPUT_FILE_YML'
alias argmh0='rm $PATH_OUTPUT_LOCAL/html/example1-clearly-false-white-swan-simplified-0mapjs.html; rm $PATH_OUTPUT_LOCAL/png/12ff0311ebc308e94fe0359b761fa405b605f126.png; 2hf $INPUT_FILE_MD0'
alias argmh='rm $PATH_OUTPUT_LOCAL/html/example1-clearly-false-white-swan-simplified-1mapjs.html; rm $PATH_OUTPUT_LOCAL/png/920713d1a74abe16c16b3fb103f893e64c5fb3ca.png; 2hf $INPUT_FILE_MD'
alias argmh2='rm $PATH_OUTPUT_LOCAL/html/example1-clearly-false-white-swan-simplified-2mapjs.html; 2hf $INPUT_FILE_MD2'
alias argmhmeta='rm $PATH_OUTPUT_LOCAL/html/example1-clearly-false-white-swan-simplified-meta-mapjs.html; 2hf $INPUT_FILE_MD_META'
alias argmp='rm $PATH_OUTPUT_LOCAL/example1-clearly-false-white-swan-simplified.pdf; md2pdf $INPUT_FILE_MD'
# TODO: simplify argmph call
alias argmph='rm $PATH_OUTPUT_LOCAL/example.pdf; rm $PATH_OUTPUT_LOCAL/header.tex; $PATH_DIR_ARGMAP_LUA/argmap2tikz.lua -i > $PATH_OUTPUT_LOCAL/header.tex; pandoc $INPUT_FILE_MD -o $PATH_OUTPUT_LOCAL/example.pdf --lua-filter pandoc-argmap.lua --pdf-engine lualatex --include-in-header $PATH_OUTPUT_LOCAL/header.tex --data-dir=$CONDA_PREFIX/share/pandoc; echo "Generated: $PATH_OUTPUT_LOCAL/example.pdf"'
alias argmf='rm $PATH_OUTPUT_LOCAL/html/example1-clearly-false-white-swan-simplified-1mapjs-fragment.html; md2htm $WORKSPACE/test/input/markdown/example1-clearly-false-white-swan-simplified-1mapjs.md'
alias argt='$WORKSPACE/test/test_scripts/tests.sh'
alias argth='$WORKSPACE/test/test_scripts/tests.sh html'

__init_tests() {
  COLOUR='true'
  TESTNUM=1
  FAILCOUNT=0 # count failed tests, also acts at return code at end; 0 = success

  COL_PASS=""
  COL_FAIL="<< "
  COL_RESET=""

  case "$TERM" in
  dumb)
    COLOUR='false'
    echo "Colour not supported by terminal."
    ;;
  *) ;;
  esac

  # Or try: if [ "$color_prompt" = yes ]; then
  if [ $COLOUR = 'true' ]; then
    echo "Colour supported"
    COL_PASS='\033[0;32m' # Green
    COL_FAIL='\033[0;31m' # Red
    COL_RESET='\033[0m'   # No Color
  fi

  mkdir --parent "$(dirname "$(getvar PATH_TEST_LOG)")"
}

check_var_value() {
  [[ $($1) == "$2" ]] &>/dev/null
}

# This function is not considered part of a public API, and therefore updates may change them without warning.
__test() {
  PRE="Test $TESTNUM:"
  echo -en "$PRE "

  # Could return pass/fail instead: return $returnValue (or alternatively would returnVariable work?)
  if "$@" >>"$(getvar PATH_TEST_LOG)"; then
    echo -e "${COL_PASS}Pass${COL_RESET}"
  else
    echo -e "$PRE ${COL_FAIL}Fail${COL_RESET}"
    FAILCOUNT=$((FAILCOUNT + 1))
  fi

  TESTNUM=$((TESTNUM + 1))
}

test_function() {
  func="$1"
  __test check_var_value "$func $4 $2" "$3"
}

# TODO add function to loop through pairs
test_getvar() {
  __init_tests
  func=getvar
  test_function "$func" bla "$([[ $? -eq 1 ]])"                                                                                          #1
  test_function "$func" bla.bla "$([[ $? -eq 1 ]])"                                                                                      #2
  test_function "$func" DIR_CONFIG config                                                                                                #3
  test_function "$func" PATH_FILE_CONFIG_ARGMAP_PROCESSED /home/s6mike/git_projects/argmap/config/processed/config-argmap-processed.yaml #4
  test_function "$func" PORT_DEV_SERVER 9001                                                                                             #5
  test_function "$func" PATH_DIR_MAPJS_ROOT /home/s6mike/git_projects/argmap/mapjs                                                       #6
  test_function "$func" DEFAULT_LANGUAGE en
  test_function "$func" DIR_OUTPUT output
  test_function "$func" PATH_OUTPUT_LOCAL /home/s6mike/git_projects/argmap/test/output
  test_function "$func" DIR_MAPJS_JSON mapjs-json #7
  test_function "$func" PATH_DIR_PUBLIC_MAPJS_JSON /home/s6mike/git_projects/argmap/test/output/mapjs-json
  test_function "$func" node "class: mapjs-node" #8
  test_function "$func" node.class mapjs-node    #9
  remember=$LIST_FILES_CONFIG_INPUT
  unset LIST_FILES_CONFIG_INPUT
  test_function "$func" LIST_FILES_CONFIG_INPUT \
    "/home/s6mike/git_projects/argmap/config/environment-argmap.yaml /home/s6mike/git_projects/argmap/config/config-argmap-paths.yaml /home/s6mike/git_projects/argmap/config/config-argmap.yaml /home/s6mike/git_projects/argmap/config/PRIVATE-environment-argmap.yaml /home/s6mike/git_projects/argmap/mapjs/config/environment-mapjs.yaml /home/s6mike/git_projects/argmap/mapjs/config/config-mapjs-paths.yaml /home/s6mike/git_projects/argmap/mapjs/config/config-mapjs.yaml" \
    "-l" #10-14
  LIST_FILES_CONFIG_INPUT=$remember
}

test_get_site_path() {
  __init_tests
  func=__get_site_path
  test_function "$func" test/input/markdown/2-maps-swan-donkey.md input/markdown/2-maps-swan-donkey.md
  test_function "$func" /home/s6mike/git_projects/argmap/test/input/markdown/2-maps-swan-donkey.md input/markdown/2-maps-swan-donkey.md
  test_function "$func" test/output/html/example1-clearly-false-white-swan-simplified-1mapjs-fragment.html output/html/example1-clearly-false-white-swan-simplified-1mapjs-fragment.html
}

export -f __init_tests check_var_value __test
export -f test_function test_getvar test_get_site_path
