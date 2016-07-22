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

// Stream creation flags. See
// https://developer.mozilla.org/en/PR_Open#Parameters
const FILE_WRITE_ONLY = 0x02;
const FILE_CREATE = 0x08;
const FILE_TRUNCATE = 0x20;

// The location of the template files.
const TEMPLATES_URL = "chrome://remotexulmanager/content/templates/";

Components.utils.import("chrome://rxm-modules/content/common.js");
Components.utils.import("chrome://rxm-modules/content/permissions.js");

XFPerms.Generator = {
  /* Logger for this object. */
  _logger : null,
  /* Generated add-on id. */
  _generatedId : null,

  /**
   * Initializes the object.
   */
  init : function() {
    this._logger = XFPerms.getLogger("XFPerms.Generator");
    this._logger.debug("init");
  },

  /**
   * Generates an installer package from the selected permissions and with the
   * given configuration parameters.
   * @param aFile the nsIFile where the package will be written to.
   * @param aPermissions the list of permissions to include in the package.
   * @param aTitle an optional localized title for dialogs in the installer.
   * @param aWarning an optional localizaed warning message.
   */
  generateInstaller : function(aFile, aPermissions, aTitle, aWarning) {
    this._logger.debug("generateInstaller");

    let zipWriter =
      Cc["@mozilla.org/zipwriter;1"].createInstance(Ci.nsIZipWriter);
    let rdfFile;
    let bootFile;

    // prepare the contents of the package.
    this._generateId();
    rdfFile =
      this._getInstallFile("install.rdf", aPermissions, aTitle, aWarning);
    bootFile =
      this._getInstallFile("bootstrap.js", aPermissions, aTitle, aWarning);

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
        rdfFile.remove(false);
      }

      if ((null != bootFile) && bootFile.exists()) {
        bootFile.remove(false);
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
    let generated = idGenerator.generateUUID().toString();

    this._generatedId = generated.replace(/{|}/g, "");
  },

  /**
   * Gets the installer file with its contents replaced with the values of the
   * parameters.
   * @param aFileName the name of the file to get.
   * @param aPermissions the list of permissions to include in the package.
   * @param aTitle an optional localized title for dialogs in the installer.
   * @param aWarning an optional localizaed warning message.
   * @return nsIFile pointing to the installer file.
   */
  _getInstallFile : function(aFileName, aPermissions, aTitle, aWarning) {
    this._logger.trace("_getInstallFile");

    let contents = this._getUrlContents(TEMPLATES_URL + aFileName);

    // replace all parameters in the template.
    contents = contents.replace(/\$\(ID\)/g, this._generatedId);
    contents =
      contents.replace(
        /\$\(PERMISSIONS\)/g, this._createPermissionsString(aPermissions));

    if (("string" == typeof(aTitle)) && (0 < aTitle.length)) {
      contents = contents.replace(/\$\(TITLE\)/g, aTitle);
    } else {
      contents = contents.replace(/\$\(TITLE\)/g, "");
    }

    if (("string" == typeof(aWarning)) && (0 < aWarning.length)) {
      contents = contents.replace(/\$\(WARNING\)/g, aWarning);
    } else {
      contents = contents.replace(/\$\(WARNING\)/g, "");
    }
    // only allow silent installs with the custom build option.
    contents = contents.replace(/\$\(SILENT\)/g, "false");

    return this._writeFile(aFileName, contents);
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
    let uri = ioService.newURI(aURL, null, null);
    let channel =
      ioService.newChannelFromURI2(uri, null, null, null, null, null);
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
   * Converts the permissions array into a string to be used in the installer
   * files.
   * @param aPermissions the array of permissions to include.
   * @return string that represents the permissions array.
   */
  _createPermissionsString : function(aPermissions) {
    this._logger.trace("_createPermissionsString");

    let permsString = "";
    let permsCount = aPermissions.length;

    for (let i = 0; i < permsCount; i++) {
      if (0 != i) {
        permsString += ",";
      }

      permsString += "\"" + aPermissions[i] + "\"";
    }

    return permsString;
  },

  /**
   * Writes the given string contents to a file with the corresponding file
   * name, in the profile directory.
   * @param aFileName the name of the file to write.
   * @param aContents the intended contents of the file.
   * @return nsIFile pointing to the written file.
   */
  _writeFile : function(aFileName, aContents) {
    this._logger.trace("_writeFile");

    let stream =
      Cc["@mozilla.org/network/file-output-stream;1"].
        createInstance(Ci.nsIFileOutputStream);
    let installFile = XFPerms.getDirectory();

    installFile.append(aFileName);

    try {
      stream.init(
        installFile, (FILE_WRITE_ONLY | FILE_CREATE | FILE_TRUNCATE), -1, 0);
      stream.write(aContents, aContents.length);
      stream.close();
      stream = null;
    } catch (e) {
      this._logger.error(
        "_writeFile. Error writing file " + aFileName + "\n" + e);
      throw e;
    }

    return installFile;
  }
};

/**
 * Constructor.
 */
(function() {
  this.init();
}).apply(XFPerms.Generator);
