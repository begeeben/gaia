/* global mediator, awesomescreen, toolbar, settings, config, browserDB */
/* global tabManager, tabsView */
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
    mediator.init({
      config: config,
      awesomescreen: awesomescreen,
      toolbar: toolbar,
      settings: settings,
      tabManager: tabManager,
      tabsView: tabsView,
      browserDB: browserDB
    });
  });

})();
