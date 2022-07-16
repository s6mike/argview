#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# TODO: normal install shouldn't use conda, so should set up to give option for either

# TODO: should parameterize bash_aliases script path
source "scripts/conda.env" # Get CONDA_ENV_ARGMAPS
source /home/s6mike/scripts/bash_aliases.sh
source /opt/miniconda3/bin/activate

# Order of setting variables then activating important?
#   create a (version-controlled) activate.cmd file in the root of the project directory that sets the environemnt variable(s) and then calls conda's own activate.bat script.
conda activate "$CONDA_ENV_ARGMAPS"

# Uses variable set in conda env, or defaults to pwd.
# TODO: this still isn't great, assumes you are in argmap folder when called.
#   Plus they will outlast any env deactivation
export PROJECT_DIR=${GIT_PROJECT_DIR:-$(dirname "$(pwd)")}

export PANDOC_DATA_DIR="$CONDA_PREFIX/share/pandoc"

export WORKSPACE="$PROJECT_DIR/argmap"
export MJS_WP_HOME="$PROJECT_DIR/mapjs-webpack-example"
export MJS_WP_MAP="$MJS_WP_HOME/src/example-map.json"

source "$WORKSPACE/scripts/bash_aliases_argmap.sh"

# Add pandoc bash completions
eval "$(pandoc --bash-completion)"
