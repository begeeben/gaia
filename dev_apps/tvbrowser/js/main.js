/* global BrowserDB */
/* exported MAX_TAB_COUNT */

'use strict';

var MAX_TAB_COUNT = 8;

(function () {

  window.addEventListener('load', function browserOnLoad(evt) {
    window.removeEventListener('load', browserOnLoad);

    // BrowserDB.init(function() {
      // this.selectTab(this.createTab());
      // this.addressBarState = this.VISIBLE;
      // BrowserDB.getSetting('defaultSearchEngine', function(uri) {
      //   if (!uri) {
      //     return;
      //   }
      //   BrowserDB.getSearchEngine(uri, function(searchEngine) {
      //     if (!searchEngine) {
      //       return;
      //     }
      //     // this.searchEngine = searchEngine;
      //   });

      // });

    // });

    // Init relevant modules and inject the mediator into these modules
    window.mediator.init({
      awesomescreen: window.awesomescreen,
      toolbar: window.toolbar,
      settings: window.settings,
      tabManager: window.tabManager,
      tabsView: window.tabsView
      // browserDB: BrowserDB
    });
  });

})();
