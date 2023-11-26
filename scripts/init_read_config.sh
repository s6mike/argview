#!/usr/bin/env bash
# shellcheck disable=SC2034
# Turns off unused variable warning, since exports are implicit due to set -o allexport

main() {
  # Bootstraps the config file processing (var expansion).
  # Process is to define initial variables which are needed to locate the first 2 env files
  #  Then look up key values in relevant files in yaml2env
  #   Can then preprocess initial files, and then makefile can take over.
  #   Want to migrate more of this logic to makefile, since it's more efficient at only updating the processed files when necessary,  instead of every shell start

  echo "Running ${BASH_SOURCE[0]}"

  # QUESTION: Can I put min startup into separate environment file?
  #  Could then reference directly from makefile
  # export PATH_ARGMAP_ROOT="${PATH_ARGMAP_ROOT:-$PATH_ARGMAP_ROOT}"

  source "$PATH_ARGMAP_ROOT/scripts/config_read_functions.lib.sh"

  # TODO could move all env variables in this script to argmap.env file, after tidying that up
  # set -o allexport
  # PATH_FILE_ENV_ARGMAP="$PATH_ARGMAP_ROOT/config/environment-argmap.yaml"
  # PATH_FILE_ENV_ARGMAP_DEFAULTS="$PATH_ARGMAP_ROOT/config/environment-argmap-defaults.yaml"
  # PATH_FILE_CONFIG_ARGMAP_PATHS="$PATH_ARGMAP_ROOT/config/config-argmap-paths.yaml"
  # set +o allexport

  # In case env.yaml file doesn't exist, attempt to make a copy from default file, but without overwriting existing one.
  make "$PATH_FILE_ENV_ARGMAP"

  __yaml2env "$PATH_FILE_ENV_ARGMAP" PORT_DEV_SERVER
  __yaml2env "$PATH_FILE_CONFIG_ARGMAP_PATHS" PATH_FILE_PANDOC_DEFAULT_CONFIG_PREPROCESSOR

  # This part more complex now I have separated paths into two files.
  #   QUESTION: If I could combine them into one before processing perhaps it would be easier?
  __yaml2env "$PATH_FILE_ENV_ARGMAP" DIR_MAPJS DIR_PUBLIC PATH_ENVIRONMENT_GLOBAL PATH_BIN_GLOBAL

  # In case env file doesn't exist, attempt to make a copy from default file, but without overwriting existing one.
  make "$PATH_ARGMAP_ROOT/$DIR_MAPJS/$DIR_CONFIG/environment-mapjs.yaml"

  set -o allexport

  # Processes initial files needed for rest
  PATH_FILE_ENV_ARGMAP_PROCESSED="$PATH_DIR_CONFIG_ARGMAP_PROCESSED/environment-argmap-$KEYWORD_PROCESSED.yaml"
  PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED="$PATH_DIR_CONFIG_ARGMAP_PROCESSED/config-argmap-paths-$KEYWORD_PROCESSED.yaml"
  set +o allexport

  # make prints

  make "$PATH_FILE_ENV_ARGMAP_PROCESSED"
  make "$PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED"

  __yaml2env "$PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED" PATH_DIR_CONFIG_MAPJS PATH_FILE_ENV_ARGMAP_PRIVATE

  make "$PATH_FILE_ENV_ARGMAP_PRIVATE"

  # Can't use __yaml2env because it's not set to take the -l option
  # TODO though that might not matter now if I put this at the end:  | sed 's/^- //
  LIST_FILES_CONFIG_PROCESSED=$(__getvar_from_yaml -e LIST_FILES_CONFIG_PROCESSED "$PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED" "$PATH_FILE_ENV_ARGMAP_PROCESSED" | tr '\n' ' ')
  export LIST_FILES_CONFIG_PROCESSED

  # make prints

  # Process remaining config files
  #   QUESTION: Better to define above variables as part of make call instead of exporting them?
  make config # --warn-undefined-variables or -d for debugging

  # TODO cover this with make config
  LIST_FILES_CONFIG_INPUT=$(__getvar_from_yaml LIST_FILES_CONFIG_INPUT "$PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED" "$PATH_FILE_ENV_ARGMAP_PROCESSED")
  export LIST_FILES_CONFIG_INPUT
}
main "$@"
