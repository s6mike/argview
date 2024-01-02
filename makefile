# Makefile for argmap

# make site MODE=prod # To make site in prod mode

# TODO: make help e.g. https://stackoverflow.com/questions/8811526/using-conditional-rules-in-a-makefile

# REVIEW: It is not wise for makefiles to depend for their functioning on environment variables set up outside their control, since this would cause different users to get different results from the same makefile. This is against the whole purpose of most makefiles. #issue #warning #review
#		From https://www.gnu.org/software/make/manual/html_node/Environment.html
#		Currently using many variables like this.
#			QUESTION: What's best practice?

# ###########
# Variables

# Turns off implicit rules etc
MAKEFLAGS += -rR --warn-undefined-variables
.SUFFIXES:

# Needed for substitutions to work when calling bash function
SHELL := /bin/bash
# .SHELLFLAGS := -o nounset -c

# Avoids collisions with filenames
#		-- is convention for private targets
.PHONY: all config public --conda output_clean site_clean clean docs install like_netlify like_netlify_pre_init like_netlify_init luarocks_clean npm npm_audit pandoc prints site test # dev netlify-cli
# .LOW_RESOLUTION_TIME: $(FILES_HTML_DOCS) ${PATH_OUTPUT_PUBLIC}/%.json %.yaml

# Define variables
# := simple, assigned once
# If PATH_PUBLIC is empty, its rule will match anything, so this ensure it always has a value:
# Sets variable if not already defined
PATH_PUBLIC ?= NULL1
PATH_ENVIRONMENT_GLOBAL ?= NULL2
PATH_DIR_MAPJS_ROOT ?= NULL3
PATH_PROFILE_LOCAL ?= NULL4
PATH_BIN_GLOBAL ?= NULL5
PATH_FILE_CONVERT_GLOBAL ?= NULL6
PATH_FILE_GDRIVE_LOCAL ?= NULL7
PATH_INPUT_LOCAL ?= NULL8
MAPJS_NODE_MODULES_PREFIX ?= NULL9

# TODO: Use var for ${PATH_INPUT_LOCAL}/markdown etc
ifneq (${PATH_INPUT_LOCAL}, NULL8) # Ensures searches only made once PATH_INPUT_LOCAL instantiated.
FILES_MD = $(shell find ${PATH_INPUT_LOCAL}/markdown -type f -iname "*.md")
FILES_MAPJS_MUP = $(shell find ${PATH_INPUT_LOCAL}/mapjs-json -type f -iname "*.mup" )
FILES_MAPJS_JSON = $(shell find ${PATH_INPUT_LOCAL}/mapjs-json -type f -iname "*.json" )
# FILES_MAPJS_ALL = $(shell find ${PATH_INPUT_LOCAL}/mapjs-json -type f \( -iname "*.json" -o -iname "*.mup" \) )
endif

FILES_MAPJS_JSON ?= NULL10
FILES_MAPJS_MUP ?= NULL11
TARGET_DOMAIN ?= NULL12

# Stops intermediate files being deleted (e.g. environment-mapjs.yaml)
# Using .SECONDARY: without arguments breaks things though
.SECONDARY: ${PATH_DIR_CONFIG_ARGMAP}/argmap.env ${PATH_DIR_CONFIG_ARGMAP}/environment-argmap.yaml ${PATH_DIR_CONFIG_MAPJS}/environment-mapjs.yaml

# .NOTINTERMEDIATE only supported in make 4.4
.NOTINTERMEDIATE: $(FILES_MAPJS_JSON) $(FILES_MAPJS_MUP)

# 	Need to export required variables at end of argmap_init_script.sh:

#		QUESTION: Could I run getvar from within makefile instead?
LINK_TARGETS_PUBLIC_FOLDERS := ${PATH_OUTPUT_PUBLIC} ${PATH_INPUT_PUBLIC}

LINK_TARGETS_PUBLIC := ${LINK_TARGETS_PUBLIC_FOLDERS}
# Adds index.html (should be called locally only)
LINK_TARGETS_PUBLIC += ${PATH_PUBLIC}/index.html

# Ensure lua dependencies available to site for client_argmap2mapjs:
# LINK_TARGETS_PUBLIC += ${PATH_PUBLIC}/lua ${PATH_PUBLIC}/lua_modules

LINK_TARGETS_CONDA := ${PATH_LUA_LOCAL}
LINK_TARGETS_CONDA += ${PATH_FILE_CONVERT_LOCAL} # Only needed for pre-commit hook (this is to create png files?)
# Connects legacy data-folder to conda env:
# 	TODO: add this to conda activation, and delete this link when env deactivated?
# 	NOTE: can use defaults file to set defalt data directory, should simplify.
# 	Alternative is always to use --data-directory "$PATH_PANDOC_GLOBAL/" when calling pandoc
LINK_TARGETS_CONDA += ${PATH_PANDOC_SHARE_LOCAL}

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
LUAROCKS_GLOBAL := ${PATH_ENVIRONMENT_GLOBAL}/lib/luarocks/rocks-5.3/manifest
LUA_MODULES_LOCAL := ${PATH_LUA_MODULES}/lib/luarocks/rocks-5.3/manifest

