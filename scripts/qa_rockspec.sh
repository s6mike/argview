#!/usr/bin/env bash

# rockspec QA: lints and makes rockspec to ensure it is valid.
# Run in project directory itself, not test project.

# TODO: Put this into function so I can run it from tests file.
#   Will need option to not reinstall dependencies.

# If there is more than 1 rockspec, might run wrong one, or maybe both?
rockspec_file=$(__find_rockspec) # Gets absolute path

echo "*** Checking: $rockspec_file ***"

# install_dir="$(getvar PATH_DIR_ARGMAP_ROOT)"

# dir_lua="$(getvar PATH_LUA_MODULES)"

luarocks lint "$rockspec_file"

# cd "$install_dir" || {
#   echo "Abandoning QA install."
#   exit 1
# }

# echo -e "***Deleting: $install_dir/$dir_lua ***\n"
# Can instead remove each package in turn with lua remove name --tree "$install_dir/$dir_lua" (name needs to match rockspec name e.g. penlight not pl)
#   Might be able to uninstall argamp if I've installed it all rather than just dependencies

# rm -R "$dir_lua"

# HOMEBREW_PREFIX=/home/linuxbrew/.linuxbrew
# echo "(brew --prefix): $(brew --prefix)"

# luarocks --tree lua_modules make --only-deps argmap-4.13.22-9.rockspec # YAML_LIBDIR="$CONDA_PREFIX/lib/"
# luarocks --lua-version=5.3 --lua-dir=$HOMEBREW_PREFIX/opt/lua@5.3 --tree "$install_dir/$dir_lua" make --only-deps "$rockspec_file" # This is for local/conda install only: YAML_LIBDIR="$CONDA_PREFIX/lib/"
luarocks --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 init
luarocks --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 make "$rockspec_file" # This is for local/conda install only: YAML_LIBDIR="$CONDA_PREFIX/lib/"

lua -v # Check lua version
# echo luarocks standard:
# luarocks list
# luarocks path
# luarocks show luafilesystem

echo luarocks customised:
# lua@5.3 -v # Check lua version
luarocks --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 install luafilesystem
luarocks --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 list
luarocks --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 path
luarocks --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 show luafilesystem
# lua -e 'print(_VERSION); package.cpath="./?.so"; require "lfs"'
# cd /opt/buildhome/.luarocks/lib/lua/5.3/ || exit
# cd - || exit
# lua -e 'print(_VERSION); package.cpath="./?.so"; require "lfs"'
# find "$(getvar PATH_LUA_MODULES)" -type f -name 'lfs.so'

ln -sf /home/linuxbrew/.linuxbrew/opt/lua@5.3/bin/lua5.3 ./lua
lua -v
which lua

# update-alternatives --config lua-interpreter
# find . -type f -name "*lua*"
# lua53 -v
# which lua53
# lua54 -v
# which lua54

# Alternative to using YAML_LIBDIR:
# TODO for conda, run command to add conda env as dependencies directory (for lib yaml etc) to end of config file: $CONDA_PREFIX/share/lua/luarocks/config-5.3.lua
# QUESTION: Something like this?
# echo "external_deps_dirs = {
#    "$CONDA_PREFIX"
# }" >> "$CONDA_PREFIX/share/lua/luarocks/config-5.3.lua"

# Though LD_LIBRARY_PATH might also work: https://workflowy.com/#/dad8323b9953
