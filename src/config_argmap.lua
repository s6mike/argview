-- Configures global variables for lua files.

-- If this file showing up as not found, then in calling file add:
-- package.path = "/home/s6mike/git_projects/argmap/src/?.lua;" .. package.path

-- Use to add breakpoint:
-- if os.getenv("LOCAL_LUA_DEBUGGER_VSCODE") == "1" then
--     require("lldebugger").start()
-- end

local config = {}

-- QUESTION: Use PANDOC_SCRIPT_FILE instead?
config.project_folder = os.getenv("WORKSPACE") or "/home/s6mike/git_projects/argmap"

-- Didn't work from extension:
package.path = os.getenv("LUA_PATH") or
    config.project_folder ..
    "/src/?.lua;" ..
    config.project_folder ..
    "/lua_modules/share/lua/5.3/?/init.lua;" ..
    config.project_folder ..
    "/lua_modules/share/lua/5.3/?.lua;" .. config.project_folder .. "/lua_modules/share/lua/5.3/?/init.lua;"
    .. package.path

package.cpath = os.getenv("LUA_CPATH") or
    config.project_folder ..
    "/lua_modules/lib/lua/5.3/?.so;/opt/miniconda3/envs/argumend/lib/lua/5.3/?.so;"
    .. package.cpath

-- LuaLogging: A simple API to use logging features in Lua: https://neopallium.github.io/lualogging/manual.html#introduction

-- For html links, use relative paths (to test/output folder) - more portable
DIR_MJS_JSON = os.getenv("DIR_MJS_JSON") or "mapjs-json"
PATH_MJS_JSON = os.getenv("PATH_MJS_JSON") or (config.project_folder .. "/test/output/" .. DIR_MJS_JSON)

local logging = require "logging"
Logger = logging.new(function(self, level, message)
    io.stderr:write(message)
    io.stderr:write("\n")
    return true
end)

-- TODO set this with a command line argument, then use in launch.json
--   Try this approach: lua -e'a=1' -e 'print(a)' script.lua
--   https://www.lua.org/manual/5.3/manual.html#6.10

-- Set to .DEBUG to activate logging
Logger:setLevel(logging.ERROR)

-- logger:debug("message: ".. message) -- tables can't be concatenated so use separate debug message.

return config
