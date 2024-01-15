#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

is_html="$1"
test_open_html=""

# Functions beginning with __ are not considered part of a public API, and therefore updates may change them without warning.
# make test

# Ensure Dev server running for tests. Start early since it takes a little while to get going.
# QUESTION: Any need to ensure its always running in dev mode?
# webpack_pack # Covered by `make all`

case $(getvar ENV) in
netlify)
  # TEMP fix: Removes symlink so that real output folder created instead
  #   TODO: Change so that only desired symlinks are created in first place
  #     QUESTION: e.g. just make output link?
  #   Should fix netlify output folder but might mean tests fail
  make public
  rm "$(getvar PATH_OUTPUT_PUBLIC)"
  test_open_html=false
  PORT_DEV_SERVER=9002
  ;;
*)
  test_open_html=true
  __check_config_read_echoes
  # Ensure everything built
  make site_clean
  make public
  # make all MODE := dev
  ;;
esac

export TARGET_DOMAIN=${2:-"http://localhost:$PORT_DEV_SERVER/"}

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
# TODO: Use test_function()
case $(getvar ENV) in
netlify) ;;
*)
  __test node -v "$(getvar NODE_VERSION)" #1
  if [ "$is_html" != html ]; then
    __test luarocks lint "$(__find_rockspec)"   #2 # Gets absolute path
    __test m2a "$(getvar INPUT_FILE_JSON)"      #3
    __test a2t "$(getvar INPUT_FILE_YML)"       #4
    __test a2mu "$(getvar INPUT_FILE_YML)"      #5
    __test a2m "$(getvar INPUT_FILE_YML)"       #6
    __test a2m "$(getvar INPUT_FILE_YML_NOTES)" #7
  fi
  ;;
esac

make "${PATH_FILE_MAPJS_HTML_DIST_TAGS}"
# npx --prefix "$(getvar MAPJS_NODE_MODULES_PREFIX)" wait-on --timeout 10000 "${PATH_FILE_MAPJS_HTML_DIST_TAGS}" && # Waits for file to finish being generated before running tests
# create html file needed for testcafe and rendering tests
# Following will fail if run before webpack has generated html partial from src/mapjs, but wait-on should ensure that never happens
make "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example1-clearly-false-white-swan-simplified.html"
make "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example1-clearly-false-white-swan-simplified-with-links.html"

# map rendering
#   TODO add var for webpack-dist-tags: PATH_FILE_MAPJS_HTML_DIST_TAGS

# Use wait-on --log if diagnostics needed (also verbose option)
# PATH_FILE_OUTPUT_EXAMPLE=$(getvar PATH_FILE_OUTPUT_EXAMPLE)
# export PATH_FILE_OUTPUT_EXAMPLE
# npx --prefix "$(getvar MAPJS_NODE_MODULES_PREFIX)" wait-on --timeout 3000 "$PATH_FILE_OUTPUT_EXAMPLE" &&
# If `__test_mapjs_renders()` fails, check log: `code $PATH_LOG_FILE_EXPECT`
# __test __test_mapjs_renders "$PATH_FILE_OUTPUT_EXAMPLE" #9

case $(getvar ENV) in
netlify) ;;
*)
  __test make HTML_OPEN="$test_open_html" KEEP_ORIGINAL=true "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example1-clearly-false-white-swan-simplified-1mapjs.html" #8 / 2
  __test make HTML_OPEN="$test_open_html" KEEP_ORIGINAL=true "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example1-clearly-false-white-swan-simplified-0mapjs.html" #9 / 3
  ;;
esac

case "$TARGET_DOMAIN" in
http://localhost:9002/)
  __test make HTML_OPEN="$test_open_html" KEEP_ORIGINAL=true "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example2-clearly-false-white-swan-v3.html" #_ / 4
  ;;