ifneq (${PATH_BIN_GLOBAL}, NULL5) # Ensures pandoc install only attempted once PATH_DIR_MAPJS_ROOT instantiated.
PANDOC := ${PATH_BIN_GLOBAL}/pandoc
endif

ifneq (${PATH_DIR_MAPJS_ROOT}, NULL3) # Ensures searches only made once PATH_DIR_MAPJS_ROOT instantiated.
FILES_JS_SRC := $(shell find "${PATH_DIR_MAPJS_ROOT}/src" -type f)
endif

ifneq ($(FILES_MAPJS_MUP), NULL11)
FILES_MAPJS_FROM_MUP = $(patsubst ${PATH_INPUT_LOCAL}/mapjs-json/%.mup,${PATH_OUTPUT_PUBLIC}/mapjs-json/%.json,${FILES_MAPJS_MUP})
FILES_HTML_FROM_JSON += $(patsubst ${PATH_INPUT_LOCAL}/mapjs-json/%.mup,${PATH_OUTPUT_HTML_PUBLIC}/%.html,$(filter %.mup,${FILES_MAPJS_MUP}))
endif

# FILES_HTML_FROM_MD := $(foreach file,$(FILES_MD),$(patsubst mapjs/public/input/markdown/%.md,${PATH_OUTPUT_HTML_PUBLIC}/%.html,$(file)))
FILES_HTML_FROM_MD := ${FILES_MD:test/input/markdown/%.md=${PATH_OUTPUT_HTML_PUBLIC}/%.html}

# Can't use above pattern because it includes files which don't match the pattern
FILES_HTML_FROM_JSON += $(patsubst ${PATH_INPUT_LOCAL}/mapjs-json/%.json,${PATH_OUTPUT_HTML_PUBLIC}/%.html,$(filter %.json,${FILES_MAPJS_JSON}))
FILES_HTML_FROM_JSON := $(filter-out ${FILES_HTML_FROM_MD}, ${FILES_HTML_FROM_JSON})

FILES_HTML = $(FILES_SITE) $(FILES_HTML_FROM_JSON) $(FILES_HTML_FROM_MD)
FILES_TEMPLATE_HTML := src/layouts/templates/pandoc-mapjs-main-html5.html ${PATH_FILE_MAPJS_HTML_DIST_TAGS} src/layouts/includes/argmap-head-element.html src/layouts/includes/argmap-input-widget.html src/layouts/includes/mapjs-map-container.html src/layouts/includes/mapjs-widget-controls.html
FILES_JS := ${PATH_OUTPUT_JS}/main.js ${PATH_OUTPUT_JS}/main.js.map
FILES_HTML_DOCS = docs/example-updated.html ${PATH_DIR_MAPJS_ROOT}/docs/legacy-mapjs-example-map.html
FILES_SITE = ${PATH_FILE_OUTPUT_EXAMPLE} ${PATH_FILE_OUTPUT_EXAMPLE2_COMPLEX} $(FILES_HTML_DOCS)

rockspec_file := $(shell find . -type f -name "argmap-*.rockspec")

# ###########
# Top Level recipes

all: config
# Optional dependencies not used by netlify.
ifneq (${ENV}, netlify)
all: | docs public --conda $(LUA_MODULES_LOCAL)
endif

config: ${PATH_FILE_ARGMAP_DOT_ENV} ${LIST_FILES_CONFIG_PROCESSED}
--conda: | $(LINK_TARGETS_CONDA)
public: | $(LINK_TARGETS_PUBLIC)

# TODO Just run conda env script?
# if in folder with config/environment-conda-argmap.yaml
# conda env create
# Else:
# conda env create -f $(getvar PATH_FILE_ENV_CONDA)
# Or:
# conda env update --file $(getvar PATH_FILE_ENV_CONDA) --prune --name $CONDA_ENV_ARGMAP

# If conda activate errors:
# conda init bash
# source /opt/miniconda3/bin/activate

# -conda activate ${CONDA_ENV_ARGMAP}
# export XDG_DATA_HOME="${PATH_ENVIRONMENT_GLOBAL}/share/"

# Delete argmap output files only
output_clean:
	$(warning Attempting to delete old test outputs:)
# QUESTION Create bash function for this?
	@rm -f ${PATH_FILE_OUTPUT_EXAMPLE}
	@rm -f ${PATH_FILE_OUTPUT_EXAMPLE2_COMPLEX}
	@rm -rf ${PATH_OUTPUT_HTML_PUBLIC}
	@rm -rf ${PATH_OUTPUT_MAPJS_PUBLIC}
#		TODO: Replace with vars:
	@rm -f ${PATH_ARGMAP_ROOT}/${PATH_OUTPUT_MAPJS_PUBLIC}/html/example1-clearly-false-white-swan-simplified-2mapjs.html
	@rm -f ${PATH_ARGMAP_ROOT}/${PATH_OUTPUT_MAPJS_PUBLIC}/mapjs-json/example2-clearly-false-white-swan-v3.mup
# rm -rf ${PATH_ARGMAP_ROOT}/mapjs/public/output/png
# argmap cleans
	__clean_repo

# Deletes key files so make site can work
#		QUESTION: Can I set logic based on MODE?
site_clean: output_clean
	$(warning Attempting to delete site redirects:)
