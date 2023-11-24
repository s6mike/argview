#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# To test: test_getvar

# aliases
alias cv='checkvar_exists'
alias gv='getvar'
alias gvy='__getvar_yaml_any'
alias pc='preprocess_config'

# Replace echo with this where not piping output
log() {
  printf "%s\n" "$*" >&2
}

__check_exit_status() {
  exit_status=$1
  result=$2
  if [[ $exit_status == 0 ]] && [[ $result != "" ]]; then
    echo "$result"
  else
    log "$3"
  fi
  return "$exit_status"
}

# Alternative: compgen -v | grep full match?
checkvar_exists() {
  [[ -v "$1" ]]
}

# To test: test_getvar
# This is used to get yaml data, all other config reading functions call it.
#  REMEMBER: ${VARS} are only expanded in -e mode, and if they are already bash env variables, otherwise they are left blank.
# TODO: improve so that if 2 values concatenated and one doesn't expand, the other still does
__getvar_from_yaml() { # __getvar_from_yaml (-el) PATH_FILE_CONFIG_MAPJS $PATH_FILE_ENV_ARGMAP
  # Filters out $variable results at root and list level
  local yq_flags=(--unwrapScalar --exit-status)
  local query_main="| explode(.) | ...comments=\"\" | select( . != null)"
  local query_opts=""
  local query_extra=('select(document_index == 0)')

  OPTIND=1
  while getopts ":el" option; do # Leading ':' removes error message if no recognised options
    # ISSUE: opt order makes a difference, since only last one is used
    case $option in
    e) # env mode - interpolates env variables. Should only be needed during config initialisation
      # Could also use envsubst as a shell function
      # Have set to exclude results with $ in them (after expansion)
      query_opts=" | to_yaml | envsubst(nu,ne) | select( . != \"*\${*}*\")"
      ;;
    l) # (de)list mode - returns a list in argument format.
      # Though since I've added  | sed 's/^- //' to main query to remove leading hyphens, this option no longer makes any difference.
      query_opts=" | .[]"
      ;;
    *) ;;
    esac
  done

  shift "$((OPTIND - 1))"

  variable_name="$1"
  files=("${@:2}") # Takes 2nd argument onwards and uses them all as yaml files
  yaml_source=("${files[@]:-$PATH_FILE_ENV_ARGMAP_PROCESSED}")

  # For python yq: https://github.com/kislyuk/yq, which is on conda
  #   result=${!variable_name:-$("$PATH_FILE_YQ"-r --exit-status --yml-out-ver=1.2 ".$variable_name | select( . != null)" $PATH_FILE_ENV_ARGMAP $PATH_FILE_CONFIG_MAPJS $PATH_FILE_CONFIG_ARGMAP)}

  set -f
  # shellcheck disable=SC2068 # Quoting ${files[@]} stops it expanding
  result=$("$PATH_FILE_YQ" "${yq_flags[@]}" ".$variable_name $query_main $query_opts" ${yaml_source[@]} | "$PATH_FILE_YQ" "${query_extra[@]}" | sed 's/^- //')
  # shellcheck disable=SC2068 # Quoting ${files[@]} stops it expanding
  # echo >&2 "query: $("$PATH_FILE_YQ" "${yq_flags[@]}" ".$variable_name $query_main $query_opts" ${yaml_source[@]} | "$PATH_FILE_YQ" "${query_extra[@]}")"

  # echo >&2 "result1: $result"
  # Not quoted so that all list elements are normalised. set -f stops globbing
  # shellcheck disable=SC2086
  result=$(__normalise_if_path "$result")

  # TODO
  #   Check if result is a list. If so, do delist part.

  # Only returns multiple results if in list mode, otherwise just first result (so unprocessed results are ignored)
  # __check_exit_status $? "${result[0]}" "$variable_name not found in ${yaml_source[*]} using .$variable_name $query_rest $query_list"
  __check_exit_status $? "$result" "$variable_name not found while running yq '.$variable_name $query_main $query_opts' ${yaml_source[*]} ${yaml_source[*]} | yq '${query_extra[*]}'"
  set +f
}

# Looks up each argument in yaml and exports it as env variable
__yaml2env() { # __yaml2env PATH_FILE_CONFIG_MAPJS
  # yaml_file=${1:-PATH_FILE_ENV_ARGMAP}
  yaml_file=${1:-PATH_FILE_ENV_ARGMAP_PATHS}
  shift
  for env_var_name in "$@"; do
    env_var_value=$(__getvar_from_yaml -e "$env_var_name" "$yaml_file")
    # log "$env_var_name=$env_var_value"
    export "$env_var_name"="$env_var_value"
  done
}

count_characters() {
  target_config_file=$1
  char=${2:-'$'}
  tr -cd "$char" <"$target_config_file" | wc -c
}

