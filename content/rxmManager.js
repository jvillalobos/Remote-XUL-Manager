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

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://remotexulmanager/rxmCommon.js");
Components.utils.import("resource://remotexulmanager/rxmPermissions.js");

/**
 * RXULMChrome namespace.
 */
if ("undefined" == typeof(RXULMChrome)) {
  var RXULMChrome = {};
};

/**
 * Remote XUL Manager dialog controller.
 */
RXULMChrome.Manager = {

  /* Logger for this object. */
  _logger : null,

  /**
   * Initializes the object.
   */
  init : function() {
    this._logger = RXULM.getLogger("RXULMChrome.Manager");
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
      let justAddedLocal = false;
      let item;

      // clear the current list.
      while (null != domains.firstChild) {
        domains.removeChild(domains.firstChild);
      }

      for (let i = 0; i < allowedCount; i++) {
        item = document.createElement("listitem");

        if (RXULM.Permissions.LOCAL_FILES != allowed[i]) {
          item.setAttribute("label", allowed[i]);
          item.setAttribute("value", allowed[i]);
        } else {
          item.setAttribute(
            "label", RXULM.stringBundle.GetStringFromName("rxm.file.label"));
          item.setAttribute("value", RXULM.Permissions.LOCAL_FILES);
          justAddedLocal = true;
        }

        domains.appendChild(item);
      }

      // adds the "local files" item in case it was added by the user in this
      // session (the DB doesn't reload).
      if (!justAddedLocal && RXULM.Permissions.addedLocal) {
        item = document.createElement("listitem");
        item.setAttribute(
          "label", RXULM.stringBundle.GetStringFromName("rxm.file.label"));
        item.setAttribute("value", RXULM.Permissions.LOCAL_FILES);
        domains.appendChild(item);
      }
    } catch (e) {
      this._logger.error("_loadPermissions\n" + e);
    }
  },

  /**
   * Adds a new domain to the list.
   * @param aEvent the event that triggered this action.
   */
  add : function(aEvent) {
    this._logger.debug("add");

    let promptService =
      Cc["@mozilla.org/embedcomp/prompt-service;1"].
        getService(Ci.nsIPromptService);
    let domain = { value : "" };
    let promptResponse;
    let result;

    promptResponse =
      promptService.prompt(
        window, RXULM.stringBundle.GetStringFromName("rxm.addDomain.title"),
        RXULM.stringBundle.formatStringFromName(
          "rxm.enterDomain.label", [ RXULM.Permissions.LOCAL_FILES ], 1),
        domain, null, { value : false });

    if (promptResponse) {
      result = RXULM.Permissions.add(this._addDomainProtocol(domain.value));

      if (RXULM.Permissions.RESULT_FAIL != result) {
        if (RXULM.Permissions.RESULT_RESTART == result) {
          let brand =
            document.getElementById("brand-bundle").getString("brandShortName");

          RXULM.Permissions.addedLocal = true;
          promptService.alert(
            window, RXULM.stringBundle.GetStringFromName("rxm.addDomain.title"),
            RXULM.stringBundle.formatStringFromName(
              "rxm.restart.label", [ brand ], 1));
        }

        this._loadPermissions();
      } else {
        promptService.alert(
          window, RXULM.stringBundle.GetStringFromName("rxm.addDomain.title"),
          RXULM.stringBundle.GetStringFromName("rxm.invalidDomain.label"));
      }
    }
  },

  /**
   * Checks if the domain need the protocol to be added to it, and adds it when
   * necessary.
   * @param aDomain the domain string entered by the user. Normally something
   * like 'www.mozilla.com'.
   * @return domain with protocol, like 'http://www.mozilla.com'. null if the
   * domain is "file" (special case).
   */
  _addDomainProtocol : function(aDomain) {
    this._logger.trace("_addDomainProtocol");

    let domain = aDomain;

    // if there's no protocol, add it.
    if ((RXULM.Permissions.LOCAL_FILES != aDomain) &&
        (0 != aDomain.indexOf("http://")) &&
        (0 != aDomain.indexOf("https://"))) {
      domain = "http://" + aDomain;
    }

    return domain;
  },

  /**
   * Removes the selected domains from the list.
   * @param aEvent the event that triggered this action.
   */
  remove : function(aEvent) {
    this._logger.debug("remove");

    let promptService =
      Cc["@mozilla.org/embedcomp/prompt-service;1"].
        getService(Ci.nsIPromptService);
    let selected = document.getElementById("domains").selectedItems;
    let count = selected.length;
    let message =
      ((1 == count) ?
       RXULM.stringBundle.GetStringFromName("rxm.removeOne.label") :
       RXULM.stringBundle.formatStringFromName(
        "rxm.removeMany.label", [ count ], 1));
    let needsRestart = false;
    let doRemove;
    let item;
    let result;

    doRemove =
      promptService.confirm(
        window, RXULM.stringBundle.GetStringFromName("rxm.removeDomain.title"),
        message);

    if (doRemove) {
      try {
        for (let i = 0; i < count; i ++) {
          item = selected[i];
          result = RXULM.Permissions.remove(item.getAttribute("value"));
          needsRestart =
            (needsRestart || (RXULM.Permissions.RESULT_RESTART == result));
        }
      } catch (e) {
        this._logger.debug("remove\n" + e);
      }

      if (needsRestart) {
          let brand =
            document.getElementById("brand-bundle").getString("brandShortName");

          RXULM.Permissions.addedLocal = false;
          promptService.alert(
            window,
            RXULM.stringBundle.GetStringFromName("rxm.removeDomain.title"),
            RXULM.stringBundle.formatStringFromName(
              "rxm.restart.label", [ brand ], 1));
      }

      this._loadPermissions();
    }
  },

  /**
   * onselect event handler. Decides when to enable or disable the remove
   * button.
   */
  select : function (aEvent) {
    this._logger.debug("select");

    let removeButton = document.getElementById("remove");
    let listbox = document.getElementById("domains");

    removeButton.disabled = (0 == listbox.selectedCount);
  }
};

window.addEventListener(
  "load", function() { RXULMChrome.Manager.init(); }, false);
