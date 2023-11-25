#!/usr/bin/env bash

# TODO: Add getvar for all variables

# To install with conda, provide first argument conda:
# ./install.sh conda

# SECTION 0:
# ----------

# TODO Should set up relevant bash to run these automatically:

# a) Set PATH_ARGMAP_ROOT to current directory/PATH_ARGMAP_ROOT? Or create a .env file.
# b) run `scripts/init_read_config.sh` to process the config folders and expand all variables, writing new files to `config/processed` folders.
# c) Review: intialised values in `scripts/argmap_init_script.sh`, `argmap.env` and `mapjs/scripts/mapjs.env`

# SECTION 1:
# ----------

# If installing from environment.yaml, skip to SECTION 2.

# TODO: check whether these are already installed
# conda install lua5.3
# conda install -c anaconda-platform luarocks

# TODO for conda, run command to add conda env as dependencies directory (for lib yaml etc) to end of config file: $PATH_ENVIRONMENT_GLOBAL/share/lua/luarocks/config-5.3.lua
# QUESTION: Something like this?
# echo "external_deps_dirs = {
#    "$PATH_ENVIRONMENT_GLOBAL"
# }" >> "$PATH_ENVIRONMENT_GLOBAL/share/lua/luarocks/config-5.3.lua"

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

chmod 744 "$PATH_DIR_ARGMAP_LUA/"*
chmod 744 "$PATH_FOLDER_ARGMAP_SRC/js/"*

