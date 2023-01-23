#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# To test: test_getvar

# aliases
alias cv='checkvar_exists'
alias gv='getvar'
alias gvy='__getvar_yaml_any'
alias pc='preprocess_config'

export PATH_FILE_ENV_ARGMAP=$WORKSPACE/config/environment-argmap.yml

# Replace echo with this where not piping output
log() {
  printf "%s\n" "$*" >&2
}

__check_exit_status() {
  exit_status=$1
  result=$2
  if [[ $exit_status == 0 ]]; then
    echo "$result"
  else
    log "$3"
  fi
  return "$exit_status"
}

# Alternative: compgen -v | grep full match?
checkvar_exists() {
  [[ -v $1 ]]
}

# This is used to get yaml data, all other config reading functions call it.
#   REMEMBER: ${VARIABLES} are only expanded if they are bash env variables, otherwise they are left blank.
__getvar_from_yaml() { # __getvar_from_yaml PATH_FILE_CONFIG_MJS $PATH_FILE_ENV_ARGMAP
  variable_name="$1"
  files=("${@:2}") # Takes 2nd argument onwards and uses them all as yaml files
  yaml_source=("${files[@]:-$PATH_FILE_ENV_ARGMAP}")

  # For this yq: https://github.com/kislyuk/yq, which is on conda
  # result=${!variable_name:-$(yq -r --exit-status --yml-out-ver=1.2 ".$variable_name | select( . != null)" $PATH_FILE_ENV_ARGMAP $PATH_FILE_CONFIG_MJS $PATH_FILE_CONFIG_ARGMAP)}
  result=$(yq -r --exit-status --no-doc ".$variable_name | ...comments=\"\" | select( . != null) | to_yaml | envsubst(nu,ne)" "${yaml_source[@]}")
  __check_exit_status $? "$result"
}

# Looks up each argument in yaml and exports it as env variable
__yaml2env() { # __yaml2env PATH_FILE_CONFIG_MJS
  yaml_file=${1:-PATH_FILE_ENV_ARGMAP}
  shift
  for env_var_name in "$@"; do
    env_var_value=$(__getvar_from_yaml "$env_var_name" "$yaml_file")
    export "$env_var_name"="$env_var_value"
  done
}

# TODO: Deprecate PATH_MJS_HOME in favour of PATH_DIR_MJS
count_characters() {
  target_config_file=$1
  char=${2:-'$'}
  tr -cd "$char" <"$target_config_file" | wc -c
}

# TODO: combine all non PRIVATE processed variables into one file
# QUESTIOn: Possible to build defaults file from template referencing other variables, using this function?
preprocess_config() { # pc /home/s6mike/git_projects/argmap/config/config-argmap.yml
  target_config_file=${1:-$PATH_FILE_ENV_ARGMAP}
  # Strips yaml extension then adds on this one:

  # local mkdir --parent "$(dirname "$DIR_PUBLIC_OUTPUT")
  local filename
  filename=$(basename "$target_config_file")
  target_dir="$(dirname "$target_config_file")/$DIR_PROCESSED"
  mkdir --parent "$target_dir"
  output_file="$target_dir/${filename%%.*}-processed.yaml"

  # Get key value pairs with $, omitting nested $var values (e.g. LIST_FILES_CONFIG)
  #   with_entries(select(.value == "*$*"))'
  # Get nested key value pairs:
  #  'with_entries(select(.value.[] == "*$*"))'
  # Think this solves it (but won't go deeper than 1 list level)
  yq_query='explode(.) | ...comments="" | with_entries(select(.value == "*$*" or .value.[] == "*$*"))'
  yq -r --exit-status "$yq_query" "$target_config_file" >"$output_file"
  # TODO if no values found then quit

  # This line create new file, comment it out and output file will be expanded version of original
  target_config_file="$output_file"

  # Loops until no $vars left or until processing doesn't reduce dollars.
  #   Though that might be too strict since it's possible expanding a $ may return another $
  #   and then count will stay the same even though it's making progress.
  #   In which case need to count a few repeated loops
  while
    dollar_count=$(count_characters "$target_config_file" '$')
    [[ "$dollar_count" -gt 0 ]] && [ "$dollar_count" != "$prev_dollar_count" ]
  do
    # QUESTION: simpler option than pandoc?
    pandoc /dev/null --output="$output_file" --template="$target_config_file" --defaults="$PATH_FILE_PANDOC_DEFAULT_CONFIG_PREPROCESSOR" || return 1

    target_config_file="$output_file"
    prev_dollar_count="$dollar_count"
  done

  if [[ "$dollar_count" -gt 0 ]]; then
    log "ERROR: Still $dollar_count unprocessed variables in $output_file."
  fi

  if [[ "$target_config_file" == "$output_file" ]]; then
    echo "$output_file"
  fi
}

PATH_FILE_ENV_ARGMAP_PROCESSED=$(preprocess_config "" "$PATH_FILE_ENV_ARGMAP")
export PATH_FILE_ENV_ARGMAP_PROCESSED

process_all_config_inputs() {
  for config_file_input in "$@"; do
    preprocess_config "$config_file_input"
  done
}

# ISSUE: this currently omits mapjs/config/processed/config-mapjs-processed.yaml because it has errors
#   Doesn't matter because nothing to expand
set -f # I don't want globbing, but I don't want to quote $args because I do want word splitting
# shellcheck disable=SC2068 # Quoting ${LIST_FILES_CONFIG_PROCESSED[@]} stops it expanding
LIST_FILES_CONFIG_PROCESSED=$(process_all_config_inputs ${LIST_FILES_CONFIG_INPUT[@]})
export LIST_FILES_CONFIG_PROCESSED
set +f

__getvar_yaml_any() { # gvy
  set -f              # I don't want globbing, but I don't want to quote it because I do want word splitting
  # shellcheck disable=SC2068 # Quoting ${YAML_FILES[@]} stops it expanding
  __getvar_from_yaml "$1" ${YAML_FILES[@]}
  set +f
}

# TEST: test_getvar()
getvar() { # gq PATH_FILE_CONFIG_MJS
  variable_name=$1
  # First checks whether env variable exists
  if checkvar_exists "$variable_name"; then
    result=${!variable_name}
  else
    result=$(__getvar_yaml_any "$variable_name")
    # TODO cache with env variable?
    #   export "$variable_name"="$result"
  fi
  __check_exit_status $? "$result" "$variable_name not found"
}

export -f __check_exit_status checkvar_exists __getvar_from_yaml __getvar_yaml_any __yaml2env getvar process_all_config_inputs
export -f log
