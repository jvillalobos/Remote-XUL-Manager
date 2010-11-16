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

// Stream creation flags. See
// https://developer.mozilla.org/en/PR_Open#Parameters
const FILE_READ_ONLY = 0x01;
const FILE_WRITE_ONLY = 0x02;
const FILE_CREATE = 0x08;
const FILE_TRUNCATE = 0x20;

// Character used to introduce comments on export files.
const COMMENT_CHAR = "#"

Components.utils.import("resource://remotexulmanager/rxmCommon.js");
Components.utils.import("resource://remotexulmanager/rxmPermissions.js");

RXULM.Export = {
  /* Logger for this object. */
  _logger : null,

  /**
   * Gets the default file extension used for imports and exports.
   */
  get DEFAULT_EXTENSION() {
    return "txt";
  },

  /**
   * Initializes the object.
   */
  init : function() {
    this._logger = RXULM.getLogger("RXULM.Export");
    this._logger.debug("init");
  },

  /**
   * Exports the list of given domains to the selected file. All existing data
   * in the file will be deleted.
   * @param aDomains array of domains to export.
   * @param aFile the file to export the domains to.
   * @return true if the operation was successful, false otherwise.
   */
  exportDomains : function(aDomains, aFile) {
    this._logger.debug("exportDomains");

    let stream =
      Cc["@mozilla.org/network/file-output-stream;1"].
        createInstance(Ci.nsIFileOutputStream);
    let count = aDomains.length;
    let result = false;
    let line;

    try {
      // open the file stream.
      stream.init(
        aFile, (FILE_WRITE_ONLY | FILE_CREATE | FILE_TRUNCATE), -1, 0);

      // write all data.
      for (let i = 0; i < count; i++) {
        line = aDomains[i] + "\n";
        stream.write(line, line.length);
      }

      // close the stream.
      stream.close();
      stream = null;
      result = true;
    } catch (e) {
      this._logger.error("exportDomains\n" + e);
    }

    return result;
  },

  /**
   * Imports a list of domains from the selected file. Domains are checked for
   * validity.
   * @param aFile the file to import the domains from.
   * @return an object with the result (.result) of the import (one of the
   * RESULT_ flags in the Permissions object), a list of valid domains
   * (.domains) and the list of invalid domains (.invalids).
   */
  importDomains : function(aFile) {
    this._logger.debug("importDomains");

    let stream =
      Cc["@mozilla.org/network/file-input-stream;1"].
        createInstance(Ci.nsIFileInputStream);
    let result =
      {
        result : RXULM.Permissions.RESULT_FAIL,
        domains : [],
        invalids : []
      };
    let hasLocalFiles = false;
    let line = {};
    let addResult;
    let hasMore;
    let lineText;
    let domain;

    try {
      // open the file stream.
      stream.init(
        aFile, FILE_READ_ONLY, -1, Ci.nsIFileInputStream.CLOSE_ON_EOF);
      stream.QueryInterface(Ci.nsILineInputStream);

      // read all data.
      do {
        hasMore = stream.readLine(line);
        lineText = line.value;

        // ignore empty lines and comment lines.
        if ((0 < lineText.length) && (COMMENT_CHAR != lineText[0])) {
          // in case we need to include more data in the future, we'll use
          // commas as separators.
          domain = lineText.split(",")[0];

          if (RXULM.Permissions.LOCAL_FILES != domain) {
              addResult = RXULM.Permissions.add(domain);

              // insert into the right array once we've tried to add it.
              if (RXULM.Permissions.RESULT_SUCCESS == addResult) {
                result.domains.push(domain);
              } else {
                result.invalids.push(domain);
              }
          } else{
            hasLocalFiles = true;
          }
        }
      } while(hasMore);

      // the local files permission needs to be added last, otherwise other
      // permission insertion may fail.
      if (hasLocalFiles) {
        RXULM.Permissions.add(RXULM.Permissions.LOCAL_FILES);
        result.domains.push(RXULM.Permissions.LOCAL_FILES);
        result.result = RXULM.Permissions.RESULT_RESTART;
      } else {
        result.result = RXULM.Permissions.RESULT_SUCCESS;
      }

      // close the stream.
      stream.close();
      stream = null;
    } catch (e) {
      this._logger.error("importDomains\n" + e);
    }

    return result;
  }
};

/**
 * Constructor.
 */
(function() {
  this.init();
}).apply(RXULM.Export);
