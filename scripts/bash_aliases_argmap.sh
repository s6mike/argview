#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# argmap aliases
alias odb='open_debug' # odb /home/s6mike/git_projects/argmap/mapjs/public/output/mapjs-json/example1-clearly-false-white-swan-simplified-1mapjs_argmap2.json
alias j2hfa='2hf test/input/mapjs-json/example1-clearly-false-white-swan-simplified.json example1-clearly-false-white-swan-simplified --metadata=argmap-input:true | open_debug'

# argmap functions

## Functions beginning with __ are for other scripts. They are not considered part of a public API, and therefore updates may change them without warning.

## browser functions

# TODO: Use __get_site_path() to simplify relative path juggling

# TODO: try shortcut to run test with chrome headless and check that it's correct: https://workflowy.com/#/8aac548986a4
#   QUESTION: review mapjs tests?

# TEST: test_get_site_path()
__get_site_path() {
  local input_path="$1"
  local full_path=""
  case $input_path in
  /*)
    full_path=$input_path
    ;;
  *)
    full_path=$(getvar PATH_ARGMAP_ROOT)/$input_path
    ;;
  esac
  # Substitutes mapjs/public for test so it's using public folder, then removes leading part of path so its relative to public/:
  local site_path="${full_path/test/$(getvar DIR_MAPJS)/$(getvar DIR_PUBLIC)}"
  local output_path
  output_path=$(realpath --no-symlinks --relative-to="$(getvar PATH_PUBLIC)" "$site_path")
  echo "$output_path"
}

# PATH_INPUT_FILE_HTML=$(realpath --no-symlinks --relative-to="$(getvar PATH_PUBLIC)" "$(getvar PATH_PUBLIC)/input/example1-clearly-false-white-swan-simplified.html")
# export PATH_INPUT_FILE_HTML
# PATH_OUTPUT_FILE_HTML=$(realpath --no-symlinks --relative-to="$(getvar PATH_PUBLIC)" "$(getvar PATH_PUBLIC)/output/html/example1-clearly-false-white-swan-simplified.html")
# export PATH_OUTPUT_FILE_HTML

# For opening html pages with debug port open
# shellcheck disable=SC2120
open_debug() { # odb /home/s6mike/git_projects/argmap/mapjs/public/output/html/example2-clearly-false-white-swan-v3.html https://argview.org/ ?keep_original=true
  # TODO: try chrome headless: https://workflowy.com/#/8aac548986a4
  # TODO: user data dir doesn't seem to work, showing normal linux browser
  if ! [ -t 0 ]; then # Checks for piped input
    local piped_input
    piped_input=$(cat -)
  fi
  local input_path="${piped_input:-${1:-$(getvar PATH_FILE_OUTPUT_EXAMPLE)}}"
  local target_domain=${2:-"http://localhost:$(getvar DEV_SERVER.PORT)/"}
  local params=${3:-""}
  local site_path
  site_path=$(__get_site_path "$input_path")
  local output_url="$target_domain$site_path$params"

  if [ "$site_path" != "" ]; then
    if [[ "$target_domain" == "http://localhost:"* ]]; then
      # QUESTION: Add target_domain check to determine 3rd arg (netlify vs webpack)?
      webserver_start "$(getvar DEV_SERVER.PORT)" dev "$(getvar DEV_SERVER.NAME)"
    fi
    google-chrome --remote-debugging-port="$(getvar PORT_DEBUG)" --user-data-dir="$(getvar PATH_CHROME_PROFILE_DEBUG)" --disable-extensions --hide-crash-restore-bubble --no-default-browser-check "$output_url" 2>/dev/null &
    disown # stops browser blocking terminal and allows all tabs to open in single window.
  fi
}

## version control functions
__update_repo() { # Running at end of test script
  echo "Updating repo..."
  # Update doc examples
  # TODO use make instead? Did I already create make for this?
  mv "$(2hf -p "$(getvar PATH_ARGMAP_ROOT)"/test/input/markdown/example-updated.md)" "$(getvar PATH_ARGMAP_ROOT)/docs/example-updated.html"
  mv "$(2hf -p "$(getvar PATH_ARGMAP_ROOT)"/test/input/mapjs-json/legacy-mapjs-example-map.json)" "$(getvar PATH_ARGMAP_ROOT)/mapjs/docs/legacy-mapjs-example-map.html"
  __save_env
  # __reset_repo  # Decided not to delete script output in case there are clues
  # __clean_repo # Decided not to delete script output in case there are clues
  __check_lua_debug
  __check_js_debug
  # __check_npm_updates
}

__find_rockspec() {
  find "$PATH_ARGMAP_ROOT" -type f -name "argmap-*.rockspec"
}

__count_config_read_echoes() { # Because it these functions return values, adding echoes for debugging can wreck output
  local expected_echoes=10
  printf "\nChecking scripts/config_read_functions.lib.sh for extra echoes. Expecting %s only:\n" "$expected_echoes"
  local echo_count
  echo_count=$(grep -o '\<echo\>' scripts/config_read_functions.lib.sh | wc -l)
  printf "Actual count: %s\n" "$echo_count"
  if (("$echo_count" > "$expected_echoes")); then
    printf "Aborting\n" >&2
    exit # "$echo_count"
  fi
}

# Checks `src/lua` for lua files with leftover debug code.
# Used by pre-commit hook
__check_lua_debug() {
  printf "\nChecking lua files for uncommented DEBUG mode directives. Expecting 1 only:\n"
  # 1st grep: Recursive search through directory, exclude lines starting with comments, show line numbers. Need to this filter first - because second grep will have line numbers etc to deal with.
  # 2nd grep: Fixed text, case insensitive
  grep -rnv '^\s*--' "$(getvar PATH_LUA_ARGMAP)" | grep -Fie 'logger:setLevel(logging.DEBUG)' -e 'require("lldebugger").start()'
  echo "-------------"
}

# Checks `mapjs/src` for lua files with uncommented debug code.
# Used by __update_repo() (called from test script) and pre-commit hook (duplication)
__check_js_debug() {
  printf "\nChecking js files for uncommented console.debug commands. Expecting 0.\n"
  # 1st grep: Recursive search through directory, exclude lines starting with comments, show line numbers. Need to this filter first - because second grep will have line numbers etc to deal with.
  # 2nd grep: Fixed text, case insensitive
  grep -rnv '^\s*//' "$PATH_DIR_MAPJS_SRC_JS" | grep -Fie 'console.debug'
  echo "-------------"
}