# Ignores error if public/output is a dir rather than a link:
#		TODO run based on current MODE, plus what's currently present
#			QUESTION: Check whether symlink is present?
	-@rm -f $(LINK_TARGETS_PUBLIC)
	@rm -rf $(LINK_TARGETS_PUBLIC_FOLDERS)
	@rm -rf ${PATH_OUTPUT_JS}
	@rm -f ${PATH_FILE_MAPJS_HTML_DIST_TAGS}

clean: site_clean
	$(warning Attempting to delete everything generated by repo:)
	@rm -f $(LINK_TARGETS_CONDA)
# Takes too long to build and breaks things so best not to delete
# delete public/js, lua_modules, node_modules,
# luarocks remove
# Delete these last since it will stop config var lookups working
	-@rm -f ${LIST_FILES_CONFIG_PROCESSED}
# rm ${PATH_FILE_GDRIVE_LOCAL}

docs: $(FILES_HTML_DOCS)

# Clean up Lua Rocks from global library
luarocks_clean:
	$(warning Attempting to delete lua dependencies:)
# This might only be necessary if rockspec installed globally:
# 	luarocks remove --global "$(rockspec_file)"
# luarocks --tree ${PATH_LUA_MODULES} remove argmap
	-@luarocks --tree ${PATH_LUA_MODULES} remove lualogging
	-@luarocks --tree ${PATH_LUA_MODULES} remove lyaml
	-@luarocks --tree ${PATH_LUA_MODULES} remove api7-lua-tinyyaml
	-@luarocks --tree ${PATH_LUA_MODULES} remove penlight
	-@luarocks --tree ${PATH_LUA_MODULES} remove rxi-json-lua
	-@luarocks --tree ${PATH_LUA_MODULES} remove luasocket
	-@luarocks --tree ${PATH_LUA_MODULES} remove luafilesystem
	-@rm $(LUA_MODULES_LOCAL)

	@echo ""
	@echo "Remaining luarocks:"
	@luarocks --tree ${PATH_LUA_MODULES} list

# TODO: Continue moving these dependencies to the targets they are needed for
install: | ${PATH_FILE_YQ} $(PANDOC) npm $(LUA_MODULES_LOCAL) # TODO: replace npm with npm_audit based on ENV
ifneq (${ENV}, netlify)
install: | ${PATH_FILE_CONVERT_GLOBAL} npm_audit ${PATH_FILE_GDRIVE_LOCAL}
endif

like_netlify: clean like_netlify_pre_init like_netlify_init site

# TODO: Add call to undo netlify_pre_init (remove any of the created .env and restore the originals)
#		Also need to clean and rebuild processed files since they use env variables
like_netlify_pre_init: config/argmap.env config/environment-argmap.yaml mapjs/config/environment-mapjs.yaml
	mv --no-clobber config/argmap.env config/argmap.env.bak
	mv --no-clobber config/environment-argmap.yaml config/environment-argmap.yaml.bak
	mv --no-clobber mapjs/config/environment-mapjs.yaml mapjs/config/environment-mapjs.yaml.bak
	printf "Attempting to halt webpack dev server...\n"
	-webpack_server_halt

like_netlify_init: config/argmap.env
	env ENV=netlify MODE=prod bash -c ./scripts/argmap_init_script.sh

dev: package-lock.json node_modules/.package-lock.json
	-webpack_server_halt
	netlify dev &

netlify_test: dev
	$(call test_recipe,netlify,9002)

# dev: netlify-cli
# #	QUESTION: How to connect to correct netlify site?
# #  QUESTION: How to check this has been done?
# 	netlify link
# # netlify build
# #  QUESTION: What to add as dependencies?
# # make all
# 	netlify dev

# #  QUESTION: How to check this has been done?
# netlify-cli:
# 	npm install -g netlify-cli


npm: ${PATH_DIR_MAPJS_ROOT}/package-lock.json ${MAPJS_NODE_MODULES_PREFIX}/node_modules/.package-lock.json
npm_audit: | npm npm_audit_output.txt

prints:
	$(info FILES_MD: $(FILES_MD))
	$(info FILES_MAPJS_MUP: ${FILES_MAPJS_MUP})
	$(info FILES_MAPJS_FROM_MUP: $(FILES_MAPJS_FROM_MUP))
	$(info FILES_MAPJS_JSON: ${FILES_MAPJS_JSON})
	$(info FILES_HTML_FROM_JSON: ${FILES_HTML_FROM_JSON})
	$(info FILES_HTML_FROM_MD: ${FILES_HTML_FROM_MD})
# $(info PATH_PUBLIC:)
# $(info ${PATH_PUBLIC})
# $(info PATH_TEST:)
# $(info ${PATH_TEST})
# 	$(info LINK_TARGETS_CONDA:)
# 	$(info ${LINK_TARGETS_CONDA})
	$(info LIST_FILES_CONFIG_PROCESSED:)
	$(info ${LIST_FILES_CONFIG_PROCESSED})
# 	$(info PATH_DIR_CONFIG_MAPJS:)
# 	$(info ${PATH_DIR_CONFIG_MAPJS})
# 	$(info PATH_DIR_CONFIG_MAPJS_PROCESSED:)
# 	$(info ${PATH_DIR_CONFIG_MAPJS_PROCESSED})

