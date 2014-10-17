
'use strict';

(function (exports) {

  var mediator;

  // DOM
  var toolbarElement;

  var urlBar, urlInput, sslIndicator, urlButton;

  // buttons on the toolbar when displaying awesome screen
  var closeButton;

  // buttons on the toolbar when browsing web pages
  var backButton, forwardButton, bookmarkButton, zoomButton;
  var homeButton, tvButton, pointerButton;
  var tabsButton, settingsButton;

  // current url button mode
  var urlButtonMode;
  // url button states
  var urlButtonModes = {
    CLEAR: 'clear',
    GO: 'go',
    STOP: 'stop',
    REFRESH: 'refresh'
  };

  // button states
  var currentStates = {
    canGoBack: false,
    getCanGoForward: false,
    isBookmarked: false,
    canZoomReset: false,
    isScrollMode: false
  };

  /**
   * Change url-button appearance
   * @param {Enum} mode urlButtonModes.GO, urlButtonModes.REFRESH,
   *                    urlButtonModes.STOP
   */
  function setUrlButtonMode(mode) {
    urlButtonMode = mode;

    if (!urlButtonMode) {
      urlButton.style.backgroundImage = '';
      urlButton.style.display = 'none';
      return;
    }

    urlButton.style.display = 'block';

    switch (mode) {
      case urlButtonModes.GO:
        urlButton.style.backgroundImage = 'url(style/images/go.png)';
        break;
      case urlButtonModes.REFRESH:
        urlButton.style.backgroundImage = 'url(style/images/refresh.png)';
        break;
      case urlButtonModes.CLEAR:
      case urlButtonModes.STOP:
        urlButton.style.backgroundImage = 'url(style/images/stop.png)';
        break;
      // case urlButtonModes.SEARCH:
      //   urlButton.style.backgroundImage = 'url(style/images/search.png)';
      //   break;
    }
  }

  function getElements () {
    toolbarElement = document.getElementById('toolbar');

    urlBar = document.getElementById('url-bar');
    urlInput = document.getElementById('url-input');
    urlButton = document.getElementById('url-button');
    sslIndicator = document.getElementById('ssl-indicator');

    closeButton = document.getElementById('awesomescreen-cancel-button');

    backButton = document.getElementById('back-button');
    forwardButton = document.getElementById('forward-button');
    bookmarkButton = document.getElementById('bookmark-button');
    zoomButton = document.getElementById('zoom-button');
    homeButton = document.getElementById('home-button');
    tvButton = document.getElementById('tv-button');
    pointerButton = document.getElementById('pointer-button');
    tabsButton = document.getElementById('tabs-button');
    settingsButton = document.getElementById('settings-button');
  }

  var toolbar = {};

  toolbar.init = function toolbar_init(options) {
    mediator = options.mediator;

    getElements();

    urlBar.addEventListener('submit', function (e) {
      e.preventDefault();

      mediator.navigate(urlInput.value);
    });
    urlInput.addEventListener('focus', function () {
      if (urlInput.value.trim()) {
        mediator.updateUrlBar(mediator.getCurrentUrl());
      }
      mediator.showAwesomescreen();
    });
    // urlInput.addEventListener('blur', urlBlur);
    // urlInput.addEventListener('touchend', urlTouchEnd);
    urlInput.addEventListener('input', function () {
      if (!urlInput.value) {
        setUrlButtonMode();
        return;
      }

      setUrlButtonMode(urlButtonModes.CLEAR);

      if (urlInput.value.trim()) {
        mediator.showSearchResults(urlInput.value);
      } else {
        mediator.hideSearchResults();
      }
    });
    urlButton.addEventListener('click', function (e) {
      e.preventDefault();

      switch (urlButtonMode) {
      case urlButtonModes.CLEAR:
        urlInput.value = '';
        urlInput.focus();
        mediator.hideSearchResults();
        break;
      }
    });

    closeButton.addEventListener('click', function () {
      if (urlInput.value.trim()) {
        mediator.updateUrlBar(mediator.getCurrentTitle());
      }
      mediator.showFrames();
    });

    backButton.addEventListener('click', mediator.goBack);
    forwardButton.addEventListener('click', mediator.goForward);
    bookmarkButton.addEventListener('click', mediator.showBookmarkMenu);
    zoomButton.addEventListener('click', mediator.zoom);
    homeButton.addEventListener('click', mediator.goHome);
    tvButton.addEventListener('click', mediator.toggleTv);
    pointerButton.addEventListener('click', mediator.togglePointer);
    tabsButton.addEventListener('click', mediator.showTabsView);
    settingsButton.addEventListener('click', mediator.showSettings);
  };

  toolbar.show = function toolbar_show() {

  };

  toolbar.hide = function toolbar_hide() {

  };

  toolbar.setUrlButtonMode = setUrlButtonMode;

  toolbar.refreshButtons = function toolbar_refreshButtons(states) {
    var keys = Object.keys(states);
    var length = keys.length;
    for (var i = 0; i < length; i++) {
      if (states[keys[i]] !== currentStates[keys[i]]) {
        currentStates[keys[i]] = states[keys[i]];
        switch (keys[i]) {
          case 'canGoBack':
            backButton.disabled = !backButton.disabled;
            break;
          case 'getCanGoForward':
            forwardButton.disabled = !forwardButton.disabled;
            break;
          case 'isBookmarked':
            bookmarkButton.classList.toggle('is-bookmarked');
            break;
          case 'canZoomReset':
            zoomButton.classList.toggle('zoom-reset');
            break;
          case 'isScrollMode':
            pointerButton.classList.toggle('scroll-mode');
            break;
        }
      }
    }
  };

  toolbar.updateUrlBar = function toolbar_updateUrlBar(value) {
    urlInput.value = value || '';
  };

  toolbar.updateSecurityIcon = function toolbar_updateSecurityIcon(state) {
    sslIndicator.value = state;
  };

  toolbar.updateTabsCount = function toolbar_updateTabsCount(num) {

  };

  exports.toolbar = toolbar;

})(window);

