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

var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;

const ALLOW_REMOTE_XUL = "allowXULXBL";
const ALLOW = 1;
const LOCAL_FILE_PREF = "dom.allow_XUL_XBL_for_file";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("chrome://rxm-modules/content/common.js");

XFPerms.Permissions = {
  /* Logger for this object. */
  _logger : null,

  /* "Domain" identifier for all local files. */
  get LOCAL_FILES() { return "<file>"; },

  /**
   * Initializes the object.
   */
  init : function() {
    this._logger = XFPerms.getLogger("XFPerms.Permissions");
    this._logger.debug("init");
  },

  /**
   * Returns all domains that have remote XUL permissions.
   * @return array of strings of the domains that have remote XUL permissions.
   */
  getAll : function() {
    this._logger.debug("getAll");

    let list = [];
    let permission;

    try  {
      let enumerator = Services.perms.enumerator;
      let allowLocalFiles = false;

      try {
        allowLocalFiles = Services.prefs.getBoolPref(LOCAL_FILE_PREF);
      } catch (e) {
        this._logger.info("getAll. No value for local files pref.");
      }

      while (enumerator.hasMoreElements()) {
        permission = enumerator.getNext().QueryInterface(Ci.nsIPermission);

        if ((ALLOW_REMOTE_XUL == permission.type) &&
            (this.LOCAL_FILES != permission.principal.URI.host)) {
          list.push(permission.principal.URI.host);
        }
      }

      if (allowLocalFiles) {
        list.push(this.LOCAL_FILES);
      }
    } catch (e) {
      this._logger.error("getAll\n" + e);
    }

    return list;
  },

  /**
   * Add a domain to the remote XUL list.
   * @param aDomain the domain to add. null to add all local files.
   * @return true if successful, false otherwise.
   */
  add : function(aDomain) {
    this._logger.debug("add: " + aDomain);

    let success = false;

    try {
      if (this.LOCAL_FILES != aDomain) {
        let uri = this._getURI(aDomain);

        Services.perms.add(uri, ALLOW_REMOTE_XUL, ALLOW);
      } else {
        Services.prefs.setBoolPref(LOCAL_FILE_PREF, true);
      }

      success = true;
    } catch (e) {
      this._logger.error("add\n" + e);
    }

    return success;
  },

  /**
   * Remove a domain from the remote XUL list.
   * @param aDomain the domain to remove.
   * @return true if successful, false otherwise.
   */
  remove : function(aDomain) {
    this._logger.debug("remove: " + aDomain);

    let success = false;

    try {
      if (this.LOCAL_FILES != aDomain) {
        let domain = XFPerms.addProtocol(aDomain);
        let uri = Services.io.newURI(domain, null, null)
        Services.perms.remove(uri, ALLOW_REMOTE_XUL);
      } else {
        Services.prefs.setBoolPref(LOCAL_FILE_PREF, false);
      }

      success = true;
    } catch (e) {
      this._logger.error("remove\n" + e);
    }

    return success;
  },

  /**
   * Returns an nsIURI version of the domain string.
   * @param aDomainString the user-provided domain string.
   * @return the nsIURI that corresponds to the domain string.
   */
  _getURI : function(aDomainString) {
    this._logger.trace("_getURI");

    return Services.io.newURI(aDomainString, null, null);
  }
};

/**
 * Constructor.
 */
(function() {
  this.init();
}).apply(XFPerms.Permissions);
