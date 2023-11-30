-- Copyright 2022 Michael Hayes and the argmap contributors
-- SPDX-License-Identifier: MIT

-- Might fix attempts to find luarocks installed depedendencies (e.g. LuaFileSystem)
-- require 'luarocks.loader'

-- QUESTION: Add config_argmap file to standard LUA_PATH so easy to update LUA_PATH etc for lua scripts?

-- config is used to store all config data and returned at end of this script.
-- QUESTION: turn this into an object so not returning at end?
local config = {}

local LUA_LOGGING_LEVEL = 'ERROR'

-- Set to DEBUG to activate logging:
-- LUA_LOGGING_LEVEL = 'DEBUG'

-- Configures global variables for lua files.

-- If this file showing up as not found, then in calling file add:
-- package.path = "/home/s6mike/git_projects/argmap/src/lua/?.lua;" .. package.path
config.project_folder = os.getenv("PATH_ARGMAP_ROOT") or "/home/s6mike/git_projects/argmap"

-- QUESTION: Use PANDOC_SCRIPT_FILE instead?

-- QUESTION: Should I changes this from a global variable to part of config?
PATH_LUA_ARGMAP = os.getenv("PATH_LUA_ARGMAP") or config.project_folder .. "/src/lua"

-- Didn't work from extension:
package.path = os.getenv("LUA_PATH") or
    PATH_LUA_ARGMAP .. "?.lua;" ..
    config.project_folder ..
    "/lua_modules/share/lua/5.3/?/init.lua;" ..
    config.project_folder ..
    "/lua_modules/share/lua/5.3/?.lua;"
    .. package.path

package.cpath = os.getenv("LUA_CPATH") or
    config.project_folder ..
    "/lua_modules/lib/lua/5.3/?.so;" .. "/opt/miniconda3/envs/argmap/lib/lua/5.3/?.so;"
    .. package.cpath

-- LuaLogging: A simple API to use logging features in Lua: https://neopallium.github.io/lualogging/manual.html#introduction
--  Calling this early in file so it's easier to debug rest.
local logging = require 'logging'
Logger = logging.new(function(self, level, message)
    io.stderr:write(message)
    io.stderr:write("\n")
    return true
end)

Logger:setLevel(logging[LUA_LOGGING_LEVEL])

-- os.getenv("LUA_PATH") returns nil when run with Markdown Preview Enhanced VSCode extension
Logger:debug("LUA_PATH: " .. (os.getenv("LUA_PATH") or ""))
Logger:debug("LUA_CPATH: " .. (os.getenv("LUA_CPATH") or ""))

-- Then use Logger:[level] to print
--  Tables can't be concatenated so use separate debug message.
--  TODO: Penlight has pl.pretty to print out objects
-- Logger:debug("message: ".. message)

-- Currently using lua-debugger, see: https://workflowy.com/#/8b71cb424dda
-- If lldebugger showing up as not found, then add:
-- package.path = "/home/s6mike/.vscode/extensions/tomblind.local-lua-debugger-vscode-0.3.3/debugger/?.lua;" .. package.path

-- Use to add breakpoint:
-- if os.getenv("LOCAL_LUA_DEBUGGER_VSCODE") == "1" then
--     require("lldebugger").start()
-- end

-- TODO set this with a command line argument, then use in launch.json
--   Try this approach: lua -e'a=1' -e 'print(a)' script.lua
--   https://www.lua.org/manual/5.3/manual.html#6.10

-- Using tyaml for portability (and since no need to write to yaml)
-- TODO: Remove from argmap2mup, or consolidate?
--  argmap2mup does call config_argmap
Module_yaml = 'tinyyaml' -- or lyaml
local tyaml = require 'tinyyaml'

-- TODO: Call this function in argmap2mup etc
function Read_file(filepath)
    local filehandle = assert(io.open(filepath, 'r'))
    local input = filehandle:read("*all")
    filehandle:close()
    
    return input
