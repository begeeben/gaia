/* exported MAX_TAB_COUNT */

'use strict';

var MAX_TAB_COUNT = 8;

(function () {

  window.addEventListener('load', function browserOnLoad(evt) {
    window.removeEventListener('load', browserOnLoad);

    // Init relevant modules and inject the mediator into these modules
    window.mediator.init({
      awesomescreen: window.awesomescreen,
      toolbar: window.toolbar,
      settings: window.settings,
      tabManager: window.tabManager,
      tabsView: window.tabsView
    });
  });

})();
