#!/usr/bin/env bash

# clean up Lua Rocks from global library
luarocks remove --global argmap-3.2.0-4.rockspec
luarocks remove argmap
luarocks remove lualogging
luarocks remove lyaml
luarocks remove penlight
luarocks remove rxi-json-lua
luarocks remove luasocket
luarocks remove luafilesystem

echo "Remaining luarocks:"
luarocks list