# Used by pre-commit hook
__reset_repo() {
  echo 'Restoring output folder to match remote.'
  git checkout -- "$PATH_ARGMAP_ROOT/examples/"
  git checkout -- "$PATH_ARGMAP_ROOT/test/output/"
  git checkout -- "$PATH_OUTPUT_LOCAL"
}

__clean_repo() {
  rm -f "$(getvar PATH_OUTPUT_LOCAL)/example1-clearly-false-white-swan-simplified.yaml"
  rm -f "$(getvar PATH_MAPJS_JSON_LOCAL)/example1-clearly-false-white-swan-simplified.json"
  rm -f "$(getvar PATH_OUTPUT_LOCAL)/example1-clearly-false-white-swan-simplified.tex"
  rm -f "$(getvar PATH_OUTPUT_LOCAL)/example1-clearly-false-white-swan-simplified-0mapjs.pdf"
  rm -f "$(getvar PATH_OUTPUT_LOCAL)/html/example1-clearly-false-white-swan-simplified-0mapjs.html"
  rm -f "$(getvar PATH_OUTPUT_LOCAL)/html/example1-clearly-false-white-swan-simplified-1mapjs.html"
  rm -f "$(getvar PATH_OUTPUT_LOCAL)/html/example1-clearly-false-white-swan-simplified-2mapjs.html"
  rm -f "$(getvar PATH_OUTPUT_LOCAL)/html/example1-clearly-false-white-swan-simplified-meta-mapjs.html"
  rm -f "$(getvar PATH_OUTPUT_LOCAL)/png/f54eea6ed0c060c9d27e1fe3507bfdd75e3e60d4.png"
  rm -f "$(getvar PATH_TEST_LOG)"
}

__save_env() {
  conda env export --from-history --name "$(getvar CONDA_ENV_ARGMAP)" >"$(getvar PATH_FILE_ENV_CONDA)"
  # TODO: Prepare Environment YAML For Distribution
  # https://workflowy.com/#/b0011d3b3ba1
}

## argmap functions

# Convert to map.json, writes it to test/output/mapjs-json/
# lua argmap2mup test/input/example1-clearly-false-white-swan-simplified.yaml > test/output/mapjs-json/example1-clearly-false-white-swan-simplified.json
# TODO add option for .mup vs .json output
a2m() { # a2m test/input/example1-clearly-false-white-swan-simplified.yaml (output path)
  local name
  name=$(basename --suffix=".yaml" "$1") && # && ensures error failure stops remaining commands.
    local output=${2:-$(getvar PATH_DIR_PUBLIC_MAPJS_JSON)/$name.json} &&
    mkdir --parent "$(dirname "$output")" && # Ensures output folder exists
    lua "$(getvar PATH_LUA_ARGMAP)/argmap2mup.lua" "$1" >"$output" &&
    echo "$output" "${@:2}" # Output path can be piped, along with any extra arguments
}

