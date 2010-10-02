##
# Copyright 2010 Jorge Villalobos
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
extension_name := remotexulmanager

# The UUID of the extension.
extension_uuid := remotexulmanager@xulforge.com

# The name of the profile dir where the extension can be installed.
profile_dir := remotexulmanager-dev

# The zip application to be used.
ZIP := zip

# The target XPI file.
xpi_file := ../bin/$(extension_name).xpi

# The type of operating system this make command is running on.
os_type := $(patsubst darwin%,darwin,$(shell echo $(OSTYPE)))

# The location of the extension profile.
ifeq ($(os_type), darwin)
  profile_location := \
    ~/Library/Application\ Support/Firefox/Profiles/$(profile_dir)/extensions/$(extension_uuid)
else
  ifeq ($(os_type), linux-gnu)
    profile_location := \
      ~/.mozilla/firefox/$(profile_dir)/extensions/$(extension_uuid)
  else
    profile_location := \
      "$(subst \,\\,$(APPDATA))\\Mozilla\\Firefox\\Profiles\\$(profile_dir)\\extensions\\$(extension_uuid)"
  endif
endif

# This builds the extension XPI file.
.PHONY: all
all: $(xpi_file)
	@echo
	@echo "Build finished successfully."
	@echo

# This cleans all temporary files and directories created by 'make'.
.PHONY: clean
clean:
	@rm -f $(xpi_file)
	@echo "Cleanup is done."

# The sources for the XPI file. Uses variables defined in the included
# Makefiles.
xpi_built := install.rdf \
             chrome.manifest \
             icon.png \
             $(wildcard content/*.js) \
             $(wildcard content/*.xul) \
             $(wildcard content/*.xml) \
             $(wildcard content/*.css) \
             $(wildcard skin/*.css) \
             $(wildcard skin/*.png) \
             $(wildcard locale/*/*.dtd) \
             $(wildcard locale/*/*.properties) \
             $(wildcard modules/*.js) \
             defaults/preferences/$(extension_name).js

xpi_root := install.rdf \
            chrome.manifest \
            content \
            skin \
            locale \
            modules \
            defaults

# This builds everything except for the actual XPI, and then it copies it to the
# specified profile directory, allowing a quick update that requires no install.
.PHONY: install
install: $(xpi_built) $(xpi_root)
	@echo "Installing in profile folder: $(profile_location)"
	@cp -Rf $(xpi_root) $(profile_location)
	@echo "Installing in profile folder. Done!"
	@echo

$(xpi_file): $(xpi_built)
	@echo "Creating XPI file."
	@$(ZIP) $(xpi_file) $(xpi_built)
	@echo "Creating XPI file. Done!"
