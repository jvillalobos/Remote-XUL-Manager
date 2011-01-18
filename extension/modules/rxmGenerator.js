/**
 * Copyright 2011 Jorge Villalobos
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


// The location of the template files.
const TEMPLATES_URL = "chrome://remotexulmanager/content/templates/";

Components.utils.import("resource://remotexulmanager/rxmCommon.js");
Components.utils.import("resource://remotexulmanager/rxmPermissions.js");

RXULM.Generator = {
  /* Logger for this object. */
  _logger : null,
  /* Generated add-on id. */
  _generatedId : null,

  /**
   * Initializes the object.
   */
  init : function() {
    this._logger = RXULM.getLogger("RXULM.Generator");
    this._logger.debug("init");
  },

  /**
   * Generates an installer package from the selected domains and with the given
   * configuration parameters.
   * @param aFile the nsIFile where the package will be written to.
   * @param aDomains the list of domains to include in the package.
   * @param aTitle an optional localized title for dialogs in the installer.
   * @param aWarning an optional localizaed warning message.
   * @param aRestartMsg an optional localized version of the "restart
   * application" message.
   */
  generateInstaller : function(aFile, aDomains, aTitle, aWarning, aRestartMsg) {
    this._logger.debug("generateInstaller");

    let zipWriter =
      Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
    let rdfFile;
    let bootFile;

    // prepare the contents of the package.
    this._generatedId();
    rdfFile = this._getInstallFile("install.rdf");
    bootFile = this._getInstallFile("bootstrap.js");

    try {
      // write the package.
      zipWriter.open(aFile, (FILE_WRITE_ONLY | FILE_CREATE | FILE_TRUNCATE));
      zipWriter.
        addEntryFile("install.rdf", zipWriter.COMPRESSION_BEST, rdfFile, false);
      zipWriter.
        addEntryFile(
          "bootstrap.js", zipWriter.COMPRESSION_BEST, bootFile, false);
      zipWriter.close();
    } finally {
      // clean up temporary files.
      if ((null != rdfFile) && rdfFile.exists()) {
        rdfFile.remove();
      }

      if ((null != bootFile) && bootFile.exists()) {
        bootFile.remove();
      }
    }
  },

  /**
   * Generates an id used to make the installer unique.
   */
  _generateId : function() {
    this._logger.trace("_generateId");

    let idGenerator =
      Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

    this._generatedId = idGenerator.generateUUID();
  },

  /**
   * Gets the installer file with its contents replaced with the values of the
   * parameters.
   * @param aFileName the name of the file to get.
   * @param aDomains the list of domains to include in the package.
   * @param aTitle an optional localized title for dialogs in the installer.
   * @param aWarning an optional localizaed warning message.
   * @param aRestartMsg an optional localized version of the "restart
   * application" message.
   * @return nsIFile pointing to the installer file.
   */
  _getInstallFile : function(
    aFileName, aDomains, aTitle, aWarning, aRestartMsg) {
    this._logger.trace("_getInstallFile");

    let installFile = RXULM.getRXMDirectory();
    let contents;

    // set up install file and get template contents.
    installFile.append(aFileName);
    contents = this._getUrlContents(TEMPLATES_URL + aFileName);

    // replace all parameters in the template.
    contents = contents.replace(/$\(ID\)/g, this._generatedId);
    contents =
      contents.replace(/$\(DOMAINS\)/g, this._getDomainsString(aDomains));

    if (("string" == typeof(aTitle)) && (0 < aTitle.length)) {
      contents = contents.replace(/$\(TITLE\)/g, aTitle);
    }

    if (("string" == typeof(aTitle)) && (0 < aTitle.length)) {
      contents = contents.replace(/$\(WARNING\)/g, aWarning);
    }

    if (("string" == typeof(aTitle)) && (0 < aTitle.length)) {
      contents = contents.replace(/$\(NEED_RESTART\)/g, aRestartMsg);
    }

    // TODO: write file.
  },

  /**
   * Converts the domain list to a string format to use for the templates. It's
   * basically a JS array converted to a string without the enclosing brackets.
   * @param aDomains the domain list.
   * @return the resulting domains string.
   */
  _getDomainsString : function (aDomains) {
    this._logger.trace("_getDomainsString");

    // TODO: do!
  },


  /**
   * Gets the contents of the file that corresponds to the given URL.
   * Based on GreaseMonkey code.
   * @param aURL the URL to get the contents from.
   * @return the contents of the file from the given URL.
   */
  _getUrlContents : function(aURL) {
    this._logger.trace("_getUrlContents");

    let ioService =
      Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    let scriptableStream =
      Cc["@mozilla.org/scriptableinputstream;1"].
        getService(Ci.nsIScriptableInputStream);
    let unicodeConverter =
      Cc["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Ci.nsIScriptableUnicodeConverter);
    let channel=ioService.newChannel(aURL, null, null);
    let input = channel.open();
    let contents;
    let result;

    unicodeConverter.charset="UTF-8";
    scriptableStream.init(input);
    contents = scriptableStream.read(input.available());
    scriptableStream.close();
    input.close();

    try {
      result = unicodeConverter.ConvertToUnicode(contents);
    } catch (e) {
      result = contents;
    }

    return result;
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
  }
};

/**
 * Constructor.
 */
(function() {
  this.init();
}).apply(RXULM.Generator);