# Ensures site_clean only run locally in prod mode (to clean up any dev files)
ifeq (${MODE}, prod)
ifneq (${ENV}, netlify)
site: site_clean $(FILES_SITE)
endif
endif
site: $(FILES_SITE)

# start: site
# start:
# 	./scripts/argmap_init_script.sh

# Using the mapjs file `public/output/mapjs-json/example2-clearly-false-white-swan-v3.json`, plus associated html file renamed as index.html
# - `netlify.toml`: Add redirect from `index.html` to `output/html/index.html`.

# REVIEW: Think I have this working now: for building sites, these should write to public folder directly, not via a symbolic link
#		i.e. make site should write to public, make test should write to test output
# 	Can I do that with a flag or something?

# Instead of: make all,  __clean_repo, and also to remove symlnks
# test: MODE := dev

${PATH_BIN_GLOBAL_NVM}:
	npm install -g testcafe

# TODO remove output dir and add symlink instead
define test_recipe =
@if [ "$$ENV" = "netlify" ]; then \
	./test/test_scripts/tests.sh html; \
elif [ "$(1)" = "netlify" ]; then \
	env PORT_DEV_SERVER=$(2) bash -c ./test/test_scripts/tests.sh html; \
else \
	webpack_server_start; \
	./test/test_scripts/tests.sh; \
fi;
endef

test: ${PATH_BIN_GLOBAL_NVM} mapjs/config/processed/config-mapjs-paths-processed.yaml mapjs/config/processed/environment-mapjs-processed.yaml # public site_clean all
	$(call test_recipe,webpack_server,9001)

# Instead of calling webpack_X in tests.sh:
# ${PATH_FILE_MAPJS_HTML_DIST_TAGS} ${PATH_OUTPUT_JS}/main.js:
# webpack_server_start
# __init_tests
# Run tests, using wait-on PATH_FILE_MAPJS_HTML_DIST_TAGS
# Print output
# Update repo?

# ###########
# Lower level recipes

## Core functionality

npm_audit_output.txt:
	-npm audit fix --prefix "${MAPJS_NODE_MODULES_PREFIX}" --legacy-peer-deps >npm_audit_output.txt

${PATH_DIR_MAPJS_ROOT}/package.json:
${PATH_DIR_MAPJS_ROOT}/webpack.config.js:

# Generate html from json
# 	QUESTION Can I combine this with first v3.html rule?
# Call make HTML_OPEN=true to open output file
#	 QUESTION Only set 2hf -s flag in production mode?

${PATH_DIR_MAPJS_ROOT}/docs/%.html: ${PATH_OUTPUT_HTML_PUBLIC}/%.html
	cp -- "$<" "$@"

docs/%.html: ${PATH_OUTPUT_HTML_PUBLIC}/%.html
	cp -- "$<" "$@"

define build_html_recipe = 
@-mkdir --parent "$(@D)"
@flags_2hf="-s"; \
if [ "$$HTML_OPEN" = "true" ]; then \
	2hf $$flags_2hf "$<" | open_debug "" $$TARGET_DOMAIN; \
else \
	2hf $$flags_2hf "$<"; \
fi;
endef

# TOOD: Use vars
$(FILES_HTML_FROM_JSON): ${PATH_OUTPUT_HTML_PUBLIC}/%.html: ${PATH_OUTPUT_PUBLIC}/mapjs-json/%.json $(FILES_TEMPLATE_HTML) config/processed/config-argmap-processed.yaml mapjs/config/processed/environment-mapjs-processed.yaml config/processed/config-argmap-paths-processed.yaml mapjs/config/processed/config-mapjs-paths-processed.yaml
	$(build_html_recipe)

# Generate .json from .yaml
# 	TOOD: Use vars
${PATH_OUTPUT_PUBLIC}/mapjs-json/%.json: ${PATH_INPUT_LOCAL}/%.yaml config/processed/config-argmap-processed.yaml config/processed/environment-argmap-processed.yaml config/processed/config-argmap-paths-processed.yaml mapjs/config/processed/config-mapjs-paths-processed.yaml | $(PANDOC) $(LUA_MODULES_LOCAL)
	@-mkdir --parent "$(@D)"
	a2m "$<" "$@"

# Copy .json from input to output, before generating html
${PATH_OUTPUT_PUBLIC}/mapjs-json/%.json: ${PATH_INPUT_LOCAL}/mapjs-json/%.json
	@-mkdir --parent "$(@D)"
	cp -- "$<" "$@"

${PATH_OUTPUT_PUBLIC}/mapjs-json/%.json: ${PATH_OUTPUT_LOCAL}/mapjs-json/%.json
	@-mkdir --parent "$(@D)"
	cp -- "$<" "$@"

# Copy .mup from input to output, before generating html
$(FILES_MAPJS_FROM_MUP): ${PATH_OUTPUT_PUBLIC}/mapjs-json/%.json: ${PATH_INPUT_LOCAL}/mapjs-json/%.mup
	@-mkdir --parent "$(@D)"
	cp -- "$<" "$@"

