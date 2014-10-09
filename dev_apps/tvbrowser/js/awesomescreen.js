/* global AccessibilityHelper */
/* global DateHelper */

'use strict';

(function (exports) {

  // var _ = navigator.mozL10n.get;

  var TOP_SITES_COUNT = 9;
  var MAX_SEARCH_RESULT_COUNT = 5;
  var DEFAULT_FAVICON = 'style/images/favicon.png';
  var UNDERLAY = ',url(./style/images/favicon-underlay.png)';

  var mediator;

  // DOM element references
  var tabs, tabPanels;
  var topSitesTab, bookmarksTab, historyTab, editButton;
  var topSitesPanel, bookmarksPanel, historyPanel;
  var searchResultsPanel;

  var activeTab, activePanel;

  function selectTab(tab, panel) {
    if (activeTab && activeTab === tab) {
      return;
    }

    if (activeTab) {
      activeTab.classList.remove('selected');
      activePanel.classList.remove('selected');
    }

    tab.classList.add('selected');
    panel.classList.add('selected');
    activeTab = tab;
    activePanel = panel;
    AccessibilityHelper.setAriaSelected(tab, tabs);
  }

  var topSitesCache, bookmarksCache, historyCache;

  var topSiteListTemplate, topSiteListItemTemplate;
  var bookmarkListTemplate, bookmarkListItemTemplate;
  var historyDateHeaderTemplate;

  // use it temporarily
  // compare the performance with innerHTML later
  function initTemplates() {
    topSiteListTemplate = document.createElement('ul');
    topSiteListTemplate.setAttribute('id', 'top-site-list');
    topSiteListTemplate.setAttribute('role', 'listbox');

    topSiteListItemTemplate = document.createElement('li');
    topSiteListItemTemplate.setAttribute('class', 'top-site-item');
    topSiteListItemTemplate.appendChild(document.createElement('a'));
    topSiteListItemTemplate.appendChild(document.createElement('span'));

    bookmarkListTemplate = document.createElement('ul');
    bookmarkListTemplate.setAttribute('id', 'bookmark-list');
    bookmarkListTemplate.setAttribute('role', 'listbox');

    bookmarkListItemTemplate = document.createElement('li');
    // bookmarkListItemTemplate.setAttribute('class', 'top-site-item');
    bookmarkListItemTemplate.setAttribute('role', 'listitem');

    var bookmarkLink = document.createElement('a');
    bookmarkLink.appendChild(document.createElement('h5'));
    bookmarkLink.appendChild(document.createElement('small'));
    bookmarkListItemTemplate.appendChild(bookmarkLink);

    historyDateHeaderTemplate = document.createElement('h3');
  }

  function createTopSiteItem(topSite) {
    var listItem = topSiteListItemTemplate.cloneNode(true);
    var link = listItem.querySelector('a');
    link.href = topSite.uri;
    link.style.backgroundImage = topSite.screenshotUrl ?
      'url(' + topSite.screenshotUrl + ')': '';
    listItem.querySelector('span').textContent = topSite.title;
    return listItem;
  }

  // should only update changed top sites, revise it later
  function updateTopSitesPanel(topSites) {
    var list = topSiteListTemplate.cloneNode();

    topSites.forEach(function(topSite) {
      list.appendChild(createTopSiteItem(topSite));
    });

    topSitesPanel.replaceChild(list, topSitesPanel.firstChild);
  }

  function createBookmarkItem(bookmark) {
    var listItem = bookmarkListItemTemplate.cloneNode(true);
    var link = listItem.querySelector('a');
    link.href = bookmark.uri;
    link.style.backgroundImage = bookmark.iconUri ?
      'url(' + bookmark.iconUri + ')' + UNDERLAY :
      'url(' + DEFAULT_FAVICON + ')' + UNDERLAY;
    listItem.querySelector('h5').innerHTML = bookmark.title;
    listItem.querySelector('small').innerHTML = bookmark.uri;
    return listItem;
  }

  function updateBookmarksPanel(bookmarks) {
    var list = bookmarkListTemplate.cloneNode();

    bookmarks.forEach(function(bookmark) {
      list.appendChild(createBookmarkItem(bookmark));
    });

    bookmarksPanel.replaceChild(list, bookmarksPanel.firstChild);
  }

  function incrementHistoryThreshold(timestamp, currentThreshold, thresholds) {
    var newThreshold = currentThreshold += 1;
    while (timestamp < thresholds[newThreshold]) {
      newThreshold += 1;
    }
    return newThreshold;
  }

  function createHistoryDateHeader(threshold, timestamp) {
    var labels = [
      'future',
      'today',
      'yesterday',
      'last-7-days',
      'this-month',
      'last-6-months',
      'older-than-6-months'
    ];

    var text = '';

    // Special case for month headings
    if (threshold == 5 && timestamp) {
      var date = new Date(timestamp);
      var now = new Date();
      text = _('month-' + date.getMonth());
      if (date.getFullYear() != now.getFullYear()) {
        text += ' ' + date.getFullYear();
      }
    } else {
      text = _(labels[threshold]);
    }

    var h3 = document.createElement('h3');
    h3.textContent = text;

    return h3;
  }

  // use the same template as bookmarks
  // assume sites are ordered by date descending
  function updateHistoryPanel(sites) {
    var fragment = document.createDocumentFragment();
    var list = bookmarkListTemplate.cloneNode();
    var dateHeader;

    var thresholds = [
      new Date().valueOf(),              // 0. Now
      DateHelper.todayStarted(),         // 1. Today
      DateHelper.yesterdayStarted(),     // 2. Yesterday
      DateHelper.thisWeekStarted(),      // 3. This week
      DateHelper.thisMonthStarted(),     // 4. This month
      DateHelper.lastSixMonthsStarted(), // 5. Six months
      0                                  // 6. Epoch!
    ];
    var threshold = 0;
    var timestamp;
    var month;
    var year;

    sites.forEach(function(site) {
      timestamp = site.timestamp;
      dateHeader = null;

      // Draw new heading if new threshold reached
      if (timestamp > 0 && timestamp < thresholds[threshold]) {
        threshold = incrementHistoryThreshold(timestamp, threshold, thresholds);
        // Special case for month headings
        if (threshold != 5) {
          fragment.appendChild(createHistoryDateHeader(threshold, timestamp));
        }
      }

      if (threshold === 5) {
        var timestampDate = new Date(timestamp);
        if (timestampDate.getMonth() != month ||
          timestampDate.getFullYear() != year) {
          month = timestampDate.getMonth();
          year = timestampDate.getFullYear();
          fragment.appendChild(createHistoryDateHeader(threshold, timestamp));
        }
      }

      if (dateHeader) {
        if (list.childNodes.length) {
          fragment.appendChild(list);
          list = bookmarkListTemplate.cloneNode();
        }
        fragment.appendChild(dateHeader);
      }

      list.appendChild(createBookmarkItem(site));
    });

    if (list.childNodes.length) {
      fragment.appendChild(list);
    }

    while (historyPanel.firstChild) {
      historyPanel.removeChild(historyPanel.firstChild);
    }
    historyPanel.appendChild(fragment);
  }

  function updateSearchResultsPanel(sites) {
    var list = bookmarkListTemplate.cloneNode();

    sites.forEach(function(site) {
      list.appendChild(createBookmarkItem(site));
    });

    searchResultsPanel.replaceChild(list, searchResultsPanel.firstChild);
  }

  var awesomescreen = {};

  awesomescreen.init = function awesomescreen_init(options) {
    mediator = options.mediator;

    // Get DOM element references
    tabs = document.querySelectorAll('#awesomescreen [role="tab"]');
    tabPanels = document.getElementById('tab-panels');
    topSitesTab = document.getElementById('top-sites-tab');
    topSitesPanel = document.getElementById('top-sites-panel');
    bookmarksTab = document.getElementById('bookmarks-tab');
    bookmarksPanel = document.getElementById('bookmarks-panel');
    historyTab = document.getElementById('history-tab');
    historyPanel = document.getElementById('history-panel');
    searchResultsPanel = document.getElementById('search-results-panel');

    // Init event listeners
    topSitesTab.addEventListener('click', awesomescreen.showTopSites);
    bookmarksTab.addEventListener('click', awesomescreen.showBookmarks);
    historyTab.addEventListener('click', awesomescreen.showHistory);

    initTemplates();
  };

  // awesomescreen.show = function awesomescreen_show(options) {
  //   awesomescreen.showTopSites();
  // };

  awesomescreen.showTopSites = function awesomescreen_showTopSites(focus) {
    selectTab(topSitesTab, topSitesPanel);
    mediator.getTopSites(TOP_SITES_COUNT)
      .then(updateTopSitesPanel)
      .then(function () {
        if (focus) {
          // focus on the 1st top site
        }
      });
  };

  awesomescreen.showBookmarks = function awesomescreen_showBookmarks() {
    selectTab(bookmarksTab, bookmarksPanel);
    mediator.getBookmarks().then(updateBookmarksPanel);
  };

  awesomescreen.showHistory = function awesomescreen_showHistory() {
    selectTab(historyTab, historyPanel);
    mediator.getHistory().then(updateHistoryPanel);
  };

  awesomescreen.showSearchResults =
  function awesomescreen_showSearchResults(sites) {
    updateSearchResultsPanel(sites);
    searchResultsPanel.classList.remove('hidden');
  };

  awesomescreen.hideSearchResults =
  function awesomescreen_hideSearchResults() {
    searchResultsPanel.classList.add('hidden');
  };

  awesomescreen.reset = function awesomescreen_reset() {
    // remove event listeners
    // clear unused variables
  };

  exports.awesomescreen = awesomescreen;

})(window);

