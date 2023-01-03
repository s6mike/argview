-- Calls argmap2mup, created for use as client side script

-- Set these global variables here
Module_yaml = 'tinyyaml'
Script_context = 'client'

-- print("package: ")
-- print(package) -- separate statement because tables can't be concatenated. Try using json.encode and then print that
-- print("package.path: " .. package.path)

package.path = "/lua_modules/share/lua/5.3/?.lua;" ..
    "/lua/?.lua;" .. "/lua_modules/share/lua/5.3/?/init.lua;" .. package.path

-- Reequires are all loaded with xhr
local tyaml = require 'tinyyaml'
local json = require 'rxi-json-lua'
local logging = require 'logging'

local js = require "js"
local window = js.global
local document = window.document

-- Customised for browser use
Logger = logging.new(function(self, level, message)
  if level == 'INFO' then
    window.console:log(message)
  else
    window.console:debug(message)
  end

  return true
end)

-- Set to .DEBUG to activate logging
-- Logger:debug("message: ".. message) -- tables can't be concatenated so use separate debug message.
Logger:setLevel(logging.DEBUG)

-- Need to define Logger before calling this:
local a2m = require 'argmap2mup'

-- Adapted from Example 3 in https://www.ucl.ac.uk/~rmhajc0/fengarilua.html
local file_picker_argmap = document:getElementById('file_picker_argmap1')
local input_argmap = document:getElementById('input_argmap1')
local submit_input_argmap = document:getElementById('submit_input_argmap1')

-- Returns mapjs JSON data
local function argmap2mapjs(yaml_data)
  local argmap = tyaml.parse(yaml_data)

  -- Then create output and encode it:
  local output = a2m.template
  output["ideas"] = a2m.parse_claims(argmap)
  -- TODO: add:
  -- output["title"] = name
  -- pass myFile.name into empty idea.name? #idea ?

  local mapjs = json.encode(output)
  return mapjs
end

-- Reads yaml from text area, passes it to argmap2mapjs(), then sends output to mapjs function.
local function convert_yaml()
  -- Parse yaml
  local yaml_data = input_argmap.value

  local mapjs = argmap2mapjs(yaml_data)
  -- TODO: Need to look up correct mapModel
  --  If poss, use getCurrentContainerID()
  -- mapInstance[this.target_container_id].mapModel.getIdea();
  -- function() return "window.changeMap(window.mapInstance.container_argmap1, window.mapjs)" end)
  local container = window.mapInstance.container_argmap1
  -- QUESTION: Could instead write to the JSON script item?
  -- First argument in call: container being passed as this. Not sure why
  window.loadMap(container, mapjs)
end

-- TODO: This is now implemented in map-model.js as readFile, so call that instead
local function read_file()
  local myFile = file_picker_argmap.files[0]
  print("myFile.name: " .. myFile.name)
  local reader = js.new(window.FileReader)
  reader.onload = function()
    input_argmap.value = reader.result
  end

  -- Think this is what triggers the onload, but not certain:
  reader:readAsText(myFile)
end

file_picker_argmap:addEventListener("change", function() read_file() end)
submit_input_argmap:addEventListener("click", function() convert_yaml() end)

-- ISSUE: Apparently textArea does not support value, instead this text should be nested inside the text area object
input_argmap.value = [=[
---
"Map 2: All swans are white.":
  r2:
    Every swan I’ve ever seen is white.: []
    These swans are representative of all swans.: []
  o1:
    Not all swans are white.: []
]=]

-- Use this if I want to convert to mapjs on load
-- local mapjs = argmap2mapjs(yaml_data)
