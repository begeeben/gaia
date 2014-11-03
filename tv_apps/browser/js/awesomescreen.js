/* global AccessibilityHelper */
/* global DateHelper */

'use strict';

(function (exports) {

  var _ = navigator.mozL10n.get;

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

    if (topSite.screenshot) {
      var objectURL = URL.createObjectURL(topSite.screenshot);
      link.style.backgroundImage = 'url(' + objectURL + ')';
    }

    listItem.querySelector('span').textContent = topSite.title;
    return listItem;
  }

  // should only update changed top sites, revise it later
  function updateTopSitesPanel(topSites) {
    var list = topSiteListTemplate.cloneNode();
    console.log(topSites);
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
          dateHeader = createHistoryDateHeader(threshold, timestamp);
        }
      }

      if (threshold === 5) {
        var timestampDate = new Date(timestamp);
        if (timestampDate.getMonth() != month ||
          timestampDate.getFullYear() != year) {
          month = timestampDate.getMonth();
          year = timestampDate.getFullYear();
          dateHeader = createHistoryDateHeader(threshold, timestamp);
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

  function onLinkClick (e) {
    e.preventDefault();

    if (e.target.nodeName === 'A') {
      mediator.goToUrl(e.target.getAttribute('href'));
    }
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
    tabPanels.addEventListener('click', onLinkClick);
    searchResultsPanel.addEventListener('click', onLinkClick);

    initTemplates();
  };

  awesomescreen.uninit = function awesomescreen_uninit() {
    // remove event listeners
    // clear unused variables
  };

  awesomescreen.showTopSites = function awesomescreen_showTopSites(focus) {
    selectTab(topSitesTab, topSitesPanel);
    mediator.getTopSites()
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

  exports.awesomescreen = awesomescreen;

})(window);
