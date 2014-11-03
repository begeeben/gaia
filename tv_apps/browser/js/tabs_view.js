/* global MAX_TAB_COUNT */
'use strict';

(function (exports) {

  var mediator;

  // DOM
  var tabList;
  var tabTemplate, newTabTemplate;

  function initTemplate () {
    tabTemplate = document.createElement('li');
    tabTemplate.classList.add('tab-item');
    var button = document.createElement('button');
    button.classList.add('delete-button');
    button.appendChild(document.createTextNode('X'));
    tabTemplate.appendChild(button);
    tabTemplate.appendChild(document.createElement('a'));
    tabTemplate.appendChild(document.createElement('span'));

    newTabTemplate = document.createElement('li');
    newTabTemplate.classList.add('tab-item');
    var a = document.createElement('a');
    a.setAttribute('id', 'new-tab');
    a.classList.add('new-tab');
    newTabTemplate.appendChild(a);
  }

  var tabsView = {};

  tabsView.init = function tabsView_init(options) {
    mediator = options.mediator;

    tabList = document.getElementById('tabs-view');

    tabList.addEventListener('click', function (e) {
      e.preventDefault();

      var li, index;

      if (e.target.id === 'new-tab') {
        mediator.addTab();
      } else if (e.target.nodeName === 'A') {
        li = e.target.parentNode;
        index = [].indexOf.call(tabList.children, li);
        mediator.selectTab(index);
        mediator.updateUrlBar(mediator.getCurrentTitle());
      } else if (e.target.nodeName === 'BUTTON') {
        li = e.target.parentNode;
        index = [].indexOf.call(tabList.children, li);
        tabList.removeChild(li);
        mediator.removeTab(index);
        if (tabList.children.length === 1) {
          tabsView.hide();
        }
        return;
      }

      tabsView.hide();
    });

    initTemplate();
  };

  tabsView.show = function tabsView_show(tabs) {
    var fragment = document.createDocumentFragment();

    tabs = tabs || [];

    tabs.forEach(function (tab) {
      var tabElement = tabTemplate.cloneNode(true);
      tabElement.querySelector('a').href = tab.url;
      tabElement.querySelector('span').innerHTML = tab.title || tab.url;
      fragment.appendChild(tabElement);
    });

    if (tabs.length < MAX_TAB_COUNT) {
      fragment.appendChild(newTabTemplate);
    }

    while (tabList.firstChild) {
      tabList.removeChild(tabList.firstChild);
    }
    tabList.appendChild(fragment);

    tabList.classList.remove('is-hidden');
  };

  tabsView.hide = function tabsView_show() {
    tabList.classList.add('is-hidden');
  };

  exports.tabsView = tabsView;

})(window);
