/**
 * Copyright 2015 Jorge Villalobos
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const Cc = Components.classes;
const Ci = Components.interfaces;

/**
 * XFPermsChrome namespace.
 */
if ("undefined" == typeof(XFPermsChrome)) {
  var XFPermsChrome = {};
};

/**
 * Manager dialog controller.
 */
XFPermsChrome.Manager = {

  /* Logger for this object. */
  _logger : null,

  /**
   * Initializes the object.
   */
  init : function() {
    Components.utils.import("resource://gre/modules/Services.jsm");
    Components.utils.import("chrome://rxm-modules/content/common.js");
    Components.utils.import("chrome://rxm-modules/content/permissions.js");

    this._logger = XFPerms.getLogger("XFPermsChrome.Manager");
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
      let generateItem = document.getElementById("generate-menuitem");
      let allowed = XFPerms.Permissions.getAll();
      let allowedCount = allowed.length;
      let item;

      // clear the current list.
      while (null != permissions.firstChild) {
        permissions.removeChild(permissions.firstChild);
      }

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

      // null in the about: window.
      if (null != generateItem) {
        generateItem.disabled = (0 == allowedCount);
      }
    } catch (e) {
      this._logger.error("_loadPermissions\n" + e);
    }
  },

  /**
   * Adds a new permission to the list.
   * @param aEvent the event that triggered this action.
   */
  add : function(aEvent) {
    this._logger.debug("add");

    let origin = { value : "" };
    let promptResponse;

    promptResponse =
      Services.prompt.prompt(
        window, XFPerms.stringBundle.GetStringFromName("rxm.addDomain.title"),
        XFPerms.stringBundle.formatStringFromName(
          "rxm.enterDomain.label", [ XFPerms.Permissions.LOCAL_FILES ], 1),
        origin, null, { value : false });

    if (promptResponse) {
      let success = XFPerms.Permissions.add(origin.value);

      if (success) {
        this._loadPermissions();
      } else {
        this._alert("rxm.addDomain.title", "rxm.invalidDomain.label");
      }
    }
  },

  /**
   * Removes the selected permissions from the list.
   * @param aEvent the event that triggered this action.
   */
  remove : function(aEvent) {
    this._logger.debug("remove");

    let selected = document.getElementById("domains").selectedItems;
    let count = selected.length;
    let message =
      ((1 == count) ?
       XFPerms.stringBundle.GetStringFromName("rxm.removeOne.label") :
       XFPerms.stringBundle.formatStringFromName(
        "rxm.removeMany.label", [ count ], 1));
    let doRemove;
    let item;

    doRemove =
      Services.prompt.confirm(
        window, XFPerms.stringBundle.GetStringFromName("rxm.removeDomain.title"),
        message);

    if (doRemove) {
      try {
        for (let i = 0; i < count; i ++) {
          item = selected[i];
          XFPerms.Permissions.remove(item.getAttribute("value"));
        }
      } catch (e) {
        this._logger.debug("remove\n" + e);
      }

      this._loadPermissions();
    }
  },

  /**
   * onselect event handler. Decides when to enable or disable the remove
   * button and export menu.
   * @param aEvent the event that triggered this action.
   */
  select : function (aEvent) {
    this._logger.debug("select");

    let removeButton = document.getElementById("remove");
    let exportMenu = document.getElementById("export-menuitem");
    let listbox = document.getElementById("domains");

    removeButton.disabled = (0 == listbox.selectedCount);

    // null in the about: window.
    if (null != exportMenu) {
      exportMenu.disabled = (0 == listbox.selectedCount);
    }
  },

  /**
   * Displays a file selection dialog to choose the file to export to. If
   * chosen, the selected permissions will be exported to that file.
   */
  exportPermissions : function(aEvent) {
    this._logger.debug("exportPermissions");

    let permissions = [];

    try {
      for (let origin of document.getElementById("domains").selectedItems) {
        permissions.push(origin.getAttribute("value"));
      }
    } catch (e) {
      this._logger.error("exportPermissions\n" + e);
    }

    if (0 < permissions.length) {
      let success = true;

      try {
        // only import the script when necessary.
        Components.utils.import("chrome://rxm-modules/content/export.js");

        let fp =
          Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
        let winResult;

        // set up the dialog.
        fp.defaultExtension = "." + XFPerms.Export.DEFAULT_EXTENSION;
        fp.defaultString = "domains." + XFPerms.Export.DEFAULT_EXTENSION;
        fp.init(
          window,
          XFPerms.stringBundle.GetStringFromName("rxm.exportSelected.title"),
          Ci.nsIFilePicker.modeSave);
        fp.appendFilters(Ci.nsIFilePicker.filterAll);

        // display it.
        winResult = fp.show();

        if ((Ci.nsIFilePicker.returnOK == winResult) ||
            (Ci.nsIFilePicker.returnReplace == winResult)) {
          success = XFPerms.Export.exportPermissions(permissions, fp.file);
        }
      } catch (e) {
        success = false;
        this._logger.error("exportPermissions\n" + e);
      }

      // if an error happens, alert the user.
      if (!success) {
        this._alert("rxm.exportSelected.title", "rxm.exportError.label");
      }
    } else {
      // how did we get here???
      this._logger.error(
        "exportPermissions. Tried to export with no permissions selected.");
    }
  },

  /**
   * Displays a file selection dialog to choose the file to import from. If
   * chosen, the permissions will be imported from that file.
   */
  importPermissions : function(aEvent) {
    this._logger.debug("importPermissions");

    let success = true;

    try {
      // only import the script when necessary.
      Components.utils.import("chrome://rxm-modules/content/export.js");

      let fp =
        Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
      let winResult;

      // set up the dialog.
      fp.defaultExtension = "." + XFPerms.Export.DEFAULT_EXTENSION;
      fp.init(
        window,
        XFPerms.stringBundle.GetStringFromName("rxm.import.title"),
        Ci.nsIFilePicker.modeOpen);
      fp.appendFilters(Ci.nsIFilePicker.filterAll);

      // display it.
      winResult = fp.show();

      if ((Ci.nsIFilePicker.returnOK == winResult) ||
          (Ci.nsIFilePicker.returnReplace == winResult)) {
        let result = XFPerms.Export.importPermissions(fp.file);

        success = result.success;

        if (success) {
          let importCount = result.permissions.length;
          let failCount = result.invalids.length;
          let message =
            ((1 == importCount) ?
             XFPerms.stringBundle.GetStringFromName(
              "rxm.import.importedOne.label") :
             XFPerms.stringBundle.formatStringFromName(
              "rxm.import.importedMany.label", [ importCount ], 1));

          if (0 < failCount) {
            message += "\n";
            message +=
              ((1 == failCount) ?
               XFPerms.stringBundle.GetStringFromName(
                "rxm.import.invalidOne.label") :
               XFPerms.stringBundle.formatStringFromName(
                "rxm.import.invalidMany.label", [ failCount ], 1));
          }

          Services.prompt.alert(
            window, XFPerms.stringBundle.GetStringFromName("rxm.import.title"),
            message);
        }
      }
    } catch (e) {
      success = false;
      this._logger.error("importPermissions\n" + e);
    }

    this._loadPermissions();

    if (!success) {
      this._alert("rxm.import.title", "rxm.importError.label");
    }
  },

  /**
   * Opens the Installer generator dialog.
   * @param aEvent the event that triggered this action.
   */
  launchGenerator : function(aEvent) {
    this._logger.debug("launchGenerator");

    let win =
      Services.wm.getMostRecentWindow("remotexulmanager-generator-dialog");

    // check if a window is already open.
    if ((null != win) && !win.closed) {
      win.focus();
    } else {
      window.openDialog(
        "chrome://remotexulmanager/content/rxmGenerator.xul",
        "remotexulmanager-generator-dialog",
        "chrome,titlebar,centerscreen,dialog,resizable");
    }
  },

  /**
   * Shows a basic alert prompt with a title and content.
   * @param aTitleKey the key to the string that is used for the title.
   * @param aContentKey the key to the string that is used for the content.
   */
  _alert : function(aTitleKey, aContentKey) {
    this._logger.trace("_alert");

    Services.prompt.alert(
      window, XFPerms.stringBundle.GetStringFromName(aTitleKey),
      XFPerms.stringBundle.GetStringFromName(aContentKey));
  }
};

window.addEventListener(
  "load", function() { XFPermsChrome.Manager.init(); }, false);
window.addEventListener(
  "unload", function() { XFPermsChrome.Manager.uninit(); }, false);
