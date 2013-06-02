/**
 * Copyright 2013 Jorge Villalobos
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const Cc = Components.classes;
const Ci = Components.interfaces;

const INSTALLER_EXTENSION = "xpi";

/**
 * XFPermsChrome namespace.
 */
if ("undefined" == typeof(XFPermsChrome)) {
  var XFPermsChrome = {};
};

/**
 * Installer Generator dialog controller.
 */
XFPermsChrome.Generator = {

  /* Logger for this object. */
  _logger : null,

  /**
   * Initializes the object.
   */
  init : function() {
    Components.utils.import("resource://gre/modules/Services.jsm");
    Components.utils.import("chrome://rxm-modules/content/common.js");
    Components.utils.import("chrome://rxm-modules/content/generator.js");

    this._logger = XFPerms.getLogger("XFPermsChrome.Generator");
    this._logger.debug("init");
    this._loadPermissions();
  },

  /**
   * Uninitializes the object.
   */
  uninit : function() {
  },

  /**
   * Load the permission list from the datasource.
   */
  _loadPermissions : function() {
    this._logger.trace("_loadPermissions");

    try {
      let permissions = document.getElementById("domains");
      let allowed = XFPerms.Permissions.getAll();
      let allowedCount = allowed.length;
      let item;

      for (let i = 0; i < allowedCount; i++) {
        item = document.createElement("listitem");

        if (XFPerms.Permissions.LOCAL_FILES != allowed[i]) {
          item.setAttribute("label", allowed[i]);
          item.setAttribute("value", allowed[i]);
        } else {
          item.setAttribute(
            "label", XFPerms.stringBundle.GetStringFromName("rxm.file.label"));
          item.setAttribute("value", XFPerms.Permissions.LOCAL_FILES);
        }

        permissions.appendChild(item);
      }
    } catch (e) {
      this._logger.error("_loadPermissions\n" + e);
    }
  },

  /**
   * onselect event handler. Decides when to enable or disable the generate
   * button.
   * @param aEvent the event that triggered this action.
   */
  select : function (aEvent) {
    this._logger.debug("select");

    let listbox = document.getElementById("domains");
    let generateButton = document.documentElement.getButton("accept");

    generateButton.disabled = (0 == listbox.selectedCount);
  },

  /**
   * Opens the file dialog that allows the user to choose where to save the
   * generated file. Once selected, it generates the file.
   * @param aEvent the event that triggered this action.
   */
  generateInstaller : function(aEvent) {
    this._logger.debug("generateInstaller");

    let selected = document.getElementById("domains").selectedItems;
    let count = selected.length;
    let permissions = [];

    try {
      for (let i = 0; i < count; i ++) {
        permissions.push(selected[i].getAttribute("value"));
      }
    } catch (e) {
      this._logger.error("generateInstaller\n" + e);
    }

    if (0 < permissions.length) {
      try {
        let fp =
          Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
        let winResult;

        // set up the dialog.
        fp.defaultExtension = "." + INSTALLER_EXTENSION;
        fp.defaultString = "rxm-installer." + INSTALLER_EXTENSION;
        fp.init(
          window,
          XFPerms.stringBundle.GetStringFromName("rxm.generateInstaller.title"),
          Ci.nsIFilePicker.modeSave);
        fp.appendFilters(Ci.nsIFilePicker.filterAll);

        // display it.
        winResult = fp.show();

        if ((Ci.nsIFilePicker.returnOK == winResult) ||
            (Ci.nsIFilePicker.returnReplace == winResult)) {
          let title = document.getElementById("title").value.trim();
          let warning =
            document.getElementById("warning").value.trim().
              replace(/\n/g, "\\n");

          XFPerms.Generator.generateInstaller(
            fp.file, permissions, title, warning);
          XFPerms.runWithDelay(function() { window.close(); }, 0);
        }
      } catch (e) {
        this._logger.error("generateInstaller\n" + e);

        // if an error happens, alert the user.
        Services.prompt.alert(
          window,
          XFPerms.stringBundle.GetStringFromName("rxm.generateInstaller.title"),
          XFPerms.stringBundle.GetStringFromName("rxm.generateError.label"));
      }
    } else {
      // how did we get here???
      this._logger.error(
        "generateInstaller. Tried to generate installer with no permissions " +
        "selected.");
    }
  }
};

window.addEventListener(
  "load", function() { XFPermsChrome.Generator.init(); }, false);
window.addEventListener(
  "unload", function() { XFPermsChrome.Generator.uninit(); }, false);
