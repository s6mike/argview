#!/usr/bin/env bash

# rockspec QA: lints and makes rockspec to ensure it is valid.
# Run in project directory itself, not test project.

# lua -v
# which lua
# echo "PATH: $PATH"

# TODO: Put this into function so I can run it from tests file.
#   Will need option to not reinstall dependencies.

# If there is more than 1 rockspec, might run wrong one, or maybe both?
rockspec_file=$(__find_rockspec) # Gets absolute path

echo "*** Checking: $rockspec_file ***"

# install_dir="$(getvar PATH_DIR_ARGMAP_ROOT)"

# dir_lua="$(getvar PATH_LUA_MODULES)"

luarocks lint "$rockspec_file"

# cd "$install_dir" || {
#   echo "Abandoning QA install." >&2
#   exit 1
# }

# echo -e "***Deleting: $install_dir/$dir_lua ***\n"
# Can instead remove each package in turn with lua remove name --tree "$install_dir/$dir_lua" (name needs to match rockspec name e.g. penlight not pl)
#   Might be able to uninstall argamp if I've installed it all rather than just dependencies

# rm -R "$dir_lua"

# HOMEBREW_PREFIX=/home/linuxbrew/.linuxbrew
# echo "(brew --prefix): $(brew --prefix)"

# luarocks --lua-version=5.3 --lua-dir=$HOMEBREW_PREFIX/opt/lua@5.3 --tree "$install_dir/$dir_lua" make --only-deps "$rockspec_file" # This is for local/conda install only: YAML_LIBDIR="$CONDA_PREFIX/lib/"
# luarocks --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 init
# luarocks --tree lua_modules make --only-deps argmap-4.13.22-9.rockspec # YAML_LIBDIR="$CONDA_PREFIX/lib/"
luarocks --tree lua_modules --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 make --only-deps "$rockspec_file" # This is for local/conda install only: YAML_LIBDIR="$CONDA_PREFIX/lib/"

# echo "****luarocks customised****":
luarocks --tree lua_modules --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 list # This is for local/conda install only: YAML_LIBDIR="$CONDA_PREFIX/lib/"
luarocks --tree lua_modules --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 show luafilesystem
luarocks --tree lua_modules --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 show rxi-json-lua
# luarocks --tree lua_modules --lua-dir="$(brew --prefix)/opt/lua@5.3" --lua-version=5.3 path

# Alternative to using YAML_LIBDIR:
# TODO for conda, run command to add conda env as dependencies directory (for lib yaml etc) to end of config file: $CONDA_PREFIX/share/lua/luarocks/config-5.3.lua
# QUESTION: Something like this?
# echo "external_deps_dirs = {
#    "$CONDA_PREFIX"
# }" >> "$CONDA_PREFIX/share/lua/luarocks/config-5.3.lua"

# Though LD_LIBRARY_PATH might also work: https://workflowy.com/#/dad8323b9953
