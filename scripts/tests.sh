#!/usr/bin/env bash

echo 'Attempting to delete old test outputs.'

rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.yml"
rm "$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
TEST=1

test() {
    PRE="Test $TEST:"
    echo -en "$PRE "

    # Could return pass/fail instead: return $returnValue (or alternatively would returnVariable work?)
    if "$1" "$2" >/dev/null; then
        echo -e "${GREEN}Pass${NC}"
    else
        echo -e "$PRE ${RED}Fail${NC}"
    fi

    TEST=$((TEST + 1))
}

# todo Delete old gdrive file
# 1uU7_yfAwMPV3a0lxpiXoVR-m0hbX2Pzs
# Though may not be consistently same name anyway, would need to create with fix name

TEST_FILE_YML="Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml"
TEST_FILE_MUP="Output/Example1_ClearlyFalse_WhiteSwan_simplified.mup"

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
test a2m $TEST_FILE_YML
test m2a $TEST_FILE_MUP
test a2mu $TEST_FILE_YML
test a2mo $TEST_FILE_YML

echo 'Testing finished.'
