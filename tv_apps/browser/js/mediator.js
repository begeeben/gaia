'use strict';
/* global UrlHelper */

(function (exports) {

  var config;
  var awesomescreen;
  var browserDB;
  var toolbar;
  var settings;
  var tabManager;
  var tabsView;

  // DOM
  var mainScreen;

  var mediator = {};

  mediator.init = function mediator_init(options) {
    config = options.config;
    awesomescreen = options.awesomescreen;
    browserDB = options.browserDB;
    toolbar = options.toolbar;
    settings = options.settings;
    tabManager = options.tabManager;
    tabsView = options.tabsView;

    mainScreen = document.getElementById('main-screen');

    browserDB.init(config).then(function() {
      // console.log('browserDB inited');
      // show awesomescreen
      awesomescreen.showTopSites(true);
    });

    toolbar.init({mediator: mediator});
    awesomescreen.init({mediator: mediator});
    settings.init({mediator: mediator});
    tabManager.init({mediator: mediator});
    tabsView.init({mediator: mediator});
  };

  mediator.uninit = function mediator_uninit() {
    browserDB.uninit();
    toolbar.uninit();
    awesomescreen.uninit();
    settings.uninit();
    tabManager.uninit();
    tabsView.uninit();

    config = null;
    awesomescreen = null;
    browserDB = null;
    toolbar = null;
    settings = null;
    tabManager = null;
    tabsView = null;

    mainScreen = null;
  };

  // Navigation methods

  function getUrlFromInput(input) {
    var hasScheme = UrlHelper.hasScheme(input);

    // Not a valid URL, could be a search term
    // if (UrlHelper.isNotURL(input) && this.searchEngine.uri) {
    //   var uri = this.searchEngine.uri.replace('{searchTerms}', input);
    //   return uri;
    // }

    // No scheme, prepend basic protocol and return
    if (!hasScheme) {
      return 'http://' + input;
    }

    return input;
  }

  /**
   * Search or go to the url according to the specified value.
   * @param  {String} value A search string or URL
   */
  mediator.navigate = function mediator_navigate(value) {
    var url = getUrlFromInput(value);

    mediator.goToUrl(url);

    // if (tabs[tabIndex]) {
      // tabManager.goToUrl(url);
    // } else {
    //   tabManager.addTab(url);
    // }
  };

  /**
   * Go to the specified url in the current tab.
   * @param  {String} url URL
   */
  mediator.goToUrl = function mediator_goToUrl(url) {
    mediator.showFrames(url);
    tabManager.goToUrl(url);
  };

  /**
   * Go back in the current tab.
   */
  mediator.goBack = function mediator_goBack() {
    tabManager.goBack();
  };

  /**
   * Go forward in the current tab.
   */
  mediator.goForward = function mediator_goForward() {
    tabManager.goForward();
  };

  /**
   * Go to homepage in the current tab.
   */
  mediator.goHome = function mediator_goHome() {
    // get homepage url from db
    var url;

    url = 'http://tw.yahoo.com';

    toolbar.updateUrlBar(url);
    tabManager.goToUrl(url);
  };

  /**
   * Reload current tab.
   */
  mediator.reload = function mediator_reload() {
    tabManager.reload();
  };

  /**
   * Stop loading current tab.
   */
  mediator.stop = function mediator_stop() {
    tabManager.stop();
  };

  // UI methods

  /**
   * Show awesome screen.
   * @param  {[type]} options [description]
   */
  mediator.showAwesomescreen = function mediator_showAwesomescreen(options) {
    if (mainScreen.classList.contains('awesomescreen')) {
      return;
    }

    mediator.stop();

    mediator.updateUrlBar(mediator.getCurrentUrl());
    toolbar.setUrlButtonMode('clear');

    mainScreen.classList.remove('frames');
    mainScreen.classList.add('awesomescreen');

    if (options) {
      awesomescreen.showTopSites(options.focus);
    } else {
      awesomescreen.showTopSites();
    }
  };

  /**
   * Show browsing iframe.
   * @param  {String} url The URL to be displayed in the url bar
   */
  mediator.showFrames = function mediator_showFrames(url) {
    // console.log('showFrames');
    if (mainScreen.classList.contains('frames')) {
      return;
    }

    var urlValue = url || mediator.getCurrentTitle();

    if (!urlValue || urlValue === 'about:blank') {
      urlValue = mediator.getCurrentUrl();
    }

    toolbar.updateUrlBar(urlValue);

    if (tabManager.getCurrentTab().loading) {
      toolbar.setUrlButtonMode();
    } else if (urlValue && urlValue !== 'about:blank') {
      toolbar.setUrlButtonMode('refresh');
    }

    mainScreen.classList.remove('awesomescreen');
    mainScreen.classList.add('frames');
  };

  /**
   * Show BrowserDB search results.
   * @param  {String} query A query string
   */
  mediator.showSearchResults = function mediator_showSearchResults(query) {
    awesomescreen.showSearchResults([{
      iconUri: '',
      title: 'Mozilla',
      uri: 'http://mozilla.org'
    },{
      iconUri: '',
      title: 'Mozilla',
      uri: 'http://mozilla.org'
    },{
      iconUri: '',
      title: 'Mozilla',
      uri: 'http://mozilla.org'
    },{
      iconUri: '',
      title: 'Mozilla',
      uri: 'http://mozilla.org'
    }]);
  };

  /**
   * Hide BrowserDB search results.
   */
  mediator.hideSearchResults = function mediator_hideSearchResults() {
    awesomescreen.hideSearchResults();
  };

  mediator.showCrashScreen = function mediator_showCrashScreen(options) {};

  mediator.showSettings = function mediator_showSettings(options) {
    document.body.classList.add('settings-screen');
  };

  mediator.hideSettings = function mediator_hideSettings() {
    document.body.classList.remove('settings-screen');
  };

  mediator.showTabsView = function mediator_showTabsView() {
    var tabs = tabManager.getTabs();
    tabsView.show(tabs);
  };

  mediator.addTab = function mediator_addTab(url) {
    tabManager.addTab(url);

    // hide tabs view and display web page
    if (url) {
      mediator.showFrames();
    } else {
      // mediator.updateUrlBar();
      mediator.showAwesomescreen();
    }
  };

  mediator.selectTab = function mediator_selectTab(index) {
    tabManager.selectTab(index);
  };

  mediator.removeTab = function mediator_removeTab(index) {
    tabManager.removeTab(index);
  };

  /**
   * Show bookmark menu for bookmark editing.
   * @param  {[type]} options [description]
   */
  mediator.showBookmarkMenu = function mediator_showBookmarkMenu() {
    // temp
    mediator.addBookmark(mediator.getCurrentUrl(), mediator.getCurrentTitle());
  };

  mediator.showContextMenu = function mediator_showContextMenu(options) {};

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
    if (mainScreen.classList.contains('awesomescreen') && mode === 'refresh') {
      return;
    }

    toolbar.setUrlButtonMode(mode);
  };

  /**
   * Refresh toolbar button states.
   * @param  {[type]} iframe [description]
   */
  mediator.refreshButtons = function mediator_refreshButtons(iframe) {};

  /**
   * Update the value in the url bar.
   * @param  {String} value Title, URL or plaintext value
   */
  mediator.updateUrlBar = function mediator_updateUrlBar(value) {
    toolbar.updateUrlBar(value);
  };

  mediator.updateSecurityIcon = function mediator_updateSecurityIcon(security) {
    toolbar.updateSecurityIcon(security ? security.state : '');
  };

  // Data methods

  mediator.getCurrentUrl = function mediator_getCurrentUrl() {
    var tab = tabManager.getCurrentTab();
    return tab ? tab.url : '';
  };

  mediator.getCurrentTitle = function mediator_getCurrentTitle() {
    var tab = tabManager.getCurrentTab();
    return tab ? tab.title : '';
  };

  mediator.getBookmarks = function mediator_getBookmarks() {
    return browserDB.getBookmarks();
  };

  mediator.addBookmark = function mediator_addBookmark(uri, title) {
    browserDB.addBookmark(uri, title).then(function() {
      // mediator.refreshButtons();
      console.log('bookmark added');
    });
  };

  mediator.removeBookmark = function mediator_removeBookmark(options) {};

  mediator.updateBookmark = function mediator_updateBookmark(options) {};

  mediator.pinToHome = function mediator_pinToHome(options) {};

  mediator.setHomepage = function mediator_setHomepage(options) {};

  mediator.getTopSites = function mediator_getTopSites(filter) {
    return browserDB.getTopSites(config.topSitesCount, filter);
  };

  mediator.removeTopSite = function mediator_removeTopSite(options) {};

  mediator.getHistory = function mediator_getHistory() {
    return browserDB.getHistory(config.historyCount);
    // return new Promise(function(resolve, reject) {

    //   resolve([{
    //     iconUri: '',
    //     title: 'Mozilla',
    //     uri: 'http://mozilla.org'
    //   },{
    //     iconUri: '',
    //     title: 'Mozilla',
    //     uri: 'http://mozilla.org'
    //   },{
    //     iconUri: '',
    //     title: 'Mozilla',
    //     uri: 'http://mozilla.org'
    //   },{
    //     iconUri: '',
    //     title: 'Mozilla',
    //     uri: 'http://mozilla.org'
    //   }]);

    // });
  };

  mediator.removeHistory = function mediator_removeHistory(options) {};

  mediator.updateHistory = function mediator_updateHistory(tab) {
    // update db entry
    browserDB.addVisit(tab.url);
    // mediator.refreshButtons(iframe);
  };

  mediator.updateTitle = function mediator_updateTitle(tab) {
    // update db entry
    browserDB.setPageTitle(tab.url, tab.title);
  };

  mediator.updateIcon = function mediator_updateIcon(tab) {
    // update db entry
    browserDB.setAndLoadIconForPage(tab.url, tab.iconUrl);
  };

  mediator.updateScreenshot = function mediator_updateScreenshot(tab) {
    // update db entry
    browserDB.updateScreenshot(tab.url, tab.screenshot);
  };

  mediator.clearBrowsingHistory = function mediator_clearBrowsingHistory() {};

  mediator.clearCookiesAndStoredData =
    function mediator_clearCookiesAndStoredData() {};

  exports.mediator = mediator;

})(window);
