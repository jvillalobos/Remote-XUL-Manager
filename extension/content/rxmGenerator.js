/**
 * Copyright 2011 Jorge Villalobos
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

Components.utils.import("resource://remotexulmanager/rxmCommon.js");
Components.utils.import("resource://remotexulmanager/rxmGenerator.js");

/**
 * RXULMChrome namespace.
 */
if ("undefined" == typeof(RXULMChrome)) {
  var RXULMChrome = {};
};

/**
 * Remote XUL Installer Generator dialog controller.
 */
RXULMChrome.Generator = {

  /* Logger for this object. */
  _logger : null,

  /**
   * Initializes the object.
   */
  init : function() {
    this._logger = RXULM.getLogger("RXULMChrome.Generator");
    this._logger.debug("init");
    this._loadPermissions();
  },

  /**
   * Load the permission list from the datasource.
   */
  _loadPermissions : function() {
    this._logger.trace("_loadPermissions");

    try {
      let domains = document.getElementById("domains");
      let allowed = RXULM.Permissions.getAll();
      let allowedCount = allowed.length;
      let item;

      for (let i = 0; i < allowedCount; i++) {
        item = document.createElement("listitem");

        if (RXULM.Permissions.LOCAL_FILES != allowed[i]) {
          item.setAttribute("label", allowed[i]);
          item.setAttribute("value", allowed[i]);
        } else {
          item.setAttribute(
            "label", RXULM.stringBundle.GetStringFromName("rxm.file.label"));
          item.setAttribute("value", RXULM.Permissions.LOCAL_FILES);
        }

        domains.appendChild(item);
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

    document.getElementById("generate").disabled = (0 == listbox.selectedCount);
  }
};

window.addEventListener(
  "load", function() { RXULMChrome.Generator.init(); }, false);
