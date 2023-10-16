# Makefile for Argumend - currently just creates symlinks

# TODO 
#		Add make test
#		Add make help e.g. https://stackoverflow.com/questions/8811526/using-conditional-rules-in-a-makefile

# Avoids collisions with filenames
#		-- is convention for private targets
.PHONY: all --public --conda prints clean # dev

# Stops intermediate files being deleted (e.g. content/X.html)
# .SECONDARY:

# Define variables

# := simple, assigned once
# 	Need to export required variables at end of argmap_init_script.sh:
PATH_TEST := ${PATH_TEST}
# TODO Move to env file
PATH_PROFILE_LOCAL := /home/s6mike/.local
#	TODO: /output: Add variable, or replace /output with basename "$(getvar DIR_PUBLIC_OUTPUT)"
LINK_TARGETS_PUBLIC := ${PATH_PUBLIC}/output ${PATH_PUBLIC}/input

LINK_TARGETS_CONDA := ${PATH_PROFILE_LOCAL}/bin/lua
LINK_TARGETS_CONDA += ${PATH_PROFILE_LOCAL}/bin/convert # Only needed for pre-commit hook
# Connects legacy data-folder to conda env:
# 	TODO: add this to conda activation, and delete this link when env deactivated?
# 	NOTE: can use defaults file to set defalt data directory, should simplify.
# 	Alternative is always to use --data-directory "$CONDA_PREFIX/share/pandoc/" when calling pandoc
LINK_TARGETS_CONDA += ${PATH_PROFILE_LOCAL}/share/pandoc

# ###########

all: --public --conda

--public: ${LINK_TARGETS_PUBLIC}
--conda: ${LINK_TARGETS_CONDA}

# dev:
# 	make all
# 	netlify dev

prints:
	$(info PATH_PUBLIC:)
	$(info ${PATH_PUBLIC})
	$(info PATH_TEST:)
	$(info ${PATH_TEST})
	$(info LINK_TARGETS_CONDA:)
	$(info ${LINK_TARGETS_CONDA})	

# Define a clean target
# 	Updated to just clean built html files, ignoring wp-json which are json files with (for some reason) html extension
#		Have to use -not instead of -prune because -delete is not compatible with -prune
# TODO Add __clean_repo()
clean:
	rm -f ${LINK_TARGETS_PUBLIC}	
	rm -f ${LINK_TARGETS_CONDA}	

# ############

# Rule for public links
#  after | is order only pre-requisite, doesn't update based on timestamps
${PATH_PUBLIC}/%: | ${PATH_TEST}/%
	ln -s ${PATH_TEST}/$* $@

# Rule for conda links to .local folder
${PATH_PROFILE_LOCAL}/%: | ${CONDA_PREFIX}/%
	ln -s ${CONDA_PREFIX}/$* $@