# ${PATH_OUTPUT_PUBLIC}/mapjs-json/%_argmap1.json ${PATH_OUTPUT_PUBLIC}/mapjs-json/%_argmap2.json: ${PATH_INPUT_LOCAL}/markdown/%.md config/processed/config-argmap-processed.yaml config/processed/environment-argmap-processed.yaml | $(LUA_MODULES_LOCAL) $(PANDOC)
# 	@-mkdir --parent "$(@D)"
# 	2hf -ps "$<"

# Generate html from markdown (may have multiple .json dependencies)
# mapjs/public/output/html/example1-clearly-false-white-swan-simplified-2mapjs.html
#		QUESTION: remove ${PATH_INPUT_LOCAL}/markdown/%.md as dependency (since this is called via mapjs-json files) and use pattern instead of "$<"?
# TOOD: Use vars
$(FILES_HTML_FROM_MD): ${PATH_OUTPUT_HTML_PUBLIC}/%.html: ${PATH_INPUT_LOCAL}/markdown/%.md ${FILES_TEMPLATE_HTML} config/processed/config-argmap-processed.yaml mapjs/config/processed/environment-mapjs-processed.yaml config/processed/environment-argmap-processed.yaml config/processed/config-argmap-paths-processed.yaml mapjs/config/processed/config-mapjs-paths-processed.yaml | $(PANDOC) $(LUA_MODULES_LOCAL)
	$(build_html_recipe)

# Create js dependencies for html files:
#		dependent on whole mapjs/src folder, using: https://stackoverflow.com/questions/14289513/makefile-rule-that-depends-on-all-files-under-a-directory-including-within-subd
# QUESTION: Use var and find for node_modules dependency, like FILE_JS_SRC? Using hidden node_modules/.packagelock instead
# QUESTION: Does including ${PATH_OUTPUT_JS}/main.js.map force rebuild in dev mode?
${PATH_FILE_MAPJS_HTML_DIST_TAGS} ${PATH_OUTPUT_JS}/main.js ${PATH_OUTPUT_JS}/main.js.map: ${PATH_DIR_MAPJS_ROOT}/webpack.config.js $(FILES_JS_SRC) ${PATH_DIR_MAPJS_ROOT}/package-lock.json mapjs/config/processed/config-mapjs-processed.yaml ${MAPJS_NODE_MODULES_PREFIX}/node_modules/.package-lock.json
	$(info make site MODE: ${MODE})
	-mkdir --parent "${@D}"
# -echo "NODE_PATH: ${NODE_PATH}"
# -$(info PATH_DIR_MAPJS_ROOT: ${PATH_DIR_MAPJS_ROOT})
# -$(info PATH_FILE_MAPJS_HTML_DIST_TAGS: ${PATH_FILE_MAPJS_HTML_DIST_TAGS})
# -ls "${PATH_FILE_MAPJS_HTML_DIST_TAGS}"
	npm run pack:$(MODE) --prefix "${MAPJS_NODE_MODULES_PREFIX}"
# -ls "$(dirname "${PATH_FILE_MAPJS_HTML_DIST_TAGS}")"
# -ls mapjs/node_modules/.bin/wait-on
# -ls mapjs/node_modules/wait-on
	-npx --prefix "${MAPJS_NODE_MODULES_PREFIX}" wait-on --timeout 10000 "${PATH_FILE_MAPJS_HTML_DIST_TAGS}"
	-touch ${PATH_FILE_MAPJS_HTML_DIST_TAGS}

## Installation:

### Config:

${PATH_FILE_ARGMAP_DOT_ENV}: | ${PATH_FILE_ARGMAP_DOT_ENV_DEFAULT}
	cp --no-clobber -- $| $@

# Copy env defaults file, but without overwriting existing one. No order pre-requisite to stop repeated copying attempts.
%.yaml: | %-defaults.yaml
	cp --no-clobber -- $| $@

# Process config and environment files

# 	TODO: De-duplicate with mapjs call
${PATH_DIR_CONFIG_ARGMAP_PROCESSED}/%-${KEYWORD_PROCESSED}.yaml: ${PATH_DIR_CONFIG_ARGMAP}/%.yaml ${PATH_FILE_ARGMAP_DOT_ENV} | ${PATH_FILE_YQ} # $(PANDOC)
	@-mkdir --parent "$(@D)"
	@preprocess_config "$<" "$@"

# QUESTION add mapjs.env as dependency?
${PATH_DIR_CONFIG_MAPJS}/${KEYWORD_PROCESSED}/%-${KEYWORD_PROCESSED}.yaml: ${PATH_DIR_CONFIG_MAPJS}/%.yaml config/processed/environment-argmap-processed.yaml | ${PATH_FILE_YQ} $(PANDOC)
	@-mkdir --parent "$(@D)"
	@preprocess_config "$<" "$@"

### Site output vs test output

# Rule for public links
#  after | is order only pre-requisite, doesn't update based on timestamps
# This is static pattern rule, which restricts rule to match LINK_TARGETS_PUBLIC:
$(LINK_TARGETS_PUBLIC_FOLDERS): ${PATH_PUBLIC}/%: | ${PATH_TEST}/%
	@-mkdir --parent "$(@D)"
# realpath generates path relative to path_public
	-ln -s $(realpath --no-symlinks --relative-to=$$(dirname $@) $|) $@

