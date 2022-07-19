#!/usr/bin/env bash

# clean up Lua Rocks from global library

# This might only be necessary if rockspec installed globally
# ROCKSPEC_FILE=$(find ~+ -type f -name "argmap-*.rockspec") # Gets absolute path
# luarocks remove --global "$ROCKSPEC_FILE"

luarocks remove argmap
luarocks remove lualogging
luarocks remove lyaml
luarocks remove penlight
luarocks remove rxi-json-lua
luarocks remove luasocket
luarocks remove luafilesystem

echo "Remaining luarocks:"
luarocks list
