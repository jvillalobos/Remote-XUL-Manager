/**
 * Copyright 2010 Jorge Villalobos
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

// SQL statements for the permissions DB.
const SQL_SELECT =
  "SELECT * FROM moz_hosts WHERE host='<file>' AND type='" + ALLOW_REMOTE_XUL +
  "'";
const SQL_DELETE =
  "DELETE FROM moz_hosts WHERE host='<file>' AND type='" + ALLOW_REMOTE_XUL +
  "'";

Components.utils.import("resource://remotexulmanager/rxmCommon.js");

RXULM.Permissions = {
  /* Logger for this object. */
  _logger : null,
  /* Permission manager component. */
  _permissionManager : null,
  /* IO Service. */
  _ioService : null,
  /* Preference that indicates local files have remote XUL permission. */
  _localFilePref : null,

  /* "Domain" identifier for all local files. */
  get LOCAL_FILES() { return "<file>"; },

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

    this._localFilePref = RXULM.Application.prefs.get(LOCAL_FILE_PREF);
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

      if (this._localFilePref.value) {
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

        this._permissionManager.add(uri, ALLOW_REMOTE_XUL, ALLOW);
      } else {
        this._localFilePref.value = true;
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
        this._permissionManager.remove(aDomain, ALLOW_REMOTE_XUL);
      } else {
        this._localFilePref.value = false;
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

    return this._ioService.newURI(aDomainString, null, null);
  },

  /**
   * Indicates if there's a local file permission stored in the DB.
   * @return true if there's a local file permission in the DB. false otherwise.
   */
  hasLocalFileDB : function() {
    this._logger.debug("hasLocalFileDB");

    let connection = this._getDBConnection();
    let statement = connection.createStatement(SQL_SELECT);
    let result = statement.executeStep();

    statement.reset();
    connection.close();

    return result;
  },

  /**
   * Deletes the local file permission entry from the DB.
   */
  deleteLocalFileDB : function() {
    this._logger.debug("deleteLocalFileDB");

    let connection = this._getDBConnection();

    connection.executeSimpleSQL(SQL_DELETE);
    connection.close();
  },

  /**
   * Returns a connection to the permissions database.
   * @return connection to the permissions database.
   */
  _getDBConnection : function() {
    this._logger.trace("_getDBConnection");

    let dirService =
      Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
    let storageService =
      Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
    let dbFile = dirService.get("ProfD", Ci.nsIFile);

    dbFile.append("permissions.sqlite");

    return storageService.openDatabase(dbFile);
  }
};

/**
 * Constructor.
 */
(function() {
  this.init();
}).apply(RXULM.Permissions);
