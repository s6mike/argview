rockspec_format="3.0"
package = "argmap"
version = "4.13.22-9"
source = {
   url = "git+ssh://git@github.com/s6mike/argmap.git",
   tag = "v4.13.22",
}
description = {
   summary = "Tools for working with argument maps.",
   detailed = "Convert YAML into .mup, vice versa, upload to Mindmup, and pandoc integration. See [README.md](README.md), and [CHANGELOG.md](docs/CHANGELOG.md) for change notes.",
   homepage = "https://github.com/s6mike/argmap)",
   issues_url = "https://github.com/s6mike/argmap/issues",
   license = "MIT",
   maintainer = "Michael Hayes <es6.mike@gmail.com>",
   labels = {"argumentation", "mindmap"},
}
supported_platforms = {"linux"}
dependencies = {
   "lua ~> 5.3",
   "lualogging ~> 1.6.0-2",
   "penlight ~> 1.12.0-2",
   "rxi-json-lua ~> e1dbe93-0",
   "api7-lua-tinyyaml ~> 0.4.2-0",
   "lyaml ~> 6.2.7-1",
}
external_dependencies = {
   YAML = {library="libyaml.so"}
}
build = {
   type = "builtin",
   modules = {
      config_argmap = "src/config_argmap.lua",
      argmap2mup = "src/argmap2mup.lua",
      argmap2tikz = "src/argmap2tikz.lua",
      mup2argmap = "src/mup2argmap.lua",
      ["pandoc-argmap"] = "src/pandoc-argmap.lua",
   },
  test = {
    type = "command",
    command ="test/test_scripts/tests.sh",
  },
}