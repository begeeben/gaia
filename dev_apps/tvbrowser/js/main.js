
'use strict';

(function () {

  window.addEventListener('load', function browserOnLoad(evt) {
    window.removeEventListener('load', browserOnLoad);

    // Init relevant modules and inject the mediator into these modules
    window.mediator.init({
      awesomescreen: window.awesomescreen,
      toolbar: window.toolbar,
      settings: window.settings,
    });
  });

})();
