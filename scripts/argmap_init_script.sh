#!/usr/bin/env bash
# shellcheck disable=SC2034
# Turns off unused variable warning, since exports are implicit due to set -o allexport

echo "Running ${BASH_SOURCE[0]}"

# set -o errexit                                       # Stops on error
shopt -s nullglob globstar                           # Stops * matching null
set -o nounset                                       # Warning if var unset. This shouldn't be used below bash 4.4 because empty arrays count as unset
set -o pipefail                                      # with pipefail enabled, the pipeline's status is set to the exit status of the last command to exit with a non-zero status, rather than the last overall command.
if [[ "${TRACE-0}" == "1" ]]; then set -o xtrace; fi # call `TRACE=1 ./script.sh` to activate debug mode

# From https://medium.com/@dirk.avery/the-bash-trap-trap-ce6083f36700
#   Didn't work with __get_site_path() exit
# trap 'catch $? $LINENO' EXIT
# catch() {
#   echo "catching!"
#   if [ "$1" != "0" ]; then
#     # error handling goes here
#     echo "Error $1 occurred on $2"
#   fi
# }

# cd "$(dirname "$0/..")" # Sets current directory to match script - this breaks everything!

init_config() {
  set -o allexport
  # Needed to access envsubst from config_read_functions.lib.sh
  #   TODO: Add envsubst install to makefile
  #   QUESTION: install envsubst somewhere more convenient?
  PATH="/opt/miniconda3/envs/argmap/bin:$PATH"
  PATH_FILE_ARGMAP_DOT_ENV=config/argmap.env
  PATH_FILE_ARGMAP_DOT_ENV_DEFAULT=config/argmap-defaults.env
  make "$PATH_FILE_ARGMAP_DOT_ENV"
  source "$PATH_FILE_ARGMAP_DOT_ENV"

  case $ENV in

  netlify)
    # brew --cache -s "lua@5.3"
    # # PATH_CACHE=/opt/build/cache/argmap
    # # mkdir --parent "$PATH_CACHE"
    # # ls "$PATH_CACHE"
    # # ls "$PATH_CACHE/node_modules"
    # # ls "${MAPJS_NODE_MODULES_PREFIX}/node_modules"
    # PATH_DIR_MAPJS_ROOT=mapjs
    # MAPJS_NODE_MODULES_PREFIX=${PATH_DIR_MAPJS_ROOT}
    # PATH_OUTPUT_JS=${PATH_DIR_MAPJS_ROOT}/public/js
    # PATH_FILE_MAPJS_HTML_DIST_TAGS=src/layouts/includes/webpack-dist-tags.html

    # make ${PATH_DIR_MAPJS_ROOT}/node_modules
    # make ${PATH_OUTPUT_JS}/main.js

    # exit
    ;;
  *)
    # TODO: normal install shouldn't use conda, so should set up to give option for eitherPATH_OUTPUT_JS
    #   ISSUE: conda needed for pandoc, so this should be set up before reading yaml
    #     Not sure if this is fixing pandoc's conda dependency
    CONDA_ENV_ARGMAP="${CONDA_ENV_ARGMAP:-argmap}"
    ;;
  esac
  set +o allexport

  echo "ENV|MODE: $ENV|$MODE"

  # shellcheck source=/home/s6mike/.bashrc
  case $ENV in

  netlify)
    make "${PATH_FILE_YQ}" pandoc
    ;;
  *)
    source "$PATH_DIR_SCRIPTS/app_install.lib.sh"
    source "$HOME/.bashrc"
    # source=/home/s6mike/scripts/default_vscode_init_script.sh # Stops shellcheck lint error
    # source "$HOME/scripts/default_vscode_init_script.sh"
    ;;
  esac

  # For trying stuff:
  #   source "$PATH_ARGMAP_ROOT/scripts/experiment.sh"

  # shellcheck source=/home/s6mike/git_projects/argmap/scripts/init_read_config.sh
  source "$PATH_DIR_SCRIPTS/init_read_config.sh"
} # End init_config