# Add index.html (should be called locally only)
${PATH_PUBLIC}/index.html: | ${PATH_FILE_OUTPUT_EXAMPLE}
	@-mkdir --parent "$(@D)"
	-ln -s $(realpath --no-symlinks --relative-to=$$(dirname $@) $|) $@

### Other install:

# netlify version 2.1.3
#	 User data directory: /opt/buildhome/.local/share/pandoc
# TODO: ln -s "$PATH_ENVIRONMENT_GLOBAL/bin/pandoc" "$HOME/.local/bin/"
# 	${PATH_PANDOC_BIN_LOCAL}: | $(PANDOC) config/processed/environment-argmap-processed.yaml
$(PANDOC):
	$(info PANDOC: $(PANDOC))
ifeq (${ENV}, netlify)
	-pandoc --version
else
# if this doesn't exist, create before installing pandoc, so that user data directory should be set automatically:
# @-mkdir --parent ~/.local/share/pandoc/filters
# Though I think I may want to install it in relevant conda env folder instead
# - pandoc==2.12=h06a4308_3
	conda install pandoc https://github.com/jgm/pandoc/blob/main/INSTALL.md
	-chmod 744 $(PANDOC)
endif

# This might be useful on more recent version of pandoc, which might actually check all these folders
# Though more likely it will use XDG_DATA_HOME which I can then overwrite
# XDG_DATA_DIRS="$PATH_ENVIRONMENT_GLOBAL/share":$XDG_DATA_DIRS

# -chmod 744 ${PATH_FILE_YQ}
# If not using conda would need conda dependencies installed.

# ${PATH_BIN_GLOBAL}/luarocks: lua

# lua: ${PATH_BIN_GLOBAL}/luarocks ${PATH_BIN_GLOBAL}/lua5.3 | $(LUA_MODULES_LOCAL)
# lua: ${PATH_BIN_GLOBAL}/luarocks # ${PATH_BIN_GLOBAL}/lua5.3 # install.sh
# echo "PATH: ${PATH}"
# update-alternatives --config lua-interpreter
# TODO use variables in linuxbrew path

# https://github.com/luarocks/luarocks/wiki/Installation-instructions-for-Unix

# ${PATH_BIN_GLOBAL}/lua5.3: ${PATH_BIN_GLOBAL}/lua-5.3.5
# # $(MAKE) is for recursive make; -C calls make in subfolder
# # cd $< && $(MAKE) linux test
# # cd $< && make install
# 	$(MAKE) -C $< linux test
# 	$(MAKE) -C $< install

# ${PATH_BIN_GLOBAL}/lua-5.3.5: ${PATH_BIN_GLOBAL}/lua-5.3.5.tar.gz
# 	tar -zxf $<
# # app_path="${app_path%.*}"

# ${PATH_BIN_GLOBAL}/lua-5.3.5.tar.gz:
# 	app_install ${PATH_BIN_GLOBAL} https://www.lua.org/ftp/lua-5.3.5.tar.gz
$(LUAROCKS_GLOBAL): # ${PATH_BIN_GLOBAL}/lua5.3
ifeq (${ENV}, netlify)
# # app_install ${PATH_BIN_GLOBAL} https://www.lua.org/ftp/lua-5.3.5.tar.gz
# 	app_install ${PATH_BIN_GLOBAL} https://luarocks.github.io/luarocks/releases/luarocks-3.7.0-linux-x86_64.zip
# 	-./configure --with-lua-include=/usr/local/include
# 	$(MAKE)
# 	$(MAKE) install
else
# If installing from environment.yaml, skip to SECTION 2.
# conda install -c anaconda lua==5.3.4=h7b6447c_0
	conda install -c anaconda-platform luarocks==3.7.0=lua53h06a4308_0
# TODO for conda, run command to add conda env as dependencies directory (for lib yaml etc) to end of config file: $PATH_ENVIRONMENT_GLOBAL/share/lua/luarocks/config-5.3.lua
# QUESTION: Something like this?
# echo "external_deps_dirs = {
#    "$PATH_ENVIRONMENT_GLOBAL"
# }" >> "$PATH_ENVIRONMENT_GLOBAL/share/lua/luarocks/config-5.3.lua"

# Though LD_LIBRARY_PATH might also work: https://workflowy.com/#/dad8323b9953

# # TODO: for other users would need to install argmap in current directory
# 	chmod 744 "${PATH_LUA_ARGMAP}/"*
# 	chmod 744 "${PATH_FOLDER_ARGMAP_SRC}/js/"*

# Link up pre-commit hook
# ln -s "$PATH_ARGMAP_ROOT/scripts/git_hooks/pre-commit" "$PATH_ARGMAP_ROOT/.git/hooks/"
# chmod +x git_hooks/*

# # Can instead remove each package in turn with lua remove name --tree "$install_dir/$dir_lua" (name needs to match rockspec name e.g. penlight not pl)
# #   Might be able to uninstall argamp if I've installed it all rather than just dependencies
#   luarocks remove
endif

# ${MAPJS_NODE_MODULES_PREFIX}/node_modules:
# 	-mkdir --parent "$(@D)"
# # -ln -s $(realpath --no-symlinks --relative-to=$(dirname $@) $|) $@
# # -ln -s "${MAPJS_NODE_MODULES_PREFIX}/node_modules" "${PATH_DIR_MAPJS_ROOT}/node_modules"
# 	-ln -s $@ "${PATH_DIR_MAPJS_ROOT}/node_modules"