# Convert to map.js and upload
# Declare function inside () to open it in subshell, to stop file_id being remembered, in case variable removed from config file
a2mu() ( # a2mu test/output/example1-simple.yaml
  local name
  name=$(basename --suffix=".yaml" "$1")
  local folder_id
  folder_id=$(getvar GDRIVE_FOLDER_ID_MAPJS_DEFAULT)
  local file_id=""
  file_id=$(getvar GDRIVE_FILE_ID_MAPJS_DEFAULT)
  if [ "$file_id" != "" ]; then # Only includes argument if there is a file id
    upload_id_arg="--gdrive_id $file_id"
  fi
  set -o noglob # I don't want globbing, but I don't want to quote $args because I do want word splitting with $upload_id_arg
  # shellcheck disable=SC2086
  lua "$(getvar PATH_LUA_ARGMAP)/argmap2mup.lua" --upload $upload_id_arg --name "$name.mup" --folder "$folder_id" "$1"
  set +o noglob
  log "Uploaded: $name.mup to GDrive. GDrive Folder URL: https://drive.google.com/drive/u/0/folders/$folder_id"
)

# Convert map.js to argmap yaml format
# TODO add option for .mup vs .json output
m2a() { # m2a test/output/example1-simple.mup (output path)
  local name
  name=$(basename --suffix=".json" "$1")
  local output=${2:-$PATH_OUTPUT_LOCAL/$name.yaml}
  mkdir --parent "$(dirname "$output")" # Ensures output folder exists
  lua "$(getvar PATH_LUA_ARGMAP)/mup2argmap.lua" "$1" >"$output" &&
    echo "$output" # Output path can be piped
}

# Convert to tikz
a2t() { # a2t test/output/example1-simple.yaml (output path)
  local name
  name=$(basename --suffix=".yaml" "$1") &&
    mkdir --parent "$(dirname "$PATH_OUTPUT_LOCAL")" && # Ensures output folder exists
    lua "$(getvar PATH_LUA_ARGMAP)/argmap2tikz.lua" "$1" >"${2:-$PATH_OUTPUT_LOCAL/$name.tex}" &&
    echo "${2:-$PATH_OUTPUT_LOCAL/$name.tex}"
}

pandoc_argmap() { # pandoc_argmap input output template extra_variables
  local input=${1:-""}
  local output=${2:-$(getvar PATH_OUTPUT_LOCAL)/html/pandoc_argmap-test.html}
  local template=${3:-$(getvar FILE_TEMPLATE_HTML_DEFAULT)}
  # TODO: Could replace this with pandoc_defaults_argmap.yaml file, might be easier to selectively override. Should be able to interpolate path variables so it should fit in with yaml config approach.
  #   Plus could set up to override default defaults file with variations, which should make various combinations more portable
  #   Also could potentially generate using pre-processor if desired
  pandoc "$input" -o "$output" --template="$template" "${@:4}" --from=markdown --metadata-file="$(getvar PATH_DIR_MAPJS_ROOT)/$(getvar PATH_FILE_CONFIG_MAPJS)" --metadata-file="$(getvar PATH_FILE_CONFIG_ARGMAP)" --metadata-file="$(getvar PATH_DIR_MAPJS_ROOT)/$(getvar PATH_FILE_CONFIG_MAPJS_PROCESSED)" --metadata-file="$(getvar PATH_FILE_CONFIG_ARGMAP_PROCESSED)" --lua-filter="$(getvar PANDOC_FILTER_LUA_DEFAULT)" --data-dir="$(getvar PANDOC_DATA_DIR)" >/dev/null
}

