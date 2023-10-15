# Makefile for Argumend - currently just creates symlinks

# TODO 
#		Add make test
#		Add make help e.g. https://stackoverflow.com/questions/8811526/using-conditional-rules-in-a-makefile

# Avoids collisions with filenames
.PHONY: all public prints clean # dev

# Stops intermediate files being deleted (e.g. content/X.html)
# .SECONDARY:

# Define variables

# := simple, assigned once
# PUBLIC_DIR := public

# Requires this at end of script with bash function (config_read_functions.lib.sh) 
# 	Allows to call a function based on arguments passed to the script
# 	$*
#
#		Then:
# 		PATH_DIR_PUBLIC := $(shell X=$(./scripts/config_read_functions.lib.sh getvar PATH_DIR_PUBLIC); echo "$$X")

# Need to export required variables at end of argmap_init_script.sh:
#		Alternative is to define variables in make call:
#			make DIR_PUBLIC_OUTPUT="${PATH_DIR_PUBLIC}/output"
#	TODO: /output: Add variable, or replace /output with basename "$(getvar DIR_PUBLIC_OUTPUT)"
PATH_OUTPUT_LOCAL := ${PATH_OUTPUT_LOCAL}
DIR_PUBLIC_OUTPUT := ${PATH_DIR_PUBLIC}/output

# ###########

all:
	make public

public:
	make ${DIR_PUBLIC_OUTPUT}

# dev:
# 	make all
# 	netlify dev

prints:
	$(info DIR_PUBLIC_OUTPUT:)
	$(info ${DIR_PUBLIC_OUTPUT})

# Define a clean target
# 	Updated to just clean built html files, ignoring wp-json which are json files with (for some reason) html extension
#		Have to use -not instead of -prune because -delete is not compatible with -prune
# TODO Add __clean_repo()
clean:
	rm ${DIR_PUBLIC_OUTPUT}	
# rm $(getvar PATH_DIR_PUBLIC)/$(basename "$(getvar DIR_PUBLIC_OUTPUT)")
# find $(PUBLIC_DIR)  \( -type f -iname "*.html" -o -type d -empty \) -not -path "$(PUBLIC_DIR)/wp-json/*" -delete

# ############

# TODO Create symlinks when not present
${DIR_PUBLIC_OUTPUT}: | ${PATH_OUTPUT_LOCAL}
	ln -s ${PATH_OUTPUT_LOCAL} $@

# # Compiles full html output in public/ from content/ + template
# $(PUBLIC_DIR)/%.html: $(CONTENT_DIR)/%.html badmintondoubles-template-main.html badmintondoubles-template-comments-new.html
# 		$(info Compiles content + template > public)
# 		mkdir -p $(@D)
# 		./compile_template.sh $< $@ $(TEMPLATE)
