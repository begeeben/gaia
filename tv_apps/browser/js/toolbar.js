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

  // toolbar button states
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
    }
  }

  /**
   * Get toolbar DOM element references.
   */
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

  // event listeners

  function urlBarOnSubmit (e) {
    e.preventDefault();

    mediator.navigate(urlInput.value);
  }

  function urlInputOnFocus () {
    mediator.showAwesomescreen();
    urlInput.setSelectionRange(0, urlInput.value.length);
    urlInput.scrollLeft = urlInput.scrollWidth;
  }

  function urlInputOnInput () {
    if (!urlInput.value) {
      setUrlButtonMode();
      return;
    }

    if (urlButtonMode !== urlButtonModes.CLEAR) {
      setUrlButtonMode(urlButtonModes.CLEAR);
    }

    if (urlInput.value.trim()) {
      mediator.showSearchResults(urlInput.value);
    } else {
      mediator.hideSearchResults();
    }
  }

  function urlButtonOnClick (e) {
    e.preventDefault();

    switch (urlButtonMode) {
    case urlButtonModes.GO:
      mediator.navigate(urlInput.value);
      break;
    case urlButtonModes.STOP:
      mediator.stop();
      break;
    case urlButtonModes.CLEAR:
      urlInput.value = '';
      urlInput.focus();
      setUrlButtonMode();
      mediator.hideSearchResults();
      break;
    case urlButtonModes.REFRESH:
      mediator.reload();
      break;
    }
  }

  function closeButtonOnClick () {
    mediator.showFrames();
  }

  var toolbar = {};

  /**
   * Initialize toolbar module.
   * @param  {Object} options [description]
   */
  toolbar.init = function toolbar_init(options) {
    mediator = options.mediator;

    getElements();

    urlBar.addEventListener('submit', urlBarOnSubmit);
    urlInput.addEventListener('focus', urlInputOnFocus);
    urlInput.addEventListener('input', urlInputOnInput);
    urlButton.addEventListener('click', urlButtonOnClick);
    // buttons visable when awesomescreen is visable
    closeButton.addEventListener('click', closeButtonOnClick);
    // buttons visable when frames is visable
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

  toolbar.unInit = function toolbar_unInit() {
    mediator = null;

    toolbarElement = null;

    urlBar = null;
    urlInput = null;
    urlButton = null;
    sslIndicator = null;
    // buttons visable when awesomescreen is visable
    closeButton = null;
    // buttons visable when frames is visable
    backButton = null;
    forwardButton = null;
    bookmarkButton = null;
    zoomButton = null;
    homeButton = null;
    tvButton = null;
    pointerButton = null;
    tabsButton = null;
    settingsButton = null;

    urlBar.removeEventListener('submit', urlBarOnSubmit);
    urlInput.removeEventListener('focus', urlInputOnFocus);
    urlInput.removeEventListener('input', urlInputOnInput);
    urlButton.removeEventListener('click', urlButtonOnClick);
    // buttons visable when awesomescreen is visable
    closeButton.removeEventListener('click', closeButtonOnClick);
    // buttons visable when frames is visable
    backButton.removeEventListener('click', mediator.goBack);
    forwardButton.removeEventListener('click', mediator.goForward);
    bookmarkButton.removeEventListener('click', mediator.showBookmarkMenu);
    zoomButton.removeEventListener('click', mediator.zoom);
    homeButton.removeEventListener('click', mediator.goHome);
    tvButton.removeEventListener('click', mediator.toggleTv);
    pointerButton.removeEventListener('click', mediator.togglePointer);
    tabsButton.removeEventListener('click', mediator.showTabsView);
    settingsButton.removeEventListener('click', mediator.showSettings);

    urlButtonMode = null;
    currentStates = {
      canGoBack: false,
      getCanGoForward: false,
      isBookmarked: false,
      canZoomReset: false,
      isScrollMode: false
    };
  };

  toolbar.setUrlButtonMode = setUrlButtonMode;

  /**
   * Refresh toolbar buttons according to states.
   * @param  {Object} states [description]
   */
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

  /**
   * Update url bar input value.
   * @param  {String} value Webpage title or URL
   */
  toolbar.updateUrlBar = function toolbar_updateUrlBar(value) {
    urlInput.value = value || '';
  };

  /**
   * Update the number of tabs on the toolbar.
   * @param  {Number} num Number of tabs
   */
  toolbar.updateTabsCount = function toolbar_updateTabsCount(num) {
    tabsButton.textContent = num;
  };

  exports.toolbar = toolbar;

})(window);

