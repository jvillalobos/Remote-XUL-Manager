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

var EXPORTED_SYMBOLS = [ "RXULM" ];

const Cc = Components.classes;
const Ci = Components.interfaces;

/**
 * RXULM namespace.
 */
if ("undefined" == typeof(RXULM)) {
  var RXULM = {
    /* Array of timer references, keeps timeouts alive. */
    _timers : [],

    /**
     * Initialize this object.
     */
    init : function() {
      // Setup logging. See http://wiki.mozilla.org/Labs/JS_Modules.
      Components.utils.import("resource://remotexulmanager/log4moz.js");

      // The basic formatter will output lines like:
      // DATE/TIME  LoggerName LEVEL  (log message)
      let formatter = new Log4Moz.BasicFormatter();
      let root = Log4Moz.repository.rootLogger;
      let logFile = this.getRXMDirectory();
      let app;

      logFile.append("log.txt");

      // Loggers are hierarchical, lowering this log level will affect all
      // output.
      root.level = Log4Moz.Level["All"];

      // this appender will log to the file system.
      app = new Log4Moz.RotatingFileAppender(logFile, formatter);
      app.level = Log4Moz.Level["Warn"]; // change this line to adjust level.
      root.addAppender(app);

      // get a Logger specifically for this object.
      this._logger = this.getLogger("RXM");

      this.stringBundle =
        Cc["@mozilla.org/intl/stringbundle;1"].
          getService(Ci.nsIStringBundleService).
            createBundle("chrome://remotexulmanager/locale/rxm.properties");
    },

    /**
     * Creates a logger repository from Log4Moz.
     * @param aName the name of the logger to create.
     * @param aLevel (optional) the logger level.
     * @return the created logger.
     */
    getLogger : function(aName, aLevel) {
      let logger = Log4Moz.repository.getLogger(aName);

      logger.level = Log4Moz.Level[(aLevel ? aLevel : "All")];

      return logger;
    },

    /**
     * Gets a reference to the directory where this add-on will keep its files.
     * The directory is created if it doesn't exist.
     * @return reference (nsIFile) to the directory.
     */
    getRXMDirectory : function() {
      // XXX: there's no logging here because the logger initialization depends
      // on this method.

      let directoryService =
        Cc["@mozilla.org/file/directory_service;1"].
          getService(Ci.nsIProperties);
      let targetDir = directoryService.get("ProfD", Ci.nsIFile);

      targetDir.append("RemoteXULManager");

      if (!targetDir.exists() || !targetDir.isDirectory()) {
        // read and write permissions to owner and group, read-only for others.
        targetDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);
      }

      return targetDir;
    },

    /**
     * Timeout function equivalent to "set timeout". It uses nsITimer behind the
     * scenes.
     * @param aFunction the function to run after the timeout.
     * @param aDelay the time in milliseconds to wait before firing the
     * function.
     * @return the nsITimer instance that can be canceled.
     */
    runWithDelay : function (aFunction, aDelay) {
      this._logger.debug("runWithDelay");

      let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

      timer.initWithCallback(
        { notify : aFunction }, aDelay, Ci.nsITimer.TYPE_ONE_SHOT);
      this._timers.push(timer);

      return timer;
    },

    /**
     * Checks if the domain doesn't have the protocol section, and adds it when
     * necessary. This function doesn't do anything for the special "local file"
     * identifier.
     * @param aDomain a domain string.
     * @return domain with protocol, like 'http://www.mozilla.com'.
     */
    addProtocol : function(aDomain) {
      this._logger.debug("addProtocol");

      let domain = aDomain;

      if (null == RXULM.Permissions) {
        Components.utils.import(
          "resource://remotexulmanager/rxmPermissions.js");
      }

      if ((RXULM.Permissions.LOCAL_FILES != aDomain) &&
          (0 != aDomain.indexOf("http://")) &&
          (0 != aDomain.indexOf("https://"))) {
        domain = "http://" + aDomain;
      }

      return domain;
    }
  };

  /**
   * Constructor.
   */
  (function() {
    this.init();
  }).apply(RXULM);
}
