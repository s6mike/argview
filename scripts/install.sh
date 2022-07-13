#!/usr/bin/env bash

# TODO: normal install shouldn't use conda, so should set up to give option for either
# install location here= /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/ not just $CONDA_ENV_ARGMAPS/

# Download/install git folder?

export CONDA_ENV_ARGMAPS="argumend"
export XDG_DATA_HOME="/opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/share/"

# TODO Just run conda env script?
# if in folder with environment.yml
# conda env create
# Else:
# conda env create -f environment.yml
# Or:
# conda env update --file environment.yml --prune --name $CONDA_ENV_ARGMAPS

# conda activate $CONDA_ENV_ARGMAPS

# TODO: check whether these are already installed
# conda install lua5.3

# conda install -c anaconda-platform luarocks

# TODO for conda, run commandto add conda env as dependencies directory (for lib yaml etc) to end of config file: /opt/miniconda3/envs/argumend/share/lua/luarocks/config-5.3.lua
#
# QUESTION: Something like this?
# echo "external_deps_dirs = {
#    "/opt/miniconda3/envs/$CONDA_ENV_ARGMAPS"
# }" >> /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/share/lua/luarocks/config-5.3.lua

# Though LD_LIBRARY_PATH  might also work: https://workflowy.com/#/dad8323b9953

# Install lua dependencies

# Ensure I'm in correct directory e.g. ~/git_projects/argmap/

luarocks make --only-deps --tree lua_modules argmap-3.2.0-4.rockspec
# But if config not amended as above, run this:
# luarocks make --only-deps --tree lua_modules YAML_LIBDIR="/opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/lib" argmap-3.2.0-4.rockspec

# if this doesn't exist, create before installing pandoc, so that user data directory should be set automatically:
# mkdir ~/.local/share/pandoc/filters
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

# ln -s source_file symbolic_link
ln -s "$WORKSPACE/src/argmap2mup.lua" /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/bin/argmap2mup
ln -s "$WORKSPACE/src/argmap2tikz.lua" /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/bin/argmap2tikz
ln -s "$WORKSPACE/src/mup2argmap.lua" /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/bin/mup2argmap

chmod u+x src/*

# pandoc data-folder:
# local: ~/.local/share/pandoc/
#   e.g. ~/.local/share/pandoc/filters
# legacy: ~/.pandoc/
# conda: /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/share/pandoc/filters
# Connects legacy data-folder to conda env:
ln -s "$WORKSPACE/src/pandoc-argmap.lua" /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/share/pandoc/filters

# TODO: add this to conda activation, and delete this link when env deactivated?
# NOTE: once using pandoc 2.8 or later, can use defaults file to set defalt data directory, should simplify.
ln -s /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/share/pandoc/ "$HOME/.pandoc"
# TODO: Alternative is always to use --data-directory /opt/miniconda3/envs/$CONDA_ENV_ARGMAPS/share/pandoc/ when calling pandoc
