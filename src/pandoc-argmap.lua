-- a pandoc lua filter that replaces yaml encoded argument maps
-- with tikz maps linked to generated mindmup maps.

-- Sets up shared 'environment' variables:

local config_argmap = require 'config_argmap'

-- LuaLogging: A simple API to use logging features in Lua: https://neopallium.github.io/lualogging/manual.html#introduction

-- TODO set this with a command line argument, then use in launch.json
--   Try this approach: lua -e'a=1' -e 'print(a)' script.lua
--   https://www.lua.org/manual/5.3/manual.html#6.10

-- Logger:debug("input_filename: " .. input_filename) -- tables can't be concatenated so use separate debug message.

-- TODO: this might simplify using argmap2mup, aliases etc
-- local argmap2mup = require 'argmap2mup'
-- will then need to call argmap2mup.main etc

-- The global FORMAT is set to the format of the pandoc writer being used (html5, latex, etc.), so the behavior of a filter can be made conditional on the eventual output format.
local format = FORMAT
-- class that identifies a code block as an argument map
local identifier = "argmap"

-- set this to the google ID of the default folder to upload to
local gdriveFolder = nil

local function trim(s)
    return (s:gsub("\n", ""))
end

local function argmap2image(src, filetype, outfile)
    -- Converts yaml map to tikz and then to pdf or png.
    -- More or less borrowed from the example given in the pandoc lua filter docs.
    local o = nil
    local tmp = os.tmpname()
    local tmpdir = string.match(tmp, "^(.*[\\/])") or "."
    local opts = { "-s" }
    if format == "latex" or format == "beamer" then
        -- for any format other than raw tikz we need a standalone tex file
        opts = {}
    end

    -- TODO: might be able to avoid /src part by using PANDOC_SCRIPT_FILE:
    -- e.g. io.stderr:write("**SCRIPT_FILE: " .. PANDOC_SCRIPT_FILE .. "\n\n")
    local tex = pandoc.pipe(config_argmap.project_folder .. "/src/argmap2tikz.lua", opts, src) -- convert map to standalone tex
    if format == 'latex' or format == 'beamer' then
        -- for latex, just return raw tex
        o = tex
    else
        local f = assert(io.open(tmp .. ".tex", 'w'))
        f:write(tex)
        f:close()
        -- convert the tex file to pdf (need to use lualatex  for graph support)
        os.execute("lualatex -output-directory " .. tmpdir .. " " .. tmp .. ".tex")
        if filetype == 'pdf' then
            -- we don't use this for latex or beamer, but it is available
            -- if other formats need pdf images instead of inline tikz
            os.rename(tmp .. ".pdf", outfile)
        elseif format == 'html5' then
            -- for html5 format, we return raw svg
            os.execute("pdf2svg " .. tmp .. ".pdf " .. tmp .. ".svg")
            local fsvg = assert(io.open(tmp .. ".svg", 'r'))
            o = fsvg:read("*all")
            fsvg:close()
            os.remove(tmp .. ".svg")
        elseif filetype == 'svg' then
            -- we don't use this for html5, but it is available for other formats
            -- that need svg images instead of inline svg.
            os.execute("pdf2svg " .. tmp .. ".pdf " .. outfile)
        else
            -- convert the pdf to appropriate format
            os.execute("convert -density 150 " .. tmp .. ".pdf " .. outfile)
        end
        -- clean up tmp files
        os.remove(tmp)
        os.remove(tmp .. ".tex")
        os.remove(tmp .. ".pdf")
        os.remove(tmp .. ".log")
        os.remove(tmp .. ".aux")
    end
    return o
end

extension_for = {
    html = 'png',
    html4 = 'png',
    html5 = 'svg',
    latex = 'pdf',
    beamer = 'pdf',
    mapjs = 'json',
}

local function file_exists(name)
    -- utility function borrowed from pandoc lua filter docs.
    local f = io.open(name, 'r')
    if f ~= nil then
        io.close(f)
        return true
    else
        return false
    end
end

