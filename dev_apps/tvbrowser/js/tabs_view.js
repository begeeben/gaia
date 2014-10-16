'use strict';

(function (exports) {

  var mediator;

  // DOM
  var tabList;

  var tabsView = {};

  tabsView.init = function tabsView_init(options) {
    mediator = options.mediator;

    tabList = document.getElementById('tabs-view');

    tabList.addEventListener('click', function (e) {
      e.preventDefault();

      console.log(e.target);
      // if target is new tab

      // else if target is an existing tab
      if (e.target.id === 'new-tab') {
        mediator.addTab();
      }

      tabsView.hide();
    });
  };

  tabsView.show = function tabsView_show(options) {
    tabList.classList.remove('is-hidden');
  };

  tabsView.hide = function tabsView_show() {
    tabList.classList.add('is-hidden');
  };

  exports.tabsView = tabsView;

})(window);
