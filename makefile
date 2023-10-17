# Makefile for Argumend - currently just creates symlinks

# Needed for substitutions to work when calling bash function
SHELL := /bin/bash

# TODO 
#		Add make test
#		Add make help e.g. https://stackoverflow.com/questions/8811526/using-conditional-rules-in-a-makefile

# Avoids collisions with filenames
#		-- is convention for private targets
.PHONY: all --public --conda config prints clean # dev

# Stops intermediate files being deleted (e.g. content/X.html)
# .SECONDARY:

# Define variables

# := simple, assigned once
# 	Need to export required variables at end of argmap_init_script.sh:

# TODO Move to env file
PATH_PROFILE_LOCAL := /home/s6mike/.local
# PATH_LUA_ARGMAP := ${PATH_DIR_ARGMAP_LUA}
#	TODO: /output: Add variable, or replace /output with basename "$(getvar DIR_PUBLIC_OUTPUT)"
LINK_TARGETS_PUBLIC := ${PATH_PUBLIC}/output ${PATH_PUBLIC}/input

# Add index.html
# 	TODO: Use netlify redirect instead
LINK_TARGETS_PUBLIC += ${PATH_PUBLIC}/index.html
# Ensure lua dependencies available to site for client_argmap2mapjs
# LINK_TARGETS_PUBLIC += ${PATH_PUBLIC}/lua ${PATH_PUBLIC}/lua_modules

LINK_TARGETS_CONDA := ${PATH_PROFILE_LOCAL}/bin/lua
LINK_TARGETS_CONDA += ${PATH_PROFILE_LOCAL}/bin/convert # Only needed for pre-commit hook
# Connects legacy data-folder to conda env:
# 	TODO: add this to conda activation, and delete this link when env deactivated?
# 	NOTE: can use defaults file to set defalt data directory, should simplify.
# 	Alternative is always to use --data-directory "$CONDA_PREFIX/share/pandoc/" when calling pandoc
LINK_TARGETS_CONDA += ${PATH_PROFILE_LOCAL}/share/pandoc

# For vscode pandoc extensions:
#		Currently no link:
#			LINK_TARGETS_CONDA += ${CONDA_PREFIX}/share/pandoc/config_argmap.lua
LINK_TARGETS_CONDA += ${CONDA_PREFIX}/share/lua/5.3/config_argmap.lua
# For calling from shell
LINK_TARGETS_CONDA += ${CONDA_PREFIX}/bin/argmap2mup
LINK_TARGETS_CONDA += ${CONDA_PREFIX}/bin/argmap2tikz
LINK_TARGETS_CONDA += ${CONDA_PREFIX}/bin/mup2argmap
# Adds lua and template files to pandoc data-folder:
LINK_TARGETS_CONDA += ${CONDA_PREFIX}/share/pandoc/filters/pandoc-argmap.lua
LINK_TARGETS_CONDA += ${CONDA_PREFIX}/share/pandoc/templates/examples/example-template.latex

CONFIG_PROCESSED := ${PATH_FILE_CONFIG_ARGMAP_PATHS_PROCESSED} ${PATH_FILE_CONFIG_ARGMAP_PROCESSED} ${PATH_FILE_ENV_ARGMAP_PROCESSED} ${PATH_FILE_ENV_ARGMAP_PRIVATE_PROCESSED}
# PATH_FILE_CONFIG_MAPJS_PATHS_PROCESSED

# ###########

all: --public --conda config

--public: ${LINK_TARGETS_PUBLIC}
--conda: ${LINK_TARGETS_CONDA}
# TODO: make into --config (and update .PHONY)
config: ${CONFIG_PROCESSED}

# dev:
# 	make all
# 	netlify dev

prints:
# $(info PATH_PUBLIC:)
# $(info ${PATH_PUBLIC})
# $(info PATH_TEST:)
# $(info ${PATH_TEST})
# $(info LINK_TARGETS_CONDA:)
# $(info ${LINK_TARGETS_CONDA})	
	$(info CONFIG_PROCESSED:)
	$(info ${CONFIG_PROCESSED})	

# Define a clean target
# 	Updated to just clean built html files, ignoring wp-json which are json files with (for some reason) html extension
#		Have to use -not instead of -prune because -delete is not compatible with -prune
# 	TODO Add __clean_repo()
clean:
	rm -f ${LINK_TARGETS_PUBLIC}	
	rm -f ${LINK_TARGETS_CONDA}	
	rm -f ${CONFIG_PROCESSED}

