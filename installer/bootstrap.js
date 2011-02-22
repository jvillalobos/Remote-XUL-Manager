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

const Cc = Components.classes;
const Ci = Components.interfaces;

function install(aData, aReason) {}

function uninstall(aData, aReason) {}

function shutdown(aData, aReason) {}

function startup(aData, aReason) {
  RXULMInstaller.init();
}

var RXULMInstaller = {

  ALLOW_REMOTE_XUL : "allowXULXBL",
  ALLOW : 1,
  LOCAL_FILES : "<file>",
  LOCAL_FILE_PREF : "dom.allow_XUL_XBL_for_file",

  // The list of domains to include on the whitelist.
  DOMAINS : [ $(DOMAINS) ],
  // Title for dialogs and optional, localized version of the message.
  TITLE : "Remote XUL Manager",
  TITLE_LOCALIZED : "$(TITLE)",
  // Installation warning and optional, localized version of the message.
  WARNING :
    "The following list of domains will be added to your remote XUL " +
    "whitelist. Select OK to accept.\nWARNING: Remote XUL is considered " +
    "insecure and should only be enabled when necessary.",
  WARNING_LOCALIZED : "$(WARNING)",

  /* Permission manager component. */
  _permissionManager : null,
  /* IO Service. */
  _ioService : null,
  /* Prompt service. */
  _promptService : null,

  /**
   * Initializes the object.
   */
  init : function() {
    // Wait 2 seconds for the install UI to show.
    const RUN_DELAY = 2 * 1000;
    let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    let that = this;

    this._permissionManager =
      Cc["@mozilla.org/permissionmanager;1"].
        getService(Ci.nsIPermissionManager);
    this._ioService =
      Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    this._promptService =
      Cc["@mozilla.org/embedcomp/prompt-service;1"].
        getService(Ci.nsIPromptService);

    timer.initWithCallback(
      { notify : function() { that.run(); } }, RUN_DELAY,
      Ci.nsITimer.TYPE_ONE_SHOT);
  },

  /**
   * Runs the installer.
   */
  run : function() {
    try {
      let domainCount = this.DOMAINS.length;
      let hasLocalFiles = false;
      let domain;

      if ((0 < domainCount) && this._showXULWarning()) {
        // read all data.
        for (let i = 0 ; i < domainCount ; i++) {
          domain = this.DOMAINS[i];

          if ("string" == typeof(domain) && (0 < domain.length)) {
            this._add(domain);
          }
        }
      }
    } catch (e) {
      this._showAlert("Unexpected error:\n" + e);
    }

    try {
      // auto remove.
      this._suicide();
    } catch (e) {
      this._showAlert(
        "Unexpected error:\n" + e + "\nPlease uninstall this add-on.");
    }
  },

  /**
   * Add a domain to the remote XUL list.
   * @param aDomain the domain to add. null to add all local files.
   */
  _add : function(aDomain) {
    try {
      if (this.LOCAL_FILES != aDomain) {
        let uri;

        if ((0 != aDomain.indexOf("http://")) &&
            (0 != aDomain.indexOf("https://"))) {
          aDomain = "http://" + aDomain;
        }

        uri = this._ioService.newURI(aDomain, null, null);
        this._permissionManager.add(uri, this.ALLOW_REMOTE_XUL, this.ALLOW);
      } else {
        let application;

        if (null != Cc["@mozilla.org/fuel/application;1"]) {
          // Firefox and Flock.
          application =
            Cc["@mozilla.org/fuel/application;1"].
              getService(Ci.fuelIApplication);
        } else if (null != Cc["@mozilla.org/smile/application;1"]) {
          // SeaMonkey.
          application =
            Cc["@mozilla.org/smile/application;1"].
              getService(Ci.smileIApplication);
        }

        application.prefs.setValue(this.LOCAL_FILE_PREF, true);
      }
    } catch (e) {
      this._showAlert(
        "Unexpected error adding domain '" + aDomain + "':\n" + e);
    }
  },

  /**
   * Shows a warning indicating that remote XUL should be used carefully and
   * asking the user if it's OK to proceed.
   * @return true if the user accepts the dialog, false if the user rejects it.
   */
  _showXULWarning : function() {
    let title =
      ((0 < this.TITLE_LOCALIZED.length) ? this.TITLE_LOCALIZED : this.TITLE);
    let content =
      ((0 < this.WARNING_LOCALIZED.length) ? this.WARNING_LOCALIZED :
       this.WARNING);
    let domainCount = this.DOMAINS.length;

    content += "\n";

    for (let i = 0 ; i < domainCount ; i++) {
      content += "\n" + this.DOMAINS[i];
    }

    return this._promptService.confirm(null, title, content);
  },

  /**
   * Shows an alert message with the given content.
   * @param aContent the content of the message to display.
   */
  _showAlert : function(aContent) {
    let title =
      ((0 < this.TITLE_LOCALIZED.length) ? this.TITLE_LOCALIZED : this.TITLE);

    this._promptService.alert(null, title, aContent);
  },

  /**
   * Uninstall this add-on.
   */
  _suicide : function() {
    Components.utils.import("resource://gre/modules/AddonManager.jsm");

    AddonManager.getAddonByID(
      "$(ID)@rxm.xulforge.com",
      function(aAddon) {
        aAddon.uninstall();
      });
  }
};
