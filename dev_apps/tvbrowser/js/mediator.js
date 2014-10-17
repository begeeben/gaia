'use strict';

(function (exports) {

  var awesomescreen;
  // var browserDB;
  var toolbar;
  var settings;
  var tabManager;
  var tabsView;

  // DOM
  var mainScreen;

  var mediator = {};

  mediator.init = function mediator_init(options) {
    awesomescreen = options.awesomescreen;
    // browserDB = options.browserDB;
    toolbar = options.toolbar;
    settings = options.settings;
    tabManager = options.tabManager;
    tabsView = options.tabsView;

    mainScreen = document.getElementById('main-screen');

    toolbar.init({mediator: mediator});

    awesomescreen.init({mediator: mediator});
    awesomescreen.showTopSites(true);
    // awesomescreen.showSearchResults();

    settings.init({mediator: mediator});

    tabManager.init({mediator: mediator});
    tabsView.init({mediator: mediator});
  };

  // Navigation methods
  mediator.navigate = function mediator_navigate(value) {
    tabManager.navigate(value);
  };

  mediator.goToUrl = function mediator_goToUrl(url) {
    tabManager.goToUrl(url);
    mediator.showFrames();
  };

  mediator.goBack = function mediator_goBack() {
    tabManager.goBack();
  };

  mediator.goForward = function mediator_goForward() {
    tabManager.goForward();
  };

  mediator.goHome = function mediator_goHome() {
    // get homepage url from db
    var url;

    url = 'http://tw.yahoo.com';

    tabManager.goToUrl(url);
  };

  mediator.reload = function mediator_reload() {
    tabManager.reload();
  };

  // UI methods

  mediator.showAwesomescreen = function mediator_showAwesomescreen(options) {
    if (mainScreen.classList.contains('awesomescreen')) {
      return;
    }

    mainScreen.classList.remove('frames');
    mainScreen.classList.add('awesomescreen');
    if (options) {
      awesomescreen.showTopSites(options.focus);
    } else {
      awesomescreen.showTopSites();
    }
  };

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

  mediator.showFrames = function mediator_showFrames(options) {
    if (mainScreen.classList.contains('frames')) {
      return;
    }

    mainScreen.classList.remove('awesomescreen');
    mainScreen.classList.add('frames');
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
      mediator.updateUrlBar();
      mediator.showAwesomescreen();
    }
  };

  mediator.selectTab = function mediator_selectTab(index) {
    tabManager.selectTab(index);
  };

  mediator.removeTab = function mediator_removeTab(index) {
    tabManager.removeTab(index);
  };

  mediator.showBookmarkMenu = function mediator_showBookmarkMenu(options) {};

  mediator.showContextMenu = function mediator_showContextMenu(options) {};

  mediator.zoom = function mediator_zoom(options) {};

  mediator.togglePointer = function mediator_togglePointer(options) {};

  mediator.toggleTv = function mediator_toggleTv(options) {};

  mediator.updateTabsCount = function mediator_updateTabsCount(options) {};

  mediator.setUrlButtonMode = function mediator_setUrlButtonMode(mode) {
    toolbar.setUrlButtonMode(mode);
  };

  mediator.refreshButtons = function mediator_refreshButtons(iframe) {};

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
    return new Promise(function(resolve, reject) {

      resolve([{
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

    });
  };

  mediator.addBookmark = function mediator_addBookmark(options) {};

  mediator.removeBookmark = function mediator_removeBookmark(options) {};

  mediator.updateBookmark = function mediator_updateBookmark(options) {};

  mediator.pinToHome = function mediator_pinToHome(options) {};

  mediator.setHomepage = function mediator_setHomepage(options) {};

  mediator.getTopSites = function mediator_getTopSites(topSitesCount) {
    return new Promise(function(resolve, reject) {
      // browserDB.getTopSites(topSitesCount, null,
      //   function(topSites) {
      //     console.log(topSites);
      //     resolve(topSites);
      //   });

      resolve([{
        iconUri: '',
        // screenshotUrl: 'blob:20af09eb-72ba-43ec-b7dc-1e38141afa7d',
        title: 'Mozilla',
        uri: 'http://mozilla.org'
      },{
        iconUri: '',
        title: 'Google',
        uri: 'http://www.google.com'
      },{
        iconUri: '',
        title: 'Mozilla',
        uri: 'http://mozilla.org'
      },{
        iconUri: '',
        title: 'Mozilla',
        uri: 'http://mozilla.org'
      }]);

    });
  };

  mediator.removeTopSite = function mediator_removeTopSite(options) {};

  mediator.getHistory = function mediator_getHistory() {
    return new Promise(function(resolve, reject) {

      resolve([{
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

    });
  };

  mediator.removeHistory = function mediator_removeHistory(options) {};

  mediator.updateHistory = function mediator_updateHistory(iframe) {
    // update db entry

    mediator.refreshButtons(iframe);
  };

  mediator.clearBrowsingHistory = function mediator_clearBrowsingHistory() {};

  mediator.clearCookiesAndStoredData =
    function mediator_clearCookiesAndStoredData() {};

  exports.mediator = mediator;

})(window);
