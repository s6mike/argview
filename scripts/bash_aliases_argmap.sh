#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# argmap aliases
alias odb='open-debug' # odb /home/s6mike/git_projects/argmap/mapjs/public/output/mapjs-json/example1-clearly-false-white-swan-simplified-1mapjs_argmap2.json
alias j2hfa='j2hf test/input/mapjs-json/example1-clearly-false-white-swan-simplified.json example1-clearly-false-white-swan-simplified --metadata=argmap-input:true'

# argmap functions

## Functions beginning with __ are for other scripts. They are not considered part of a public API, and therefore updates may change them without warning.

## browser functions

# TODO: Use get-site-path() to simplify relative path juggling

# TODO try shortcut to run test with chrome headless and check that it's correct: https://workflowy.com/#/8aac548986a4
#   Maybe review mapjs tests.

get-site-path() {
  input_path="${1}"
  case $input_path in
  /*)
    full_path=$input_path
    ;;
  *)
    full_path=$WORKSPACE/$input_path
    ;;
  esac
  # Substitutes mapjs/public for test so it's using public folder, then removes leading part of path so its relative to public/:
  site_path="${full_path/test/$DIR_MJS/$DIR_PUBLIC}"
  # echo "site_path: $site_path"
  output_path=$(realpath --no-symlinks --relative-to="$PATH_DIR_PUBLIC" "$site_path")
  echo "$output_path"
}

# For opening html pages with debug port open
open-debug() { # odb /home/s6mike/git_projects/argmap/mapjs/public/output/html/example2-clearly-false-white-swan-v3.html
  # TODO: try chrome headless: https://workflowy.com/#/8aac548986a4
  # TODO: user data dir doesn't seem to work, showing normal linux browser
  __check_server_on
  input_path="${1:-$DIR_HTML/$PATH_OUTPUT_FILE_HTML}"
  site_path=$(get-site-path "$input_path")
  google-chrome --remote-debugging-port="$PORT_DEBUG" --user-data-dir="$PATH_CHROME_PROFILE_DEBUG" --disable-extensions --hide-crash-restore-bubble --no-default-browser-check "http://localhost:$PORT_DEV_SERVER/$site_path" 2>/dev/null &
  disown # stops browser blocking terminal and allows all tabs to open in single window.
}

## version control functions

# Checks `src/lua` for lua files with leftover test/debug code.
# Used by pre-commit hook
__check_repo() {
  grep -Frni "$PATH_DIR_ARGMAP_LUA" -e 'logger:setLevel(logging.DEBUG)' -e 'require("lldebugger").start()'
}

# Used by pre-commit hook
__reset_repo() {
  echo 'Restoring output folder to match remote.'
  git checkout -- "$WORKSPACE/examples/"
  git checkout -- "$WORKSPACE/test/output/"
  git checkout -- "$DIR_PUBLIC_OUTPUT"
}

__clean_repo() {
  rm "$DIR_PUBLIC_OUTPUT/example1-clearly-false-white-swan-simplified.yml"
  # rm "$DIR_PUBLIC_OUTPUT/example1-clearly-false-white-swan-simplified.mup"
  rm "$PATH_MJS_JSON/example1-clearly-false-white-swan-simplified.json"
  rm "$DIR_PUBLIC_OUTPUT/example1-clearly-false-white-swan-simplified.tex"
  rm "$DIR_PUBLIC_OUTPUT/example1-clearly-false-white-swan-simplified-0mapjs.pdf"
  rm "$DIR_PUBLIC_OUTPUT/html/example1-clearly-false-white-swan-simplified-1mapjs-fragment.html"
  rm "$DIR_PUBLIC_OUTPUT/html/example1-clearly-false-white-swan-simplified-0mapjs.html"
  rm "$DIR_PUBLIC_OUTPUT/html/example1-clearly-false-white-swan-simplified-1mapjs.html"
  rm "$DIR_PUBLIC_OUTPUT/html/example1-clearly-false-white-swan-simplified-2mapjs.html"
  rm "$DIR_PUBLIC_OUTPUT/html/example1-clearly-false-white-swan-simplified-meta-mapjs.html"
  rm "$DIR_PUBLIC_OUTPUT/png/f54eea6ed0c060c9d27e1fe3507bfdd75e3e60d4.png"
  rm "$PATH_TEST_LOG"
  # rm "$INPUT_FILE_JSON"
}

__save_env() {
  conda env export --from-history --name "$CONDA_ENV_ARGMAP" >"$ENV_FILE"
  # TODO: Prepare Environment YAML For Distribution
  # https://workflowy.com/#/b0011d3b3ba1
}

## argmap functions

# Convert to map.json, writes it to test/output/mapjs-json/
# lua argmap2mup test/input/example1-clearly-false-white-swan-simplified.yml > test/output/mapjs-json/example1-clearly-false-white-swan-simplified.json
# TODO add option for .mup vs .json output
a2m() {                                    # a2m test/input/example1-clearly-false-white-swan-simplified.yml (output path)
  name=$(basename --suffix=".yml" "$1") && # && ensures error failure stops remaining commands.
    output=${2:-$PATH_MJS_JSON/$name.json} &&
    echo "output: $output" "${@:2}" &&
    mkdir --parent "$(dirname "$output")" && # Ensures output folder exists
    lua "$PATH_DIR_ARGMAP_LUA/argmap2mup.lua" "$1" >"$output" &&
    echo "$output" "${@:2}" # Output path can be piped, along with any extra arguments
}

# Convert to map.js and upload
a2mu() { # a2mu test/output/example1-simple.yml
  name=$(basename --suffix=".yml" "$1") &&
    lua "$PATH_DIR_ARGMAP_LUA/argmap2mup.lua" --upload --name "$name.mup" --folder 1cSnE4jv5f1InNVgYg354xRwVPY6CvD0x "$1" &&
    echo "Uploaded: $name.mup to GDrive."
}

# Convert map.js to argmap yaml format
# TODO add option for .mup vs .json output
m2a() { # m2a test/output/example1-simple.mup (output path)
  name=$(basename --suffix=".json" "$1")
  output=${2:-$DIR_PUBLIC_OUTPUT/$name.yml}
  mkdir --parent "$(dirname "$output")" # Ensures output folder exists
  lua "$PATH_DIR_ARGMAP_LUA/mup2argmap.lua" "$1" >"$output" &&
    echo "$output" # Output path can be piped
}

# Convert to tikz
a2t() { # a2t test/output/example1-simple.yml (output path)
  name=$(basename --suffix=".yml" "$1") &&
    mkdir --parent "$(dirname "$DIR_PUBLIC_OUTPUT")" && # Ensures output folder exists
    lua "$PATH_DIR_ARGMAP_LUA/argmap2tikz.lua" "$1" >"${2:-$DIR_PUBLIC_OUTPUT/$name.tex}" &&
    echo "${2:-$DIR_PUBLIC_OUTPUT/$name.tex}"
}

# Convert markdown to full page html
# IDEA: Could combine md2htm by checking for an argument like --fragment and witholding template argument etc
#   Would need to use getopts and then pop the --fragment so that the number of other arguments are not affected
md2hf() { # md2h test/input/example.md (output filename) (optional pandoc arguments)
  input="${1:-$INPUT_FILE_MD2}"
  name=$(basename --suffix=".md" "$input")
  output=$DIR_PUBLIC_OUTPUT/html/${2:-$name}.html
  mkdir --parent "$(dirname "$output")" # Ensures output folder exists
  # QUESTION: Is it worth putting some of these settings into a metadata or defaults file?
  # If so, how would I easily update it?
  # Useful? --metadata=curdir:X
  # css here overrides the template value, which may not be what I want. Not sure best way to handle.
  # https://workflowy.com/#/ee624e71f40c
  # Using "${@:3}" to allow 3rd argument onwards to be passed directly to pandoc.
  pandoc "$input" "${@:3}" --template "$FILE_TEMPLATE_HTML_ARGMAP_MAIN" --metadata=mapjs-output-js:"$FILE_MJS_JS" --metadata=css:"$MJS_CSS" -o "$output" --lua-filter="$PATH_DIR_ARGMAP_LUA/pandoc-argmap.lua" "--metadata=lang:$LANGUAGE_PANDOC" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "$output"
  # QUESTION: Might want to make debug default, but with test option for normal?
  #  open-server "$DIR_HTML_SERVER_OUTPUT/html/$name.html"
  open-debug "$output"
  # TODO construct link from server details and output it?
}

# j2hf public/output/mapjs-json/example1-clearly-false-white-swan-simplified-1mapjs-argmap2.json (output filename) (optional pandoc arguments)
# shellcheck disable=SC2120 # Disables lint error from a2hf() passing to j2hf
j2hf() { # j2hfa Default output with argmap input activated
  # TODO If input defaults to cat, write to a file in input folder and then pass path onto pandoc.
  # input=${1:-$(cat)} # If there is an argument, use it as input file, else use stdin (expecting piped input)
  input="${1:-$INPUT_FILE_JSON}"
  # Substitutes mapjs/public for test so its using public folder, then removes leading part of path:

  # Removes either suffix:
  name=$(basename --suffix=".json" "$input")
  name=$(basename --suffix=".mup" "$name")
  html_output=$DIR_PUBLIC_OUTPUT/html/${2:-$name}.html
  mkdir --parent "$(dirname "$html_output")" # Ensures output folder exists

  #  TODO: Check and copy to input folder?
  path_output_json=/$(get-site-path "$input")
  # mkdir --parent "$(dirname "$path_output_json")" # Ensures JSON output folder exists
  # Using "${@:3}" to allow 3rd argument onwards to be passed directly to pandoc.
  # Add --metadata=argmap-input:true to enable argmap input functionality:
  echo "" | pandoc --template "$FILE_TEMPLATE_HTML_ARGMAP_MAIN" -o "$html_output" "${@:3}" --metadata=quick-container:true --metadata=BLOCK_ID:"1" --metadata title="$name" --metadata=path-json-source:"$path_output_json" --metadata=css:"$MJS_CSS" "--metadata=lang:$LANGUAGE_PANDOC" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "$html_output"
  open-debug "$html_output"
}

a2hf() { # a2hf test/input/example1-clearly-false-white-swan-simplified.yml
  a2m "$1" | j2hf
}

# Convert markdown to html fragment
# QUESTION Would it be better to swap round md2htm and m2dhf names?
# Currently using include after body, which works fine.
#   QUESTION: Use lua filter to include webpack js output instead?
md2htm() { # md2htm test/input/markdown/example-updated.md (output filename) (optional pandoc arguments)
  input="${1:-$INPUT_FILE_MD}"
  name=$(basename --suffix=".md" "$input")-fragment
  output=$DIR_PUBLIC_OUTPUT/html/${2:-$name}.html
  mkdir --parent "$(dirname "$output")" # Ensures output folder exists
  # TODO: Put this into new function?
  # Or use a defaults file:
  # https://workflowy.com/#/ee624e71f40c
  # Using "${@:3}" to allow 3rd argument onwards to be passed directly to pandoc.
  pandoc "$input" -o "$output" "${@:3}" --include-after-body "$PATH_DIR_INCLUDES/webpack-dist-tags.html" --metadata=css:"$MJS_CSS" --lua-filter="$PATH_DIR_ARGMAP_LUA/pandoc-argmap.lua" "--metadata=lang:$LANGUAGE_PANDOC" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "$output"
  open-debug "$output"
}

# Convert markdown to pdf
md2pdf() { # md2pdf test/input/example.md (output filename) (optional pandoc arguments)
  # __check_server_on # No point since open-debug runs it too.
  name=$(basename --suffix=".md" "$1")
  output=$DIR_PUBLIC_OUTPUT/${2:-$name}.pdf
  mkdir --parent "$(dirname "$output")" # Ensures output folder exists
  # Using "${@:3}" to allow 3rd argument onwards to be passed directly to pandoc.
  pandoc "$1" -o "$output" "${@:3}" --lua-filter="$PATH_DIR_ARGMAP_LUA/pandoc-argmap.lua" --pdf-engine lualatex --template "$WORKSPACE/examples/example-template.latex" "--metadata=lang:$LANGUAGE_PANDOC" --data-dir="$PANDOC_DATA_DIR" >/dev/null &&
    echo "$output"
  open-debug "$output"
  # open-server "$DIR_HTML_SERVER_OUTPUT/$name.pdf"
}

## Mark functions for export to use in other scripts:
export -f __reset_repo __clean_repo __check_repo __save_env
export -f get-site-path
export -f a2m m2a a2t a2mu md2htm md2hf md2pdf j2hf a2hf
