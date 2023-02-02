#!/usr/bin/env bash

main() {
  echo "Running ${BASH_SOURCE[0]}"

  export PATH_DIR_ARGMAP_ROOT="${PATH_DIR_ARGMAP_ROOT:-$WORKSPACE}"

  source "$PATH_DIR_ARGMAP_ROOT/scripts/config_read_functions.lib.sh"

  # TODO could move all env variablaes in this script to argmap.env file, after tidying that up

  export PATH_FILE_ENV_ARGMAP="$PATH_DIR_ARGMAP_ROOT/config/environment-argmap.yaml"
  export PATH_FILE_ENV_ARGMAP_DEFAULTS="$PATH_DIR_ARGMAP_ROOT/config/environment-argmap-defaults.yaml"
  export PATH_FILE_CONFIG_ARGMAP_PATHS="$PATH_DIR_ARGMAP_ROOT/config/config-argmap-paths.yaml"

  # In case env.yaml file doesn't exist, attempt to make a copy from default file, but without overwriting existing one.
  cp --no-clobber "$PATH_FILE_ENV_ARGMAP_DEFAULTS" "$PATH_FILE_ENV_ARGMAP"

  __yaml2env "$PATH_FILE_ENV_ARGMAP" PORT_DEV_SERVER
  __yaml2env "$PATH_FILE_CONFIG_ARGMAP_PATHS" DIR_CONFIG DIR_PROCESSED PATH_DIR_CONFIG_ARGMAP PATH_FILE_PANDOC_DEFAULT_CONFIG_PREPROCESSOR

  # This part more complex now I have separated paths into two files.
  #   QUESTION: If I could combine them into one before processing perhaps it would be easier?
  __yaml2env "$PATH_FILE_ENV_ARGMAP" DIR_MAPJS DIR_PUBLIC
  # __yaml2env "$PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED" PATH_FILE_CONFIG_MAPJS_PATHS_PROCESSED
  # __yaml2env "$PATH_FILE_CONFIG_MAPJS_PATHS_PROCESSED" PATH_FILE_ENV_MAPJS_DEFAULTS PATH_FILE_ENV_MAPJS
  # In case env file doesn't exist, attempt to make a copy from default file, but without overwriting existing one.
  cp --no-clobber "$PATH_DIR_ARGMAP_ROOT/$DIR_MAPJS/$DIR_CONFIG/environment-mapjs-defaults.yaml" "$PATH_DIR_ARGMAP_ROOT/$DIR_MAPJS/$DIR_CONFIG/environment-mapjs.yaml"

  PATH_FILE_ENV_ARGMAP_PROCESSED=$(preprocess_config "$PATH_FILE_ENV_ARGMAP")
  export PATH_FILE_ENV_ARGMAP_PROCESSED
  PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED=$(preprocess_config "$PATH_FILE_CONFIG_ARGMAP_PATHS")
  export PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED

  # Can't use __yaml2env because it's not set to take the -l option
  LIST_FILES_CONFIG_INPUT=$(__getvar_from_yaml -l LIST_FILES_CONFIG_INPUT "$PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED" "$PATH_FILE_ENV_ARGMAP_PROCESSED")
  export LIST_FILES_CONFIG_INPUT

  set -f # I don't want globbing, but I don't want to quote $args because I do want word splitting
  # shellcheck disable=SC2068 # Quoting ${LIST_FILES_CONFIG_PROCESSED[@]} stops it expanding
  LIST_FILES_CONFIG_PROCESSED=$(process_all_config_inputs ${LIST_FILES_CONFIG_INPUT[@]})
  export LIST_FILES_CONFIG_PROCESSED
  set +f
}

main "$@"
