#!/usr/bin/env bash

# Functions beginning with __ are not considered part of a public API, and therefore updates may change them without warning.

# Ensure Dev server running for tests. Start early since it takes a little while to get going.
webpack_pack
__check_server_on

# Have switched rendering to be second test.
# Before moving to first, need to fix race condition with web server
# Ensure server running before runnig first html test.
#   TODO: Would be better to store the time here and then pause the difference before running html tests.
# sleep 1.5
# Or would this work?

echo 'Attempting to delete old test outputs.'

__clean_repo

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fix name

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

# This function is not considered part of a public API, and therefore updates may change them without warning.
__test() {
    PRE="Test $TESTNUM:"
    echo -en "$PRE "

    # Could return pass/fail instead: return $returnValue (or alternatively would returnVariable work?)
    if "$1" "$2" >>"$PATH_TEST_LOG"; then
        echo -e "${COL_PASS}Pass${COL_RESET}"
    else
        echo -e "$PRE ${COL_FAIL}Fail${COL_RESET}"
        FAILCOUNT=$((FAILCOUNT + 1))
    fi

    TESTNUM=$((TESTNUM + 1))
}

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

if [ "$1" != html ]; then
    __test a2m "$INPUT_FILE_YML"       #1
    __test a2m "$INPUT_FILE_YML_NOTES" #2
    __test m2a "$INPUT_FILE_JSON"      #3
    __test a2t "$INPUT_FILE_YML"       #4
    __test a2mu "$INPUT_FILE_YML"      #5
fi

# map rendering
# npx --prefix "$PATH_MJS_HOME" wait-on --timeout 5000 "$PATH_MJS_HOME/site/$PATH_OUTPUT_FILE_HTML" &&
npx --prefix "$PATH_MJS_HOME" wait-on --timeout 10000 "$WORKSPACE/includes/webpack-dist-tags.html" && # Waits for file to finish being generated before running tests
    # create html file needed for testcafe and rendering tests
    # Following will fail if run before webpack has generated html partial from src/mapjs, but wait-on should ensure that never happens

    # j2hf will still fail if json file missing, but it's part of repo.
    # TODO: add option for not opening the output, since this is just to set up tests.
    j2hf "$INPUT_FILE_JSON"
j2hf "$INPUT_FILE_JSON2"      # Dependency for recording PATH_REPLAY_SCRIPT_ADD_SUPPORTING_E2V3
j2hf "$INPUT_FILE_JSON_LINKS" # Dependency for recording PATH_REPLAY_SCRIPT_EDIT_LINK_EXISTING

__test md2hf "$INPUT_FILE_MD0" #6
# Use wait-on --log if diagnostics needed (also verbose option)
npx --prefix "$PATH_MJS_HOME" wait-on --timeout 3000 "$PATH_MJS_HOME/site/$PATH_OUTPUT_FILE_HTML" &&
    # If `__test_mapjs_renders()` fails, check log: `code $PATH_LOG_FILE_EXPECT`
    __test __test_mapjs_renders "$PATH_OUTPUT_FILE_HTML" #7
__test md2hf "$INPUT_FILE_MD"                            #8
__test md2hf "$INPUT_FILE_MD2"                           #9
__test md2hf "$INPUT_FILE_MD_META"                       #10

# To make browser test visible, add 'head' as first arg
__test testcafe_run "$PATH_REPLAY_SCRIPT_ADD_IDEA"            #11 add child button
__test testcafe_run "$PATH_REPLAY_SCRIPT_NODE_CLICK"          #12 left click
__test testcafe_run "$PATH_REPLAY_SCRIPT_BUTTON_UNDO_REDO"    #13 undo/redo button
__test testcafe_run "$PATH_REPLAY_SCRIPT_ADD_ROOT_PARENT"     #14
__test testcafe_run "$PATH_REPLAY_SCRIPT_ADD_SUPPORTING"      #15
__test testcafe_run "$PATH_REPLAY_SCRIPT_ADD_SUPPORTING_E2V3" #16
__test testcafe_run "$PATH_REPLAY_SCRIPT_BUTTON_ADD_LINK"     #17
__test testcafe_run "$PATH_REPLAY_SCRIPT_EDIT_LINK_EXISTING"  #18

# These don't work
# __test testcafe_run "$PATH_REPLAY_SCRIPT_KEYS_UNDO_REDO"      # undo/redo keys fails in testcafe, first ctrl-z step didn't work.
# __test testcafe_run "$PATH_REPLAY_SCRIPT_EDIT_FIRST_CHILD"    # edit first child node
# __test testcafe_run "$PATH_REPLAY_SCRIPT_BUTTON_ZOOM"
# __test testcafe_run "$PATH_REPLAY_SCRIPT_KEYS_ZOOM"
# __test testcafe_run "$PATH_REPLAY_SCRIPT_DELETE_GRANDCHILD"
# __test testcafe_run "$PATH_REPLAY_SCRIPT_EDIT_LINK_NEW"
# __test testcafe_run "$PATH_REPLAY_SCRIPT_EDIT_LINK_EXISTING_ALL_ATTRIBUTES"

if [ "$1" != html ]; then
    __test md2pdf "$INPUT_FILE_MD0" #19
fi

echo "Testing finished, $FAILCOUNT tests failed."
echo "If first html test failed, check whether webserver was running."
echo "If all testcafe test failed, check that $INPUT_FILE_JSON exists."
echo "Test cafe log location: $PATH_TEST_LOG"

exit $FAILCOUNT
