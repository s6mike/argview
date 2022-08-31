#!/usr/bin/env bash

# Script to run for each git bisect iteration:
# git bisect run ~/scripts/argmap_test_scripts/mapjs_bisect_testcafe.sh

# First time only
# npm run start

# Bisect Setup
# ------------

# Want stash files to be absolute minimum to avoid merge conflicts
# This stops bisect if apply breaks (125 to skip commit and continue testing)
#  Alternative to stash apply: https://workflowy.com/#/c1fcaad78669
PATH_SCRIPT=$DIR_PROJECTS/argmap/test/devtools-recordings/add_idea.json

git stash apply || exit 255
npm install
npm exec

# "testc": "npm run test-cafe",
# "test-start": "npm run start && npm run test-cafe",
# "stop": "killall node",
# "start": "npm run pack && webpack-dev-server &",
# "test-cafe": "testcafe 'chrome:headless --no-default-browser-check' $DIR_PROJECTS/argmap/test/devtools-recordings/Add_supporting_group.json",
# "pack": "webpack",
#  "server": "webpack-dev-server"

# git add -u

# TODO: Ideally want to read node_count_before and pass it into the JSON script as a variable to compare it to.
#   See https://workflowy.com/#/33d0bdfaf875
# node_count_before = document.getElementsByClassName('mapjs-node').length

# Run Test
# --------

# Better to use exec since not dependent on package.json
# testcafe 'chrome:headless --no-default-browser-check' $DIR_PROJECTS/argmap/test/devtools-recordings/Add_supporting_group.json
npm exec testcafe 'chrome:headless --no-default-browser-check' "$PATH_SCRIPT"
status=$?

wait

# Included in test (expecting 14):
# node_count_after = document.getElementsByClassName('mapjs-node').length
# exit if node_count_after > node_count_before then 0 else 1

# Bisect Teardown
# ---------------
git reset --hard

# Return test result
exit "$status"

# After fix:
# ----------

# Review bisect log
# git bisect log >../bisect_log.txt

# Repeat bisect
# Edit log, then:
# git bisect reset
# git bisect replay ../bisect_log.txt

# Get diff of staging area vs prev commit
# git add -u
# git stash -u -m "cumulative-fixes"
# git diff --cached >../diffs/mapjs_cumulative_fixes.diff
