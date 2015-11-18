/* exported Ifilter */
/* global Browser */
/* global BrowserDB */

'use strict';

/**
 * Browser app ifilter panel.
 * @namespace Ifilter
 */
var Ifilter = {
  OFFER_URL: 'https://sec.ifuser.jp/ce/?device=pastb',
  DEFAULT_FUNC: 'オフ',
  DEFAULT_SERVER: 'px.ifuser.jp',
  DEFAULT_PORT: 80,
  DEFAULT_ID: '',
  FUNC_ON: 'オン',
  FUNC_OFF: 'オフ',
  currentFunc: 'オフ',
  selectFunc: '',
  funcList: null,
  focusList: null,
  focusPos: 0,
  blurFlag: false,
  user_id: '',

  /** Get all DOM elements when inited. */
  getAllElements: function ifilter_getAllElements() {
  
    var toCamelCase = function toCamelCase(str) {
      return str.replace(/\-(.)/g, function replacer(str, p1) {
        return p1.toUpperCase();
      });
    };

    var elementIDs = [
      'ifilter-list', 'ifilter-list-area',

      'ifilter-offer', 'ifilter-offer-title',
      'ifilter-func', 'ifilter-func-title', 'ifilter-func-content',
      'ifilter-server', 'ifilter-server-title', 'ifilter-server-content',
      'ifilter-port', 'ifilter-port-title', 'ifilter-port-content',
      'ifilter-id', 'ifilter-id-title', 'ifilter-id-content',

      'ifilter-dialog',
      'ifilter-dialog-func',
      'ifilter-dialog-func-header', 'ifilter-dialog-func-header-title',
      'ifilter-dialog-func-select', 'ifilter-dialog-func-select-list', 
      'ifilter-dialog-func-button',
      'ifilter-dialog-func-cancel', 'ifilter-dialog-func-ok'
    ];
  
    // Loop and add element with camel style name to Modal Dialog attribute.
    elementIDs.forEach(function createElementRef(name) {
      this[toCamelCase(name)] = document.getElementById(name);
    }, this);
  },

  /**
   * Intialise ifilter panel.
   */
  init: function ifilter_init() {
    this.getAllElements();

    this.getFuncByDB((function(result) {
      if((result == null) || (result == undefined)) {
         Ifilter.setDefaultFunc();
         result = this.DEFAULT_FUNC;
      }
      Ifilter.currentFunc = result;
    }).bind(this));
    this.getServerByDB((function(result) {
      if((result == null) || (result == undefined)) {
         Ifilter.setDefaultServer();
      }
    }).bind(this));
    this.getPortByDB((function(result) {
      if((result == null) || (result == undefined)) {
         Ifilter.setDefaultPort();
      }
    }).bind(this));
    this.getIdByDB((function(result) {
      if((result == null) || (result == undefined)) {
         Ifilter.setDefaultId();
         result = this.DEFAULT_ID;
      }
      Ifilter.user_id = result;
    }).bind(this));

    this.ifilterList.addEventListener('mouseup',
      this.handleListClick.bind(this));
    this.ifilterListArea.addEventListener('mouseup',
      this.handleListAreaClick.bind(this));

    this.ifilterOffer.addEventListener('mouseup',
      this.handleOfferClick.bind(this));
    this.ifilterFunc.addEventListener('mouseup',
      this.handleFuncClick.bind(this));
    this.ifilterServer.addEventListener('mouseup',
      this.handleServerClick.bind(this));
    this.ifilterPort.addEventListener('mouseup',
      this.handlePortClick.bind(this));
    this.ifilterId.addEventListener('mouseup',
      this.handleIdClick.bind(this));

    this.ifilterDialogFuncCancel.addEventListener('mouseup',
      this.handleDialogFuncCancel.bind(this));
    this.ifilterDialogFuncOk.addEventListener('mouseup',
      this.handleDialogFuncOk.bind(this));
    this.ifilterDialogFuncCancel.addEventListener('keyup',
      this.handleDialogFuncCancel.bind(this));
    this.ifilterDialogFuncOk.addEventListener('keyup',
      this.handleDialogFuncOk.bind(this));
  },

  /**
   * Show ifilter panel.
   */
  show: function ifilter_show() {
    this.getFuncByDB((function(result) {
      Ifilter.ifilterFuncContent.textContent = result;
      Ifilter.currentFunc = result;
    }).bind(this));
    this.getServerByDB((function(result) {
      Ifilter.ifilterServerContent.textContent = result;
    }).bind(this));
    this.getPortByDB((function(result) {
      Ifilter.ifilterPortContent.textContent = result;
    }).bind(this));
    this.getIdByDB((function(result) {
      Ifilter.ifilterIdContent.textContent = result;
    }).bind(this));

    document.body.classList.add('ifilter-screen');
  },

  /**
   * ifilter list displays a confirmation.
   */
  isDisplayed: function ifilter_isDisplayed() {
    return document.body.classList.contains('ifilter-screen');
  },

  /**
   * Hide ifilter panel.
   */
  hide: function ifilter_hide() {
    if( this.isDialogFuncDisplayed() ) { 
      this.hideDialogFunc();
    }
    document.body.classList.remove('ifilter-screen');
  },

  handleListClick: function ifilter_handleListClick(evt) {
    if( evt ) evt.stopPropagation();
    if(evt.target == this.ifilterList) this.hide();
  },

  handleListAreaClick: function ifilter_handleListAreaClick(evt) {
    if( evt ) evt.stopPropagation();
  },

  handleOfferClick: function ifilter_handleOfferClick(evt) {
    if( !Browser.currentInfo ) return;
    Browser.variousWindowErase();
    if(( Browser.currentInfo.url != null ) && ( Browser.currentInfo.url != '' )) {
      var req = new Object();
      req.detail = { url: this.OFFER_URL, frameElement: null };
      Awesomescreen.openNewTab(req);
    } else {
      Browser.navigate(this.OFFER_URL);
    }
  },

  /**
   * ifilter function setting(OFF/ON).
   */
  handleFuncClick: function ifilter_handleFuncClick(evt) {
    if( evt ) evt.preventDefault();
    if( !this.isDialogFuncDisplayed() ) {
      this.focusList = new Array();
      this.blurFlag = false;
      Browser.switchCursorMode(false);
      this.ifilterDialog.classList.remove('hidden');
      this.ifilterDialogFunc.classList.remove('hidden');

      this.selectFunc = this.currentFunc;
      this.funcList = [this.FUNC_ON, this.FUNC_OFF];
      for(var i in this.funcList) {
        var title = document.createElement('div');
        title.classList.add('title');
        var name = document.createElement('p');
        name.classList.add('name');
        name.textContent = this.funcList[i];
        title.appendChild(name);

        var check = document.createElement('div');
        check.classList.add('check');
        var onoff = document.createElement('p');
        if( name.textContent == this.currentFunc ) {
          name.dataset.display = 'selected';
          onoff.classList.add('on');
        } else {
          name.dataset.display = '';
          onoff.classList.add('off');
        }
        check.appendChild(onoff);

        var item = document.createElement('div');
        item.classList.add('item');
        item.appendChild(title);
        item.appendChild(check);
        item.tabIndex = '0';
        this.ifilterDialogFuncSelectList.appendChild(item);
        item.addEventListener('mouseup',
          Ifilter.handleDialogFuncSelected.bind(Ifilter));
        item.addEventListener('keyup',
          this.handleDialogFuncSelected.bind(Ifilter));
        this.focusList.push(item);
      } 
      this.focusList.push(this.ifilterDialogFuncOk);
      this.focusList.push(this.ifilterDialogFuncCancel);
      this.focusPos = this.focusList.length - 1;
      this.focusChange(this.focusPos);
    }
  },
  hideDialogFunc: function ifilter_hideDialogFunc() {
    if( this.isDialogFuncDisplayed() ) {
      Awesomescreen.pointerImg.style.display = 'none';
      var childs = this.ifilterDialogFuncSelectList.childNodes;
      var len = childs.length;
      for(var i = 0 ; i < len ; i ++) {
        this.ifilterDialogFuncSelectList.removeChild(childs[0]);
      }
      this.ifilterDialogFunc.classList.add('hidden');
      this.ifilterDialog.classList.add('hidden');
      Browser.switchCursorMode(true);

      this.ifilterDialogFuncOk.classList.remove('active');
      this.ifilterDialogFuncCancel.classList.remove('active');
    }
  },
  isDialogFuncDisplayed: function ifilter_isDialogFuncDisplayed() {
    return !this.ifilterDialogFunc.classList.contains('hidden');
  },
  handleDialogFuncSelected: function ifilter_handleDialogFuncSelected(evt) {
    if( evt ) evt.stopPropagation();
    if(( evt.type == 'keyup' ) && ( evt.keyCode != KeyEvent.DOM_VK_RETURN )) {
      return;
    }
    this.selectFunc = evt.currentTarget.textContent;
    var childs = this.ifilterDialogFuncSelectList.childNodes;
    var len = childs.length;
    for(var i = 0 ; i < len ; i ++) {
      if(childs[i].textContent == this.selectFunc) {
        childs[i].firstChild.firstChild.dataset.display = 'selected';
        childs[i].lastChild.lastChild.classList.remove('off');
        childs[i].lastChild.lastChild.classList.add('on');
      } else {
        childs[i].firstChild.firstChild.dataset.display = '';
        childs[i].lastChild.lastChild.classList.remove('on');
        childs[i].lastChild.lastChild.classList.add('off');
      }
    }
  },
  handleDialogFuncCancel: function ifilter_handleDialogFuncCancel(evt) {
    if( evt ) evt.stopPropagation();
    if(( evt.type == 'keyup' ) && ( evt.keyCode != KeyEvent.DOM_VK_RETURN )) {
      return;
    }

    // Animation end event
    var current_target = evt.currentTarget;
    var end_event = (function() {
      current_target.removeEventListener('transitionend', end_event, false);
      Ifilter.hideDialogFunc();
    });
    current_target.addEventListener('transitionend', end_event, false);

    var elm = document.activeElement;
    elm.classList.remove('active');
  },
  handleDialogFuncOk: function ifilter_handleDialogFuncOk(evt) {
    if( evt ) evt.stopPropagation();
    if(( evt.type == 'keyup' ) && ( evt.keyCode != KeyEvent.DOM_VK_RETURN )) {
      return;
    }
    var dialog = false;
    if( this.selectFunc != this.currentFunc ) {
      if( this.selectFunc == this.FUNC_ON ) {
        dialog = true;
        var cset = {};
        cset['browser.proxy.app_origins'] = "app://0077777700140002.myhomescreen.tv";
        cset['browser.proxy.enabled'] = true;
        cset['browser.proxy.host'] = this.getServer();
        cset['browser.proxy.port'] = this.getPort();
        navigator.mozSettings.createLock().set(cset);
      } else {
        var cset = {};
        cset['browser.proxy.enabled'] = false;
        navigator.mozSettings.createLock().set(cset);
      }
      this.setFunc(this.selectFunc);
    }

    // Animation end event
    var current_target = evt.currentTarget;
    var end_event = (function() {
      current_target.removeEventListener('transitionend', end_event, false);
      Ifilter.hideDialogFunc();
      if( dialog ) {
        BrowserDialog.createDialog('ifilter_func', null);
      }
    });
    current_target.addEventListener('transitionend', end_event, false);

    var elm = document.activeElement;
    elm.classList.remove('active');
  },
  getDefaultFunc: function ifilter_getDefaultFunc() {
    return Ifilter.DEFAULT_FUNC;
  },
  setDefaultFunc: function ifilter_setDefaultFunc() {
    BrowserDB.db.open((function() {
      BrowserDB.updateSetting( this.DEFAULT_FUNC, 'ifilter_func' );
    }).bind(this));
  },
  getFuncByDB: function ifilter_getFuncByDB(cb) {
    BrowserDB.db.open((function() {
      BrowserDB.getSetting( 'ifilter_func', cb );
    }).bind(this));
  },
  getFunc: function ifilter_getFunc() {
    return Ifilter.currentFunc;
  },
  setFunc: function ifilter_setFunc(func) {
    Ifilter.currentFunc = func;
    Ifilter.ifilterFuncContent.textContent = func;
    BrowserDB.db.open((function() {
      BrowserDB.updateSetting( func, 'ifilter_func' );
    }).bind(this));
  },

  focusChange: function ifilter_focusChange(pos) {
    if( Ifilter.blurFlag ) {
      Ifilter.blurFlag = false;
      Browser.switchCursorMode(true);
      Browser.switchCursorMode(false);
    }
    for( var i = 0 ; i < Ifilter.focusList.length ; i ++ ) {
      if( i == pos ) {
        Ifilter.focusList[i].focus();
        Awesomescreen.focusImgFunc(Ifilter.focusList[i], null);
      } else {
        Ifilter.focusList[i].blur();
      }
    }
  },

  /**
   * ifilter server setting.
   */
  handleServerClick: function ifilter_handleServerClick(evt) {
    BrowserDialog.createDialog('ifilter_server', null);
  },
  getDefaultServer: function ifilter_getDefaultServer() {
    return this.DEFAULT_SERVER;
  },
  setDefaultServer: function ifilter_setDefaultServer() {
    BrowserDB.db.open((function() {
      BrowserDB.updateSetting( this.DEFAULT_SERVER, 'ifilter_server' );
    }).bind(this));
  },
  getServerByDB: function ifilter_getServerByDB(cb) {
    BrowserDB.db.open((function() {
      BrowserDB.getSetting( 'ifilter_server', cb );
    }).bind(this));
  },
  getServer: function ifilter_getServer() {
    return this.ifilterServerContent.textContent;
  },
  setServer: function ifilter_setServer(server) {
    this.ifilterServerContent.textContent = server;
    if( this.currentFunc == this.FUNC_ON ) {
      var cset = {};
      cset['browser.proxy.host'] = this.getServer();
      navigator.mozSettings.createLock().set(cset);
    }
    BrowserDB.db.open((function() {
      BrowserDB.updateSetting( server, 'ifilter_server' );
    }).bind(this));
  },

  /**
   * ifilter port setting.
   */
  handlePortClick: function ifilter_handlePortClick(evt) {
    BrowserDialog.createDialog('ifilter_port', null);
  },
  getDefaultPort: function ifilter_getDefaultPort() {
    return this.DEFAULT_PORT;
  },
  setDefaultPort: function ifilter_setDefaultPort() {
    BrowserDB.db.open((function() {
      BrowserDB.updateSetting( this.DEFAULT_PORT, 'ifilter_port' );
    }).bind(this));
  },
  getPortByDB: function ifilter_getPortByDB(cb) {
    BrowserDB.db.open((function() {
      BrowserDB.getSetting( 'ifilter_port', cb );
    }).bind(this));
  },
  getPort: function ifilter_getPort() {
    return this.ifilterPortContent.textContent;
  },
  setPort: function ifilter_setPort(port) {
    this.ifilterPortContent.textContent = port;
    if( this.currentFunc == this.FUNC_ON ) {
      var cset = {};
      cset['browser.proxy.port'] = this.getPort();
      navigator.mozSettings.createLock().set(cset);
    }
    BrowserDB.db.open((function() {
      BrowserDB.updateSetting( port, 'ifilter_port' );
    }).bind(this));
  },

  /**
   * ifilter user id setting.
   */
  handleIdClick: function ifilter_handleIdClick(evt) {
    BrowserDialog.createDialog('ifilter_id', null);
  },
  getDefaultId: function ifilter_getDefaultId() {
    return this.DEFAULT_ID;
  },
  setDefaultId: function ifilter_setDefaultId() {
    BrowserDB.db.open((function() {
      BrowserDB.updateSetting( this.DEFAULT_ID, 'ifilter_id' );
    }).bind(this));
  },
  getIdByDB: function ifilter_getIdByDB(cb) {
    BrowserDB.db.open((function() {
      BrowserDB.getSetting( 'ifilter_id', cb );
    }).bind(this));
  },
  getId: function ifilter_getId() {
    return this.ifilterIdContent.textContent;
  },
  setId: function ifilter_setId(id) {
    this.ifilterIdContent.textContent = id;
    this.user_id = id;
    BrowserDB.db.open((function() {
      BrowserDB.updateSetting( id, 'ifilter_id' );
    }).bind(this));
  },

  /**
   * Handle Key Event.
   */
  handleKeyEvent: function ifilter_handleKeyEvent(ev) {
    if( !Ifilter.isDisplayed() ) return false;
    // in the input area focus (= display keyboard)
    if(document.activeElement.nodeName == 'INPUT') {
      return true;
    }
    switch( ev.keyCode ) {
      case KeyEvent.DOM_VK_LEFT :
        ev.preventDefault();
        if( Ifilter.isDialogFuncDisplayed() ) {
          if( Ifilter.focusPos == Ifilter.focusList.length - 1 ) {
            Ifilter.focusPos --;
            Ifilter.focusChange(Ifilter.focusPos);
          }
          return true;
        }
        break;

      case KeyEvent.DOM_VK_RIGHT :
        ev.preventDefault();
        if( Ifilter.isDialogFuncDisplayed() ) {
          if( Ifilter.focusPos == Ifilter.focusList.length - 2 ) {
            Ifilter.focusPos ++;
            Ifilter.focusChange(Ifilter.focusPos);
          }
          return true;
        }
        break;

      case KeyEvent.DOM_VK_UP :
        ev.preventDefault();
        if( Ifilter.isDialogFuncDisplayed() ) {
          if( Ifilter.focusPos > 0 ) {
            if( Ifilter.focusPos >= Ifilter.focusList.length - 1 ) {
              Ifilter.focusPos = Ifilter.focusList.length - 3;
            } else {
              Ifilter.focusPos --;
            }
            Ifilter.focusChange(Ifilter.focusPos);
          }
          return true;
        }
        break;

      case KeyEvent.DOM_VK_DOWN :
        ev.preventDefault();
        if( Ifilter.isDialogFuncDisplayed() ) {
          if( Ifilter.focusPos < Ifilter.focusList.length - 2 ) {
            Ifilter.focusPos ++;
            Ifilter.focusChange(Ifilter.focusPos);
          }
          return true;
        }
        break;

      case KeyEvent.DOM_VK_RETURN :
        ev.preventDefault();
        if( Ifilter.isDialogFuncDisplayed() ) {
          if( Ifilter.focusPos > 1 ) {
            document.activeElement.classList.remove('active');
            document.activeElement.classList.add('active');
            return true;
          }
        }
        break;

      case KeyEvent.DOM_VK_BACK_SPACE :
        if( Ifilter.isDialogFuncDisplayed() ) {
          Ifilter.hideDialogFunc();
          return true;
        }
        Ifilter.hide();
        return true;

      default :
        return false;
    }
    return true;
  }
};
