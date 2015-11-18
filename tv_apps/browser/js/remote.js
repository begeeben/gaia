/* global Browser, MozActivity */

'use strict';

var _ = navigator.mozL10n.get;

/**
 * Browser app remote
 * @namespace Remote
 */
var Remote = {
  dlnadSocket: null,
  DLNAD_HOST: '127.0.0.1',
  DLNAD_PORT: 55104,
  dlnadContinue: false,
  dlnadRcvArray: [],
  dlnadRcvData: null,
  dlnadRcvCnt: 0,
  dlnadTimer: null,
  dlnadAction: 0x00,

  smaphoSocket: null,
  smaphoHost: '',
  smaphoPort: 0,
  smaphoKeyword: '',
  smaphoContinue: false,
  smaphoRcvArray: [],
  smaphoRcvData: null,
  smaphoRcvCnt: 0,
  smaphoTimer: null,
  smaphoAction: 0x00,

  REMOTE_DLNAD_LEN: 8,
  REMOTE_SMAPHO_LEN: 4,
  REMOTE_LENSIZE: 4,
  REMOTE_NOTIFY_MESSAGE: "vc_app:0:resource_id=1063:Browser",
  REMOTE_CONNECT_MESSAGE: "HTML5 web browser 0.001",
  REMOTE_LENGTH_MASK: 0xff,

  REMOTE_DLNAD_HEADER: 0x64,
  REMOTE_SMAPHO_HEADER: 0xf4,

  REMOTE_ACTION_RUN_NOTIFY: 0x01,
  REMOTE_ACTION_CONNECT: 0x02,
  REMOTE_ACTION_QUERY: 0x03,

  REMOTE_ACTION_SET_URL: 0x01,
  REMOTE_ACTION_GET_URL: 0x02,
  REMOTE_ACTION_SET_BOOKMARK: 0x03,
  REMOTE_ACTION_GET_TITLE: 0x04,

  REMOTE_REQACK_REQ: 0x01,
  REMOTE_REQACK_ACK: 0x02,

  REMOTE_RESULT_REQUEST: 0x00,
  REMOTE_RESULT_SUCCESS: 0x01,
  REMOTE_RESULT_ERROR: 0x10,

  /**
   * Intialise SearchResult.
   */
  init: function remote_init() {
    if( this.dlnadSocket != null ) {
      Browser.debug('already connected...');
      return;
    }
    try {
      this.dlnadSocket = navigator.mozTCPSocket.open(
                           this.DLNAD_HOST,
                           this.DLNAD_PORT,
                           {binaryType: 'arraybuffer'}
                         );
      this.dlnadSocket.onopen = function(evt) {
        Browser.debug("dlnad socket onopen().");
        Remote.sendDlnad(Remote.REMOTE_ACTION_RUN_NOTIFY,
                         Remote.REMOTE_REQACK_REQ,
                         Remote.REMOTE_RESULT_REQUEST,
                         Remote.REMOTE_NOTIFY_MESSAGE
                        );
      };
      this.dlnadSocket.onclose = function(evt) {
        Browser.debug("dlnad socket onclose(). : type = " + evt.type);
        Remote.closeDlnad();
      };
      this.dlnadSocket.onerror = function(evt) {
        console.log("dlnad socket failed : " + evt.data.name);
        Remote.closeDlnad();
      };
      this.dlnadSocket.ondata = function(evt) {
        Remote.recvDlnadData(evt);
        if( Remote.dlnadContinue ) return;
        Remote.recvDlnad();
      };
      this.dlnadSocket.ondrain = function(evt) {
        Browser.debug("dlnad socket ondrain() : " + evt.data);
      };
    } catch(evt) {
      console.log("navigator.mozTCPSocket.open(dlnad) exception : " + evt);
    }
  },

  close: function remote_close() {
    this.closeDlnad();
  },

  suspend: function remote_suspend() {
    this.closeSmapho();
    if( this.dlnadSocket ) {
      Browser.debug('dlnad socket close...');
      this.setDlnadContinue(false); 
      this.dlnadSocket.close();
      this.dlnadSocket = null;
    }
  },

  getUtf8Length: function remote_getUtf8Length( str ) {
    if( !str ) return 0;
    var encodeStr = encodeURI( str );
    var match = encodeStr.match(/%/g);
    return match ? ( encodeStr.length - match.length *2 ) : encodeStr.length;
  },

  setDlnadContinue: function remote_setDlnadContinue(mode) {
    this.dlnadContinue = mode;
    if( this.dlnadTimer ) {
      window.clearTimeout( this.dlnadTimer );
      Browser.debug('dlnadTimer cancel...');
      this.dlnadTimer = null;
    }
    if( mode ) {
      this.dlnadTimer = window.setTimeout( this.timeoutDlnad.bind(this), 5000 );
      Browser.debug('dlnadTimer start...');
    }
  },

  timeoutDlnad: function remote_timeoutDlnad() {
    Browser.debug('dlnadTimer timeout...');
    this.sendDlnadError(this.dlnadAction);
  },

  closeDlnad: function remote_closeDlnad() {
    this.closeSmapho();
    if( this.dlnadSocket ) {
      Browser.debug('dlnad socket close...');
      this.setDlnadContinue(false); 
      this.dlnadSocket.close();
      this.dlnadSocket = null;
      setTimeout( function() {
        Remote.init(); // reboot...
      }, 10000);
    }
  },

  sendDlnad: function remote_sendDlnad(action, reqack, result, message) {
    if( message == null ) {
      message = '';
    }
    var utf8len = this.getUtf8Length( message );
    var sendlen = this.REMOTE_DLNAD_LEN + this.REMOTE_LENSIZE + utf8len;
    var myArray = new ArrayBuffer(sendlen);
    var byteArray = new Uint8Array(myArray);

    var i = 0;
    byteArray[i++] = this.REMOTE_DLNAD_HEADER;
    byteArray[i++] = action;
    byteArray[i++] = reqack;
    byteArray[i++] = result;

    var total = utf8len + 4;
    byteArray[i++] = ( total >> 24 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = ( total >> 16 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = ( total >>  8 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = total & this.REMOTE_LENGTH_MASK;

    var len = utf8len;
    byteArray[i++] = ( len >> 24 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = ( len >> 16 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = ( len >>  8 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = len & this.REMOTE_LENGTH_MASK;

    var encoder = new TextEncoder();
    var utf8Array = encoder.encode(message);
    for( var j = 0 ; j < utf8Array.length ; j ++ ) {
      byteArray[i++] = utf8Array[j];
    }
    Browser.debug('send to dlnad : action = ' + action.toString() +
                             ' , reqack = ' + reqack.toString() +
                             ' , result = ' + result.toString() +
                             ' , message.len = ' + utf8len +
                             ' , message = ' + message);
    var rtn = Remote.dlnadSocket.send(myArray, 0, myArray.byteLength);
    if( rtn != true ) {
      console.log("dlnad message send failed.");
    } else {
      Browser.debug("dlnad message send success.");
    }
  },

  sendDlnadError: function remote_sendDlnadError(action) {
    this.setDlnadContinue(false); 
    this.sendDlnad(action,
                   this.REMOTE_REQACK_ACK,
                   this.REMOTE_RESULT_ERROR,
                   ''
                  );
  },

  recvDlnadData: function remote_recvDlnadData(evt) {
    if(( !evt ) || ( !evt.data )) {
      this.sendDlnadError(0x00);
      return;
    }

    var rcvArray = null;
    if( typeof evt.data === 'string' ) {
      Browser.debug("dlnad socket ondata(string)");
      // string to Uint8Array
      var encoder = new TextEncoder();
      rcvArray = encoder.encode(evt.data);
    } else {
      Browser.debug("dlnad socket ondata(Uint8Array)");
      rcvArray = new Uint8Array(evt.data);
    }
    if( !this.dlnadContinue ) {
      this.dlnadRcvArray = [];
      this.dlnadRcvCnt = 0;
      this.dlnadRcvData = null;
    }
    this.dlnadRcvArray[this.dlnadRcvCnt++] = rcvArray;
    var len = 0;
    for( var i = 0 ; i < this.dlnadRcvCnt ; i ++ ) {
      len += this.dlnadRcvArray[i].length;
    }
    if( len < this.REMOTE_DLNAD_LEN ) {
      this.setDlnadContinue(true); 
      return;
    }
    if( len < this.REMOTE_DLNAD_LEN + this.REMOTE_LENSIZE ) {
      this.setDlnadContinue(true); 
      return;
    }
    var array = new ArrayBuffer(len);
    var uiarray = new Uint8Array(array);
    var cnt = 0;
    for( var i = 0 ; i < this.dlnadRcvCnt ; i ++ ) {
      var buf = this.dlnadRcvArray[i];
      for( var j = 0 ; j < buf.length ; j ++ ) {
        uiarray[cnt++] = buf[j];
      }
    }
    // get Header
    var header = uiarray[0];
    var action = uiarray[1];
    this.dlnadAction = action;
    var reqack = uiarray[2];
    var result = uiarray[3];

    if( header != this.REMOTE_DLNAD_HEADER ) {
      this.sendDlnadError(action);
      return;
    }
    if(( result != this.REMOTE_RESULT_REQUEST ) &&
       ( result != this.REMOTE_RESULT_SUCCESS )) {
      if(( result != 0xf1 ) || ( result != 0xf2 )) {
        this.closeDlnad();
      } else {
        this.sendDlnadError(action);
      }
      return;
    }

    var total = ( uiarray[4] << 24 ) | ( uiarray[5] << 16 ) |
                ( uiarray[6] << 8  ) | uiarray[7];
    if( total > len - this.REMOTE_DLNAD_LEN ) {
      this.setDlnadContinue(true); 
      return;
    }
    this.dlnadRcvData = uiarray;
    this.setDlnadContinue(false); 
  },

  recvDlnad: function remote_recvDlnad() {
    var head_len = this.REMOTE_DLNAD_LEN + this.REMOTE_LENSIZE;
    var rcvArray = null;
    var length  = [];
    var rcvData = [];
    var pos = 0;
    var mesCnt = 0;

    // get Header
    var header = this.dlnadRcvData[pos++];
    var action = this.dlnadRcvData[pos++];
    var reqack = this.dlnadRcvData[pos++];
    var result = this.dlnadRcvData[pos++];
    var total = ( this.dlnadRcvData[pos++] << 24 ) |
                ( this.dlnadRcvData[pos++] << 16 ) |
                ( this.dlnadRcvData[pos++] << 8  ) |
                  this.dlnadRcvData[pos++];

    while( total > pos ) {
      var current = pos;
      // get Length
      length[mesCnt] = ( this.dlnadRcvData[pos++] << 24 ) |
                       ( this.dlnadRcvData[pos++] << 16 ) |
                       ( this.dlnadRcvData[pos++] << 8  ) |
                         this.dlnadRcvData[pos++];
      // get Message
      var str = '';
      for( ; pos < current + length[mesCnt] + 4 ; ) {
        var s = this.dlnadRcvData[pos++];
        if( s != 0x00 ) { // null string cut
          str += String.fromCharCode(s);
        }
      }
      rcvData[mesCnt] = str;
      mesCnt++;
    }

    switch( action ) {
      case this.REMOTE_ACTION_CONNECT :
        Browser.debug("recv action = CONNECT... ip : " + rcvData[1]);
        this.sendDlnad(action,
                       this.REMOTE_REQACK_ACK,
                       this.REMOTE_RESULT_SUCCESS,
                       this.REMOTE_CONNECT_MESSAGE
                      );
        this.smaphoKeyword = rcvData[0];
        var str = rcvData[1].split(':');
        this.smaphoHost = str[0];
        this.smaphoPort = Number(str[1]);
        this.connectSmapho();
        break;

      case this.REMOTE_ACTION_QUERY :
        Browser.debug("recv action = QUERY...");
        break;

      default :
        Browser.debug("recv action = " + String.fromCharCode(action));
        break;
    }
  },

  connectSmapho: function remote_connectSmapho() {
    try {
      this.smaphoSocket = navigator.mozTCPSocket.open(
                            this.smaphoHost,
                            this.smaphoPort,
                            {binaryType: 'arraybuffer'}
                          );
      this.smaphoSocket.onopen = function(evt) {
        Browser.debug("smapho socket onopen.");
      };
      this.smaphoSocket.onclose = function(evt) {
        Browser.debug("smapho socket onclose.");
        Remote.closeSmapho();
      };
      this.smaphoSocket.onerror = function(evt) {
        console.log("smapho socket failed : " + evt.data.name);
        Remote.closeSmapho();
      };
      this.smaphoSocket.ondata = function(evt) {
        Remote.recvSmaphoData(evt);
        if( Remote.smaphoContinue ) return;
        Remote.recvSmapho();
      };
      this.smaphoSocket.ondrain = function(evt) {
        Browser.debug("smapho socket ondrain : " + evt.data);
      };
    } catch(evt) {
      console.log("navigator.mozTCPSocket.open(smapho) exception : " + evt.data);
    }
  },

  setSmaphoContinue: function remote_setSmaphoContinue(mode) {
    this.smaphoContinue = mode;
    if( this.smaphoTimer ) {
      window.clearTimeout( this.smaphoTimer );
      Browser.debug('smaphoTimer cancel...');
      this.smaphoTimer = null;
    }
    if( mode ) {
      this.smaphoTimer = window.setTimeout( this.timeoutSmapho.bind(this), 5000 );
      Browser.debug('smaphoTimer start...');
    }
  },

  timeoutSmapho: function remote_timeoutSmapho() {
    console.log('smaphoTimer timeout...');
    this.sendSmaphoError(this.smaphoAction);
  },

  closeSmapho: function remote_closeSmapho() {
    if( this.smaphoSocket ) {
      Browser.debug('smapho socket close...');
      this.smaphoSocket.close();
      this.setSmaphoContinue(false); 
      this.smaphoSocket = null;
    }
  },

  sendSmapho: function remote_sendSmapho(action, result, message) {
    if( !this.smaphoSocket ) {
      console.log('smapho socket is nothing...');
      return;
    }
    if( message == null ) {
      message = '';
    }
    var utf8len = this.getUtf8Length( message );
    var sendlen = this.REMOTE_SMAPHO_LEN + this.REMOTE_LENSIZE + utf8len;
    var myArray = new ArrayBuffer(sendlen);
    var byteArray = new Uint8Array(myArray);

    var i = 0;
    byteArray[i++] = this.REMOTE_SMAPHO_HEADER;
    byteArray[i++] = action;
    byteArray[i++] = this.REMOTE_REQACK_ACK;
    byteArray[i++] = result;

    var len = utf8len;
    byteArray[i++] = ( len >> 24 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = ( len >> 16 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = ( len >>  8 ) & this.REMOTE_LENGTH_MASK;
    byteArray[i++] = len & this.REMOTE_LENGTH_MASK;

    var encoder = new TextEncoder();
    var utf8Array = encoder.encode(message);
    for( var j = 0 ; j < utf8Array.length ; j ++ ) {
      byteArray[i++] = utf8Array[j];
    }
    Browser.debug('send to smapho : action = ' + action.toString() +
                              ' , result = ' + result.toString() +
                              ' , message.len = ' + utf8len +
                              ' , message = ' + message);
    var rtn = this.smaphoSocket.send(myArray, 0, myArray.byteLength);
    if( rtn != true ) {
      console.log("smapho message send failed.");
    } else {
      Browser.debug("smapho message send success.");
    }
  },

  sendSmaphoSetUrl: function remote_sendSmaphoSetUrl(result) {
    Browser.debug('sendSmaphoSetUrl() : result = ' + result.toString());
    var rslt = ( result ) ? this.REMOTE_RESULT_SUCCESS : this.REMOTE_RESULT_ERROR;
    this.sendSmapho(this.REMOTE_ACTION_SET_URL, rslt, '');
  },

  sendSmaphoAddBookmark: function remote_sendSmaphoAddBookmark(result) {
    Browser.debug('sendSmaphoAddBookmark() : result = ' + result.toString());
    var rslt = ( result ) ? this.REMOTE_RESULT_SUCCESS : this.REMOTE_RESULT_ERROR;
    this.sendSmapho(this.REMOTE_ACTION_SET_BOOKMARK, rslt, '');
  },

  sendSmaphoError: function remote_sendSmaphoError(action) {
    this.setSmaphoContinue(false); 
    this.sendSmapho(action, this.REMOTE_RESULT_ERROR, '');
  },

  recvSmaphoData: function remote_recvSmaphoData(evt) {
    if(( !evt ) || ( !evt.data )) {
      this.sendSmaphoError(0x00);
      return;
    }

    var rcvArray = null;
    if( typeof evt.data === 'string' ) {
      Browser.debug("smapho socket ondata(string)");
      // string to Uint8Array
      var encoder = new TextEncoder();
      rcvArray = encoder.encode(evt.data);
    } else {
      Browser.debug("smapho socket ondata(Uint8Array)");
      rcvArray = new Uint8Array(evt.data);
    }
    if( !this.SmaphoContinue ) {
      this.smaphoRcvArray = [];
      this.smaphoRcvCnt = 0;
      this.smaphoRcvData = null;
    }
    this.smaphoRcvArray[this.smaphoRcvCnt++] = rcvArray;
    var len = 0;
    for( var i = 0 ; i < this.smaphoRcvCnt ; i ++ ) {
      len += this.smaphoRcvArray[i].length;
    }
    if( len < this.REMOTE_SMAPHO_LEN ) {
      this.setSmaphoContinue(true); 
      return;
    }
    if( len < this.REMOTE_SMAPHO_LEN + this.REMOTE_LENSIZE ) {
      this.setSmaphoContinue(true); 
      return;
    }
    var array = new ArrayBuffer(len);
    var uiarray = new Uint8Array(array);
    var cnt = 0;
    for( var i = 0 ; i < this.smaphoRcvCnt ; i ++ ) {
      var buf = this.smaphoRcvArray[i];
      for( var j = 0 ; j < buf.length ; j ++ ) {
        uiarray[cnt++] = buf[j];
      }
    }
    // get Header
    var header = uiarray[0];
    var action = uiarray[1];
    this.smaphoAction = action;
    var reqack = uiarray[2];
    var result = uiarray[3];

    if( header != this.REMOTE_SMAPHO_HEADER ) {
      this.sendSmaphoError(action);
      return;
    }
    if( result != this.REMOTE_RESULT_REQUEST ) {
      this.sendSmaphoError(action);
    }

    var total = ( uiarray[4] << 24 ) | ( uiarray[5] << 16 ) |
                ( uiarray[6] << 8  ) | uiarray[7];
    if( total > len - this.REMOTE_SMAPHO_LEN - this.REMOTE_LENSIZE ) {
      this.setSmaphoContinue(true); 
      return;
    }
    this.smaphoRcvData = uiarray;
    this.setSmaphoContinue(false); 
  },

  recvSmapho: function remote_recvSmapho() {
    var head_len = this.REMOTE_SMAPHO_LEN + this.REMOTE_LENSIZE;
    var pos = 0;
    // get Header
    var header = this.smaphoRcvData[pos++];
    var action = this.smaphoRcvData[pos++];
    var reqack = this.smaphoRcvData[pos++];
    var result = this.smaphoRcvData[pos++];
    var length = ( this.smaphoRcvData[pos++] << 24 ) |
                 ( this.smaphoRcvData[pos++] << 16 ) |
                 ( this.smaphoRcvData[pos++] << 8  ) |
                   this.smaphoRcvData[pos++];
    // get Message
    var str = '';
    for( ; pos < length + head_len ; ) {
      var s = this.smaphoRcvData[pos++];
      if( s != 0x00 ) { // null string cut
        str += String.fromCharCode(s);
      }
    }
    var rcvData = str;
    var flagBookmark = false;

    switch( action ) {
      case this.REMOTE_ACTION_SET_BOOKMARK :
        Browser.debug("smapho recv action = SET_BOOKMARK...");
        flagBookmark = true;
        // not break
      case this.REMOTE_ACTION_SET_URL :
        Browser.debug("smapho recv action = SET_URL... url : " + rcvData);
        if( UrlHelper.isNotURL(rcvData)) {
          // is not url...
          this.sendSmaphoError(action);
        } else {
          Browser.launch_from = -1;
          Browser.variousWindowErase();

          if(( Browser.currentInfo.url != null ) && ( Browser.currentInfo.url != '' )) {
            var evt = new Object();
            evt.detail = { url: rcvData, frameElement: null };
            Awesomescreen.openNewTab(evt);
          } else {
            Browser.navigate(rcvData);
          }
          Browser.currentInfo.smaphoSetUrl = true;
          Browser.currentInfo.smaphoAddBookmark = flagBookmark;
        }
        break;

      case this.REMOTE_ACTION_GET_URL :
        Browser.debug("smapho recv action = GET_URL... " + Browser.currentInfo.url);
        if(( Browser.currentInfo.url == null ) ||
           ( Browser.currentInfo.url == ''   )) {
          this.sendSmaphoError(action);
        } else {
          this.sendSmapho(action, this.REMOTE_RESULT_SUCCESS,
                          Browser.currentInfo.url);
        }
        break;

      case this.REMOTE_ACTION_GET_TITLE :
        Browser.debug("smapho recv action = GET_TITLE... " + Browser.currentInfo.title);
        this.sendSmapho(action, this.REMOTE_RESULT_SUCCESS,
                        Browser.currentInfo.title);
        break;

      default :
        Browser.debug("smapho recv action = " + String.fromCharCode(action));
        break;
    }
  },

  addBookmark: function remote_addBookmark(tab) {
    if(!tab.url || UrlHelper.isNotURL(tab.url)) {
      console.log('url is illegal... : ' + tab.url);
      // this.sendSmaphoAddBookmark(false);
      return;
    }
    BrowserDB.getBookmarks( function( bmList ) {
      for( var i = 0 ; i < bmList.length ; i++ ) {
        if( bmList[i].uri == tab.url ) {
          console.log('url is already registered...');
          // Remote.sendSmaphoAddBookmark(true);
          return;
        }
      }
      //Bookmark maximum number check
      if( bmList.length >= Awesomescreen.BOOKMARK_MAX ) {
        console.log('bookmark is already full...');
        // Remote.sendSmaphoAddBookmark(false);
      } else {
        BrowserDB.addBookmark( tab.url, tab.title,
                               Browser.refreshBookmarkButton.bind(Browser)
                             );
        // Remote.sendSmaphoAddBookmark(true);
      }
    });
  }
};