# TODO: combine all non PRIVATE processed variables into one file
# QUESTION: Possible to build defaults file from template referencing other variables, using this function?
#   When adding new config file, don't forget to update pandoc defaults
preprocess_config() { # pc /home/s6mike/git_projects/argmap/config/config-argmap.yaml
  input_config_file=${1:-$PATH_FILE_ENV_ARGMAP}

  local filename
  local repeat_count=0
  filename=$(basename "$input_config_file")

  # processed_dir="$(dirname "$input_config_file")/$KEYWORD_PROCESSED"
  # TODO This won't distinguish between mapjs and argmap
  # processed_dir="${PATH_DIR_CONFIG_ARGMAP_PROCESSED}"

  # Strips yaml extension then adds on this one:
  # output_file="$processed_dir/${filename%%.*}-processed.yaml"
  output_file="${2:-"$(dirname "$input_config_file")/$KEYWORD_PROCESSED/${filename%%.*}-processed.yaml"}"

  # echo "output_file: $output_file"
  mkdir --parent "$(dirname "$output_file")"

  # Get key value pairs with $, omitting nested $var values (e.g. LIST_FILES_CONFIG)
  #   with_entries(select(.value == "*$*"))'
  # Get nested key value pairs:
  #  'with_entries(select(.value.[] == "*$*"))'
  # Think this solves it (but won't go deeper than 1 list level)
  yq_query='explode(.) | ...comments="" | with_entries(select(.value == "*$*" or .value.[] == "*$*"))'
  # echo "PATH_DIR_CONFIG_ARGMAP_PROCESSED: $PATH_DIR_CONFIG_ARGMAP_PROCESSED"
  # shellcheck disable=SC2016 # This vars needs to be single quoted
  use_env_vars='$HOME $PATH_DIR_CONFIG_ARGMAP_PROCESSED $ENV $MODE $CONDA_ENV_ARGMAP $WORKSPACE $PATH_DIR_SCRIPTS $PATH_DIR_ARGMAP_ROOT $PATH_FILE_YQ $PATH_FILE_ENV_ARGMAP $PATH_FILE_ENV_ARGMAP_DEFAULTS $PATH_FILE_CONFIG_ARGMAP_PATHS'

  if [ -z "$PATH_FILE_CONFIG_ARGMAP_PATHS" ]; then # only sources if necessary
    source "$PATH_FILE_ARGMAP_DOT_ENV"             # Might not be necessary but just to ensure it's always used
  fi
  # Substitutes only specific env variables, found in argmap.env, to ensure no empty variables are substituted
  "$PATH_FILE_YQ" -r --exit-status "$yq_query" "$input_config_file" | envsubst "$use_env_vars" >"$output_file"

  # TODO if no values found then quit

  # This line create new file, comment it out and output file will be expanded version of original
  target_config_file="$output_file"

  # Loops until no $vars left or until processing doesn't reduce dollars for more than 3 iterations.
  while
    dollar_count=$(count_characters "$target_config_file" '$')
    [[ "$dollar_count" -gt 0 ]] && [ "$repeat_count" -lt 4 ]
  do
    # QUESTION: simpler option than pandoc? maybe lua template module or bash search or yq?
    # NOTE, no error detection because defaults file includes processed files which don't exist on first few runs, and therefore trigger errors during normal operation.
    processed_metadata_file=""
    if [ -f "$PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED" ]; then # If file exists
      processed_metadata_file="--metadata-file=$PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED"
    fi
    set -f
    tmpfile=$(mktemp) # Temp file because piping original file makes it empty for some reason
    # shellcheck disable=SC2086 # Quoting $processed_metadata_file makes it appear as an argument even when an empty string
    pandoc /dev/null --metadata=PATH_DIR_ARGMAP_ROOT:"$PATH_DIR_ARGMAP_ROOT" --template="$target_config_file" --defaults="$PATH_FILE_PANDOC_DEFAULT_CONFIG_PREPROCESSOR" --metadata-file="$PATH_FILE_ENV_ARGMAP_PROCESSED" $processed_metadata_file | envsubst "$use_env_vars" >"$tmpfile" && mv "$tmpfile" "$output_file"
    set +f
    target_config_file="$output_file"

    # Checks for possible infinite loop:
    if [ "$dollar_count" == "$prev_dollar_count" ]; then
      repeat_count=$((repeat_count + 1))
    fi

    prev_dollar_count="$dollar_count"
  done

  if [[ "$dollar_count" -gt 0 ]]; then
    log "ERROR: Still $dollar_count unprocessed variables in $output_file"
  fi

  if [[ "$target_config_file" == "$output_file" ]]; then
    echo "$output_file"
  fi
}

process_all_config_inputs() {
  for config_file_input in "$@"; do
    preprocess_config "$config_file_input"
  done
}

__getvar_yaml_any() { # gvy
  set -f              # I don't want globbing, but I don't want to quote it because I do want word splitting
  # shellcheck disable=SC2068 # Quoting ${LIST_FILES_CONFIG_PROCESSED[@]} stops it expanding
  __getvar_from_yaml "$@" ${LIST_FILES_CONFIG_PROCESSED[@]} ${LIST_FILES_CONFIG_INPUT[@]} # $list_files_config_processed
  set +f
}

__normalise_if_path() {
  result="$1"
  if [[ $1 == *"/"* ]]; then
    base_path=${PATH_DIR_ARGMAP_ROOT}

    set -f # Disable globbing, since can't use quotes
    # Options set: canonicalize non-existent paths, want mapjs ones relative to mapjs, don't want to follow symlinks
    #   Removes /./ etc from paths
    # shellcheck disable=SC2086
    result=$(realpath --no-symlinks --canonicalize-missing --relative-base="$base_path" $1)
    set +f
  fi

  echo "$result"
}

# This looks up variables.
#   It can pass on -opts to __getvar_yaml_any, but this doesn't happen if value stored in an env variable
#   So results can be unpredictable.
#   TEST: test_getvar()
getvar() { # gq PATH_FILE_CONFIG_MAPJS
  variable_name="$1"
  # First checks whether env variable exists
  if checkvar_exists "$variable_name"; then
    result=${!variable_name}
  else
    result=$(__getvar_yaml_any "$@")
    # TODO cache with env variable?
    #   export "$variable_name"="$result"
  fi
  result=$(__normalise_if_path "$result")
  __check_exit_status $? "$result" "$variable_name not found"
}

export -f __check_exit_status checkvar_exists __getvar_from_yaml __getvar_yaml_any __yaml2env getvar process_all_config_inputs
export -f log preprocess_config count_characters __normalise_if_path
