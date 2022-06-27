rockspec_format="3.0"
package = "argmap"
version = "2.2.0-1"
source = {
   url = "git+ssh://git@github.com/s6mike/argmap.git",
   tag = "v2.2.0"
}
description = {
   summary = "Tools for working with argument maps.",
   detailed = "Convert YAML into .mup, vice versa, upload to Mindmup, and pandoc integration. See [README.md](README.md), and [NEWS.md](NEWS.md) for change notes.",
   homepage = "https://github.com/s6mike/argmap)",
   issues_url = "https://github.com/s6mike/argmap/issues",
   license = "MIT",
   maintainer = "Michael Hayes <es6.mike@gmail.com>",
   labels = {"argumentation", "mindmap"}
}
supported_platforms = {"linux"}
dependencies = {
   "lua ~> 5.3",
   "lualogging ~> 1.6.0-2",
   "lyaml ~> 6.2.7-1",
   "penlight ~> 1.12.0-2",
   "rxi-json-lua ~> e1dbe93-0",
}
build = {
   type = "builtin",
   modules = {
      argmap2mup = "argmap2mup.lua",
      argmap2tikz = "argmap2tikz.lua",
      mup2argmap = "mup2argmap.lua",
      ["pandoc-argmap"] = "pandoc-argmap.lua"
   }
}
