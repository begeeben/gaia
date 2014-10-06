/* global mediator */

'use strict';

(function () {

  window.addEventListener('load', function browserOnLoad(evt) {
    window.removeEventListener('load', browserOnLoad);

    mediator.init();
  });

})();
