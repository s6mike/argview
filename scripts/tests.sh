#!/usr/bin/env bash

echo 'Attempting to delete old test outputs.'

TEST_FILE_YML=$WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml
TEST_FILE_MUP=$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup
TEST_FILE_MD=$WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.md

rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml"
rm "$WORKSPACE/Output/example.html"
rm "$TEST_FILE_MUP"
rm "$MJS_WP_MAP"

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fix name

COLOUR='true' # true
TESTNUM=1
FAILCOUNT=0 #count failed tests, also acts at return code at end; 0 = success

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

if [ $COLOUR = 'true' ]; then
    echo "Colour supported"
    COL_PASS='\033[0;32m' # Green
    COL_FAIL='\033[0;31m' # Red
    COL_RESET='\033[0m'   # No Color
fi

test() {
    PRE="Test $TESTNUM:"
    echo -en "$PRE "

    # Could return pass/fail instead: return $returnValue (or alternatively would returnVariable work?)
    if "$1" "$2" >/dev/null; then
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
# for Output in $(ls)
# do
#     cat "$Output"
# done
test a2m "$TEST_FILE_YML"
test m2a "$TEST_FILE_MUP"
test a2t "$TEST_FILE_YML"
test a2mu "$TEST_FILE_YML"
test a2mo "$TEST_FILE_YML"
test md2htm "$TEST_FILE_MD"
test md2pdf "$TEST_FILE_MD"

echo "Testing finished, $FAILCOUNT tests failed."

exit $FAILCOUNT