end

-- Loads filepath's yaml data into config
function config.load_yaml (self, filepath)
    local yaml_data = tyaml.parse(Read_file(filepath))
    for k, v in pairs(yaml_data) do
        self[k] = v
    end
end

-- Loads a list of yaml filepaths into config
--  Can be a lua table, or a referenc to a yaml list
--      e.g. config.LIST_FILES_CONFIG_INPUT
function config.load_yaml_list (self, filelist)
    for _, file in ipairs(filelist) do
        config:load_yaml(file)
    end
end

PATH_FILE_ENV_ARGMAP_PROCESSED = os.getenv("PATH_FILE_ENV_ARGMAP_PROCESSED") or config.project_folder .. "/config/environment-argmap.yaml"
config:load_yaml(PATH_FILE_ENV_ARGMAP_PROCESSED)

-- QUESTION: use os.getenv("LIST_FILES_CONFIG_PROCESSED")?
-- config:load_yaml_list(config.LIST_FILES_CONFIG_PROCESSED)

-- QUESTION: Add this list to config file instead and use that?
-- Order important: need processed files to overwrite values in unprocessed files.
local remaining_files = {config.PATH_FILE_ENV_ARGMAP, config.PATH_FILE_CONFIG_ARGMAP, config.PATH_FILE_ENV_ARGMAP_PROCESSED, config.PATH_FILE_CONFIG_ARGMAP_PROCESSED}
config:load_yaml_list(remaining_files)

-- TODO: Remove these variable definitions - may need to replace in other lua files. See notes in pandoc-argmap.lua.
--  Currently only reading argmap config files, may need mapjs config files too when transitioning to using config files.

-- For html links, use relative paths (to test/output folder) - more portable
DIR_MAPJS_JSON = os.getenv("DIR_MAPJS_JSON") or "mapjs-json"

-- QUESTION: Should I be using a path join function?
PATH_DIR_MAPJS_ROOT = os.getenv("PATH_DIR_MAPJS_ROOT")
PATH_FILE_CONFIG_MAPJS = os.getenv("PATH_FILE_CONFIG_MAPJS")
PATH_FILE_CONFIG_MAPJS_PROCESSED = os.getenv("PATH_FILE_CONFIG_MAPJS_PROCESSED")
-- PATH_OUTPUT_LOCAL = os.getenv("PATH_OUTPUT_LOCAL") or (config.project_folder .. "/test/output")
PATH_PUBLIC = os.getenv("PATH_PUBLIC") or (config.project_folder .. "mapjs/public")
PATH_DIR_PUBLIC_MAPJS_JSON = os.getenv("PATH_DIR_PUBLIC_MAPJS_JSON") or (PATH_PUBLIC .. "/output/" .. DIR_MAPJS_JSON)
DIR_OUTPUT = os.getenv("DIR_OUTPUT") or "output"

PATH_DIR_LAYOUTS = os.getenv("PATH_DIR_LAYOUTS") or config.project_folder .. "/src/layouts" -- Reads the container and controls html
PATH_DIR_TEMPLATES = os.getenv("PATH_DIR_TEMPLATES") or PATH_DIR_LAYOUTS .. "/templates" -- Reads the container and controls html
PATH_DIR_INCLUDES = os.getenv("PATH_DIR_INCLUDES") or PATH_DIR_LAYOUTS .. "/includes" -- Reads the container and controls html

PATH_INCLUDES_ARGMAP_CONTROLS = os.getenv("PATH_INCLUDES_ARGMAP_CONTROLS") or
    PATH_DIR_INCLUDES .. "/mapjs-widget-controls.html"

-- Reads the container and controls html
PATH_INCLUDES_ARGMAP_CONTAINER_DEFAULT = os.getenv("PATH_INCLUDES_ARGMAP_CONTAINER_DEFAULT") or
    PATH_DIR_INCLUDES .. "/mapjs-map-container.html"

return config