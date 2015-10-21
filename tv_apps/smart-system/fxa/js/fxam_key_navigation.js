/* global KeyNavigationAdapter */
/* global SpatialNavigator */
/* exported FxaModuleKeyNavigation */

'use strict';

(function (exports) {

  var elementNames = [
    // '#fxa-module-header .action-button',
    // '#fxa-email-input', '#fxa-terms', '#fxa-privacy',
    // '#fxa-age-select',
    // '#fxa-pw-input', '#fxa-forgot-password', '#fxa-show-pw',
    '#fxa-module-next'
  ];

  function getElements(elementNames) {
    var elements = [];

    elementNames.forEach(selector => {
      var element = document.querySelector(selector);
      if (element) {
        elements.push(element);
      }
    });

    return elements;
  }

  var FxaModuleKeyNavigation = {

    spatialNavigator: null,

    keyNavigationAdapter: null,

    init() {
      var elements = getElements(elementNames);

      this.spatialNavigator = new SpatialNavigator(elements);
      this.spatialNavigator.on('focus', elem => {
        console.log('focus', elem);
        elem.focus();
        console.log('activeElement', document.activeElement);
      });

      this.keyNavigationAdapter = new KeyNavigationAdapter();

      this.keyNavigationAdapter.init();

      this.keyNavigationAdapter.on('move', key => {
        console.log(key);
        this.spatialNavigator.move(key);
      });
    },

    add(param) {
      setTimeout(() => {
      //   var element = document.querySelector(param);

      //   console.log(element);
      //   console.log(document.activeElement);

      // document.activeElement.blur();
      //   console.log(document.activeElement);

      //   element.focus();
      //   console.log(document.activeElement);
      // }, 1000);

      // return;

      var a;
      if (Array.isArray(param)) {
        var elements = getElements(param);
        this.spatialNavigator.multiAdd(elements);
        a = this.spatialNavigator.focus(elements[0]);
      } else {
        var element = document.querySelector(param);
        this.spatialNavigator.add(element);
        a = this.spatialNavigator.focus(element);
      }
      console.log(a);
      console.log(this.spatialNavigator.getFocusedElement());
      console.log(document.activeElement)
      }, 500);
    },

    remove(param) {
      if (Array.isArray(param)) {
        var elements = getElements(param);
        this.spatialNavigator.multiRemove(elements);
      } else {
        var element = document.querySelector(param);
        this.spatialNavigator.remove(element);
      }
    }
  };

  exports.FxaModuleKeyNavigation = FxaModuleKeyNavigation;

})(window);
