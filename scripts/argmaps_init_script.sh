#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# TODO: normal install shouldn't use conda, so should set up to give option for either

# TODO: should parameterize bash_aliases script path

# Needed for non-VSCode environments:
export WORKSPACE=${WORKSPACE:-/home/s6mike/git_projects/argmap}

source "$WORKSPACE/scripts/conda.env" # Get CONDA_ENV_ARGMAPS
source /home/s6mike/scripts/bash_aliases.sh
source /opt/miniconda3/bin/activate

# Order of setting variables then activating important?
#   create a (version-controlled) activate.cmd file in the root of the project directory that sets the environemnt variable(s) and then calls conda's own activate.bat script.
conda activate "$CONDA_ENV_ARGMAPS"

# Uses variable set in conda env, or defaults to pwd.
# TODO: this still isn't great, assumes you are in argmap folder when called.
#   Plus they will outlast any env deactivation
PROJECT_DIR=$(dirname "$WORKSPACE")
export PROJECT_DIR

export PANDOC_DATA_DIR="$CONDA_PREFIX/share/pandoc"

# TODO: Remove WP from variable names?
export MJS_WP_HOME="$WORKSPACE/mapjs-example"
# export MJS_WP_HOME="$WORKSPACE/mapjs"

# Uses config file in the relevant directory to identify mapjs based locations
# shellcheck source=/mapjs-example/scripts/mapjs.env
source "$MJS_WP_HOME/scripts/mapjs.env"
# # export MJS_OUTPUT_FILE="site/main.js"
# export MJS_OUTPUT_FILE="test/bundle.js"
# export MJS_WP_MAP="$WORKSPACE/examples/example.json"

export INPUT_FILE_YML=$WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.yml
export INPUT_FILE_MUP=$WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.mup
export INPUT_FILE_MD=$WORKSPACE/Input/Example1_ClearlyFalse_WhiteSwan_simplified.md
# export INPUT_FILE_JSON=$WORKSPACE/Output/Example1_ClearlyFalse_WhiteSwan_simplified.json

source "$WORKSPACE/scripts/bash_aliases_argmap.sh"

# Add pandoc bash completions
eval "$(pandoc --bash-completion)"

# Add Nodejs flags:
# Didn't fix type: json import error, leaving for reference.
# export NODE_OPTIONS="--experimental-modules --experimental-json-modules"