# Link up pre-commit hook
ln -s "$PATH_ARGMAP_ROOT/scripts/git_hooks/pre-commit" "$PATH_ARGMAP_ROOT/.git/hooks/"
chmod +x git_hooks/*

# Link up tests.sh to deprecated location?
# ln -s test/test_scripts/tests.sh scripts

# This section only executed if called with first argument 'conda'
# e.g.
#     ./install.sh conda
if [ "$1" == 'conda' ]; then

  # Note: this used to be section 1
  # SECTION 2 Set up conda env:
  # ----------

  # TODO: normal install shouldn't use conda, so should set up to give option for either
  # ie  INSTALL_ROOT=$PATH_ENVIRONMENT_GLOBAL||X or similar.

  # Download/install git folder?

  export CONDA_ENV_ARGMAP="argmap"
  export XDG_DATA_HOME="$PATH_ENVIRONMENT_GLOBAL/share/"

  # TODO Just run conda env script?
  # if in folder with config/environment-conda-argmap.yaml
  # conda env create
  # Else:
  # conda env create -f $(getvar PATH_FILE_ENV_CONDA)
  # Or:
  # conda env update --file $(getvar PATH_FILE_ENV_CONDA) --prune --name $CONDA_ENV_ARGMAP

  # If conda activate errors:
  # conda init bash
  # source /opt/miniconda3/bin/activate

  # conda activate $CONDA_ENV_ARGMAP

  # SECTION 3: Link conda env
  # ---------------------------------------------------

  # a) Review: intialised values in `config/environment-conda-argmap.yaml`

  # # ln -s source_file symbolic_link
  # rm "$PATH_ENVIRONMENT_GLOBAL/bin/argmap2mup"
  # ln -s "$PATH_DIR_ARGMAP_LUA/argmap2mup.lua" "$PATH_ENVIRONMENT_GLOBAL/bin/argmap2mup"
  # rm "$PATH_ENVIRONMENT_GLOBAL/bin/argmap2tikz"
  # ln -s "$PATH_DIR_ARGMAP_LUA/argmap2tikz.lua" "$PATH_ENVIRONMENT_GLOBAL/bin/argmap2tikz"
  # rm "$PATH_ENVIRONMENT_GLOBAL/bin/mup2argmap"
  # ln -s "$PATH_DIR_ARGMAP_LUA/mup2argmap.lua" "$PATH_ENVIRONMENT_GLOBAL/bin/mup2argmap"

  # pandoc data-folder:
  # local: ~/.local/share/pandoc/
  #   e.g. ~/.local/share/pandoc/filters
  # legacy: ~/.pandoc/
  # conda: "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/filters"

  # This might be useful on more recent version of pandoc, which might actually check all these folders
  # Though more likely it will use XDG_DATA_HOME which I can then overwrite
  # XDG_DATA_DIRS="$PATH_ENVIRONMENT_GLOBAL/share":$XDG_DATA_DIRS

  # Adds .lua files to pandoc data-folder:

  # ln -s "$PATH_DIR_ARGMAP_LUA/config_argmap.lua" "$PATH_ENVIRONMENT_GLOBAL"/share/pandoc/

  # mkdir --parent "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/filters/"
  # rm "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/filters/pandoc-argmap.lua"
  # ln -s "$(getvar PATH_FILE_PANDOC_FILTER_LUA_ARGMAP)" "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/filters/"

  # TODO is this necessary? Forget why
  # ln -s "$PATH_DIR_ARGMAP_LUA/argmap2mup.lua" "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/"

  # Add config_argmap file to standard LUA_PATH so easy to update LUA_PATH etc for lua scripts
  # Need to use sudo for both:
  # Uninstalling the main (apt-get) lua might have removed /usr/local.. from LUA_PATH, since vscode-pandoc was suddenly throwing errors.
  # So these shouldn't be needed any longer:
  # mkdir --parents /usr/local/share/lua/5.3/
  # ln -s "$PATH_DIR_ARGMAP_LUA/config_argmap.lua" /usr/local/share/lua/5.3/

  # -----
  # For vscode pandoc extensions:

  # # 1. Fixed issue with vscode-pandoc not finding config_argmap with these links:
  # #   QUESTION: Do I need first of these?
  # rm "$PATH_ENVIRONMENT_GLOBAL/share/lua/5.3/config_argmap.lua"
  # ln -s "$PATH_DIR_ARGMAP_LUA/config_argmap.lua" "$PATH_ENVIRONMENT_GLOBAL/share/lua/5.3"
  # rm "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/config_argmap.lua"
  # ln -s "$PATH_DIR_ARGMAP_LUA/config_argmap.lua" "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/"

  #  2. Pandoc folder location can be printed (see src/lua/pandoc-hello.lua in branch X?) is location of markdown file, so might be able to do relative links from extensions
  # rm /js
  # Currently mapjs/public/js is just a directory, so have commented out:
  # ln -s /home/s6mike/git_projects/argmap/mapjs/public/js /js

  # 3. Install rockspec in global scope

  rockspec_file=$(_find_rockspec) # Gets absolute path
  # Can instead remove each package in turn with lua remove name --tree "$install_dir/$dir_lua" (name needs to match rockspec name e.g. penlight not pl)
  #   Might be able to uninstall argamp if I've installed it all rather than just dependencies

  luarocks remove
  luarocks make --only-deps "$rockspec_file" YAML_LIBDIR="$PATH_ENVIRONMENT_GLOBAL/lib/"
  # -----

  # latex templates e.g. examples/example-template.latex need to go here:
  # mkdir --parent "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/templates/examples/"
  # ln -s "$PATH_ARGMAP_ROOT/examples/example-template.latex" "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/templates/examples/example-template.latex"

  # Connects legacy data-folder to conda env:
  # TODO: add this to conda activation, and delete this link when env deactivated?
  # NOTE: can use defaults file to set defalt data directory, should simplify.
  # Alternative is always to use --data-directory "$PATH_ENVIRONMENT_GLOBAL/share/pandoc/" when calling pandoc
  # ln -s "$PATH_ENVIRONMENT_GLOBAL/share/pandoc" "$HOME/.local/share/pandoc"

  # Makes conda exes available in local for VSCode extensions which don't have path option:
  # Unnecessary for extensions which have custom pandoc path setting, though vscode-pandoc still throws an error message:
  # ln -s "$PATH_ENVIRONMENT_GLOBAL/bin/pandoc" "$HOME/.local/bin/"

  # Added since after uninstalling global lua, vscode-pandoc extension fails.
  # Wondering if adding this link (from section 2), would help:
  #   ln -s "$PATH_DIR_ARGMAP_LUA/config_argmap.lua" "$PATH_ENVIRONMENT_GLOBAL"/share/pandoc/

  # ln -s "$PATH_ENVIRONMENT_GLOBAL/bin/lua" "$HOME/.local/bin/"

  # # Only needed for pre-commit hook (this is to create png files?)
  # ln -s "$PATH_ENVIRONMENT_GLOBAL/bin/convert" "$HOME/.local/bin/"

  # Install testcafe
  npm install -g testcafe

fi

# SECTION 4: mapjs
# ---------------------------------------------------

# # Check $(getvar PATH_DIR_MAPJS_ROOT) is set as desired
# cd "$(getvar PATH_DIR_MAPJS_ROOT)" || {
#   echo "Abandoning QA install." >&2
#   exit 1
# }

# TODO Use env variables instead of hardcoded folders
# Create json and png output folders otherwise pandoc-argmap.lua won't work
mkdir --parent "$PATH_ARGMAP_ROOT/test/output/mapjs-json"
mkdir --parent "$PATH_ARGMAP_ROOT/test/output/png"
mkdir --parent "$PATH_ARGMAP_ROOT/test/output/html"

# For dev web server:
# Link up test/output and test/input with mapjs/public

PATH_PUBLIC=$(getvar PATH_PUBLIC)

# Migrated to makefile:

# rm "$PATH_PUBLIC/$(basename "$PATH_OUTPUT_LOCAL")"
# ln -s "$(getvar PATH_OUTPUT_LOCAL)" "$(getvar PATH_PUBLIC)/."
# rm "$PATH_PUBLIC/$(basename "$PATH_INPUT_LOCAL")"
# ln -s "$(getvar PATH_INPUT_LOCAL)" "$(getvar PATH_PUBLIC)/."

# Use netlify redirect instead
#   Add index.html
#   rm "$PATH_PUBLIC/index.html"
#   ln -s "$PATH_FILE_OUTPUT_EXAMPLE" "$PATH_PUBLIC/index.html"

#nodejs installed with conda

# TODO: remove this comment, now irrelevant?
# Before npm install:
# Check mapjs/package.json, ensure latest git commit is referenced:
# "dependencies": {
#     "mindmup-mapjs": "git@github.com:mindmup/mapjs.git#e30f8d835e028febe2e951e422c313ac304a0431"
#   }

# QUESTION: Do I need above cd if I'm using prefix?
npm --prefix "$(getvar MAPJS_NODE_MODULES_PREFIX)" install

# ISSUE: npm audit on netlify vulnerabilities doesn't work - better to just build using package-lock?
#   QUESTION: Use force instead?
npm audit fix --prefix "$(getvar MAPJS_NODE_MODULES_PREFIX)" --legacy-peer-deps >npm_audit_output.txt

__build_mapjs

# SECTION 5: yq
# sudo wget -qO "$HOME/.local/bin/yq" https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
# chmod 744 "$HOME/.local/bin/yq"

# SECTION X: Clientside Lua
# ---------------------------------------------------
# TODO: These links probably need re-creating (add rm commands)

# Ensures fengari script and source map available to site
ln -s "$PATH_FOLDER_ARGMAP_SRC/js/fengari-web.js" "$PATH_PUBLIC/js/fengari-web.js"
ln -s "$PATH_FOLDER_ARGMAP_SRC/js/fengari-web.js.map" "$PATH_PUBLIC/js/fengari-web.js.map"
# Ensure lua dependencies available to site
# ln -s "$PATH_DIR_ARGMAP_LUA" "$PATH_PUBLIC/lua"
# ln -s "$PATH_ARGMAP_ROOT/lua_modules" "$PATH_PUBLIC/lua_modules"

# SECTION Z: Uninstall

# Leave env files in place (but delete samples)
# What about test output files? vscode settings?
# delete everything else?
# run `scripts/luarocks_clean.sh`
# do npm uninstall process
# env variables? symbolic links?
