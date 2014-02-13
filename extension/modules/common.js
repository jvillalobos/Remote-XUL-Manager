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

var EXPORTED_SYMBOLS = [ "XFPerms" ];

const Cc = Components.classes;
const Ci = Components.interfaces;

const FIREFOX_MOBILE_ID = "{a23983c0-fd0e-11dc-95ff-0800200c9a66}";
const FIREFOX_ANDROID_ID = "{aa3c5121-dab2-40e2-81ca-7ea25febc110}";

var logLoaded = true;

try {
  Components.utils.import("resource://gre/modules/services-common/log4moz.js");
} catch (e) {
  // certain Mozilla-based applications don't have /services-common/, so let's
  // just skip logging there.
  logLoaded = false;
}

Components.utils.import("resource://gre/modules/Services.jsm");

/**
 * XFPerms namespace.
 */
if ("undefined" == typeof(XFPerms)) {
  var XFPerms = {
    /* Array of timer references, keeps timeouts alive. */
    _timers : [],

    /**
     * Initialize this object.
     */
    init : function() {
      if (logLoaded) {
        // Setup logging. See http://wiki.mozilla.org/Labs/JS_Modules.
        // The basic formatter will output lines like:
        // DATE/TIME  LoggerName LEVEL  (log message)
        let formatter = new Log4Moz.BasicFormatter();
        let appender;

        this._logger = Log4Moz.repository.getLogger("XFPerms");

        if (!this.isMobile()) {
          let logFile = this.getDirectory();

          logFile.append("log.txt");
          // this appender will log to the file system.
          if (null != Log4Moz.BoundedFileAppender) {
            appender = new Log4Moz.BoundedFileAppender(logFile.path, formatter);
          } else {
            appender = new Log4Moz.RotatingFileAppender(logFile, formatter);
          }
        } else {
          appender = new Log4Moz.ConsoleAppender(formatter);
        }

        this._logger.level = Log4Moz.Level["All"];
        appender.level = Log4Moz.Level["Warn"]; // change this to adjust level.
        this._logger.addAppender(appender);
      } else {
        this._logger =
          { error : function() {}, warn : function() {}, debug : function() {},
            trace : function() {}, info : function() {} };
      }

      this.stringBundle =
        Services.strings.createBundle(
          "chrome://remotexulmanager/locale/rxm.properties");
    },

    /**
     * Creates a logger for other objects to use.
     * @param aName the name of the logger to create.
     * @param aLevel (optional) the logger level.
     * @return the created logger.
     */
    getLogger : function(aName, aLevel) {
      let logger;

      if (logLoaded) {
        logger = Log4Moz.repository.getLogger(aName);

        logger.level = Log4Moz.Level[(aLevel ? aLevel : "All")];
        logger.parent = this._logger;
      } else {
        logger =
          { error : function() {}, warn : function() {}, debug : function() {},
            trace : function() {}, info : function() {} };
      }

      return logger;
    },

    /**
     * Indicates if this is a mobile version of Firefox.
     * @return true if this is Firefox Mobile (XUL) or Firefox for Android.
     */
    isMobile : function() {
      let isMobileApp =
        (FIREFOX_ANDROID_ID == Services.appinfo.ID) ||
        (FIREFOX_MOBILE_ID == Services.appinfo.ID);

      return isMobileApp;
    },

    /**
     * Gets a reference to the directory where this add-on will keep its files.
     * The directory is created if it doesn't exist.
     * @return reference (nsIFile) to the directory.
     */
    getDirectory : function() {
      Components.utils.import("resource://gre/modules/FileUtils.jsm");

      return FileUtils.getDir("ProfD", [ "RemoteXULManager" ], true);
    },

    /**
     * Gets the preferences service.
     */
    get prefService() {
      Services.prefs;
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

      if (null == XFPerms.Permissions) {
        Components.utils.import(
          "chrome://rxm-modules/content/permissions.js");
      }

      if ((XFPerms.Permissions.LOCAL_FILES != aDomain) &&
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
  }).apply(XFPerms);
}
