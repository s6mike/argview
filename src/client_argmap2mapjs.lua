-- Calls argmap2mup, created for use as client side script

-- Set these global variables here
Module_yaml = 'tinyyaml'
Script_context = 'client'

-- print("package: ")
-- print(package) -- separate statement because tables can't be concatenated. Try using json.encode and then print that
-- print("package.path: " .. package.path)

package.path = "/lua_modules/share/lua/5.3/?.lua;" ..
    "/lua/?.lua;" .. "/lua_modules/share/lua/5.3/?/init.lua;" .. package.path

local tyaml = require 'tinyyaml'
local json = require 'rxi-json-lua'
local logging = require 'logging'

Logger = logging.new(function(self, level, message)
  -- Might be able to instead use: `window.console:log(x)` -- Or maybe console.debug?
  print(message)
  print("\n")
end)

-- Set to .DEBUG to activate logging
Logger:setLevel(logging.DEBUG)

Logger:debug("Hello a2m test debug!")

-- Need to define Logger before calling this:
local a2m = require 'argmap2mup'

-- arg contains the arguments which would be passed to argmap2mup if run in the shell.
-- local input_yaml = 'mapjs/site/input/example1-clearly-false-white-swan-simplified.yml'
-- local output = {}

-- TODO: read file from path
-- Borrowed from Example 3 in https://www.ucl.ac.uk/~rmhajc0/fengarilua.html

local js = require "js"
local window = js.global
local document = window.document

local fileChooser = document:getElementById("file")
local textArea = document:querySelector("textarea")

local function argmap2mapjs(yaml_data)
  -- Logger:debug("yaml_data: " .. yaml_data)
  local argmap = tyaml.parse(yaml_data)
  -- Logger:debug("argmap: ")
  -- Logger:debug(argmap)

  -- Then create output and encode it:
  local output = a2m.template
  output["ideas"] = a2m.parse_claims(argmap)
  -- TODO: add:
  -- output["title"] = name

  -- Logger:debug("output: ")
  -- Logger:debug(output)
  local mup = json.encode(output)

  -- window.mapInstance.container_argmap1.mapModel
  -- mapModel.setIdea(content(JSON.parse(mup)));
  -- Have removed content
  -- TODO: Need to use correct mapModel
  -- push mup to JS?
  window.mup = mup
  -- mapInstance[this.target_container_id].mapModel.getIdea();
  -- window.mapInstance.container_argmap1.mapModel.setIdea(JSON.parse(mup));

  return mup
end

local function read()
  local myFile = fileChooser.files[0]
  print("myFile.name: " .. myFile.name)
  local reader = js.new(window.FileReader)
  reader.onload = function()
    textArea.value = reader.result

    -- Parse yaml
    local yaml_data = reader.result

    argmap2mapjs(yaml_data)

  end

  -- Think this is what triggers the onload, but not certain:
  reader:readAsText(myFile)

end

-- Restore this and comment out the lines after
-- fileChooser:addEventListener("change", function() read() end)

local yaml_data = [=[
---
"Map 2: All swans are white.":
  r2:
    Every swan I’ve ever seen is white.: []
    These swans are representative of all swans.: []
  o1:
    Not all swans are white.: []
]=]

local mup = argmap2mapjs(yaml_data)
Logger:debug("mapjs (- theme): " .. mup)

-- Can I send mup to JS?
-- Could also write to the JSON script item?
Logger:debug("mapjs (- theme): " .. mup)

-- Can I send mup to JS?
-- Could also write to the JSON script item?
