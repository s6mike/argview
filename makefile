# Makefile for argmap

# TODO 
#		Add make test
#		Add make help e.g. https://stackoverflow.com/questions/8811526/using-conditional-rules-in-a-makefile

# REVIEW: It is not wise for makefiles to depend for their functioning on environment variables set up outside their control, since this would cause different users to get different results from the same makefile. This is against the whole purpose of most makefiles. #issue #warning #review
#		From https://www.gnu.org/software/make/manual/html_node/Environment.html
#		Currently using many variables like this.
#			QUESTION: What's best practice?

# Turns off implicit rules etc
MAKEFLAGS += -rR
.SUFFIXES :

# Needed for substitutions to work when calling bash function
SHELL := /bin/bash

# Avoids collisions with filenames
#		-- is convention for private targets
.PHONY: all --public --conda config prints clean # dev

# Stops intermediate files being deleted (e.g. environment-mapjs.yaml)
.SECONDARY:

# Define variables
# := simple, assigned once

# 	Need to export required variables at end of argmap_init_script.sh:

#		QUESTION: Could I run getvar from within makefile instead?
LINK_TARGETS_PUBLIC := ${PATH_OUTPUT_PUBLIC} ${PATH_INPUT_PUBLIC}

# Add index.html
# 	TODO: Use netlify redirect instead
LINK_TARGETS_PUBLIC += ${PATH_PUBLIC}/index.html
# Ensure lua dependencies available to site for client_argmap2mapjs:
# LINK_TARGETS_PUBLIC += ${PATH_PUBLIC}/lua ${PATH_PUBLIC}/lua_modules

LINK_TARGETS_CONDA := ${PATH_LUA_LOCAL}
LINK_TARGETS_CONDA += ${PATH_CONVERT_LOCAL} # Only needed for pre-commit hook (this is to create png files?)
# Connects legacy data-folder to conda env:
# 	TODO: add this to conda activation, and delete this link when env deactivated?
# 	NOTE: can use defaults file to set defalt data directory, should simplify.
# 	Alternative is always to use --data-directory "$PATH_PANDOC_GLOBAL/" when calling pandoc
LINK_TARGETS_CONDA += ${PATH_PANDOC_LOCAL}

# For vscode pandoc extensions:
#		Currently no link:
#			LINK_TARGETS_CONDA += ${PATH_PANDOC_GLOBAL}/config_argmap.lua
LINK_TARGETS_CONDA += ${PATH_LUA_GLOBAL}/config_argmap.lua
# For calling from shell
LINK_TARGETS_CONDA += ${PATH_BIN_GLOBAL}/argmap2mup
LINK_TARGETS_CONDA += ${PATH_BIN_GLOBAL}/argmap2tikz
LINK_TARGETS_CONDA += ${PATH_BIN_GLOBAL}/mup2argmap
# Adds lua and template files to pandoc data-folder:
LINK_TARGETS_CONDA += ${PATH_PANDOC_GLOBAL}/filters/pandoc-argmap.lua
LINK_TARGETS_CONDA += ${PATH_PANDOC_GLOBAL}/templates/examples/example-template.latex

# If PATH_PUBLIC is empty, its rule will match anything, so this ensure it always has a value:
# Sets variable if not already defined
PATH_PUBLIC ?= NULL

# ###########

all: config --public --conda

config: ${LIST_FILES_CONFIG_PROCESSED}
--public: ${LINK_TARGETS_PUBLIC}

--conda: ${LINK_TARGETS_CONDA}
# export CONDA_ENV_ARGMAP="argmap"
# export XDG_DATA_HOME="${CONDA_PREFIX}/share/"

dev:
	npm install -g testcafe

#	QUESTION: run __clean_repo before building site?
site: ${PATH_FILE_OUTPUT_EXAMPLE} ${PATH_FILE_OUTPUT_EXAMPLE2_COMPLEX} ${PATH_FILE_MAPJS_HTML_DIST_TAGS} ${PATH_OUTPUT_JS}/main.js
# Using the mapjs file `public/output/mapjs-json/example2-clearly-false-white-swan-v3.json`, plus associated html file renamed as index.html
# - `netlify.toml`: Add redirect from `index.html` to `output/html/index.html`.

# TODO: for building sites, these should write to public folder directly, not via a symbolic link
#		i.e. make site should write to public, make test should write to test output		
#			plus webpack-dist-tags should also be written there directly not by redirect
# 	Can I do that with a flag or something?

# Define a clean target
# 	Updated to just clean built html files, ignoring wp-json which are json files with (for some reason) html extension
#		Have to use -not instead of -prune because -delete is not compatible with -prune
# 	TODO Add __clean_repo()
clean:
	rm -f ${LINK_TARGETS_PUBLIC}
	rm -f ${LINK_TARGETS_CONDA}	
	rm -f ${PATH_FILE_OUTPUT_EXAMPLE}	
	rm -f ${PATH_DIR_ARGMAP_ROOT}/test/output/mapjs-json/example2-clearly-false-white-swan-v3.mup
	rm -f ${PATH_FILE_OUTPUT_EXAMPLE2_COMPLEX}