/**
 * Browser App Awesomescreen. Display top sites, bookmarks, histories and search
 * result.
 * @namespace Awesomescreen
 */
var Awesomescreen = {

  RESULT_CACHE_SIZE: 20,

  listTemplate: null,
  resultTemplate: null,
  searchTemplate: null,
  resultCache: {},
  updateInProgress: false,
  pendingUpdateFilter: null,
  // Keep img object URLs to later clean up img file references
  objectURLs: [],

  /**
   * Initialise Awesomescreen.
   */
  init: function awesomescreen_init() {
    // DOM elements
    this.cancelButton = document.getElementById('awesomescreen-cancel-button');
    // this.tabs = document.querySelectorAll('#awesomescreen [role="tab"]');
    // this.tabPanels = document.getElementById('tab-panels');
    // this.tabHeaders = document.getElementById('tab-headers');
    // this.topSitesTab = document.getElementById('top-sites-tab');
    // this.topSites = document.getElementById('top-sites');
    // this.bookmarksTab = document.getElementById('bookmarks-tab');
    // this.bookmarks = document.getElementById('bookmarks');
    // this.historyTab = document.getElementById('history-tab');
    // this.history = document.getElementById('history');
    this.results = document.getElementById('results');

    // Add event listeners
    // this.topSitesTab.addEventListener('click',
    //   this.selectTopSitesTab.bind(this));
    // this.bookmarksTab.addEventListener('click',
    //   this.selectBookmarksTab.bind(this));
    // this.historyTab.addEventListener('click', this.selectHistoryTab.bind(this));
    // this.cancelButton.addEventListener('click',
    //   this.handleCancel.bind(this));
    // this.results.addEventListener('click', this.handleClickResult.bind(this));
    // this.tabPanels.addEventListener('click', this.handleClickResult.bind(this));

    // Create template elements
    this.resultTemplate = this.createResultTemplate();
    // this.listTemplate = this.createList();
  },

  /**
   * Show Awesomescreen.
   */
  show: function awesomescreen_show() {
    this.results.classList.add('hidden');
    // Browser.hideCurrentTab();
    // Browser.tabsBadge.innerHTML = '';
    // Ensure the user cannot interact with the browser until the
    // transition has ended, this will not be triggered unless the
    // use is navigating from the tab screen.
    // var pageShown = (function() {
    //   Browser.mainScreen.removeEventListener('transitionend', pageShown, true);
    //   Browser.inTransition = false;
    // });
    // Browser.mainScreen.addEventListener('transitionend', pageShown, true);
    // Browser.switchScreen(Browser.AWESOME_SCREEN);
    var buttonMode = Browser.urlInput.value === '' ? null : Browser.GO;
    Browser.setUrlButtonMode(buttonMode);
    // this.selectTopSitesTab();
  },

  /**
   * Update Awesomescreen results based on the provided filter.
   *
   * @param {string} filter String to filter results by.
   */
  update: function awesomescreen_update(filter) {
    // If an update is already in progress enqueue the following ones
    if (this.updateInProgress) {
      this.pendingUpdateFilter = filter;
      return;
    } else {
      this.updateInProgress = true;
    }

    if (!filter) {
      this.results.classList.add('hidden');
      filter = false;
    } else {
      this.results.classList.remove('hidden');
    }
    BrowserDB.getTopSites(this.TOP_SITES_COUNT, filter,
      (function gotTopSites(results, filter) {
        this.populateResults(results, filter);
        this.updateInProgress = false;

        var pendingUpdateFilter = this.pendingUpdateFilter;

        if (pendingUpdateFilter !== null) {
          this.pendingUpdateFilter = null;
          this.update(pendingUpdateFilter);
        }
      }).bind(this));
  },

  /**
   * Show Awesomescreen results and/or search options.
   *
   * @param {Array} results The list of results to display.
   * @param {string} filter Filter to generate search options if needed.
   */
  populateResults: function awesomescreen_populateResults(results, filter) {
    var list = this.listTemplate.cloneNode(true);
    results.forEach(function(data) {
      list.appendChild(this.createListItem(data, filter, 'results'));
    }, this);

    var oldList = this.results.firstElementChild;

    if (oldList) {
      this.results.replaceChild(list, oldList);
    } else {
      this.results.appendChild(list);
    }

    // If less than two results, show default search option.
    if (results.length < 2 && filter && Browser.searchEngine.uri) {
      var uri = Browser.searchEngine.uri.replace('{searchTerms}',
        filter);
      var data = {
        title: Browser.searchEngine.title,
        uri: uri,
        iconUri: Browser.searchEngine.iconUri,
        description: _('search-for') + ' "' + filter + '"'
      };
      var item = this.createListItem(data, null, 'search');
      this.results.firstElementChild.appendChild(item);
    }
  },

  /**
   * Create a template list item DOM node.
   *
   * @return {Element} List item element.
   */
  createResultTemplate: function awesomescreen_createResultTemplate() {
    var template = document.createElement('li');
    var link = document.createElement('a');
    var title = document.createElement('h5');
    var url = document.createElement('small');
    template.setAttribute('role', 'listitem');

    link.appendChild(title);
    link.appendChild(url);
    template.appendChild(link);

    return template;
  },

  /**
   * Create a list item representing a result.
   *
   * @param {Object} data Result data.
   * @param {string} filter Text to highlight if necessary.
   * @param {string} listType Type of list being generated e.g. 'bookmarks'.
   * @return {Element} List item element representing result.
   */
  createListItem: function awesomescreen_createListItem(data, filter,
    listType) {

    var listItem = null;
    var fromCache = false;

    // Clone list item element from the cache or a template
    if (listType == 'search') {
      if (this.searchTemplate) {
        listItem = this.searchTemplate.cloneNode(true);
        fromCache = true;
      } else {
        listItem = this.resultTemplate.cloneNode(true);
        this.searchTemplate = listItem;
      }
    } else if (this.resultCache[data.uri]) {
      listItem = this.resultCache[data.uri].cloneNode(true);
      fromCache = true;
    } else {
      listItem = this.resultTemplate.cloneNode(true);
      this.cacheResult(data.uri, listItem);
    }

    var link = listItem.firstChild;

    // Set text content of non-cached results or those that may need updating
    if (!fromCache || listType == 'bookmarks' || listType == 'results' ||
      listType == 'search') {
      var title = link.firstChild;
      var url = link.childNodes[1];
      link.href = data.uri;
      var titleText = data.title ? data.title : data.url;
      title.innerHTML = HtmlHelper.createHighlightHTML(titleText, filter);

      if (data.uri == this.ABOUT_PAGE_URL) {
        url.textContent = 'about:';
      } else if (data.description) {
        url.innerHTML = HtmlHelper.createHighlightHTML(data.description);
      } else {
        url.innerHTML = HtmlHelper.createHighlightHTML(data.uri, filter);
      }
    }

    // Add contextmenu event listener for long press on bookmarks
    if (listType === 'bookmarks') {
      link.addEventListener('contextmenu', function() {
        Browser.showBookmarkTabContextMenu(data.uri);
      });
    }

    // If the result was cached, nothing left to do so return it
    if (fromCache) {
      return listItem;
    }

    // Set result icon
    var underlay = ',url(./style/images/favicon-underlay.png)';
    if (!data.iconUri) {
      link.style.backgroundImage =
        'url(' + this.DEFAULT_FAVICON + ')' + underlay;
    } else {
      BrowserDB.db.getIcon(data.iconUri, (function(icon) {
        if (icon && icon.failed !== true && icon.data) {
          var imgUrl = window.URL.createObjectURL(icon.data);
          link.style.backgroundImage = 'url(' + imgUrl + ')' + underlay;
          this.objectURLs.push(imgUrl);
        } else {
          link.style.backgroundImage =
            'url(' + this.DEFAULT_FAVICON + ')' + underlay;
        }
      }).bind(this));
    }

    return listItem;
  },

  /**
   * Cache an awesomescreen result.
   *
   * Use this.resultCache as a FIFO cache of DOM elements for previous results.
   *
   * @param {string} uri URI of result to cache.
   * @param {Element} listItem DOM element representing result.
   */
  cacheResult: function awesomescreen_cacheResult(uri, listItem) {
    var keys = Object.keys(this.resultCache);
    if (keys.length >= this.RESULT_CACHE_SIZE) {
      delete this.resultCache[keys[0]];
    }
    this.resultCache[uri] = listItem;
  },

  /**
   * Clear the cache of awesomescreen results to save memory.
   */
  clearResultCache: function awesomescreen_clearResultCache() {
    this.resultCache = {};
    this.searchTemplate = null;

    this.objectURLs.forEach(function(url) {
      window.URL.revokeObjectURL(url);
    });
    this.objectURLs = [];
  },

  /**
   * Handle the user clicking on an awesomescreen result.
   *
   * @param {Event} e Click event.
   */
  handleClickResult: function awesomescreen_handleClickResult(e) {
    this.clearResultCache();
    Browser.followLink(e);
  }
};
