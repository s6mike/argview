#!/usr/bin/env bash

echo "Running ${BASH_SOURCE[0]}"

# To test: test_getvar

# aliases
alias cv='checkvar_exists'
alias gv='getvar'
alias gvy='__getvar_yaml_any'

export PATH_FILE_ENV_ARGMAP=$WORKSPACE/environment-argmap.yml

__check_exit_status() {
  exit_status=$1
  result=$2
  # echo exit_status: $exit_status
  if [[ $exit_status == 0 ]]; then
    echo "$result"
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
__yaml2env "$PATH_FILE_ENV_ARGMAP" DIR_MJS PATH_DIR_MJS PATH_FILE_ENV_MAPJS PATH_FILE_ENV_ARGMAP_PRIVATE PATH_MJS_HOME PATH_FILE_CONFIG_ARGMAP PATH_FILE_CONFIG_MJS PATH_FILE_CONFIG_MJS PATH_FILE_CONFIG_ARGMAP PATH_FILE_ENV_CONDA

# readarray YAML_FILES < <(yq -r '.LIST_FILES_CONFIG[] | envsubst(nu,ne)' "$PATH_FILE_ENV_ARGMAP")
YAML_FILES="$(yq -r '.LIST_FILES_CONFIG[] | envsubst(nu,ne)' "$PATH_FILE_ENV_ARGMAP")"
export YAML_FILES

__getvar_yaml_any() { # gvy
  set -f              # I don't want globbing, but I don't want to quote it because I do want word splitting
  # shellcheck disable=SC2068 # Quoting ${YAML_FILES[@]} stops it expanding
  __getvar_from_yaml "$1" ${YAML_FILES[@]}
  set +f
}

getvar() { # gq PATH_FILE_CONFIG_MJS
  variable_name=$1
  if checkvar_exists "$variable_name"; then
    result=${!variable_name}
  else
    result=$(__getvar_yaml_any "$variable_name")
  fi
  __check_exit_status $? "$result"
}

export -f __check_exit_status checkvar_exists __getvar_from_yaml __getvar_yaml_any __yaml2env getvar