# Creates full page html intelligently based on input type.
#   Accepts: m, argmap, or json
#  TODO: Create md2x() which gives choice of output - html, fragment, pdf, native format etc
#   Though lua solution might be even better than bash one
2hf() { # 2hf test/input/example.md (output filename) (optional pandoc arguments)
  local default_template=""
  # TODO set quiet to false so test can be == false
  local quiet=""
  local path_output=PATH_OUTPUT_LOCAL

  OPTIND=1
  while getopts ":qps" option; do # Leading ':' in ":p" removes error message if no recognised options
    case $option in
    q) # quiet mode - doesn't print output path at end
      quiet=true
      ;;
    s) # site mode - always sends output to public folder
      path_output=PATH_OUTPUT_PUBLIC
      ;;
    *) ;;
    esac
  done

  shift "$((OPTIND - 1))"

  local input="${1:-$(getvar INPUT_FILE_MD2)}"
  local output_name
  output_name=$(basename "$input")
  local ext=${output_name#*.}

  local name=${output_name%%.*}
  local args=""

  case $ext in
  yml | yaml) # Converts argmap yaml into mindmup json then runs this command again on the output.
    # QUESTION: Is there a way I can pass data straight into json/mup step instead?
    # shellcheck disable=SC2119
    2hf "$(a2m "$input")" | open_debug
    return 0
    ;;
  json | mup) # Injects mindmup json into template
    # TODO If input defaults to cat, write to a file in input folder and then pass path onto pandoc.
    # input=${1:-$(cat)} # If there is an argument, use it as input file, else use stdin (expecting piped input, see open_debug for example).

    #  TODO: Check and copy to input folder?
    local path_output_json
    path_output_json=/$(__get_site_path "$input")
    input=/dev/null # JSON input feeds into template not body
    args="--metadata=quick-container:true --metadata=MAP_INSTANCE_ID:1 --metadata title=$name --metadata=path-json-source:$path_output_json"
    ;;
  md | *) # markdown is default option
    args=""
    ;;
  esac

  # TODO should check whether supplied output has extension already and then act accordingly
  #   Either strip it or choose output format based on ext

  # Substitutes mapjs/public for test so its using public folder, then removes leading part of path:
  #   TODO ideally would be more flexible with output location e.g. default to standard location but pick either filename or whole directory
  local output
  output=$(getvar "$path_output")/html/${2:-$name}.html
  mkdir --parent "$(dirname "$output")" # Ensures output folder exists

  set -o noglob # I don't want globbing, but I don't want to quote $args because I do want word splitting
  # shellcheck disable=SC2086
  pandoc_argmap "$input" "$output" "$default_template" $args "${@:3}"
  set +o noglob

  if [ "$quiet" != true ]; then
    echo "$output"
  fi
}

# Convert markdown to pdf
md2pdf() { # md2pdf test/input/example.md (output filename) (optional pandoc arguments)
  local name output
  name=$(basename --suffix=".md" "$1")
  output=$(getvar PATH_OUTPUT_PUBLIC)/${2:-$name}.pdf
  mkdir --parent "$(dirname "$output")" # Ensures output folder exists
  # Using "${@:3}" to allow 3rd argument onwards to be passed directly to pandoc.
  # QUESTION: Update to use pandoc_argmap?
  pandoc "$1" -o "$output" "${@:3}" --metadata-file="$(getvar PATH_FILE_CONFIG_ARGMAP)" --metadata-file="$(getvar PATH_FILE_CONFIG_ARGMAP_PROCESSED)" --lua-filter="$(getvar PANDOC_FILTER_LUA_DEFAULT)" --pdf-engine lualatex --template="$PATH_ARGMAP_ROOT/examples/example-template.latex" --data-dir="$(getvar PANDOC_DATA_DIR)" >/dev/null &&
    echo "$output"
}

# Convert markdown to native pandoc output
md2np() {
  local input="${1:-$INPUT_FILE_MD2}"
  local name
  name=$(basename --suffix=".md" "$input")
  local output=$PATH_OUTPUT_LOCAL/${2:-$name}.ast
  mkdir --parent "$(dirname "$output")" # Ensures output folder exists
  # QUESTION: Update to use pandoc_argmap?
  pandoc "$input" --to=native --metadata-file="$(getvar PATH_FILE_CONFIG_ARGMAP)" --metadata-file="$(getvar PATH_FILE_CONFIG_MAPJS)" --metadata-file="$(getvar PATH_FILE_CONFIG_ARGMAP_PROCESSED)" --metadata-file="$(getvar PATH_FILE_CONFIG_MAPJS_PROCESSED)" --template "$FILE_TEMPLATE_HTML_DEFAULT" --metadata=toolbar_main:toolbar-mapjs-main -o "$output" --lua-filter="$(getvar PANDOC_FILTER_LUA_DEFAULT)" --data-dir="$PANDOC_DATA_DIR" >/dev/null
  code "$output"
}

# Mark functions for export to use in other scripts:
export -f open_debug __find_rockspec
export -f __reset_repo __clean_repo __check_lua_debug __check_js_debug __save_env __update_repo __find_rockspec __count_config_read_echoes
export -f __get_site_path a2m m2a a2t a2mu pandoc_argmap 2hf md2pdf md2np