# rm -f ${PATH_FILE_MAPJS_HTML_DIST_TAGS} # Takes too long to build and breaks things to best not to delete
	rm -r ${PATH_OUTPUT_JS}
# argmap cleans
	__clean_repo
# delete public/js, lua_modules, node_modules, 
# luarocks remove
# Delete these last since it will stop config var lookups working
# rm -f ${LIST_FILES_CONFIG_PROCESSED}

# ###########

${PATH_FILE_MAPJS_HTML_DIST_TAGS} ${PATH_OUTPUT_JS}/main.js:
	mkdir -p "${@D}"
	npm run pack:prod --prefix "${PATH_DIR_MAPJS_ROOT}"

# Generate html from json
# 	TODO combine this with first v3.html rule
${PATH_DIR_ARGMAP_ROOT}/test/output/html/%.html: ${PATH_DIR_ARGMAP_ROOT}/test/output/mapjs-json/%.json ${PATH_FILE_MAPJS_HTML_DIST_TAGS} ${PATH_OUTPUT_JS}/main.js
	mkdir -p "$(@D)"
# TODO: need to wait for ${PATH_FILE_MAPJS_HTML_DIST_TAGS} to be present before running this
	2hf -p "$<"

# Generate .json from .yaml
${PATH_DIR_ARGMAP_ROOT}/test/output/mapjs-json/%.json: ${PATH_DIR_ARGMAP_ROOT}/test/input/%.yaml
	mkdir -p "$(@D)"
	a2m "$<"

# Copy .json from input to output, before generating html
${PATH_DIR_ARGMAP_ROOT}/test/output/%.json: ${PATH_DIR_ARGMAP_ROOT}/test/input/%.mup
	mkdir -p "$(@D)"
	cp "$<" "$@"

# Copy .mup from input to output, before generating html
${PATH_DIR_ARGMAP_ROOT}/test/output/%.json: ${PATH_DIR_ARGMAP_ROOT}/test/input/%.mup
	mkdir -p "$(@D)"
	cp "$<" "$@"

${PATH_DIR_ARGMAP_ROOT}/test/output/html/%.html: ${PATH_DIR_ARGMAP_ROOT}/test/input/markdown/%.md ${PATH_FILE_MAPJS_HTML_DIST_TAGS} ${PATH_OUTPUT_JS}/main.js
# Might be able to run pandoc_argmap instead
	mkdir -p "$(@D)"
# TODO: need to wait for ${PATH_FILE_MAPJS_HTML_DIST_TAGS} to be present before running this
	2hf -p "$<"

# install: npm lua yq
# 	mkdir --parent "${WORKSPACE/test/output/mapjs-json}"
# 	mkdir --parent "${WORKSPACE/test/output/png}"
# 	mkdir --parent "${WORKSPACE/test/output/html}"

# npm:
# 	npm install --prefix "$(getvar PATH_DIR_MAPJS_ROOT)"
# 	npm audit fix --prefix "$(getvar PATH_DIR_MAPJS_ROOT)" --legacy-peer-deps >npm_audit_output.txt
# # Running qa_rockspec will also install dependencies

# lua:
# 	scripts/qa_rockspec.sh
# # lualatex is a LaTeX based format, so in order to use it you have to install LaTeX, not just TeX. So you need at least the Ubuntu texlive-latex-base package.
# # But if you aren't an expert, it's usually better to just install texlive-full to avoid issues later on with missing packages.
# # https://tex.stackexchange.com/questions/630111/install-lualatex-for-use-on-the-command-line
# 	apt-get install texlive-latex-extra
# 	apt-get install texlive-luatex
# # TODO: for other users would need to install argmap in current directory
# 	chmod u+x "${PATH_DIR_ARGMAP_LUA}/"*
# 	chmod u+x "${PATH_FOLDER_ARGMAP_SRC}/js/"*
# 	rockspec_file=$(_find_rockspec) # Gets absolute path
# __test luarocks lint "$(__find_rockspec)"
# # Can instead remove each package in turn with lua remove name --tree "$install_dir/$dir_lua" (name needs to match rockspec name e.g. penlight not pl)
# #   Might be able to uninstall argamp if I've installed it all rather than just dependencies
#   luarocks remove
#   luarocks make --only-deps "$rockspec_file" YAML_LIBDIR="$CONDA_PREFIX/lib/"

# yq:
# 	sudo wget -qO "$HOME/.local/bin/yq" https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
# 	chmod u+x "$HOME/.local/bin/yq"

# dev:
# 	make all
# 	netlify dev

prints:
	$(info PATH_PUBLIC:)
	$(info ${PATH_PUBLIC})
	$(info PATH_TEST:)
	$(info ${PATH_TEST})