#TODO: Combine this rule with mapjs install below
package-lock.json node_modules/.package-lock.json: package.json
	npm install


${PATH_DIR_MAPJS_ROOT}/package-lock.json ${MAPJS_NODE_MODULES_PREFIX}/node_modules/.package-lock.json: ${PATH_DIR_MAPJS_ROOT}/package.json
	@if [ "${ENV}" = "netlify" ] || [ "${MODE}" = "prod" ]; then \
		printf "mapjs: npm clean install, omit dev\n"; \
		npm ci --prefix "${MAPJS_NODE_MODULES_PREFIX}" --omit=dev; \
	else \
		printf "mapjs: npm install\n"; \
		npm install --prefix "${MAPJS_NODE_MODULES_PREFIX}"; \
	fi;

# QUESTION: Is touch necessary when node_modules always order only (|) dependency?
# touch ${MAPJS_NODE_MODULES_PREFIX}/node_modules

${PATH_FILE_YQ}:
# -path=$(app_install ${PATH_BIN_GLOBAL} https://github.com/mikefarah/yq/releases/download/v4.30.8/yq_linux_amd64)
# @-mkdir --parent $$(dirname $@)
# QUESTION: how to execute once go installed? Update PATH?
# 	go install github.com/mikefarah/yq/v4@latest
	-wget -qO $@ https://github.com/mikefarah/yq/releases/download/v4.30.8/yq_linux_amd64
	-chmod 744 ${PATH_FILE_YQ}
	-${PATH_FILE_YQ} --version

# Install lua dependencies
#		TODO: Ensure I'm in correct directory e.g. ~/git_projects/argmap/
$(LUA_MODULES_LOCAL): $(rockspec_file) | $(LUAROCKS_GLOBAL) config/processed/environment-argmap-processed.yaml
ifeq (${ENV}, netlify)
	$(info ************)
# YAML_LIBDIR=${PATH_LIB_GLOBAL}
	luarocks --tree ${PATH_LUA_MODULES} --lua-dir=${PATH_SHARE_GLOBAL}/opt/lua@5.3 --lua-version=5.3 make --only-deps ${rockspec_file}
	$(info ************)
else
	luarocks --tree lua_modules --lua-version=5.3 make --only-deps ${rockspec_file} YAML_LIBDIR=${PATH_ENVIRONMENT_GLOBAL}/lib/
endif
	touch "$@"

$(rockspec_file):
	$(info *** Checking: $(rockspec_file) ***)
	luarocks lint "$(rockspec_file)"

# Rule for conda links to .local folder
${PATH_PROFILE_LOCAL}/%: | ${PATH_ENVIRONMENT_GLOBAL}/%
	@-mkdir --parent "$(@D)"
	-ln -s "$|" "$@"

${PATH_ENVIRONMENT_GLOBAL}/%:
	@-mkdir --parent "$(@D)"

# For calling lua functions from shell (within conda env)
${PATH_BIN_GLOBAL}/%: | ${PATH_ARGMAP_ROOT}/${PATH_LUA_ARGMAP}/%.lua
	@-mkdir --parent "$(@D)"
	-ln -s $| $@

# Adds .lua files to pandoc data-folder:

${PATH_PANDOC_GLOBAL}/filters/%: | ${PATH_ARGMAP_ROOT}/${PATH_LUA_ARGMAP}/%
# Makes the required directories in the path
#		Haven't noticed this happening: If you don't use order-only-prerequisites each modification (e.g. copying or creating a file)
#		in that directory will trigger the rule that depends on the directory-creation target again!
	@-mkdir --parent "$(@D)"
	-ln -s $| $@

# latex templates e.g. examples/example-template.latex need to be in conda folder:
${PATH_PANDOC_GLOBAL}/templates/%: | ${PATH_ARGMAP_ROOT}/%
	@-mkdir --parent "$(@D)"
	-ln -s $| $@

# For vscode pandoc extensions (1,2,3):

# 1. Fixed issue with vscode-pandoc not finding config_argmap with these links:

# Rule for argmap lua links to conda lua folder
#   Needed for config_argmap, but need to use absolute link
${PATH_LUA_GLOBAL}/%.lua: | ${PATH_ARGMAP_ROOT}/${PATH_LUA_ARGMAP}/%.lua
	@-mkdir --parent "$(@D)"
	-ln -s $| $@

# Currently no link
# Rule for argmap lua links to conda pandoc folder
# ${PATH_ENVIRONMENT_GLOBAL}/share/pandoc/%: | ${PATH_LUA_ARGMAP}/%
# 	@-mkdir --parent "$(@D)"
# 	ln -s $| $@

# Uninstalling the main (apt-get) lua might have removed /usr/local.. from LUA_PATH, since vscode-pandoc was suddenly throwing errors.

# 2. Pandoc folder location can be printed (see src/lua/pandoc-hello.lua in branch X?) is location of markdown file, so might be able to do relative links from extensions
# rm /js
# Currently mapjs/public/js is just a directory, so have commented out:
# -ln -s /home/s6mike/git_projects/argmap/mapjs/public/js /js

