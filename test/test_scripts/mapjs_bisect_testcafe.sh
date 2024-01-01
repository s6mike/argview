#!/usr/bin/env bash

# Script to run for each git bisect iteration (or use alias bru or bre):
# git bisect run ~/scripts/argmap_test_scripts/mapjs_bisect_testcafe.sh

# Otherwise, first time only (or use alias wss):
# npm exec webpack-dev-server

# Bisect Setup
# ------------

bash_aliases_argmap.sh
# shellcheck source=/home/s6mike/scripts_links/argmap_scripts/bash_aliases_mapjs.sh
source "$HOME/scripts_links/argmap_scripts/bash_aliases_mapjs.sh"

TEST_MODE=false      # false allows git commands to remove any changes.
APPLY_PATCH=true     # false stops patch being applied
VALIDATE_PATCH=false # false skips the check that patch needs to work
KEEP_PATCHES=false   # git reset will only happen if this and TEST_MODE is false, and if APPLY_PATCH is true.
REBUILD=true         # false stops webserver stop, install, webserver start
SERVER_CHECK=false   # false stops browser being opened after rendering fails.
PATH_BISECT_PATCH_FILE=${PATH_BISECT_PATCH_FILE:-"$DIR_PROJECTS/diffs/all_mapjs_fixes_latest.diff"}
BISECT_START_TIMESTAMP=${BISECT_START_TIMESTAMP:-$(date "+%Y.%m.%d-%H.%M.%S")}

# Add Hotfixes
# ------------

# Can use stash or diff file, currently using diff.
# Example diff to generate new patch file:
#   git diff --no-color e30f8d835e028febe2e951e422c313ac304a0431 HEAD -- . ':(exclude)package-lock.json' ':(exclude).gitignore' ':(exclude)docs/CHANGELOG-mapjs.md' > ../all_mapjs_fixes_3_3_8.diff

# These files are problematic and not being present can break things:
#   scripts/mapjs.env
#   .vscode/settings.json
# Can add them to work area but not staging and git reset --hard won't remove them.

# This stops bisect if apply breaks (125 to skip commit and continue testing)
#  Alternative to stash apply: https://workflowy.com/#/c1fcaad78669

# Ensures bisect log is updated each iteration.
git bisect log >"$PATH_BISECT_LOG"

if [ "$APPLY_PATCH" = true ]; then # Only runs if applying patch file.

  if [ "$TEST_MODE" = false ]; then # Only runs if not in test mode

    # if git stash apply; then
    # -v to get verbose feedback

    # Reject allows each patch to be applied independently of success/fails of rest
    # if git apply -v --ignore-whitespace --3way "$PATH_BISECT_PATCH_FILE"; then
    if git apply -v --ignore-whitespace --reject "$PATH_BISECT_PATCH_FILE"; then
      echo "'git apply patch' successful."
    else

      if [ "$VALIDATE_PATCH" = true ]; then
        echo "'git apply patch' failed, exit 255 (abort bisect)"
        exit 255
      else
        echo "'git apply patch' failed, continuing anyway."
      fi

    fi

  fi

fi

# Build
#------

# Should now be available to source
# shellcheck source=/home/s6mike/git_projects/mapjs-git-bisect/scripts/git-bisect.env # Stops shellcheck lint error
source "$DIR_PROJECTS/mapjs-git-bisect/scripts/git-bisect.env"

if [ "$REBUILD" = true ]; then # Only runs if not in test mode
  # webpack_build
  node_stop

  if [ "$TEST_MODE" = false ]; then # Only runs if not in test mode
    npm install --prefix "$(getvar MAPJS_NODE_MODULES_PREFIX)" --legacy-peer-deps
  fi

  npm run --prefix "$(getvar MAPJS_NODE_MODULES_PREFIX)" start &
  # PID=$!

  # wait $!
  sleep 1.5
fi

# TODO: Ideally want to read node_count_before and pass it into the JSON script as a variable to compare it to.
#   See https://workflowy.com/#/33d0bdfaf875

# TODO: Read class from config file: node.class
# node_count_before = document.getElementsByClassName('mapjs-node').length

# Run Test
# --------

# Pre-test: Does page load?

# Check url:
# check_url '' || exit_status=125
# if [ $exit_status == 125 ]; then
#   echo "Page unavailable, setting exit exit_status to 125"

# Pre-test: Do any elements render?
# shellcheck disable=SC2119 # No arguments needed, all defaults

__test_mapjs_renders
rendered=$?

echo "rendered: $rendered"
case $rendered in
0)
  echo "Render test succeeded, running testcafe script: $PATH_REPLAY_SCRIPT"
  if [ "$PATH_REPLAY_SCRIPT" == "" ]; then
    echo "No TestCafe PATH_REPLAY_SCRIPT set, setting exit status to 255 (bisect abort)"
    exit_status=255
    exit 255 # exits without git reset
  else
    npm exec testcafe 'chrome:headless --no-default-browser-check' "$PATH_REPLAY_SCRIPT" >>"$DIR_PROJECTS/mapjs-git-bisect/git-bisect-logs/$BISECT_START_TIMESTAMP-testcafe-output.txt"
    exit_status=$?
  fi
  ;;

127)
  exit_status=255
  echo "__test_mapjs_renders failure 127: command not found, setting exit status to 255 (bisect abort)"
  ;;

*)
  exit_status=125
  echo "Rendering test failed, setting exit status to 125 (bisect skip). Is server running? Try 'wss.'"

  if [ "$SERVER_CHECK" = true ]; then # Only opens browser if true
    # Sanity check rendering in browser
    # shellcheck disable=SC2119 # No arguments needed, all defaults
    open-server
  fi
  ;;

esac

# Bisect Teardown
# ---------------

# Only resets if not in test mode
if [ "$TEST_MODE" = false ] && [ "$KEEP_PATCHES" = false ]; then # Won't in test mode
  git reset --hard
  git clean -f
fi

# Return test result
echo "bisect exit status: $exit_status"
exit "$exit_status"
