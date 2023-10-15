# Makefile for Argumend - currently just creates symlinks

# TODO 
#		Add make test
#		Add make help e.g. https://stackoverflow.com/questions/8811526/using-conditional-rules-in-a-makefile

# Avoids collisions with filenames
.PHONY: all public conda prints clean # dev

# Stops intermediate files being deleted (e.g. content/X.html)
# .SECONDARY:

# Define variables

# := simple, assigned once
# 	Need to export required variables at end of argmap_init_script.sh:
PATH_TEST := ${PATH_TEST}
#	TODO: /output: Add variable, or replace /output with basename "$(getvar DIR_PUBLIC_OUTPUT)"
LINK_TARGETS_PUBLIC := ${PATH_PUBLIC}/output ${PATH_PUBLIC}/input

# ###########

all:
	make public

public:
	make ${LINK_TARGETS_PUBLIC}

# conda:

# dev:
# 	make all
# 	netlify dev

prints:
	$(info PATH_PUBLIC:)
	$(info ${PATH_PUBLIC})
	$(info PATH_TEST:)
	$(info ${PATH_TEST})

# Define a clean target
# 	Updated to just clean built html files, ignoring wp-json which are json files with (for some reason) html extension
#		Have to use -not instead of -prune because -delete is not compatible with -prune
# TODO Add __clean_repo()
clean:
	rm ${LINK_TARGETS_PUBLIC}	

# ############

${PATH_PUBLIC}/%: | ${PATH_TEST}/%
	ln -s ${PATH_TEST}/$* $@