function CodeBlock(block)
    -- function finds code blocks with class '.argmap', generates a corresponding
    -- mindmup map, uploads that map to google drive, and replaces the block with:
    --
    -- (a) raw latex code containing a tikz map linked to the mindmup map (if format is latex);
    -- (b) a code block the class '.map' and a 'gid' attribute pointing with the google drive
    --     id of the mindmup map (if format is markdown);
    -- (c) a pandoc paragraph containing an image link linked to the mindmup map (for all other formats)
    -- (d) (WIP) a mapjs container

    -- ISSUE: only detects argmap block if it's first class in list.
    if block.classes[1] == identifier then
        local original = block.text

        -- REVIEW: Much of following code not required?
        -- TODO: have stopped opt "-p" forcing upload, but might want to remove this flag too/instead.
        local argmap2mup_opts = { "-p" } -- Defaults to publicly accessible map.
        local name = block.attributes["name"]
        if name and name ~= "" then
            argmap2mup_opts[#argmap2mup_opts + 1] = "-n"
            argmap2mup_opts[#argmap2mup_opts + 1] = name
        else
            name = ""
        end
        local gid = block.attributes["gid"]
        if gid then
            argmap2mup_opts[#argmap2mup_opts + 1] = "-g"
            argmap2mup_opts[#argmap2mup_opts + 1] = gid
        end
        if gdriveFolder then
            argmap2mup_opts[#argmap2mup_opts + 1] = "-f"
            argmap2mup_opts[#argmap2mup_opts + 1] = gdriveFolder
        end
        if format == "markdown" and block.attributes["tidy"] == "true" then
            -- TODO: might be able to avoid /src part by using PANDOC_SCRIPT_FILE:
            -- e.g. io.stderr:write("**SCRIPT_FILE: " .. PANDOC_SCRIPT_FILE .. "\n\n")

            -- convert and upload to google drive, and return a yaml
            -- argument map with the gid as attribute.
            local output = pandoc.pipe(config_argmap.project_folder .. "/src/argmap2mup.lua", argmap2mup_opts, original)
            gid = trim(output)
            local attr = pandoc.Attr(nil, { identifier }, { ["name"] = name, ["gid"] = gid, ["tidy"] = "true" })
            return pandoc.CodeBlock(original, attr)
        else
            -- TODO: get convertTo value
            local convertTo = block.attributes["convertTo"]

            -- TODO: might be able to avoid /src part by using PANDOC_SCRIPT_FILE:
            -- e.g. io.stderr:write("**SCRIPT_FILE: " .. PANDOC_SCRIPT_FILE .. "\n\n")
            -- argmap2mup converts yaml to mindmup

            -- Now I've changed argmap2mup, this may output the JSON rather than the upload gid
            local output_extra_line = pandoc.pipe(config_argmap.project_folder .. "/src/argmap2mup.lua", argmap2mup_opts
                , original)

            output = trim(output_extra_line)

            -- TODO: assign later only where needed (since it may now be JSON rather than gid)
            gid = output

            -- construct link to map on mindmup
            local mupLink = "https://drive.mindmup.com/map/" .. gid
            local filetype = extension_for[FORMAT] or "png"

            if format == "latex" or format == "beamer" then
                -- convert mup to raw tikz
                local rawtikz = argmap2image(original, filetype, nil)
                -- construct raw latex:
                --   wrap the tikz map with \href and a link to mindmup
                --   and wrap the \href is adjustbox, so it shrinks to the page
                --   TODO: support captions by wrapping in figure environment
                local rawlatex = [[\begin{adjustbox}{max totalsize={.9\textwidth}{.7\textheight},center}]]
                    .. "\\href{" .. mupLink .. "}{" .. rawtikz .. "}\n" ..
                    [[\end{adjustbox}]]
                return pandoc.RawBlock(format, rawlatex)
            elseif convertTo == "mapjs" then -- if code block has this attribute then convert to mapjs output
                -- ISSUE: Currently filetype: "png", want "json"

                local block_id = block.attr.identifier

                -- TODO: use lua solution instead (use regex or upgrade pandoc)
                -- Cheat method to run os command and get output back (should really use to pipe input to output via os command).
                local input_filename_extra_line = pandoc.pipe("basename", { "--suffix=.md", PANDOC_STATE.input_files[1] }
                    , "")
                local input_filename = trim(input_filename_extra_line)

                -- TODO: output should be a constant set in early part of this file.
                -- TODO: can I set filetype based on pandoc target format?
                -- yml #ID (block id: append to container_ for: container div id;
                --          prepend with input filename for:
                --              Output/input_file_yml_id.json
                -- TODO: add _yml name attribute (with _ substitutions for spaces) ?

                local output_filename = input_filename .. "_" .. block_id
                local output_fpath = "Output/" .. output_filename .. ".json"

                -- TODO: This should be a utility function, since used elsewhere
                --  Or could maybe use os.execute() to run argmap2mup using correct input and output, rather than pandoc.pipe
                local f = assert(io.open(output_fpath, 'w'))
                f:write(output)
                f:close()

                -- QUESTION: Better to build html using pandoc functions rather than with rawhtml?
                local argmap_controls_path = "pandoc-templates/mapjs/mapjs-testcontrols.html"
                local _, argmap_controls_html = pandoc.mediabag.fetch(argmap_controls_path)

                local rawhtml = argmap_controls_html ..
                    "<div id=\"container" ..
                    "_" .. block_id .. "\" class=\"container_argmapjs\" src=\"" .. output_filename .. "\"></div>"
                -- "<div id=\"container" .. "\" src=\"" .. output_filename .. "\"></div>"

                -- return pandoc.CodeBlock(original, attr)
                return pandoc.RawBlock(format, rawhtml)
            elseif format == "html5" then
                -- convert mup to raw svg
                local rawsvg = argmap2image(original, filetype, nil)
                local rawhtml = "<a href=\"" .. mupLink .. "\">" .. rawsvg .. "</a>"
                return pandoc.RawBlock(format, rawhtml)
            else
                -- check to see if the images need to be regenerated (borrowed from pandoc lua filter docs: each image name is a hash of the yaml map.)
                -- TODO: put the images in a directory
                -- TODO: delete old images that are no longer needed?
                local fname = pandoc.sha1(original) .. "." .. filetype
                if not file_exists(fname) then
                    -- convert the yaml map to an image
                    argmap2image(original, filetype, fname)
                end
                local mapCaption = pandoc.Str(name)
                local attr = pandoc.Attr(nil, { identifier }, { ["name"] = name, ["width"] = "100%", ["gid"] = gid })
                local linkContent = { pandoc.Image(mapCaption, fname, "", attr) }
                return pandoc.Para(pandoc.Link(linkContent, mupLink))
            end
        end
    end
end
