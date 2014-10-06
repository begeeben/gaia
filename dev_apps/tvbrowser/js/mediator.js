'use strict';

(function (exports) {

  var mediator = {};

  mediator.init = function mediator_init(options) {};

  // Navigation methods

  mediator.goToUrl = function mediator_goToUrl(options) {};

  mediator.goBack = function mediator_goBack(options) {};

  mediator.goForward = function mediator_goForward(options) {};

  mediator.reload = function mediator_reload(options) {};

  // UI methods

  mediator.showAwesomeScreen = function mediator_showAwesomeScreen(options) {};

  mediator.showCrashScreen = function mediator_showCrashScreen(options) {};

  mediator.showSettings = function mediator_showSettings(options) {};

  mediator.showTab = function mediator_showTab(options) {};

  mediator.showTabsView = function mediator_showTabsView(options) {};

  mediator.addTab = function mediator_addTab(options) {};

  mediator.removeTab = function mediator_removeTab(options) {};

  mediator.showTab = function mediator_showTab(options) {};

  mediator.showContextMenu = function mediator_showContextMenu(options) {};

  mediator.zoom = function mediator_zoom(options) {};

  mediator.togglePointer = function mediator_togglePointer(options) {};

  mediator.toggleTvScreen = function mediator_toggleTvScreen(options) {};

  // Data methods

  mediator.addBookmark = function mediator_addBookmark(options) {};

  mediator.removeBookmark = function mediator_removeBookmark(options) {};

  mediator.updateBookmark = function mediator_updateBookmark(options) {};

  mediator.pinToHome = function mediator_pinToHome(options) {};

  mediator.setHomepage = function mediator_setHomepage(options) {};

  mediator.removeTopSite = function mediator_removeTopSite(options) {};

  mediator.removeHistory = function mediator_removeHistory(options) {};

  mediator.clearBrowsingHistory =
    function mediator_clearBrowsingHistory(options) {};

  mediator.clearCookiesAndStoredData =
    function mediator_clearCookiesAndStoredData(options) {};

  exports.mediator = mediator;

})(window);