init_apps() {
  # TODO remove stuff covered by `init_read_config.sh`
  #   QUESTION: Why not using getvar() ?
  # Needed for argmap.env tmp chrome profile:
  set -o allexport
  DIR_PROJECTS=${DIR_PROJECTS:-$(dirname "$PATH_ARGMAP_ROOT")}
  PATH_MISC_DEV=$DIR_PROJECTS/misc
  PATH_BIN_GLOBAL=${PATH_BIN_GLOBAL:-$(getvar PATH_BIN_GLOBAL)}
  set +o allexport

  # shellcheck disable=SC1091
  source "$PATH_DIR_SCRIPTS/bash_aliases_mapjs.sh"

  # QUESTION move to end of file?
  set -o allexport

  # Adds lua folder to start of PATH so lua files called from there instead of /opt/miniconda3/envs/argmap/bin/argmap2mup
  #  QUESTION: Combine these?
  # PATH_DIR_ARGMAP_SRC="$(getvar PATH_DIR_ARGMAP_SRC)"
  # PATH_DIR_ARGMAP_LUA="$PATH_DIR_ARGMAP_SRC/lua"

  # echo "Updating PATH"
  # QUESTION: add this to .env / netlify env instead?
  PATH="$(getvar PATH_ADD_PATH):$PATH"

  # PANDOC - needed for pandoc-argamp.lua until lua reads config directly
  PATH_INCLUDES_ARGMAP_CONTAINER_DEFAULT=$(getvar PATH_INCLUDES_ARGMAP_CONTAINER_DEFAULT || getvar PATH_INCLUDES_ARGMAP_CONTAINER)
  LUA_PATH=$(getvar LUA_PATH)
  # Not sure if this is needed:
  LUA_CPATH=$(getvar LUA_CPATH)
  PATH_TEST_LOG=$(getvar PATH_TEST_LOG)
  PATH_DIR_MAPJS_ROOT=$(getvar PATH_DIR_MAPJS_ROOT)
  MAPJS_NODE_MODULES_PREFIX=$(getvar MAPJS_NODE_MODULES_PREFIX)
  PATH_LUA_MODULES=$(getvar PATH_LUA_MODULES)
  set +o allexport

  # Covered by default init script
  # shellcheck source=/home/s6mike/scripts/bash_aliases.sh # Stops shellcheck lint error
  # source "$HOME/scripts/bash_aliases.sh"
  # source /opt/miniconda3/bin/activate

  # Order of setting variables then activating important?
  #   create a (version-controlled) activate.cmd file in the root of the project directory that sets the environemnt variable(s) and then calls conda's own activate.bat script.
  # conda activate "$CONDA_ENV_ARGMAP"

  # QUESTION: Add cleanup function?
  #   https://stackoverflow.com/questions/4632028/how-to-create-a-temporary-directory#answer-34676160

  # Uses config file in the relevant mapjs directory to get correct mapjs paths
  # shellcheck source=/mapjs/scripts/mapjs.env # Stops shellcheck lint error
  source "$(getvar PATH_DIR_MAPJS_ROOT)/scripts/mapjs.env"
  source "$PATH_ARGMAP_ROOT/scripts/bash_aliases_argmap.sh"

  # Add pandoc bash completions
  eval "$(pandoc --bash-completion)"

  # tabtab source for netlify package
  # uninstall by removing these lines

  # shellcheck source=/dev/null
  # shellcheck disable=SC2015
  [ -f ~/.config/tabtab/__tabtab.bash ] && . ~/.config/tabtab/__tabtab.bash || true

  # Add Nodejs flags:
  # Didn't fix type: json import error, leaving for reference.
  # export NODE_OPTIONS="--experimental-modules --experimental-json-modules"

  # shellcheck source=/home/s6mike/git_projects/argmap/test/test_scripts/bash_aliases_argmap_test.sh
  case $ENV in

  netlify)
    set -o allexport
    PATH_SHARE_GLOBAL=$(getvar PATH_SHARE_GLOBAL)
    # PATH_CACHE=$(getvar PATH_CACHE)
    set +o allexport
    make install
    # find . -type f -name yaml.so
    # find . -name libyaml.so
    ;;
  *) ;;
  esac
}

