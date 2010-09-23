/**
 * Copyright 2010 Jorge Villalobos
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


var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;

const ALLOW_REMOTE_XUL = "allowXULXBL";
const ALLOW = 1;

Components.utils.import("resource://remotexulmanager/rxmCommon.js");

RXULM.Permissions = {
  /* Logger for this object. */
  _logger : null,
  /* Permission manager component. */
  _permissionManager : null,
  /* IO Service. */
  _ioService : null,

  /**
   * Initializes the object.
   */
  init : function() {
    this._logger = RXULM.getLogger("RXULM.Permissions");
    this._logger.debug("init");

    this._permissionManager =
      Cc["@mozilla.org/permissionmanager;1"].
        getService(Ci.nsIPermissionManager);
    this._ioService =
      Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
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
      let enumerator = this._permissionManager.enumerator;

      while (enumerator.hasMoreElements()) {
        permission = enumerator.getNext().QueryInterface(Ci.nsIPermission);

        if (ALLOW_REMOTE_XUL == permission.type) {
          list.push(permission.host);
        }
      }
    } catch (e) {
      this._logger.error("getAll\n" + e);
    }

    return list;
  },

  /**
   * Add a domain to the remote XUL list.
   * @param aDomain the domain to add.
   * @return true if the operation worked correctly, false otherwise.
   */
  add : function(aDomain) {
    this._logger.debug("add: " + aDomain);

    let result = false;
    let uri;

    try {
      uri = this._getURI(aDomain);
      this._permissionManager.add(uri, ALLOW_REMOTE_XUL, ALLOW);
      result = true;
    } catch (e) {
      this._logger.error("add\n" + e);
    }

    return result;
  },

  /**
   * Remove a domain from the remote XUL list.
   * @param aDomain the domain to remove.
   * @return true if the operation worked correctly, false otherwise.
   */
  remove : function(aDomain) {
    this._logger.debug("remove: " + aDomain);

    let result = false;

    try {
      this._permissionManager.remove(aDomain, ALLOW_REMOTE_XUL);
      result = true;
    } catch (e) {
      this._logger.error("remove\n" + e);
    }

    return result;
  },

  /**
   * Returns an nsIURI version of the domain string.
   * @param aDomainString the user-provided domain string.
   * @return the nsIURI that corresponds to the domain string.
   */
  _getURI : function(aDomainString) {
    this._logger.trace("_getURI");

    return this._ioService.newURI(aDomainString, null, null);
  }
};

/**
 * Constructor.
 */
(function() {
  this.init();
}).apply(RXULM.Permissions);
