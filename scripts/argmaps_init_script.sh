#!/usr/bin/env bash

echo "argmaps_init_script running from $(pwd)/scripts/"

source /home/s6mike/scripts/bash_aliases.sh
source /opt/miniconda3/bin/activate
conda activate argmaps

source "scripts/bash_aliases_argmap.sh"
