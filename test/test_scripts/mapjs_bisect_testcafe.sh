#!/usr/bin/env bash

# Script to run for each git bisect iteration (or use alias bru or bre):
# git bisect run ~/scripts/argmap_test_scripts/mapjs_bisect_testcafe.sh

# First time only (or use alias wss):
# npm exec webpack-dev-server

# Bisect Setup
# ------------

# QUESTION can I move these two commands outside of this script into calling function?
# export PATH_REPLAY_SCRIPT=$DIR_PROJECTS/argmap/test/devtools-recordings/add_idea.json

# source /home/s6mike/scripts/bash_aliases.sh                      # Functions to ensure clean build.
# source /home/s6mike/scripts/argmap_scripts/bash_aliases_mapjs.sh # Function to test rendering.

TEST_MODE=false # false allows git commands to remove any changes.

BISECT_START_TIMESTAMP=${BISECT_START_TIMESTAMP:-$(date "+%Y.%m.%d-%H.%M.%S")}

# Add Hotfixes
# ------------

# Want stash files to be absolute minimum to avoid merge conflicts
# This stops bisect if apply breaks (125 to skip commit and continue testing)
#  Alternative to stash apply: https://workflowy.com/#/c1fcaad78669

# Current latest stash fix: All mapjs fixes up to toolbar
#   /home/s6mike/git_projects/all_mapjs_fixes_to_toolbar.diff
# Does package.json use 'webpack-dev-server': '^2.4.1'?
# Has start.js alert but changed to console error? Not essential
# stash@{0}: On (no branch): package.json version, start.js alert
# map-model.js _ fix
# toolbar fix

if [ "$TEST_MODE" = false ]; then # Only runs if not in test mode

  if git stash apply; then
    echo "'git stash apply' successful."
  else
    echo "'git stash apply' failed, exit 255 (abort bisect)"
    exit 255
  fi

fi

# Build
#------

# webpack_build
if [ "$TEST_MODE" = false ]; then # Only runs if not in test mode
  npm install --prefix "$PATH_MJS_HOME" --legacy-peer-deps
fi

# webpack_server_start # Dev server should already be started
# git add -u

# TODO: Ideally want to read node_count_before and pass it into the JSON script as a variable to compare it to.
#   See https://workflowy.com/#/33d0bdfaf875
# node_count_before = document.getElementsByClassName('mapjs-node').length

# Included in test (expecting 14):
# node_count_after = document.getElementsByClassName('mapjs-node').length
# exit if node_count_after > node_count_before then 0 else 1

# Run Test
# --------

# Pre-test: Does page load?

# Check url:
# check_url '' || exit_status=125

# if [ $exit_status == 125 ]; then
#   echo "Page unavailable, setting exit exit_status to 125"
# else

# Pre-test: Do any elements render?
__test_mapjs_renders
rendered=$?

if [ $rendered = 0 ]; then # headless chrome fails to render any map nodes
  # Run main test
  echo "Render test succeeded, running testcafe script: $PATH_REPLAY_SCRIPT"
  if [ "$PATH_REPLAY_SCRIPT" == "" ]; then
    echo "No TestCafe PATH_REPLAY_SCRIPT set, setting exit status to 255 (bisect abort)"
    exit_status=255
    exit 255 # exits without git reset
  else
    npm exec testcafe 'chrome:headless --no-default-browser-check' "$PATH_REPLAY_SCRIPT" >>"../git-bisect-logs/$BISECT_START_TIMESTAMP-testcafe-output.txt"
    exit_status=$?
  fi
else # render succeeds
  exit_status=125
  echo "Rendering test failed, setting exit status to 125 (bisect skip)."
fi

# Bisect Teardown
# ---------------

# node_stop
# This is necessary to allow checkout to work for next bisect step:

# Only resets if not in test mode
if [ "$TEST_MODE" = false ]; then # Won't in test mode
  git reset --hard
fi

# Return test result
echo "bisect exit status: $exit_status"
exit "$exit_status"

# After fix:
# ----------

# Review bisect log
# git bisect log >../git-bisect-logs/git_bisect_log_"$(basename --suffix=".json" "$PATH_REPLAY_SCRIPT")".txt

# Repeat bisect
# git bisect log >../git-bisect-logs/git_bisect_log_"$(basename --suffix=".json" "$PATH_REPLAY_SCRIPT")".txt
# Edit log, then:
# git bisect reset
# git bisect replay ../git-bisect-logs/git_bisect_log_"$(basename --suffix=".json" "$PATH_REPLAY_SCRIPT")".txt
# git bisect run ~/scripts/argmap_test_scripts/mapjs_bisect_testcafe.sh

# Get diff of staging area vs prev commit
# git add -u
# git stash -u -m "cumulative-fixes"
# git diff --cached >../mapjs_cumulative_fixes.diff