# ############

# Process config and environment files
${PATH_DIR_CONFIG_ARGMAP}/${DIR_PROCESSED}/%-processed.yaml: ${PATH_DIR_CONFIG_ARGMAP}/%.yaml
	mkdir -p "$(@D)"
	. scripts/config_read_functions.lib.sh && preprocess_config "$<"

# Rule for public links
#  after | is order only pre-requisite, doesn't update based on timestamps
${PATH_PUBLIC}/%: | ${PATH_TEST}/%
	ln -s ${PATH_TEST}/$* $@

# Add index.html
#	 TODO: Use netlify redirect instead
#   ln -s "$PATH_FILE_OUTPUT_EXAMPLE" "$PATH_PUBLIC/index.html"
${PATH_PUBLIC}/index.html: | ${PATH_FILE_OUTPUT_EXAMPLE}
	ln -s ${PATH_FILE_OUTPUT_EXAMPLE} $@

# Rule for conda links to .local folder
${PATH_PROFILE_LOCAL}/%: | ${CONDA_PREFIX}/%
	ln -s ${CONDA_PREFIX}/$* $@

# For calling lua functions from shell (within conda env)
${CONDA_PREFIX}/bin/%: | ${PATH_LUA_ARGMAP}/%.lua
	ln -s ${PATH_LUA_ARGMAP}/$*.lua $@

# Adds .lua files to pandoc data-folder:

${CONDA_PREFIX}/share/pandoc/filters/%: | ${PATH_LUA_ARGMAP}/%
# Makes the required directories in the path
#		Haven't noticed this happening: If you don't use order-only-prerequisites each modification (e.g. copying or creating a file) 
#		in that directory will trigger the rule that depends on the directory-creation target again!
	mkdir -p "$(@D)"
	ln -s ${PATH_LUA_ARGMAP}/$* $@

# latex templates e.g. examples/example-template.latex need to be in conda folder:
${CONDA_PREFIX}/share/pandoc/templates/%: | ${WORKSPACE}/%
	mkdir -p "$(@D)"
	ln -s ${WORKSPACE}/$* $@

# Ensure lua dependencies available to site for client_argmap2mapjs
# ${PATH_PUBLIC}/%: | ${PATH_LUA_ARGMAP}
# 	ln -s ${PATH_LUA_ARGMAP} $@

# ${PATH_PUBLIC}/%: | ${WORKSPACE}/%
# 	ln -s ${WORKSPACE}/% $@

# ln -s "$PATH_DIR_ARGMAP_LUA" "$PATH_PUBLIC/lua"
# ln -s "$WORKSPACE/lua_modules" "$PATH_PUBLIC/lua_modules"

# For vscode pandoc extensions (1,2,3):

# 1. Fixed issue with vscode-pandoc not finding config_argmap with these links:

# Rule for argmap lua links to conda lua folder
#   QUESTION: Do I need this one?
${CONDA_PREFIX}/share/lua/5.3/%: | ${PATH_LUA_ARGMAP}/%
	ln -s ${PATH_LUA_ARGMAP}/$* $@

# Currently no link
# Rule for argmap lua links to conda pandoc folder
# ${CONDA_PREFIX}/share/pandoc/%: | ${PATH_LUA_ARGMAP}/%
# 	ln -s ${PATH_LUA_ARGMAP}/$* $@

#  2. Pandoc folder location can be printed (see src/lua/pandoc-hello.lua in branch X?) is location of markdown file, so might be able to do relative links from extensions
# rm /js
# Currently mapjs/public/js is just a directory, so have commented out:
# ln -s /home/s6mike/git_projects/argmap/mapjs/public/js /js

# 3. Install rockspec in global scope

# rockspec_file=$(_find_rockspec) # Gets absolute path
# # Can instead remove each package in turn with lua remove name --tree "$install_dir/$dir_lua" (name needs to match rockspec name e.g. penlight not pl)
# #   Might be able to uninstall argamp if I've installed it all rather than just dependencies

# luarocks remove
# luarocks make --only-deps "$rockspec_file" YAML_LIBDIR="$CONDA_PREFIX/lib/"