export_vars() {
  set -o allexport

  PATH_PUBLIC=$(getvar PATH_PUBLIC)
  PATH_INPUT_PUBLIC=$(getvar PATH_INPUT_PUBLIC)
  PATH_OUTPUT_PUBLIC=$(getvar PATH_OUTPUT_PUBLIC)
  PATH_LUA_LOCAL=$(getvar PATH_LUA_LOCAL)
  PATH_PANDOC_LOCAL=$(getvar PATH_PANDOC_LOCAL)
  PATH_TEST=$(getvar PATH_TEST)

  case $ENV in

  netlify) ;;
  *)
    # Not needed by netlify:
    #   QUESTION: Any more?
    # NODE_PATH=${NODE_PATH:-$(getvar NODE_PATH)}:NODE_PATH
    PATH_FILE_CONVERT_LOCAL=$(getvar PATH_FILE_CONVERT_LOCAL)
    PATH_FILE_CONVERT_GLOBAL=$(getvar PATH_FILE_CONVERT_GLOBAL)
    PATH_FILE_GDRIVE_LOCAL=$(getvar PATH_FILE_GDRIVE_LOCAL)
    PATH_BIN_LOCAL=$(getvar PATH_BIN_LOCAL)
    PATH_ENVIRONMENT_GLOBAL=$(getvar PATH_ENVIRONMENT_GLOBAL)
    PATH_BIN_GLOBAL=$(getvar PATH_BIN_GLOBAL)
    PATH_PANDOC_GLOBAL=$(getvar PATH_PANDOC_GLOBAL)
    PATH_LUA_GLOBAL=$(getvar PATH_LUA_GLOBAL)
    ;;
  esac

  # TODO: rename orig var to PATH_LUA_ARGMAP
  PATH_LUA_ARGMAP=$(getvar PATH_DIR_ARGMAP_LUA)

  # make site dependencies:
  PATH_DIR_MAPJS_ROOT=$(getvar PATH_DIR_MAPJS_ROOT)
  PATH_FILE_OUTPUT_EXAMPLE=$(getvar PATH_FILE_OUTPUT_EXAMPLE)
  PATH_FILE_OUTPUT_EXAMPLE2_COMPLEX=$(getvar PATH_FILE_OUTPUT_EXAMPLE2_COMPLEX)
  PATH_OUTPUT_JS=$(getvar PATH_OUTPUT_JS)

  # For `webpack-dist-tags.html` generation.
  PATH_FILE_MAPJS_HTML_DIST_TAGS=$(getvar PATH_FILE_MAPJS_HTML_DIST_TAGS)

  # For cleaning html output
  PATH_OUTPUT_HTML_PUBLIC=$(getvar PATH_OUTPUT_HTML_PUBLIC)
  PATH_OUTPUT_MAPJS_PUBLIC=$(getvar PATH_OUTPUT_MAPJS_PUBLIC)
  PATH_INPUT_LOCAL=$(getvar PATH_INPUT_LOCAL)
  PATH_OUTPUT_LOCAL=$(getvar PATH_OUTPUT_LOCAL)
  set +o allexport
} # end export_vars

make_rest() {
  # Calling make site from here because environment vars seem to get lost otherwise
  case $ENV in
  netlify)
    if [ "$(getvar TEST_SITE_DEPLOY)" = "true" ]; then
      # TODO: would rather only call this when make test called, but not sure how
      source "$PATH_ARGMAP_ROOT/test/test_scripts/bash_aliases_argmap_test.sh"
      make test
    fi
    make site
    ;;
  *)
    # TODO: would rather only call this when make test called, but not sure how
    source "$PATH_ARGMAP_ROOT/test/test_scripts/bash_aliases_argmap_test.sh"
    # QUESTION: Better to define above variables as part of make call instead of exporting them?
    make all # --warn-undefined-variables, -d for debugging
    ;;
  esac
}

init_config
init_apps
export_vars
make_rest

# QUESTION: Do this?
# main() {
#     Put whole script in here
# }

# main "$@"

# exit 0