# 	$(info LINK_TARGETS_CONDA:)
# 	$(info ${LINK_TARGETS_CONDA})	
# 	$(info LIST_FILES_CONFIG_PROCESSED:)
# 	$(info ${LIST_FILES_CONFIG_PROCESSED})
# 	$(info PATH_DIR_CONFIG_MAPJS:)
# 	$(info ${PATH_DIR_CONFIG_MAPJS})
# 	$(info PATH_DIR_CONFIG_MAPJS_PROCESSED:)
# 	$(info ${PATH_DIR_CONFIG_MAPJS_PROCESSED})

# ############

# Copy env defaults file, but without overwriting existing one. No order pre-requisite to stop repeated copying attempts.
%.yaml: | %-defaults.yaml
	cp --no-clobber $*-defaults.yaml $@

# Process config and environment files
# 	QUESTION: Use more variables?
${PATH_DIR_CONFIG_ARGMAP}/${KEYWORD_PROCESSED}/%-${KEYWORD_PROCESSED}.yaml: ${PATH_DIR_CONFIG_ARGMAP}/%.yaml
	mkdir -p "$(@D)"
	preprocess_config "$<"

${PATH_DIR_CONFIG_MAPJS}/${KEYWORD_PROCESSED}/%-${KEYWORD_PROCESSED}.yaml: ${PATH_DIR_CONFIG_MAPJS}/%.yaml
	mkdir -p "$(@D)"
	preprocess_config "$<"

# Rule for public links
#  after | is order only pre-requisite, doesn't update based on timestamps
${PATH_PUBLIC}/%: | ${PATH_TEST}/%
	ln -s $| $@

# Makes required folder if not present
# 	Hope this isn't hostage to fortune! since make public/anything will create this folder in test and then symlink to it from public
#		TODO: Replace % with $(DIRECTORIES), matching the relevant directories: input, output, mapjs-json, html, mapjs-json
#			Chatgpt suggestion, not sure it works that way: https://chat.openai.com/c/7b2b5fd5-6431-4c16-bd49-ddba40a6df45
# ${PATH_TEST}/%:
# 	mkdir -p "$(@D)"

# Add index.html
#	 TODO: Use netlify redirect instead
${PATH_PUBLIC}/index.html: | ${PATH_FILE_OUTPUT_EXAMPLE}
	ln -s $| $@

# Rule for conda links to .local folder
${PATH_PROFILE_LOCAL}/%: | ${CONDA_PREFIX}/%
	ln -s $| $@

# For calling lua functions from shell (within conda env)
${PATH_BIN_GLOBAL}/%: | ${PATH_LUA_ARGMAP}/%.lua
	ln -s $| $@

# Adds .lua files to pandoc data-folder:

${PATH_PANDOC_GLOBAL}/filters/%: | ${PATH_LUA_ARGMAP}/%
# Makes the required directories in the path
#		Haven't noticed this happening: If you don't use order-only-prerequisites each modification (e.g. copying or creating a file) 
#		in that directory will trigger the rule that depends on the directory-creation target again!
	mkdir -p "$(@D)"
	ln -s $| $@

# latex templates e.g. examples/example-template.latex need to be in conda folder:
${PATH_PANDOC_GLOBAL}/templates/%: | ${WORKSPACE}/%
	mkdir -p "$(@D)"
	ln -s $| $@

# Ensure lua dependencies available to site for client_argmap2mapjs
# ${PATH_PUBLIC}/%: | ${PATH_LUA_ARGMAP}
# 	ln -s $| $@

# ${PATH_PUBLIC}/%: | ${WORKSPACE}/%
# 	ln -s $| $@

# ln -s "$PATH_DIR_ARGMAP_LUA" "$PATH_PUBLIC/lua"
# ln -s $| "$PATH_PUBLIC/lua_modules"

# For vscode pandoc extensions (1,2,3):

# 1. Fixed issue with vscode-pandoc not finding config_argmap with these links:

# Rule for argmap lua links to conda lua folder
#   QUESTION: Do I need this one?
${PATH_LUA_GLOBAL}/%.lua: | ${PATH_LUA_ARGMAP}/%.lua
	ln -s $| $@

# Currently no link
# Rule for argmap lua links to conda pandoc folder
# ${CONDA_PREFIX}/share/pandoc/%: | ${PATH_LUA_ARGMAP}/%
# 	ln -s $| $@

#  2. Pandoc folder location can be printed (see src/lua/pandoc-hello.lua in branch X?) is location of markdown file, so might be able to do relative links from extensions
# rm /js
# Currently mapjs/public/js is just a directory, so have commented out:
# ln -s /home/s6mike/git_projects/argmap/mapjs/public/js /js

# 3. Install rockspec in global scope

# rockspec_file=$(_find_rockspec) # Gets absolute path
# Can instead remove each package in turn with lua remove name --tree "$install_dir/$dir_lua" (name needs to match rockspec name e.g. penlight not pl)
#   Might be able to uninstall argamp if I've installed it all rather than just dependencies

# luarocks remove
# luarocks make --only-deps "$rockspec_file" YAML_LIBDIR="$CONDA_PREFIX/lib/"