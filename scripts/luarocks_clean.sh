#!/usr/bin/env bash

# clean up Lua Rocks from global library
luarocks remove --global argmap-3.1.2-3.rockspec
luarocks remove lualogging
luarocks remove lyaml
luarocks remove penlight
luarocks remove rxi-json-lua
luarocks remove luasocket
luarocks remove luafilesystem
luarocks list