*)

  # Checks make dependency logic
  #   TODO: Use vars
  __test test_make_mapjs_dependencies "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example2-clearly-false-white-swan-v3.html" "mapjs/public/output/mapjs-json/example2-clearly-false-white-swan-v3.json" "$test_open_html" "$TARGET_DOMAIN" #10 / _ / 2
  # __test test_make_mapjs_dependencies "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example1-clearly-false-white-swan-simplified-2mapjs.html" mapjs/public/output/mapjs-json/example1-clearly-false-white-swan-simplified-2mapjs_argmap1.json "$test_open_html" "$TARGET_DOMAIN" #11 / _ / 3

  # For some reason test_make_mapjs_dependencies() seems to reset TARGET_DOMAIN, so re-exporting
  #   Although it might have been because I wasn't passing TARGET_DOMAIN to test_make_mapjs_dependencies(), so might not be an issue now
  TARGET_DOMAIN=${2:-"http://localhost:$PORT_DEV_SERVER/"}
  ;;
esac

__test make HTML_OPEN="$test_open_html" KEEP_ORIGINAL=true "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example1-clearly-false-white-swan-simplified-meta-mapjs.html" #11 / 5 / 3
__test make HTML_OPEN="$test_open_html" KEEP_ORIGINAL=true "$(getvar PATH_OUTPUT_HTML_PUBLIC)/example1-clearly-false-white-swan-simplified-2mapjs.html"     #12 / 6 / 4

case $(getvar ENV) in
netlify) ;;
*)
  # To make browser test visible, add 'head' as first arg
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.MAP_RENDERS)" "$TARGET_DOMAIN?keep_original=true"                                                                                 #13 / 7
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.NODE_CLICK)" "$TARGET_DOMAIN?keep_original=true"                                                                                  #14 / 8 left click
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.ADD_ROOT_PARENT)" "$TARGET_DOMAIN?keep_original=true"                                                                             #15 / 9
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.ADD_SUPPORTING)" "$TARGET_DOMAIN?keep_original=true"                                                                              #16 / 10
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.ADD_SUPPORTING_E2V3)" "$TARGET_DOMAIN/output/html/example2-clearly-false-white-swan-v3.html?keep_original=true"                   #17 / 11
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.BUTTON_ADD_LINK)" "$TARGET_DOMAIN?keep_original=true"                                                                             #18 / 12
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.EDIT_LINK_EXISTING)" "$TARGET_DOMAIN/output/html/example1-clearly-false-white-swan-simplified-with-links.html?keep_original=true" #19 / 13
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.ADD_IDEA)" "$TARGET_DOMAIN?keep_original=true"                                                                                    #20 / 14 add child button
  __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.BUTTON_UNDO_REDO)" "$TARGET_DOMAIN?keep_original=true"                                                                            #21 / 15 undo/redo button

  # These don't work
  # __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.KEYS_UNDO_REDO)"      # undo/redo keys fails in testcafe, first ctrl-z step didn't work.
  # __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.EDIT_FIRST_CHILD)"    # edit first child node
  # __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.BUTTON_ZOOM)"
  # __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.KEYS_ZOOM)"
  # __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.DELETE_GRANDCHILD)"
  # __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.EDIT_LINK_NEW)"
  # __test testcafe_run "$(getvar PATH_REPLAY_SCRIPT.EDIT_LINK_EXISTING_ALL_ATTRIBUTES)"
  # __test testcafe_run test/devtools-recordings/argmap-button-editlink-menu-error.json "$TARGET_DOMAIN?keep_original=true" # The specified selector does not match any element in the DOM tree. > | Selector('#linkEditWidget > input')
  # __test testcafe_run test/devtools-recordings/argmap-mouse-past-linkEditWidget-after-link-click.json "$TARGET_DOMAIN?keep_original=true" # The specified selector does not match any element in the DOM tree. > | Selector('#link_22_5 > path.mapjs-link-hit.noTransition')

  if [ "$is_html" != html ]; then
    __test make TARGET_DOMAIN="$TARGET_DOMAIN" "$(getvar PATH_OUTPUT_PUBLIC)/example1-clearly-false-white-swan-simplified-0mapjs.pdf" #22
  fi
  ;;
esac

echo "Testing finished, $(getvar FAILCOUNT) tests failed."
echo "If first html test failed, check whether webserver was running."
echo "If all testcafe test failed, check that $(getvar INPUT_FILE_JSON) exists."
echo "Test log location: $(getvar PATH_TEST_LOG)"

case $(getvar ENV) in
netlify) ;;
*)
  if [ "$is_html" != html ]; then
    # Check/update config
    __update_repo
  fi
  ;;
esac

exit "$FAILCOUNT"