// var Toolbar = {

//   /**
//    * Intialise toolbar.
//    */
//   init: function toolbar_init() {
//     this.backButton = document.getElementById('back-button');
//     this.forwardButton = document.getElementById('forward-button');
//     this.shareButton = document.getElementById('share-button');
//     this.bookmarkButton = document.getElementById('bookmark-button');
//     this.shareButton.addEventListener('click',
//       this.handleShareButtonClick.bind(this));
//     this.backButton.addEventListener('click',
//       Browser.goBack.bind(Browser));
//     this.forwardButton.addEventListener('click',
//       Browser.goForward.bind(Browser));
//     this.bookmarkButton.addEventListener('click',
//       Browser.showBookmarkMenu.bind(Browser));
//   },

//   /**
//    * Refresh state of bookmark button based on current tab URL.
//    */
//   refreshBookmarkButton: function toolbar_refreshBookmarkButton() {
//     if (!Browser.currentTab.url) {
//       this.bookmarkButton.classList.remove('bookmarked');
//       return;
//     }
//     BrowserDB.getBookmark(Browser.currentTab.url, (function(bookmark) {
//       if (bookmark) {
//         this.bookmarkButton.classList.add('bookmarked');
//       } else {
//         this.bookmarkButton.classList.remove('bookmarked');
//       }
//     }).bind(this));
//   },

//   /**
//    * Refresh state of all toolbar buttons.
//    */
//   refreshButtons: function toolbar_refreshButtons() {
//     // When handling window.open we may hit this code
//     // before canGoBack etc has been applied to the frame
//     if (!Browser.currentTab.dom.getCanGoBack) {
//       return;
//     }

//     Browser.currentTab.dom.getCanGoBack().onsuccess = (function(e) {
//       this.backButton.disabled = !e.target.result;
//     }).bind(this);
//     Browser.currentTab.dom.getCanGoForward().onsuccess = (function(e) {
//       this.forwardButton.disabled = !e.target.result;
//     }).bind(this);
//     this.refreshBookmarkButton();
//   }

// };
