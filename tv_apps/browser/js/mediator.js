'use strict';

(function (exports) {

  var config;
  var awesomescreen;
  var browserDB;
  var toolbar;
  var settings;

  var mediator = {};

  mediator.init = function mediator_init(options) {
    config = options.config;
    awesomescreen = options.awesomescreen;
    browserDB = options.browserDB;
    toolbar = options.toolbar;
    settings = options.settings;
    browserDB.init(config).then(function() {
      // show awesomescreen
      awesomescreen.showTopSites(true);
    });

    toolbar.init({mediator: mediator});
    awesomescreen.init({mediator: mediator});
    settings.init({mediator: mediator});
  };

  mediator.uninit = function mediator_uninit() {
    browserDB.uninit();
    toolbar.uninit();
    awesomescreen.uninit();
    settings.uninit();
    config = null;
    awesomescreen = null;
    browserDB = null;
    toolbar = null;
    settings = null;
  };

  // Navigation methods

  /**
   * Search or go to the url according to the specified value.
   * @param  {String} value A search string or URL
   */
  mediator.navigate = function mediator_navigate(value) {
  };

  /**
   * Go to the specified url in the current tab.
   * @param  {String} url URL
   */
  mediator.goToUrl = function mediator_goToUrl(url) {
  };

  /**
   * Go back in the current tab.
   */
  mediator.goBack = function mediator_goBack() {
  };

  /**
   * Go forward in the current tab.
   */
  mediator.goForward = function mediator_goForward() {
  };

  /**
   * Go to homepage in the current tab.
   */
  mediator.goHome = function mediator_goHome() {
  };

  /**
   * Reload current tab.
   */
  mediator.reload = function mediator_reload() {
  };

  /**
   * Stop loading current tab.
   */
  mediator.stop = function mediator_stop() {
  };

  // UI methods

  /**
   * Show awesome screen.
   * @param  {[type]} options [description]
   */
  mediator.showAwesomescreen = function mediator_showAwesomescreen(options) {
  };

  /**
   * Show browsing iframe.
   * @param  {String} url The URL to be displayed in the url bar
   */
  mediator.showFrames = function mediator_showFrames(url) {
  };

  /**
   * Show BrowserDB search results.
   * @param  {String} query A query string
   */
  mediator.showSearchResults = function mediator_showSearchResults(query) {
  };

  /**
   * Hide BrowserDB search results.
   */
  mediator.hideSearchResults = function mediator_hideSearchResults() {
  };

  mediator.showSettings = function mediator_showSettings(options) {
  };

  mediator.hideSettings = function mediator_hideSettings() {
  };

  mediator.showTabsView = function mediator_showTabsView() {
  };

  /**
   * Show bookmark menu for bookmark editing.
   * @param  {[type]} options [description]
   */
  mediator.showBookmarkMenu = function mediator_showBookmarkMenu(options) {};

  /**
   * Zoom the current tab.
   * @param  {[type]} options [description]
   */
  mediator.zoom = function mediator_zoom(options) {};

  /**
   * Toggle pointer mode.
   * @param  {[type]} options [description]
   */
  mediator.togglePointer = function mediator_togglePointer(options) {};

  /**
   * Toggle TV preview.
   * @param  {[type]} options [description]
   */
  mediator.toggleTv = function mediator_toggleTv(options) {};

  mediator.updateTabsCount = function mediator_updateTabsCount(num) {
    toolbar.updateTabsCount(num);
  };

  /**
   * Set the action mode of the button in the url bar.
   * @param {[type]} mode [description]
   */
  mediator.setUrlButtonMode = function mediator_setUrlButtonMode(mode) {
  };

  /**
   * Update the value in the url bar.
   * @param  {String} value Title, URL or plaintext value
   */
  mediator.updateUrlBar = function mediator_updateUrlBar(value) {
    toolbar.updateUrlBar(value);
  };

  // Data methods

  exports.mediator = mediator;

})(window);
