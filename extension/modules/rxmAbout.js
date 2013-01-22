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

var EXPORTED_SYMBOLS = [ "registerAboutPage", "unregisterAboutPage" ];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

/**
 * Registers itself as an about: provider, so that about:remotexul points to a
 * chrome path in this extension.
 */
function AboutRXM() {}

AboutRXM.prototype = {
  classDescription : "about:remotexul",
  contractID : "@mozilla.org/network/protocol/about;1?what=remotexul",
  classID : Components.ID("{aa76f1c0-a902-4afe-ab37-e51d8c6d2e68}"),

  getURIFlags : function(aURI) {
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  },

  newChannel : function(aURI) {
    let ioService =
      Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    let channel =
      ioService.newChannel(
        "chrome://remotexulmanager/content/rxmAbout.xul", null, null);

    channel.originalURI = aURI;

    return channel;
  },

  QueryInterface : XPCOMUtils.generateQI([ Ci.nsIAboutModule ])
};

var factory;

if (XPCOMUtils.generateNSGetFactory) {
  let NSGetFactory = XPCOMUtils.generateNSGetFactory([ AboutRXM ]);

  factory = NSGetFactory(AboutRXM.prototype.classID);
}

function registerAboutPage() {
  let compMan = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

  if (!compMan.isCIDRegistered(AboutRXM.prototype.classID)) {
    compMan.registerFactory(
      AboutRXM.prototype.classID, AboutRXM.prototype.classDescription,
      AboutRXM.prototype.contractID, factory);
  }
}

function unregisterAboutPage() {
  let compMan = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

  if (compMan.isCIDRegistered(AboutRXM.prototype.classID)) {
    compMan.unregisterFactory(AboutRXM.prototype.classID, factory);
  }
}
