##
# Copyright 2011 Jorge Villalobos
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
##

# The name of the extension.
extension_name := remotexulinstaller

# First part of the add-on id. Generated to avoid conflicts.
id := $(shell uuidgen)

# The zip application to be used.
ZIP := zip

# Bin dir.
bin_dir := ../bin

# The target XPI file.
xpi_file := $(bin_dir)/$(extension_name).xpi

# This builds the extension XPI file.
.PHONY: all
all: $(xpi_file)
	@echo
	@echo "Build finished successfully."
	@echo

# This cleans all temporary files and directories created by 'make'.
.PHONY: clean
clean:
	@rm -rf $(build_dir)
	@rm -f $(xpi_file)
	@echo "Cleanup is done."

# The temporary location where the extension tree will be copied and built.
build_dir := $(bin_dir)/build

# The sources for the XPI file. Uses variables defined in the included
# Makefiles.
xpi_built := $(build_dir)/install.rdf \
             $(build_dir)/bootstrap.js

xpi_built_no_dir := $(subst $(build_dir)/,,$(xpi_built))

$(xpi_file): $(build_dir) $(xpi_built)
	@echo "Creating XPI file."
	@cd $(build_dir); $(ZIP) ../$(xpi_file) $(xpi_built_no_dir)
	@echo "Creating XPI file. Done!"

include config.mk

$(build_dir)/%: %
	@sed -E \
    -e 's/\$$\(ID\)/$(id)/g' \
    -e 's/\$$\(DOMAINS\)/$(domains)/g' \
    -e 's/\$$\(TITLE\)/$(title_localized)/g' \
    -e 's/\$$\(WARNING\)/$(warning_localized)/g' \
    $< > $@

$(build_dir):
	@if [ ! -x $(build_dir) ]; \
  then \
    mkdir $(build_dir); \
  fi
