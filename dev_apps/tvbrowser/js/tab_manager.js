/* global UrlHelper */
/* global MAX_TAB_COUNT */
'use strict';

(function (exports) {

  var mediator;

  // DOM
  var framesElement;

  function getMozBrowserEventHandler (tab) {
    // browser event handler
    return function onMozBrowserEvents (e) {
      // console.log(e);
      switch (e.type) {

      case 'mozbrowserloadstart':
        handleLoadStart(e, tab);
        break;

      case 'mozbrowserloadend':
        handleLoadEnd(e, tab);
        break;

      case 'mozbrowserlocationchange':
        handleLocationChange(e, tab);
        break;

      case 'mozbrowsertitlechange':
        handleTitleChange(e, tab);
        break;

      case 'mozbrowsericonchange':
        handleIconChange(e, tab);
        break;

      case 'mozbrowsercontextmenu':
        handleContextMenu(e, tab);
        break;

      case 'mozbrowsersecuritychange':
        handleSecurityChange(e, tab);
        break;

      case 'mozbrowseropenwindow':
        handleOpenWindow(e, tab);
        break;

      case 'mozbrowserclose':
        handleClose(e, tab);
        break;

      case 'mozbrowserusernameandpasswordrequired':
        handleUsernameAndPasswordRequired(e, tab);
        break;

      case 'mozbrowsershowmodalprompt':
        handleShowModalPrompt(e, tab);
        break;

      case 'mozbrowsererror':
        handleError(e, tab);
        break;

      case 'mozbrowserasyncscroll':
        handleAsyncScroll(e, tab);
        break;
      }
    };
  }

  function handleLoadStart (e, tab) {
    // iframe will call loadstart on creation, ignore
    if (!tab.url || tab.crashed) {
      return;
    }

    if (tab === tabs[tabIndex]) {
      mediator.setUrlButtonMode('stop');
    }

    tab.title = null;
    tab.iconUrl = null;
  }

  function handleLoadEnd (e, tab) {

  }

  function handleLocationChange (e, tab) {
    var url = e.detail;

    tab.url = url;

    if (url === 'about:blank') {
      return;
    }

    mediator.updateHistory(e.target);

    if (tab === tabs[tabIndex]) {
      mediator.updateUrlBar(url);
    }
  }

  function handleTitleChange (e, tab) {
    var title = e.detail;

    if (title) {
      tab.title = title;

      // update page title in db
      // mediator.updateTitle(tab.dom);

      if (tab === tabs[tabIndex]) {
        mediator.updateUrlBar(title);
      }

      // update title in tabs view
    }
  }

  function handleIconChange (e, tab) {
    if (e.detail.href && e.detail.href != tab.iconUrl) {
      tab.iconUrl = e.detail.href;
      // TODO: Pick up the best icon
      // based on e.detail.sizes and device size.
      // BrowserDB.setAndLoadIconForPage(tab.url, tab.iconUrl);
    }
  }

  function handleContextMenu (e, tab) {
    mediator.showContextMenu();
  }

  function handleSecurityChange (e, tab) {
    tab.security = e.detail;

    if (tab === tabs[tabIndex]) {
      mediator.updateSecurityIcon(tab.security);
    }
  }

  function handleOpenWindow (e, tab) {
    var url = e.detail.url;
    var iframe = e.detail.frameElement;

    // this block is duplicated
    if (tabs.length < MAX_TAB_COUNT) {
      tabs.push(createTab(url, iframe));
      tabManager.selectTab(tabs.length - 1);
      mediator.updateTabsCount(tabs.length);
    } else {
      // use the current tab to open the url
    }
  }

  function handleClose (e, tab) {
    tabs.forEach(function (item, index) {
      if (tab.id === item.id) {
        tabManager.removeTab(index);
      }
    });
  }

  function handleShowModalPrompt (e, tab) {

  }

  function handleError (e, tab) {

  }

  function handleAsyncScroll (e, tab) {

  }

  function handleUsernameAndPasswordRequired (e, tab) {

  }

  var tabs = [];
  // the current tab index
  var tabIndex = 0;

  function createTab(url, iframe) {
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.setAttribute('mozbrowser', true);
      iframe.setAttribute('mozallowfullscreen', true);

      iframe.classList.add('browser-tab');

      if (url) {
        iframe.setAttribute('src', url);
      }
    }

    iframe.setAttribute('id', 'tab_' + tabs.length);
    // iframe.setAttribute('mozasyncpanzoom', true);
    // FIXME: content shouldn't control this directly
    iframe.setAttribute('remote', 'true');

    var tab = {
      id: 'tab_' + tabs.length,
      dom: iframe,
      url: url || '',
      title: null,
      loading: false,
      screenshot: null,
      security: null
    };

    var browserEvents = [
      'mozbrowserloadstart',
      'mozbrowserloadend',
      'mozbrowserlocationchange',
      'mozbrowsertitlechange',
      'mozbrowsericonchange',
      'mozbrowsercontextmenu',
      'mozbrowsersecuritychange mozbrowseropenwindow',
      'mozbrowserclose',
      'mozbrowsershowmodalprompt',
      'mozbrowsererror',
      'mozbrowserasyncscroll',
      'mozbrowserusernameandpasswordrequired'
    ];

    var browserEventHandler = getMozBrowserEventHandler(tab);

    browserEvents.forEach(function (eventName) {
      iframe.addEventListener(eventName, browserEventHandler);
    });

    framesElement.appendChild(iframe);

    return tab;
  }

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

  var tabManager = {};

  tabManager.init = function tabManager_init(options) {
    mediator = options.mediator;

    framesElement = document.getElementById('frames');
  };

  tabManager.addTab = function tabManager_addTab(url, iframe) {
    console.log('addTab');
    console.log(tabs);
    if (tabs.length < MAX_TAB_COUNT) {
      tabs.push(createTab(url, iframe));
      tabManager.selectTab(tabs.length - 1);
      mediator.updateTabsCount(tabs.length);
    }
  };

  tabManager.removeTab = function tabManager_removeTab(index) {
    if (tabs.length > index) {
      tabManager.selectTab(index > 0 ? index -1 : 0);
      var tab = tabs.splice(index, 1)[0];
      framesElement.removeChild(tab.dom);
      mediator.updateTabsCount(tabs.length);
      if (tabs.length === 0) {
        mediator.addTab();
      }
    }
  };

  tabManager.selectTab = function tabManager_selectTab(index) {
    console.log('tabIndex ' + tabIndex);
    console.log('select ' + index);
    if (tabs[index]) {
      if (tabs[tabIndex]) {
        tabs[tabIndex].dom.style.display = 'none';
        tabs[tabIndex].dom.setVisible(false);
      }
      tabIndex = index;
      tabs[tabIndex].dom.style.display = 'block';
      tabs[tabIndex].dom.setVisible(true);
      mediator.refreshButtons(tabs[tabIndex].dom);
    }
  };

  tabManager.navigate = function tabManager_navigate(input) {
    var url = getUrlFromInput(input);

    if (tabs[tabIndex]) {
      tabManager.goToUrl(url);
    } else {
      tabManager.addTab(url);
    }
  };

  tabManager.goToUrl = function tabManager_goToUrl(url) {
    if (tabs[tabIndex]) {
      tabs[tabIndex].dom.src = url;
      mediator.refreshButtons(tabs[tabIndex].dom);
    } else {
      tabManager.addTab(url);
    }
  };

  tabManager.goBack = function tabManager_goBack() {
    tabs[tabIndex].dom.goBack();
    mediator.refreshButtons(tabs[tabIndex].dom);
  };

  tabManager.goForward = function tabManager_goForward() {
    tabs[tabIndex].dom.goForward();
    mediator.refreshButtons(tabs[tabIndex].dom);
  };

  tabManager.reload = function tabManager_reload() {
    tabs[tabIndex].dom.reload();
  };

  tabManager.getCurrentTab = function tabManager_getCurrentTab() {
    return tabs[tabIndex];
  };

  tabManager.getTabs = function tabManager_getTabs() {
    return tabs;
  };

  exports.tabManager = tabManager;

})(window);
