#!/usr/bin/env bash

# rockspec QA: lints and makes rockspec to ensure it is valid.
# Run in project directory itself, not test project.

# If there is more than 1 rockspec, might run wrong one, or maybe both?
ROCKSPEC_FILE=$(find ~+ -type f -name "argmap-*.rockspec") # Gets absolute path
export ROCKSPEC_FILE

echo "*** Checking: $ROCKSPEC_FILE ***"

INSTALL_DIR="$PROJECT_DIR/argmap"
LUA_FOLDER="lua_modules"

luarocks lint "$ROCKSPEC_FILE"

cd "$INSTALL_DIR" || {
  echo "Abandoning QA install."
  exit 1
}

echo -e "***Deleting: $INSTALL_DIR/$LUA_FOLDER ***\n"

rm -R "$LUA_FOLDER"

luarocks --tree "$INSTALL_DIR/$LUA_FOLDER" make --only-deps "$ROCKSPEC_FILE" YAML_LIBDIR=/opt/miniconda3/envs/argmap/lib/ # DEPS_DIR=/opt/miniconda3/envs/argmap/
