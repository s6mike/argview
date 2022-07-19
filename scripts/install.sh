#!/usr/bin/env bash

# SECTION 1:
# ----------

# TODO: normal install shouldn't use conda, so should set up to give option for either
# ie  INSTALL_ROOT=$CONDA_PREFIX||X or similar.

# Download/install git folder?

export CONDA_ENV_ARGMAPS="argmap"
export XDG_DATA_HOME="$CONDA_PREFIX/share/"

# TODO Just run conda env script?
# if in folder with environment.yml
# conda env create
# Else:
# conda env create -f environment.yml
# Or:
# conda env update --file environment.yml --prune --name $CONDA_ENV_ARGMAPS

# conda activate $CONDA_ENV_ARGMAPS

# SECTION 2:
# ----------

# If installing from environment.yml, skip to SECTION 3.

# TODO: check whether these are already installed
# conda install lua5.3

# conda install -c anaconda-platform luarocks

# TODO for conda, run command to add conda env as dependencies directory (for lib yaml etc) to end of config file: $CONDA_PREFIX/share/lua/luarocks/config-5.3.lua
# QUESTION: Something like this?
# echo "external_deps_dirs = {
#    "$CONDA_PREFIX"
# }" >> "$CONDA_PREFIX/share/lua/luarocks/config-5.3.lua"

# Though LD_LIBRARY_PATH might also work: https://workflowy.com/#/dad8323b9953

# Install lua dependencies

# Ensure I'm in correct directory e.g. ~/git_projects/argmap/

# Running qa_rockspec will also install dependencies
scripts/qa_rockspec.sh

# if this doesn't exist, create before installing pandoc, so that user data directory should be set automatically:
# mkdir --parent ~/.local/share/pandoc/filters
# Though I think I may want to install it in relevant conda env folder instead

# conda install pandoc

# If not using conda would need conda dependencies installed.

# check the version and user data directory, which should be /home/s6mike/.local/share/pandoc/filters
# though I prob want it to be in conda install instead
pandoc --version

# lualatex is a LaTeX based format, so in order to use it you have to install LaTeX, not just TeX. So you need at least the Ubuntu texlive-latex-base package.
# But if you aren't an expert, it's usually better to just install texlive-full to avoid issues later on with missing packages.
# https://tex.stackexchange.com/questions/630111/install-lualatex-for-use-on-the-command-line
apt-get install texlive-latex-extra
apt-get install texlive-luatex

# TODO: for other users would need to install argmap in current directory

# SECTION 3: Link conda env
# ---------------------------------------------------

# ln -s source_file symbolic_link
ln -s "$WORKSPACE/src/argmap2mup.lua" "$CONDA_PREFIX/bin/argmap2mup"
ln -s "$WORKSPACE/src/argmap2tikz.lua" "$CONDA_PREFIX/bin/argmap2tikz"
ln -s "$WORKSPACE/src/mup2argmap.lua" "$CONDA_PREFIX/bin/mup2argmap"

chmod u+x src/*

# pandoc data-folder:
# local: ~/.local/share/pandoc/
#   e.g. ~/.local/share/pandoc/filters
# legacy: ~/.pandoc/
# conda: "$CONDA_PREFIX/share/pandoc/filters"

# This might be useful on more recent version of pandoc, which might actually check all these folders
# Though more likely it will use XDG_DATA_HOME which I can then overwrite
# XDG_DATA_DIRS="$CONDA_PREFIX/share":$XDG_DATA_DIRS

# Adds .lua files to pandoc data-folder:

# ln -s "$WORKSPACE/src/config_argmap.lua" "$CONDA_PREFIX"/share/pandoc/

mkdir --parent "$CONDA_PREFIX/share/pandoc/filters/"
ln -s "$WORKSPACE/src/pandoc-argmap.lua" "$CONDA_PREFIX/share/pandoc/filters/"

# TODO is this necessary? Forget why
# ln -s "$WORKSPACE/src/argmap2mup.lua" "$CONDA_PREFIX/share/pandoc/"

# Add config_argmap file to standard LUA_PATH so easy to update LUA_PATH etc for lua scripts
# Need to use sudo for both:
mkdir --parents /usr/local/share/lua/5.3/
ln -s "$WORKSPACE/src/config_argmap.lua" /usr/local/share/lua/5.3/

# latex templates e.g. examples/example-template.latex need to go here:
mkdir --parent "$CONDA_PREFIX/share/pandoc/templates/examples/"

ln -s "$WORKSPACE/examples/example-template.latex" "$CONDA_PREFIX/share/pandoc/templates/examples/example-template.latex"

# Connects legacy data-folder to conda env:
# TODO: add this to conda activation, and delete this link when env deactivated?
# NOTE: once using pandoc 2.8 or later, can use defaults file to set defalt data directory, should simplify.
ln -s "$CONDA_PREFIX/share/pandoc" "$HOME/.pandoc"
# TODO: Alternative is always to use --data-directory "$CONDA_PREFIX/share/pandoc/" when calling pandoc

# Makes conda exes available in local for VSCode extensions which don't have path option:
# Unnecessary for extensions which have custom pandoc path setting, though vscode-pandoc still throws an error message:
# ln -s "$CONDA_PREFIX/bin/pandoc" "$HOME/.local/bin/"

# Only needed for pre-commit hook:
ln -s "$CONDA_PREFIX/bin/convert" "$HOME/.local/bin/"
