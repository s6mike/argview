#!/usr/bin/env bash

# clean up Lua Rocks from global library

# This might only be necessary if rockspec installed globally
# rockspec_file=$(_find_rockspec) # Gets absolute path
# luarocks remove --global "$ROCKSPEC_FILE"

luarocks --tree lua_modules remove argmap
luarocks --tree lua_modules remove lualogging
luarocks --tree lua_modules remove lyaml
luarocks --tree lua_modules remove api7-lua-tinyyaml
luarocks --tree lua_modules remove penlight
luarocks --tree lua_modules remove rxi-json-lua
luarocks --tree lua_modules remove luasocket
luarocks --tree lua_modules remove luafilesystem

echo "Remaining luarocks:"
luarocks --tree lua_modules list