# Makes conda exes available in local for VSCode extensions which don't have path option:
  # Unnecessary for extensions which have custom pandoc path setting, though vscode-pandoc still throws an error message:
  # ln -s "$PATH_ENVIRONMENT_GLOBAL/bin/pandoc" "$HOME/.local/bin/"

  # Added since after uninstalling global lua, vscode-pandoc extension fails.
  # Wondering if adding this link (from section 2), would help:
  #   ln -s "$PATH_LUA_ARGMAP/config_argmap.lua" "$PATH_ENVIRONMENT_GLOBAL"/share/pandoc/

# 3. Install rockspec in global scope

# Can instead remove each package in turn with lua remove name --tree "$install_dir/$dir_lua" (name needs to match rockspec name e.g. penlight not pl)
#   Might be able to uninstall argamp if I've installed it all rather than just dependencies
# 		luarocks remove
# 	luarocks make --only-deps "$rockspec_file" YAML_LIBDIR="$PATH_ENVIRONMENT_GLOBAL/lib/"

# 5. `pandoc-argmap.lua` depends on [Pandoc](https://pandoc.org/installing.html)(tested with v2.9.2.1 and v2.6), and on `argmap2lua` and `argmap2tikz.lua`. It also depends on [`pdf2svg`](https://www.cityinthesky.co.uk/opensource/pdf2svg/) for conversion to svg, and [ImageMagick](https://www.imagemagick.org/)'s `convert` for conversion to png.
${PATH_FILE_CONVERT_GLOBAL}: ${PATH_BIN_GLOBAL}/magick
ifneq (${ENV}, netlify)
	conda install imagemagick
endif

# 3. `argmap2mup.lua` and `mup2argmap.lua` also depend on the command line utility [`gdrive`](https://github.com/prasmussen/gdrive) for Google Drive integration. Follow the link for installation instructions. (Note that on linux the 386 version is more likely to work: see <https://github.com/prasmussen/gdrive/issues/597>).
# 	TODO make var for gdrive_2.1.1_linux_386.tar.gz (ideally generate from URL)
${PATH_FILE_GDRIVE_LOCAL}: | ${PATH_BIN_LOCAL}/gdrive_2.1.1_linux_386.tar.gz
	app_unzip ${PATH_BIN_LOCAL}/gdrive_2.1.1_linux_386.tar.gz ${PATH_FILE_GDRIVE_LOCAL}

${PATH_BIN_LOCAL}/gdrive_2.1.1_linux_386.tar.gz:
	app_install ${PATH_BIN_LOCAL} https://github.com/prasmussen/gdrive/releases/download/2.1.1/gdrive_2.1.1_linux_386.tar.gz

# Though may be covered by conda dependencies:
  # - anaconda/linux-64::luarocks==3.7.0=lua53h06a4308_0
  # - texlive-core
  # - pandoc=2.9.2.1
  # - imagemagick
  # - conda-forge/linux-64::unzip==6.0=h7f98852_3
  # - anaconda/linux-64::yaml==0.2.5=h7b6447c_0
  # - anaconda/linux-64::nodejs==16.13.1=hb931c9a_0
  # - anaconda/linux-64::lua==5.3.4=h7b6447c_0

# brew "libyaml"
# 2. For lyaml, you may need to install [libyaml-dev](https://packages.debian.org/stretch/libyaml-dev) or [yaml (conda)](https://anaconda.org/anaconda/yaml).

# brew "texlive"
# 4. Converting the `tikz` code generated by `argmap2tikz.lua` to PDF requires several `TeX` packages, some of which you may need to install if they are not already available on your system. e.g. `texlive-latex-extra` and `texlive-luatex` from apt-get.
# # lualatex is a LaTeX based format, so in order to use it you have to install LaTeX, not just TeX. So you need at least the Ubuntu texlive-latex-base package.
# # But if you aren't an expert, it's usually better to just install texlive-full to avoid issues later on with missing packages.
# # https://tex.stackexchange.com/questions/630111/install-lualatex-for-use-on-the-command-line
# 	apt-get install texlive-latex-extra
# 	apt-get install texlive-luatex

# SECTION X: Clientside Lua
# ---------------------------------------------------
# TODO: These links probably need re-creating (add rm commands)

# Ensures fengari script and source map available to site:
# 	ln -s "$PATH_FOLDER_ARGMAP_SRC/js/fengari-web.js" "$PATH_PUBLIC/js/fengari-web.js"
# 	ln -s "$PATH_FOLDER_ARGMAP_SRC/js/fengari-web.js.map" "$PATH_PUBLIC/js/fengari-web.js.map"
# Ensure lua dependencies available to site for client_argmap2mapjs

# ${PATH_PUBLIC}/%: | ${PATH_ARGMAP_ROOT}/%
# 	-ln -s $| $@

# -ln -s "$PATH_LUA_ARGMAP" "$PATH_PUBLIC/lua"
# -ln -s $| "$PATH_PUBLIC/lua_modules"

# SECTION Z: Uninstall

# Leave env files in place (but delete samples)
# What about test output files? vscode settings?
# delete everything else?
# run `scripts/luarocks_clean.sh`
# do npm uninstall process
# env variables? symbolic links?
