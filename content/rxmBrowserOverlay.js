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

/**
 * RXULMChrome namespace.
 */
if ("undefined" == typeof(RXULMChrome)) {
  var RXULMChrome = {};
};

/**
 * Controls the browser overlay.
 */
RXULMChrome.BrowserOverlay = {

  /**
   * Opens the Remote XUL Manager dialog.
   */
  launchManager : function(aEvent) {
    let windowManager =
      Cc['@mozilla.org/appshell/window-mediator;1'].
        getService(Ci.nsIWindowMediator);
    let win =
      windowManager.getMostRecentWindow("remotexulmanager-manager-dialog");

    // check if a window is already open.
    if ((null != win) && !win.closed) {
      win.focus();
    } else {
      window.openDialog(
        "chrome://remotexulmanager/content/rxmManager.xul",
        "remotexulmanager-manager-dialog",
        "chrome,titlebar,centerscreen,dialog,resizable=no");
    }
  }
};
