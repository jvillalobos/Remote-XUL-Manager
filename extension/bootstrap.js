/**
 * Copyright 2013 Jorge Villalobos
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

"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;

function install(aData, aReason) {}

function uninstall(aData, aReason) {}

function startup(aData, aReason) {
  RXM.init();
}

function shutdown(aData, aReason) {
  RXM.uninit();
}

let RXM = {
  windowListener :
    {
      stringBundle : null,

      /**
       * Adds the menu items used to open the RXM window.
       */
      addUI : function(aWindow) {
        this.stringBundle =
          Cc["@mozilla.org/intl/stringbundle;1"].
            getService(Ci.nsIStringBundleService).
              createBundle("chrome://remotexulmanager/locale/rxm.properties");

        // fullFirefox menu
        this.tryToAddMenuItemAt(aWindow, "menuWebDeveloperPopup");
        // Firefox app menu
        this.tryToAddMenuItemAt(aWindow, "appmenu_webDeveloper_popup");
        // SeaMonkey menu
        this.tryToAddMenuItemAt(aWindow, "toolsPopup");
        // Komodo menu
        this.tryToAddMenuItemAt(aWindow, "popup_tools");
      },

      /**
       * Tries to add a menu item at the specified location.
       */
      tryToAddMenuItemAt : function(aWindow, aParentId) {
        let doc = aWindow.document;
        let parent = doc.getElementById(aParentId);

        if ((null != parent) && ("menupopup" == parent.localName)) {
          let menuitem = doc.createElement("menuitem");

          menuitem.setAttribute("id", "rxm-menu-" + aParentId);
          menuitem.setAttribute(
            "label", this.stringBundle.GetStringFromName("rxm.menu.label"));
          menuitem.setAttribute(
            "accesskey",
            this.stringBundle.GetStringFromName("rxm.menu.accesskey"));

          menuitem.addEventListener(
            "command",
            function () {
              let windowManager =
                Cc['@mozilla.org/appshell/window-mediator;1'].
                  getService(Ci.nsIWindowMediator);
              let win =
                windowManager.
                  getMostRecentWindow("remotexulmanager-manager-dialog");

              // check if a window is already open.
              if ((null != win) && !win.closed) {
                win.focus();
              } else {
                aWindow.openDialog(
                  "chrome://remotexulmanager/content/rxmManager.xul",
                  "remotexulmanager-manager-dialog",
                  "chrome,titlebar,centerscreen,dialog,resizable");
              }
            });

          if ("menuWebDeveloperPopup" == aParentId) {
            parent.insertBefore(
              menuitem, doc.getElementById("devToolsEndSeparator"));
          } else if ("appmenu_webDeveloper_popup" == aParentId) {
            parent.insertBefore(
              menuitem, doc.getElementById("appmenu_pageInspect").nextSibling);
          } else {
            parent.appendChild(menuitem);
          }
        }
      },

      removeUI : function(aWindow) {
        this.tryToRemoveMenuItemAt(aWindow, "menuWebDeveloperPopup");
        this.tryToRemoveMenuItemAt(aWindow, "appmenu_webDeveloper_popup");
        this.tryToRemoveMenuItemAt(aWindow, "toolsPopup");
        this.tryToRemoveMenuItemAt(aWindow, "popup_tools");
      },

      tryToRemoveMenuItemAt : function(aWindow, aId) {
        let doc = aWindow.document;
        let menuitem = doc.getElementById("rxm-menu-" + aId);

        if (null != menuitem) {
          menuitem.parentNode.removeChild(menuitem);
        }
      },

      onOpenWindow : function(xulWindow) {
        // A new window has opened.
        let that = this;
        let domWindow =
          xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).
          getInterface(Ci.nsIDOMWindow);

        // Wait for it to finish loading
        domWindow.addEventListener(
          "load",
          function listener() {
            domWindow.removeEventListener("load", listener, false);
            // If this is a browser window then setup its UI
            if (domWindow.document.documentElement.getAttribute("windowtype") ==
                "navigator:browser") {
              that.addUI(domWindow);
            }
        }, false);
      },
      onCloseWindow : function(xulwindow) {},
      onWindowTitleChange: function(xulWindow, newTitle) {}
    },

  init : function() {
    let wm =
      Cc["@mozilla.org/appshell/window-mediator;1"].
        getService(Ci.nsIWindowMediator);
    let enumerator = wm.getEnumerator("navigator:browser");

    while (enumerator.hasMoreElements()) {
      this.windowListener.addUI(enumerator.getNext());
    }

    wm.addListener(this.windowListener);
  },

  uninit : function() {
    let wm =
      Cc["@mozilla.org/appshell/window-mediator;1"].
        getService(Ci.nsIWindowMediator);
    let enumerator = wm.getEnumerator("navigator:browser");

    wm.removeListener(this.windowListener);

    while (enumerator.hasMoreElements()) {
      this.windowListener.removeUI(enumerator.getNext());
    }
  }
};
