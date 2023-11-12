#!/usr/bin/env bash

# Functions beginning with __ are not considered part of a public API, and therefore updates may change them without warning.
# make test

# Ensure everything built
# make site_clean public
# make all MODE:=dev

# Ensure Dev server running for tests. Start early since it takes a little while to get going.
# QUESTION: Any need to ensure its always running in dev mode?
# webpack_pack # Covered by `make all`

case $(getvar ENV) in
netlify)
  # echo "PATH_TEST_LOG: $(getvar PATH_TEST_LOG)"
  ;;
*)
  webpack_server_start
  ;;
esac

# Have switched rendering to be second test.
# Before moving to first, need to fix race condition with web server
# Ensure server running before runnig first html test.
#   TODO: Would be better to store the time here and then pause the difference before running html tests.
# sleep 1.5
# Or would this work?

# echo 'Attempting to delete old test outputs.'

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fix name
# __clean_repo # Covered by `make site_clean`
__init_tests

# todo turn these into an array
# array0=(one two three four five six)
# for i in "${array0[@]}"; do
#     echo "$i"
# done
# or
# for Variable in {1..3}
# do
#     echo "$Variable"
# done
# or could loop through files in a folder
# for test/output in $(ls)
# do
#     cat "$test/output"
# done

echo "ENV: $(getvar ENV)"
echo "INPUT_FILE_YML: $(getvar INPUT_FILE_YML)"
echo "INPUT_FILE_JSON: $(getvar INPUT_FILE_JSON)"

# TODO: Use test_function()
if [ "$1" != html ]; then
  case $(getvar ENV) in
  netlify) ;;
  *)
    __test luarocks lint "$(__find_rockspec)" #1 # Gets absolute path
    __test m2a "$(getvar INPUT_FILE_JSON)"    #2
    __test a2t "$(getvar INPUT_FILE_YML)"     #3
    __test a2mu "$(getvar INPUT_FILE_YML)"    #4

    npx --prefix "$(getvar PATH_DIR_MAPJS_ROOT)" wait-on --timeout 10000 "${PATH_FILE_MAPJS_HTML_DIST_TAGS}" && # Waits for file to finish being generated before running tests
      # create html file needed for testcafe and rendering tests
      # Following will fail if run before webpack has generated html partial from src/mapjs, but wait-on should ensure that never happens

      # j2hf will still fail if json file missing, but it's part of repo so that shouldn't happen.
      2hf -pq "$(getvar INPUT_FILE_JSON)"
    2hf -pq "$(getvar INPUT_FILE_JSON2)"      # Dependency for recording PATH_REPLAY_SCRIPT_ADD_SUPPORTING_E2V3
    2hf -pq "$(getvar INPUT_FILE_JSON_LINKS)" # Dependency for recording PATH_REPLAY_SCRIPT_EDIT_LINK_EXISTING

    ;;
  esac

  __test a2m "$(getvar INPUT_FILE_YML)"       #6/1
  __test a2m "$(getvar INPUT_FILE_YML_NOTES)" #7/2
fi

# map rendering
#   TODO add var for webpack-dist-tags: PATH_FILE_MAPJS_HTML_DIST_TAGS

# Use wait-on --log if diagnostics needed (also verbose option)
# PATH_FILE_OUTPUT_EXAMPLE=$(getvar PATH_FILE_OUTPUT_EXAMPLE)
# export PATH_FILE_OUTPUT_EXAMPLE
# npx --prefix "$(getvar PATH_DIR_MAPJS_ROOT)" wait-on --timeout 3000 "$PATH_FILE_OUTPUT_EXAMPLE" &&
# If `__test_mapjs_renders()` fails, check log: `code $PATH_LOG_FILE_EXPECT`
# __test __test_mapjs_renders "$PATH_FILE_OUTPUT_EXAMPLE" #9
__test 2hf "$(getvar INPUT_FILE_MD)"      #8/3
__test 2hf "$(getvar INPUT_FILE_MD2)"     #10
__test 2hf "$(getvar INPUT_FILE_MD_META)" #11

# To make browser test visible, add 'head' as first arg
__test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_NODE_CLICK)"          #12 left click
__test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_ADD_ROOT_PARENT)"     #13
__test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_ADD_SUPPORTING)"      #14
__test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_ADD_SUPPORTING_E2V3)" #15
__test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_BUTTON_ADD_LINK)"     #16
__test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_EDIT_LINK_EXISTING)"  #17
__test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_ADD_IDEA)"            #18 add child button
__test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_BUTTON_UNDO_REDO)"    #19 undo/redo button

# These don't work
# __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_KEYS_UNDO_REDO)"      # undo/redo keys fails in testcafe, first ctrl-z step didn't work.
# __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_EDIT_FIRST_CHILD)"    # edit first child node
# __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_BUTTON_ZOOM)"
# __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_KEYS_ZOOM)"
# __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_DELETE_GRANDCHILD)"
# __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_EDIT_LINK_NEW)"
# __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT_EDIT_LINK_EXISTING_ALL_ATTRIBUTES)"

if [ "$1" != html ]; then
  __test md2pdf "$(getvar INPUT_FILE_MD0)" # 20
fi

echo "Testing finished, $(getvar FAILCOUNT) tests failed."
echo "If first html test failed, check whether webserver was running."
echo "If all testcafe test failed, check that $(getvar INPUT_FILE_JSON) exists."
echo "Test log location: $(getvar PATH_TEST_LOG)"

case $(getvar ENV) in
netlify)
  # echo "PATH_TEST_LOG: $(getvar PATH_TEST_LOG)"
  ;;
*)
  if [ "$1" != html ]; then
    # Check/update config
    __update_repo
  fi
  ;;
esac

# make clean

exit "$FAILCOUNT"
