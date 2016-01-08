'use strict';

/* exported _ */
/* global AuthenticationDialog */
/* global Awesomescreen */
/* global BrowserDB */
/* global BrowserDialog */
/* global connectionHandler */
/* global SearchResult */
/* global SearchUtil */
/* global Settings */
/* global Toolbar */
/* global UrlHelper */

//IFDEF_FIREFOX_SYNC
/* global SyncManagerBridge */
/* global SyncBrowserDB */
//ENDIF_FIREFOX_SYNC

var _ = navigator.mozL10n.get;

var Browser = {

  currentInfo: null,
  info: {},

  DEFAULT_LANG: 'en-US',
  language: null,

  SCREEN_HEIGHT: 1080,
  SCREEN_WIDTH: 1920,
  SIDE_WINDOW_WIDTH: 400,
  MAX_THUMBNAIL_WIDTH: 448, //storage change
  MAX_THUMBNAIL_HEIGHT: 236, //storage change
  //By multiplying 0.8, image of the designated size can be obtained
  DEVICE_RATIO: 0.8,

  MAX_BOOKMARK_LIST: 60,
  MAX_HISTORY_LIST: 60,
  MAX_TOPSITE_LIST: 18,
  MAX_ICON_LIST: 120,

  waitingActivities: [],
  hasLoaded: false,

  // < launch_from >
  // 0 : ICON
  // 1 : BOOKMARK
  // 2 : SMARTPHONE
  // 3 : VOICE_SEARCH
  // 4 : HOME_SEARCH
  // 5 : URL_DIRECT
  launch_from: 0,

  // < category >
  // 1 : web search
  // 2 : image search
  // 3 : movie search
  // 4 : news search
  // 5 : map search
  category: 1,
  categoryTbl: [
    {'category':'internet', 'id': 1},
    {'category':'image'   , 'id': 2},
    {'category':'video'   , 'id': 3},
    {'category':'news'    , 'id': 4},
    {'category':'maps'    , 'id': 5},
  ],

  // < keyword >
  keyword: '',

  // Country code
  DEFAULT_COUNTRY: 'US',
  country: null,

  // color bar
  colorBar: null,

  // start page url
  start_page_url: '',

  // tabcount
  tabCounter: 0,

  // private browsing
  privateBrowsing: false,

  cursorMode: true,

  // auto scroll cursor direction
  direction: null,

  returnApp: null,
  returnOpt: null,

  // ASR jump mode
  asrJumpMode: false,

  // Suspend flag
  isSuspend: false,

  // tv info
  tuner: null,
  tvStore: null,
  lastSource: null,
  inputs: null,

  /**
   * Debug
   */
  DEBUG: false,
  debug: function debug(msg) {
    if (this.DEBUG) {
      var output = '##### [DEBUG BROWSER] ##### : ' + msg;
      console.log(output);
    }
  },

  //
  // Initialize
  //
  init: function browser_init() {
    // Get elements
    this.getAllElements();
    this.isSuspend = false;

    // key hook
    document.addEventListener('keydown', this.keyHook.bind(this), true);
    // mouse move
    document.addEventListener('mousemove', this.mouseMove.bind(this), false);
    // key press
    document.addEventListener('keypress', this.keypress.bind(this), true);


    // init bookmark dialog
    Awesomescreen.init();

    // tv info
    this.tvStore = window.navigator.panaSystem.tvstore;
    window.navigator.inputPortManager.getInputPorts().then(inputs => {
      Browser.inputs = inputs;
    });

    // init database
    BrowserDB.init((function() {
      // init screen mode(side, full)
      this.initScreenMode();

      // init database MaxNum Check
      this.initIdbCheck();

      // XXX: Remove country dependency here.
      // get Country
      this.getCountry((function() {
        // get Language
        this.getLanguage();
        // get color bar
        this.getColorBar();
        // init search util
        this.initSearchUtil();
        // init settings list
        Settings.init();
        // init ifilter list
        Ifilter.init();
        // init Toolbar
        Toolbar.init();

        BrowserDB.getBookmarks(this.populateBookmarks.bind(this));

        // init create
        this.selectInfo(this.createIframe(this.start_page_url));

        // init tab setting
        Awesomescreen.isTabSetting();

        // start IAC handler
        connectionHandler.activate();
      }).bind(this));
    }).bind(this));

    // init ASR
    this.initAsr();

    // init authentication dialog
    AuthenticationDialog.init();

    // init dialog
    BrowserDialog.init();

    // init SearchResult
    SearchResult.init();

//IFDEF_FIREFOX_SYNC
    SyncBrowserDB.init();
//ENDIF_FIREFOX_SYNC

    if (this.waitingActivities.length) {
      this.waitingActivities.forEach(this.handleActivity, this);
    }
    this.hasLoaded = true;
  },

  mouseMove: function browser_mouseMove(ev) {
    if(this.asrJumpMode) {
      this.stopAsrJumpMode();
    }

    if(Toolbar.sidebarButtonBlock.dataset.fade == 'true') {
      Toolbar.sidebarButtonBlock.dataset.fade = 'false';
    }

    var rangeX = (Browser.sideBlock.dataset.sidebar == 'true')? 400: 0;
    if(ev.clientX == 0) {
      this.startScroll('left');
    } else if(ev.clientX == 1919) {
      this.startScroll('right');
    } else if(ev.clientY == 0 && ev.clientX >= rangeX) {
      this.startScroll('up');
    } else if(ev.clientY == 1079 && ev.clientX >= rangeX) {
      this.startScroll('down');
    } else {
      this.stopScroll();
    }
    if(Awesomescreen.pointerImg.style.display == 'block') {
      Awesomescreen.pointerImg.style.display = 'none';
      document.activeElement.blur();
    }

    if( Awesomescreen.isDisplayed() ) {
      Awesomescreen.blurFlag = true;
      if( Awesomescreen.bmtitleArea.classList.contains('exfocus') ) {
        Awesomescreen.bmtitleArea.classList.remove('exfocus');
      }
    }

    if( Awesomescreen.isFocusCheck() ) {
      document.activeElement.blur();
    }

    if( BrowserDialog.isDisplayed() ) {
      Awesomescreen.pointerImg.style.display = 'none';
      if(document.activeElement.nodeName != 'INPUT') {
        document.activeElement.blur();
      }
      if( BrowserDialog.browserDialogInput.classList.contains('exfocus') ) {
        BrowserDialog.browserDialogInput.classList.remove('exfocus');
      }
    }
    if( AuthenticationDialog.isDisplayed() ) {
      Awesomescreen.pointerImg.style.display = 'none';
      if(document.activeElement.nodeName != 'INPUT') {
        document.activeElement.blur();
      }
      if( AuthenticationDialog.httpAuthenticationUsername.classList.contains('exfocus') ) {
        AuthenticationDialog.httpAuthenticationUsername.classList.remove('exfocus');
      }
      if( AuthenticationDialog.httpAuthenticationPassword.classList.contains('exfocus') ) {
        AuthenticationDialog.httpAuthenticationPassword.classList.remove('exfocus');
      }
    }
    if( Settings.isDialogHomepageDisplayed() ) {
      Awesomescreen.pointerImg.style.display = 'none';
      if(document.activeElement.nodeName != 'INPUT') {
        document.activeElement.blur();
      }
      if( Settings.settingsDialogHomepageInput.classList.contains('exfocus') ) {
        Settings.settingsDialogHomepageInput.classList.remove('exfocus');
      }
    }
    if( Settings.isDialogSearchDisplayed() ) {
      Awesomescreen.pointerImg.style.display = 'none';
      document.activeElement.blur();
    }
    if( Ifilter.isDialogFuncDisplayed() ) {
      Ifilter.blurFlag = true;
      Awesomescreen.pointerImg.style.display = 'none';
      document.activeElement.blur();
    }
  },

  startScroll: function browser_startScroll(direction) {
    // Timeout when no key operation
    if(this.mouseMoveTID) {
      clearTimeout(this.mouseMoveTID);
    }
    this.mouseMoveTID = setTimeout(function(){
      clearTimeout(this.mouseMoveTID);
      Browser.stopScroll();
    }, 100);

    if(this.direction != direction) {
      this.direction = direction;
      var scroll_val = (direction == 'up' || direction == 'left')? -10: 10;
      var scroll_cnt = 0;
      var add_val = 0;

      var scroll_run = (function() {
        if(scroll_cnt < 13){
          scroll_cnt++;
          add_val += 5;
          if(scroll_val > 0){
            scroll_val += add_val;
          }else{
            scroll_val -= add_val;
          }
        }
        if(Browser.direction == 'up' || Browser.direction == 'down'){
          Browser.currentInfo.dom.scrollBy(0, scroll_val);
        }else{
          Browser.currentInfo.dom.scrollBy(scroll_val, 0);
        }
      });

      // first run
      //scroll_run();

      if(this.scrollingTID) {
        clearInterval(this.scrollingTID);
      }
      // scrolling timer set
      this.scrollingTID = setInterval(function(){
        scroll_run();
      }, 200);
    }
  },

  stopScroll: function browser_stopScroll() {
    this.direction = 'default';
    if(this.scrollingTID) {
      clearInterval(this.scrollingTID);
    }
  },

  /**
   * init screen mode
   */
  initScreenMode: function browser_initScreenMode() {
    BrowserDB.db.open((function() {
      BrowserDB.getSetting('screen_mode', ((function(result) {
        if(result && result == 'full') {
          // Full screen
          Browser.sideBlock.dataset.sidebar = 'false';
          Browser.mainBlock.dataset.sidebar = 'false';
          // hidden tv
          var video = document.getElementById('tv');
          video.mozSrcObject = null;
        } else {
          // Disp side screen
          Browser.sideBlock.dataset.sidebar = 'true';
          Browser.mainBlock.dataset.sidebar = 'true';
          // init tv
          Browser.initTV();
          if(!result || result != 'side') {
            // save screen mode
            BrowserDB.updateSetting('side', 'screen_mode');
          }
        }
      }).bind(this)));
    }).bind(this));
  },

 /**
  * init database MaxNum Check
  */
  initIdbCheck: function browser_initIdbCheck() {

    // indexedDB MaxNum Check Type
    var checkTypeTbl = [
      {'type':'bookmarks', 'maxNum': Browser.MAX_BOOKMARK_LIST},
      {'type':'visits'   , 'maxNum': Browser.MAX_HISTORY_LIST},
      {'type':'places'   , 'maxNum': Browser.MAX_TOPSITE_LIST},
      {'type':'icons'    , 'maxNum': Browser.MAX_ICON_LIST}
    ];

    for (var i=0; i < checkTypeTbl.length; i++) {
      if(checkTypeTbl[i].type != 'icons') {
        BrowserDB.db.idbMaxCheck(checkTypeTbl[i].type, checkTypeTbl[i].maxNum);
      }else{
        BrowserDB.db.iconMaxCheck(checkTypeTbl[i].maxNum);
      }
    }
  },


 /**
  * Get default data generated at build time.
  * Invoked by BrowserDB.
  */
  getDefaultData: function browser_getConfData(callback) {
    // TODO
    callback(null);
  },
  getConfigurationData: function browser_getDefaultData(variant, callback) {
    // TODO
    callback(null);
  },

  /**
   * init search util
   */
  initSearchUtil: function browser_initSearchUtil() {
    SearchUtil.init(this.country, (function(){
      // display search bar engine name
      Toolbar.setSearchEngine();
    }).bind(this));
  },

  /**
   * init TV
   */
  initTV: function browser_initTV() {
    var self = this;
    var tv = window.navigator.mozTV;
    var video = document.getElementById('tv');

    if (!tv) {
      console.log('===== failed to get mozTV. check permission. =====');
      return;
    }
    video.focus();

    tv.getTuners().then(function onsuccess(tuners) {
      if (tuners.length > 0) {
        self.tuner = tuners[0];
        video.mozSrcObject = tuners[0].stream;
        var source = JSON.parse(self.tvStore.get('lastMainSource'));
        var input = self.getInputPort(source.type, source.idx);
        self.lastSource = source.type;
        if (input) {
          self.fireInputChangedEvent(input, source.idx);
        } else {
          self.fireChannelChangedEvent(self.tuner.channel);
        }
        self.tvStore.addObserver('lastMainSource',
          self.onSourceChanged.bind(self));
        self.tuner.addEventListener('channelchanged',
          self.onChannelChanged.bind(self), false);
      }
    }, function onerror(error) {
      console.log('===== failed to getTuners. ', error);
    });
  },

  setTvInfo: function browser_setTvInfo(param) {
    if(param.name) {
      switch(param.inputType) {
      case 'arib-terr':
        this.tvInfo.textContent = _('LT_CH_DIGITAL') + ' ' + param.name;
        break;
      case 'arib-bs':
        this.tvInfo.textContent = _('LT_CH_BS') + ' ' + param.name;
        break;
      case 'arib-cs1':
        this.tvInfo.textContent = _('LT_CH_CS1') + ' ' + param.name;
        break;
      case 'arib-cs2':
        this.tvInfo.textContent = _('LT_CH_CS2') + ' ' + param.name;
        break;
      case 'input':
        this.tvInfo.textContent = _('LT_INPUT') + ' ' + param.name;
        break;
      default:
        this.tvInfo.textContent = param.name;
        break;
      }
    } else if(param.nameLT) {
      this.tvInfo.textContent = _(param.nameLT);
    } else {
      this.tvInfo.textContent = '';
    }
  },
  getInputPort: function browser_getInputPort(type, port) {
    if (this.inputs) {
      var id = type + '://' + port;
      for (var i = 0; i < this.inputs.length; i++) {
        if (this.inputs[i].id == id) {
          return this.inputs[i];
        }
      }
    }
    return false;
  },
  fireInputChangedEvent: function browser_fireInputChangedEvent(input, port) {
    var param = {};
    if (input) {
      var names = this.getInputLabel(input.type, port);
      param.hash = input.id;
      param.name = names.name;
      param.nameLT = names.nameLT;
      param.inputType = input.type;
      if (input.type === 'av') {
        if (input.isScartInput) {
          param.inputSubType = 'scart';
        }
        else {
          param.inputSubType = input.avInputSrc;
        }
      }
      else {
        param.inputSubType = null;
      }
    }
    this.setTvInfo(param);
  },
  fireChannelChangedEvent: function browser_fireChannelChangedEvent(channel) {
    var param = {};
    if (channel && channel.channelId) {
      param.hash = channel.channelId;
      param.name = channel.number + ' ' + channel.sname;
      param.nameLT = null;
      param.inputType = channel.sourceType;
      param.inputSubType = null;
    }
    this.setTvInfo(param);
  },
  onSourceChanged: function browser_onSourceChanged() {
    if (this.tvStore) {
      var source = JSON.parse(this.tvStore.get('lastMainSource'));
      var input = this.getInputPort(source.type, source.idx);
      this.lastSource = source.type;
      if (input) {
        this.fireInputChangedEvent(input, source.idx);
      }
    }
  },
  onChannelChanged: function browser_onChannelChanged(event) {
    var channel = event.channel;
    this.fireChannelChangedEvent(channel);
  },
  getInputPortNum: function browser_getInputPortNum(type) {
    var num = 0;
    if (this.inputs) {
      var i;
      for (i = 0; i < this.inputs.length; i++) {
        if (this.inputs[i].type === type) {
          num++;
        }
      }
    }
    return num;
  },
  getInputLabel: function browser_getInputLabel(type, port) {
    var id = type + port;
    var labelData = this.tvStore.get('inputLabelName.' + id);
    var portnum = this.getInputPortNum(type);
    var result = {
      name: null,
      nameLT: null
    };

    switch (labelData) {
    case 'LT_VCR':
    case 'LT_DVD':
    case 'LT_CABLE':
    case 'LT_INP_SAT':
    case 'LT_NETWORK':
    case 'LT_PVR':
    case 'LT_GAME':
    case 'LT_STB':
    case 'LT_BD':
    case 'LT_TERR':
    case 'LT_USER_INPUT':
    case 'LT_DVD_REC':
    case 'LT_DVR':
    case 'LT_HOME_THTR':
    case 'LT_RECEIVER':
    case 'LT_COMPUTER':
    case 'LT_MEDIA_CTR':
    case 'LT_MEDIA_EXT':
    case 'LT_CAMERA':
    case 'LT_MONITOR2':
    case 'LT_AUX':
    case 'LT_OTHER2':
    case 'LT_PC':
    case 'LT_DVD1':
    case 'LT_DVD2':
    case 'LT_DISK':
    case 'LT_DIGA':
    case 'LT_HDD_RECORDER':
      result.nameLT = labelData;
      break;
    case 'LT_DEFAULT':
    case 'LT_LABEL_NOT_USED':
    case 'LT_TITEL_NO_DISPLAY':
      {
        switch (id) {
        case 'hdmi1':
          if (portnum === 1) {
            result.nameLT = 'LT_HDMI';
          } else {
            result.nameLT = 'LT_HDMI1';
          }
          break;
        case 'hdmi2':
          result.nameLT = 'LT_HDMI2';
          break;
        case 'hdmi3':
          result.nameLT = 'LT_HDMI3';
          break;
        case 'hdmi4':
          result.nameLT = 'LT_HDMI4';
          break;
        case 'av1':
          if (portnum === 1) {
            result.nameLT = 'LT_AV_COMPONENT';
          } else {
            result.nameLT = 'LT_AV1_COMPONENT1';
          }
          break;
        case 'av2':
          result.nameLT = 'LT_AV2_COMPONENT2';
          break;
        case 'displayport1':
          result.nameLT = 'LT_DISPLAYPORT';
          break;
        default:
          result.nameLT = 'LT_DEFAULT'; // error case
          break;
        }
      }
      break;
    default:
      result.name = labelData; // free input
      break;
    }
    return result;
  },

  /**
   * init ASR
   */
  initAsr: function browser_initAsr() {
    if(!window.navigator.mozAsr){
      console.log('***** Voice Control API (ASR) is Disabled *****');
      return;
    }
    window.navigator.mozAsr.onmicstart = this.startAsr.bind(this);
    window.navigator.mozAsr.onmicend = this.endAsr.bind(this);
    window.navigator.mozSetMessageHandler('asr-event',
        this.handleAsrEvent.bind(this));
  },
  // Start ASR
  startAsr: function browser_startAsr() {
    this.debug('***** Voice Control API (ASR) START *****');
  },
  // End ASR
  endAsr: function browser_endAsr() {
    this.debug('***** Voice Control API (ASR) END *****');
  },

  /**
   * Handle ASR Event
   */
  handleAsrEvent: function broser_handleAsrEvent(message) {
    if(message.appli_id != 'browser') {
      return;
    }

    // Hide All
    if(Settings.isDisplayed()) {
      Settings.hide();
    }
    if(SearchResult.isDisplayed()) {
      SearchResult.hide();
    }
    if(BrowserDialog.isDisplayed()) {
      BrowserDialog.cancelDialog();
    }
    if(AuthenticationDialog.isDisplayed()) {
      AuthenticationDialog.cancelHandler();
    }
    if(Awesomescreen.isDisplayedList()) {
      Awesomescreen.listHidden();
    }
    if(Awesomescreen.isDisplayedDialog()) {
      Awesomescreen.dialogHidden();
    }
    if(Awesomescreen.isDisplayedTab()) {
      Awesomescreen.tabviewHidden();
    }

    var param = message.param;

    if(param.action) {
      if(Awesomescreen.isDisplayedTop()) return;
      switch(param.action.id) {
      case 'previous_page':
        if(this.asrJumpMode) {
          this.stopAsrJumpMode();
        }
        Toolbar.goBack();
        break;
      case 'next_page':
        if(this.asrJumpMode) {
          this.stopAsrJumpMode();
        }
        Toolbar.goForward();
        break;
      case 'scroll_up':
      case 'page_up':
        Browser.currentInfo.dom.scrollBy(0, -500);
        break;
      case 'scroll_down':
      case 'page_down':
        Browser.currentInfo.dom.scrollBy(0, 500);
        break;
      case 'scroll_left':
      case 'page_left':
        Browser.currentInfo.dom.scrollBy(-500, 0);
        break;
      case 'scroll_right':
      case 'page_right':
        Browser.currentInfo.dom.scrollBy(500, 0);
        break;
      case 'pin_to_home':
        if(this.asrJumpMode) {
          this.stopAsrJumpMode();
        }
        Awesomescreen.pinToHome();
        break;
      case 'zoom_in':
        Toolbar.clickZoomButtonBlock();
        break;
      case 'zoom_out':
        Toolbar.zoomOut();
        break;
      case 'add_bookmark':
        if(this.asrJumpMode) {
          this.stopAsrJumpMode();
        }
        Browser.addBookmark();
        break;
      case 'reload':
        if(this.asrJumpMode) {
          this.stopAsrJumpMode();
        }
        Toolbar.clickAddressButton();
       break;
      case 'change_screen':
        Toolbar.showHideSidebar();
        break;
      case 'private_browsing':
        if(this.asrJumpMode) {
          this.stopAsrJumpMode();
        }
        Browser.handlePrivateBrowsing();
        break;
      case 'url_jump':
        if(Awesomescreen.isDisplayedTop()) return;
        if(param.keywords) {
          if(this.currentInfo.dom.highlight) {
            this.currentInfo.dom.highlight(false);
            this.currentInfo.dom.highlight(true, param.keywords[0].word, true);
            this.asrJumpMode = true;
            this.switchCursorMode(false);
          }
        }
        break;
      default:
        this.debug('asr message unknown id = ', param.action.id);
        break;
      }
    } else if(param.browser_param) {
      if(this.asrJumpMode) {
        this.stopAsrJumpMode();
      }
      switch(param.browser_param.id) {
      case 'internet':
      case 'image':
      case 'video':
      case 'news':
      case 'maps':
      //case 'youtube':
        this.keywordSearch(param);
        break;
      default:
        this.debug('asr message unknown id = ', param.browser_param.id);
        break;
      }
    } else if(param.keywords) {
      if(this.asrJumpMode) {
        this.stopAsrJumpMode();
      }
      this.keywordSearch({
          'browser_param': { 'id': 'internet' },
          'keywords': [
              { 'word': param.keywords[0].word }
          ]
      });
    } else {
      this.debug('asr unknown message');
    }
  },
  getLanguageUrl: function browser_getLanguageUrl() {
    var url_str = '';
    // processing of the engine
    var engineName = SearchUtil.getCurrentEngineName();
    var low = engineName.toLowerCase();
    switch(low){
      case "google":
        if((this.language.substr(0,2) == "pt") ||
           (this.language.substr(0,2) == "zh")){
          url_str = "&hl=" + this.language;
        }else{
          url_str = "&hl=" + this.language.substr(0,2);
        }
        break;
      case "bing":
        url_str = "&Market=" + this.language;
        break;
      case "baido":
        break;
      default:
        break;
    }
    return url_str;
  },
  keywordSearch: function browser_keywordSearch(param) {
    var action_id = {
      'internet': 0, 'image': 1, 'video': 2, 'news': 3, 'maps': 4, 'youtube': 5,
    };
    var index = (param.browser_param.id in action_id)?
        action_id[param.browser_param.id]: 0;
    var urlStr = SearchUtil.getCurrentSearchUrl();
    var url = urlStr[index];
    if(param.keywords) {
      url += encodeURIComponent(param.keywords[0].word);
    } else {
      url = url.replace(/&q=/g, '');
    }
    url += this.getLanguageUrl();
    this.debug('search url = ' + url);
    this.navigate(url);
  },

  /**
   * Set cursor pan mode.
   */
  setCursorPanMode: function browser_setCursorPanMode(mode) {
    this.mainBlock.dataset.mode = mode;
  },

  /**
   * Get cursor pan mode.
   */
  getCursorPanMode: function browser_getCursorPanMode() {
    return this.mainBlock.dataset.mode;
  },

  /**
   * Init Start Browsing
   */
  initStartBrowsing: function browser_initStartBrowsing() {
    if( this.currentInfo.url == null ) return;
    Toolbar.initStartBrowsing();
  },

  /**
   * Refresh state of Back Forward buttons.
   */
  refreshBackForwardButtons: function browser_refreshBackForwardButtons() {
    // When handling window.open we may hit this code
    // before canGoBack etc has been applied to the frame
    if (!this.currentInfo.dom.getCanGoForward){
      return;
    }

    Toolbar.backButton.classList.remove('disable');

    this.currentInfo.dom.getCanGoForward().onsuccess = (function(ev) {
      Toolbar.forwardButtonBlock.classList.remove('disable');
      if(!ev.target.result){
        Toolbar.forwardButtonBlock.classList.add('disable');
      }
    }).bind(this);
  },

  /**
   * Refresh state of add bookmark button based on current info URL.
   */
  refreshBookmarkButton: function browser_refreshBookmarkButton() {
    if( this.currentInfo.url == null ) {
      Toolbar.bookmarkButton.dataset.isbookmark = false;
      return;
    }
    BrowserDB.getBookmark(this.currentInfo.url, (function(bookmark) {
      if(bookmark) {
        Toolbar.bookmarkButton.dataset.isbookmark = true;
        Toolbar.bookmarkButtonBlock.dataset.tips = 'WB_LT_W_BOOKMARK_DELETE';
      } else {
        Toolbar.bookmarkButton.dataset.isbookmark = false;
        Toolbar.bookmarkButtonBlock.dataset.tips = 'WB_LT_TIPS_BOOKMARK_THIS_PAGE';
      }
    }).bind(this));
  },

  /**
   * Refresh state of scroll cursor.
   */
  refreshScrollCursor: function browser_refreshScrollCursor() {
    this.scrollU.classList.remove('disable');
    this.scrollD.classList.remove('disable');
    this.scrollL.classList.remove('disable');
    this.scrollR.classList.remove('disable');
    if (!this.currentInfo.url) {
      this.scrollU.classList.add('disable');
      this.scrollD.classList.add('disable');
      this.scrollL.classList.add('disable');
      this.scrollR.classList.add('disable');
      return;
    }
  },

  refreshBrowserParts: function browser_refreshBrowserParts() {
    Browser.refreshBackForwardButtons();
    Browser.refreshBookmarkButton();
    Browser.refreshScrollCursor();
    if(( Browser.currentInfo.loading ) && ( !Browser.isSuspend )) {
      Toolbar.showLoadingIcon();
    } else {
      Toolbar.hiddenLoadingIcon();
    }
  },

  // Add Bookmark Current url
  addBookmark: function browser_addBookmark(ev) {
    if(Toolbar.bookmarkButton.classList.contains('disable')){
      return;
    }

    if(ev) {
      // Can be canceled
      ev.preventDefault();
    }
    if (!this.currentInfo.url || UrlHelper.isNotURL(this.currentInfo.url)){
      return;
    }

    //and the process proceeds to awesomescreen 20150106 update
    BrowserDB.getBookmarks(Awesomescreen.addBookmarkSite.bind(this));
  },
  // Bookmark animation end
  bookmarkButtonAnimeEnd: function browser_bookmarkButtonAnimeEnd(ev) {
    Toolbar.bookmarkButtonAnime.dataset.anime = 'end';
    Toolbar.showBookmarksButtonAnime.dataset.anime = 'end';
    Toolbar.showBookmarksButton.style.display = 'block';
  },

  /**
   * CamelCase (xxx_yyy -> xxxYyy)
   */
  toCamelCase: function toCamelCase(str) {
    return str.replace(/\-(.)/g, function replacer(str, p1) {
      return p1.toUpperCase();
    });
  },

  /**
   * Get All Elements (from id)
   */
  getAllElements: function browser_getAllElements() {
    var elementIDs = [
      'fade-base',

      'side-block', 'tv-block', 'tv-info',
      'main-block',
      'web-block',

      'scroll-u', 'scroll-d', 'scroll-l', 'scroll-r',
    ];

    // Loop and add element with camel style name to Modal Dialog attribute.
    elementIDs.forEach(function createElementRef(name) {
      this[this.toCamelCase(name)] = document.getElementById(name);
    }, this);
  },

  /**
   * Each browser gets their own listener
   */
  handleBrowserEvent: function browser_handleBrowserEvent(tab) {
    return (function(evt) {
      switch (evt.type) {

      case 'mozbrowsermemorypressure':
        this.debug('mozbrowsermemorypressure[' + tab.id + ']');
        if (tab.alive && tab.dom.style.visibility === 'hidden') {
          tab.dom.parentNode.removeChild(tab.dom);
          tab.alive = false;
        }
        break;

      case 'mozbrowserloadstart':
        this.debug('mozbrowserloadstart[' + tab.id + ']');
        evt.preventDefault();
        tab.title = null;
        tab.iconUrl = null;
        tab.loading = true;
        tab.dom.blur();
         BrowserDB.browserTitle = null;
        if(( this.currentInfo.id === tab.id ) && ( !this.isSuspend )) {
          Toolbar.showLoadingIcon();
        }
        if(( tab.zoomInit ) && ( tab.dom.zoom )) {
          tab.zoomInit = false;
          tab.dom.zoom(Toolbar.getDefaultZoomScale());
        }
        if( tab.smaphoSetUrl ) {
          if( tab.smaphoAddBookmark ) {
            Remote.sendSmaphoAddBookmark(true);
          } else {
            Remote.sendSmaphoSetUrl(true);
          }
        }
        if(this.asrJumpMode) {
          this.stopAsrJumpMode();
        }
        break;

      case 'mozbrowserloadend':
        this.debug('mozbrowserloadend[' + tab.id + ']');
        evt.preventDefault();
        if(( tab.zoomInit ) && ( tab.dom.zoom )) {
          tab.zoomInit = false;
          tab.dom.zoom(Toolbar.getDefaultZoomScale());
        } else if( tab.dom.zoom ) {
          if( tab.zoom ) {
            Toolbar.setZoomScale(tab.zoom);
            tab.dom.zoom(Toolbar.getZoomScale());
          } else {
            tab.dom.zoom(Toolbar.getDefaultZoomScale());
          }
        }
        tab.loading = false;
        this.refreshBrowserParts();
        this.initStartBrowsing();
        if( tab.smaphoSetUrl ) {
          tab.smaphoSetUrl = false;
          if( tab.smaphoAddBookmark ) {
            tab.smaphoAddBookmark = false;
            Remote.addBookmark(tab);
          }
        }

        // get to favicon
        if( (tab.url != null) && (tab.url != "") && (!tab.iconUrl) ) {
            var a = document.createElement('a');
            a.href = tab.url;
            var iconUrl = a.protocol + '//' + a.hostname + '/' + 'favicon.ico';
            BrowserDB.setAndLoadIconForPage(tab.url, iconUrl);

//IFDEF_FIREFOX_SYNC
            // if data sync enabled, update icon info to data sync indexedDB
            SyncManagerBridge.getInfo().then(message => {
              if(message.state === 'enabled') {
                SyncBrowserDB.setAndLoadIconForPage(tab.url, iconUrl);
              }
            });
//ENDIF_FIREFOX_SYNC

          }

        // Capture screenshot for tab thumbnail
        if (tab.dom.getScreenshot) {
          tab.dom.getScreenshot(this.MAX_THUMBNAIL_WIDTH * this.DEVICE_RATIO,
                                this.MAX_THUMBNAIL_HEIGHT * this.DEVICE_RATIO).onsuccess =
          (function(e) {
            tab.screenshot = e.target.result;
            BrowserDB.updateScreenshot(tab.url, tab.screenshot);
          }).bind(this);
        }
        break;

      case 'mozbrowserlocationchange':
        this.debug('mozbrowserlocationchange[' + tab.id + ']');
        evt.preventDefault();
        if (evt.detail === 'about:blank') {
          return;
        }
        if( tab.loading ) tab.dom.blur();
        tab.url = evt.detail;
        if( !tab.pvtBrowse ) {
          BrowserDB.addVisit(tab.url);
        }
        if( this.currentInfo.id === tab.id ) {
          Toolbar.setUrlBar(tab.url);
          this.refreshBookmarkButton();
        }
        break;

      case 'mozbrowsertitlechange':
        this.debug('mozbrowsertitlechange[' + tab.id + ']');
        evt.preventDefault();
        tab.dom.blur();
        if (evt.detail) {
          tab.title = evt.detail;
          if( !tab.pvtBrowse ) {
            BrowserDB.setPageTitle(tab.url, tab.title);
          }
        }
        break;

      case 'mozbrowsericonchange':
        this.debug('mozbrowsericonchange[' + tab.id + ']');
        evt.preventDefault();
        if (evt.detail.href && evt.detail.href != tab.iconUrl) {
          tab.iconUrl = evt.detail.href;
          // TODO: Pick up the best icon
          // based on evt.detail.sizes and device size.
          BrowserDB.setAndLoadIconForPage(tab.url, tab.iconUrl);

//IFDEF_FIREFOX_SYNC
          // if data sync enabled, update icon info to data sync indexedDB
          SyncManagerBridge.getInfo().then(message => {
            if(message.state === 'enabled') {
              SyncBrowserDB.setAndLoadIconForPage(tab.url, tab.iconUrl);
            }
          });
//ENDIF_FIREFOX_SYNC
        }
        break;

      case 'mozbrowsercontextmenu':
        this.debug('mozbrowsercontextmenu[' + tab.id + ']');
        evt.preventDefault();
        break;

      case 'mozbrowsersecuritychange':
        this.debug('mozbrowsersecuritychange[' + tab.id + ']');
        evt.preventDefault();
        tab.security = evt.detail;
        if( this.currentInfo.id === tab.id ) {
          this.updateSecurityIcon();
        }
        break;

      case 'mozbrowseropenwindow':
        this.debug('mozbrowseropenwindow[' + tab.id + ']');
        evt.preventDefault();
        if( tab.pvtBrowse ) {
          this.privateBrowsing = true;
        }
        tab.dom.blur();
        Awesomescreen.openNewTab(evt);
        break;

      case 'mozbrowserclose':
        this.debug('mozbrowserclose[' + tab.id + ']');
        evt.preventDefault();
        this.handleCrashed(tab);
        break;

      case 'mozbrowserusernameandpasswordrequired':
        this.debug('mozbrowserusernameandpasswordrequired[' + tab.id + ']');
        if( evt.detail.isProxy && Ifilter.currentFunc == Ifilter.FUNC_ON
            && Ifilter.user_id != '' ){
          console.log('ifilter proxy auth [' + Ifilter.user_id + ']');
          evt.detail.authenticate( Ifilter.user_id, '' );
        }
        else {
          tab.loading = false;
          this.refreshBrowserParts();
          AuthenticationDialog.handleEvent(evt, tab.id);
        }
        break;

      case 'mozbrowsershowmodalprompt':
        this.debug('mozbrowsershowmodalprompt[' + tab.id + ']');
        switch( evt.detail.promptType ) {
          case 'alert' :
            BrowserDialog.createDialog('alert', evt);
            break;
          case 'prompt' :
            BrowserDialog.createDialog('prompt', evt);
            break;
          case 'confirm' :
            BrowserDialog.createDialog('confirm', evt);
            break;
        }
        break;

      case 'mozbrowsererror':
        this.debug('mozbrowsererror[' + tab.id + ']:'+JSON.stringify(evt.detail));
        evt.preventDefault();
        tab.loading = false;
        this.refreshBrowserParts();
        if( tab.smaphoSetUrl ) {
          tab.smaphoSetUrl = false;
          if( tab.smaphoAddBookmark ) {
            tab.smaphoAddBookmark = false;
            Remote.sendSmaphoAddBookmark(false);
          } else {
            Remote.sendSmaphoSetUrl(false);
          }
        }
        if (evt.detail.type === 'fatal') {
          if( Awesomescreen.isDisplayedTab() ) Awesomescreen.tabviewHidden();
          this.handleCrashed(tab);
        }
        setTimeout( function() {
          BrowserDialog.createDialog('error_browser', evt);
        }, 800);
        break;

      case 'mozbrowserasyncscroll':
        this.debug('mozbrowserasyncscroll[' + tab.id + ']');
        break;

      default:
        this.debug('other event = ' + evt.type);
        break;
      }
    }).bind(this);
  },

  handleCrashed: function browser_handleCrashed(tab) {
    if( tab.id == this.currentInfo.id ) {
      var tabCount = Object.keys(this.info).length;
      var tabIds = Object.keys(this.info);
      for( var i = 0 ; i < tabCount ; i++ ) {
        if( tab.id == this.info[tabIds[i]].id ) {
          if( i + 1 < tabCount ) {
            this.selectInfo(tabIds[i+1]);
            this.refreshBrowserParts();
            this.switchVisibility(this.currentInfo, true);
          } else if( i - 1 >= 0 ) {
            this.selectInfo(tabIds[i-1]);
            this.refreshBrowserParts();
            this.switchVisibility(this.currentInfo, true);
          }
        }
      }
    }
    var id = tab.id;
    this.webBlock.removeChild(tab.dom);
    delete tab.dom;
    delete this.info[id];
    if( Object.keys(this.info).length == 0 ) {
      Awesomescreen.createAddNewTab();
    } else {
      Awesomescreen.updateTabsCount();
    }
  },

  /**
   * Add Browser Event (iframe)
   */
  bindBrowserEvents: function browser_bindBrowserEvents(iframe, tab) {
    var browserEvents = ['loadstart', 'loadend', 'locationchange',
                         'titlechange', 'iconchange', 'contextmenu',
                         'securitychange', 'openwindow', 'close',
                         'showmodalprompt', 'error', 'asyncscroll',
                         'usernameandpasswordrequired', 'memorypressure'];
    browserEvents.forEach(function attachBrowserEvent(type) {
      iframe.addEventListener('mozbrowser' + type,
                              this.handleBrowserEvent(tab));
    }, this);
  },

  /**
   * Create Iframe (browser page)
   */
  createIframe: function browser_createIframe(url, rcvIframe, info) {
    var iframe = null;
    if( !rcvIframe ) {
      iframe = document.createElement('iframe');
    } else {
      iframe = rcvIframe;
    }
    iframe.setAttribute('mozbrowser', true);
    iframe.setAttribute('mozallowfullscreen', true);
    iframe.classList.add('browser-tab');
    iframe.setAttribute('remote', 'true');
    if( this.privateBrowsing ) {
      iframe.setAttribute('mozprivatebrowsing', 'true');
    }
    if (url) {
      iframe.setAttribute('src', url);
    }
    if (info) {
      info.dom = iframe;
    } else {
      info = {
        id: 'tab' +  ('000' + this.tabCounter++).slice(-3),
        dom: iframe,
        url: url || null,
        title: null,
        screenshot: null,
        pvtBrowse: this.privateBrowsing,
        zoom: Toolbar.defaultZoomScale,
        zoomInit: false,
        security: null,
        loading: false,
        alive: true,
        smaphoSetUrl: false,
        smaphoAddBookmark: false,
        timestamp: new Date().getTime()
      };
    }
    Toolbar.setPrivateBrowsing(this.privateBrowsing);
    this.privateBrowsing = false;

    // Default newly created frames to the background
    var tabCount = Object.keys(this.info).length;
    var tabIds = Object.keys(this.info);
    //Hide other than the selected tab
    for( var i = 0 ; i < tabCount ; i++ ) {
      this.switchVisibility(this.info[tabIds[i]], false);
    }
    this.bindBrowserEvents(iframe, info);
    this.info[info.id] = info;
    this.webBlock.appendChild(iframe);
    this.switchVisibility(info, true);
    if( info.dom.zoom ) {
      info.dom.zoom(Toolbar.getDefaultZoomScale());
    } else {
      info.zoomInit = true;
    }
    return info.id;
  },

  handlePrivateBrowsing: function browser_handlePrivateBrowsing() {
    this.privateBrowsing = true;
    Awesomescreen.createAddNewTab();
  },

  navigate: function browser_navigate(url) {
    if(Awesomescreen.isDisplayedTop()) {
      Awesomescreen.topsiteHidden();
    }
    this.currentInfo.title = null;
    this.currentInfo.url = url;
    this.currentInfo.dom.setAttribute('src', url);
    Toolbar.setZoomScale(this.currentInfo.zoom);
    this.currentInfo.dom.zoom(Toolbar.getZoomScale());
    Toolbar.setUrlBar(url);
  },

  // Get search form input
  getSearchFromInput: function browser_getSearchFromInput(input) {
    var url_str = SearchUtil.getCurrentSearchUrl();
    this.debug("Search Url:"+url_str[0]);
    url_str = url_str[0] + encodeURIComponent(input);
    // get language option
    url_str += this.getLanguageUrl();

    return url_str;
  },

  // Get url form input
  getUrlFromInput: function browser_getUrlFromInput(input) {
    var hasScheme = UrlHelper.hasScheme(input);

    // No scheme, prepend basic protocol and return
    if (!hasScheme) {
      return 'http://' + input;
    }

    return input;
  },

  closeBrowser: function browser_closeBrowser(ev) {
    Remote.close(); // close TCPSocket
    self.close();
  },

  switchVisibility: function browser_switchVisibility(info, visible) {
    if( !info ) return;
    if( visible ) {
      if(info.dom.setVisible) {
        info.dom.setVisible(true);
        info.dom.style.display = 'block';
        info.dom.style.visibility = 'visible';
      }
      if (!info.alive) {
        this.webBlock.appendChild(info.dom);
        info.alive = true;
      }
    } else {
      if(info.dom.setVisible) {
        info.dom.setVisible(false);
        info.dom.style.display = 'none';
        info.dom.style.visibility = 'hidden';
      }
    }
  },

  // dom.setVisible is loaded asynchronously from BrowserElementChildPreload
  // and may require a yield before we call it, we want to make sure to
  // clear any previous call
  setVisibleWrapper: function(info, visible) {
    if (info.setVisibleTimeout) {
      clearTimeout(info.setVisibleTimeout);
    }
    if (info.dom.setVisible) {
      this.switchVisibility(info, true);
      return;
    }
    info.setVisibleTimeout = setTimeout(function() {
      if (info.dom.setVisible) {
        this.switchVisibility(info, true);
      }
    });
  },

  updateSecurityIcon: function browser_updateSecurityIcon() {
    if (!this.currentInfo.security) {
      Toolbar.sslIndicator.name = '';
      return;
    }
    this.debug('updateSecurityIcon:' + this.currentInfo.security.state);
    Toolbar.sslIndicator.name = this.currentInfo.security.state;
  },

  selectInfo: function browser_selectInfo(id) {
    this.currentInfo = this.info[id];
    this.debug('currentInfo = ' + this.currentInfo.id);
    Toolbar.setUrlBar(this.currentInfo.url);
    Toolbar.setPrivateBrowsing(this.currentInfo.pvtBrowse);
    this.updateSecurityIcon();
  },

  variousWindowErase: function browser_variousWindowErase() {
    // various window erase...
    // in the input area focus (= display keyboard)
    if(document.activeElement.nodeName == 'INPUT') {
      document.activeElement.blur();
    }
    if( BrowserDialog ) BrowserDialog.cancelDialog();
    if(( AuthenticationDialog ) && ( AuthenticationDialog.isDisplayed() )) {
      AuthenticationDialog.cancelHandler();
    }
    if( Settings ) Settings.hide();
    if( Ifilter ) Ifilter.hide();
    if( Awesomescreen ) Awesomescreen.allHidden();
    if( SearchResult ) SearchResult.hide();
  },

  /**
   * Show the list of bookmarks.
   *
   * @param {Array} bookmarks List of bookmark data objects.
   */
  populateBookmarks: function browser_populateBookmarks(bookmarks) {
    this.debug( ' launch_from = ' + this.launch_from );
    switch( this.launch_from ) {
      case 0 : // from ICON
        Awesomescreen.selectTopSites();
        this.launch_from = -1;
        break;

      case 1 : // from BOOKMARK(WEBLINK)
        this.launch_from = -1;
        break;

      case 2 : // from SMARTPHONE
        Awesomescreen.selectTopSites();
        this.launch_from = -1;
        break;

      case 3 : // from VOICE_SEARCH
      case 4 : // from HOME_SEARCH
        if(( this.category > 0 ) && ( this.keyword != '' )) {
          var searchList = SearchUtil.getCurrentSearchUrl();
          var url = searchList[ this.category - 1 ] + this.keyword;
          this.debug(' search url = ' + url);
          this.navigate( url );
        }
        this.launch_from = -1;
        break;

      case 5 : // from DIRECT LAUNCH
        var url = this.start_page_url;
        if(( url != null ) && ( url != "" )) {
          this.navigate(url);
        }
        this.launch_from = -1;
        break;
    }
  },

  handleActivity: function browser_handleActivity(activity) {
    // Activities can send multiple names, right now we only handle
    // one so we only filter on types
    switch( activity.source.name ) {
      case 'view':
        switch (activity.source.data.type) {
          case 'url':
            var url = this.getUrlFromInput(activity.source.data.url);
            this.debug(' url = ' + url);
            connectionHandler.openPage(url);
            this.start_page_url = url;
            break;
        }
        break;
      case 'pana_apps_launch':
      case 'pana_apps_launch_inline':
        this.launch_from = activity.source.data.arg.launch_from || 0;
        this.debug( ' launch_from = ' + this.launch_from );
        switch( this.launch_from ) {
          case 0: // from ICON
            this.start_page_url = '';
            if( this.currentInfo ) {
              this.launch_from = -1;
            }
            break;
          case 1: // from BOOKMARK(WEBLINK but not used...)
          case 5: // from URL_DIRECT
            var url = this.getUrlFromInput( activity.source.data.arg.url );
            this.debug( ' url = ' + url );
            this.start_page_url = url;
            if( this.currentInfo ) {
              this.variousWindowErase();
              this.launch_from = -1;
              if(( this.currentInfo.url != null ) && ( this.currentInfo.url != '' )) {
                var evt = new Object();
                evt.detail = { url: url, frameElement: null };
                Awesomescreen.openNewTab(evt);
              } else {
                this.navigate(url);
              }
            }
            break;
          case 2: // SMARTPHONE
            break;
          case 3: // VOICE_SEARCH
          case 4: // HOME_SEARCH
            for (var i=0; i<this.categoryTbl.length; i++) {
              if (this.categoryTbl[i].category == activity.source.data.arg.category || 0) {
                this.category = this.categoryTbl[i].id;
              }
            }
            this.keyword  = activity.source.data.arg.keyword || '';
            this.debug( ' category = ' + this.category +
                         ' , keyword = ' + this.keyword );
            if (activity.source.data.returnApp) {
              this.returnApp = activity.source.data.returnApp;
            }
            if (activity.source.data.returnOpt) {
              this.returnOpt = activity.source.data.returnOpt;
            }
            if( this.currentInfo ) {
              if(( this.category > 0 ) && ( this.keyword != '' )) {
                var searchList = SearchUtil.getCurrentSearchUrl();
                var url = searchList[ this.category - 1 ] + this.keyword;
                this.debug(' search url = ' + url);

                this.variousWindowErase();
                this.launch_from = -1;
                if(( this.currentInfo.url != null ) && ( this.currentInfo.url != '' )) {
                  var evt = new Object();
                  evt.detail = { url: url, frameElement: null };
                  Awesomescreen.openNewTab(evt);
                } else {
                  this.navigate(url);
                }
              }
            }
            break;
        }
        break;
    }
  },

  /**
   * get language (ex:en-US)
   */
  getLanguage: function browser_getLanguage() {
    this.language = this.DEFAULT_LANG;
    var getLang = this.tvStore.get('languageEnv');
    if(getLang){
      var lang = getLang;
      Browser.language = lang;
      this.debug('========== get language:'+getLang);
    } else {
      console.log('========== get language: error');
    }
  },

  /**
   * get country (ex:US)
   */
  getCountry: function browser_getCountry(cb) {
    this.country = this.DEFAULT_COUNTRY;
    var getCountry = this.tvStore.get('countryEnv');
    if(getCountry){
      Browser.country = getCountry;
      Browser.tvBlock.dataset.model = getCountry;
      this.debug('========== get country:'+Browser.country);
    } else {
      console.log('========== get country: error');
    }
    if(cb){
      cb();
    }
  },

  /**
   * get color bar (color bar)
   */
  getColorBar: function browser_getColorBar() {
    var COLOR_KEY_TYPE = {
      'US' : [
        { 'COLOR': 'red',    'KEY_CODE': KeyEvent.DOM_VK_RED    },
        { 'COLOR': 'green',  'KEY_CODE': KeyEvent.DOM_VK_GREEN  },
        { 'COLOR': 'yellow', 'KEY_CODE': KeyEvent.DOM_VK_YELLOW },
        { 'COLOR': 'blue',   'KEY_CODE': KeyEvent.DOM_VK_BLUE   }
      ],
      'JP' : [
        { 'COLOR': 'blue',   'KEY_CODE': KeyEvent.DOM_VK_BLUE   },
        { 'COLOR': 'red',    'KEY_CODE': KeyEvent.DOM_VK_RED    },
        { 'COLOR': 'green',  'KEY_CODE': KeyEvent.DOM_VK_GREEN  },
        { 'COLOR': 'yellow', 'KEY_CODE': KeyEvent.DOM_VK_YELLOW }
      ]
    };

    if(this.country == 'JP'){
      this.colorBar = COLOR_KEY_TYPE['JP'];
    }else{
      this.colorBar = COLOR_KEY_TYPE['US'];
    }
  },
  getColorBarData: function browser_getColorBarData() {
    return this.colorBar;
  },

  switchCursorMode: function browser_switchCursorMode( mode ) {
    this.debug("switch cursor new_mode = " + mode + " , current = " + this.cursorMode);
    if( this.cursorMode == null ) {
      this.cursorMode = mode;
    } else if( this.cursorMode != mode ) {
      this.cursorMode = mode;
    } else {
      return;
    }
    var inputSet = window.navigator.panaInputDeviceSetting;
    Toolbar.clearDragMode();
    if( mode ) {
      inputSet.setMouseMode('enable');
      inputSet.setTouchPadMode('mouse');
      inputSet.setRemoteArrowKeyMode('mouse');
      // inputSet.setKeyboardArrowKeyMode('arrow-key');
    } else {
      inputSet.setMouseMode('disable');
      inputSet.setTouchPadMode('arrow-key');
      inputSet.setRemoteArrowKeyMode('arrow-key');
      // inputSet.setKeyboardArrowKeyMode('arrow-key');
    }
  },

  /**
   * key hook
   */
  preventDefaultForVideo: function browser_preventDefaultForVideo(ev) {
    if(Browser.sideBlock.dataset.sidebar == 'true'){
      switch (ev.keyCode) {
      case KeyEvent.DOM_VK_NET_TD:
      case KeyEvent.DOM_VK_NET_BS:
      case KeyEvent.DOM_VK_NET_CS:
      case KeyEvent.DOM_VK_CHG_INPUT:
      case KeyEvent.DOM_VK_F_CHG_INPUT:
      case KeyEvent.DOM_VK_F4:
      case KeyEvent.DOM_VK_AD_CHANGE:
        ev.preventDefault();
        break;
      default:
        break;
      }
    }
  },
  keyHook: function browser_keyHook(ev) {
    this.debug('kc = ' + ev.keyCode);
    if(this.asrJumpMode) {
      this.asrKeyHook(ev);
      this.preventDefaultForVideo(ev);
      return;
    }

    if(ev.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
      if(Toolbar.toolbarPanel.dataset.menu == 'show') {
        Toolbar.toolbarPanel.dataset.menu = 'hide';
        return;
      }
    }

    if(BrowserDialog.isDisplayed()) {
      BrowserDialog.handleKeyEvent(ev);
      this.preventDefaultForVideo(ev);
      return;
    }
    if(AuthenticationDialog.isDisplayed()) {
      AuthenticationDialog.handleKeyEvent(ev);
      this.preventDefaultForVideo(ev);
      return;
    }
    if(Settings.isDisplayed()) {
      Settings.handleKeyEvent(ev);
      this.preventDefaultForVideo(ev);
      return;
    }
    if(Ifilter.isDisplayed()) {
      Ifilter.handleKeyEvent(ev);
      this.preventDefaultForVideo(ev);
      return;
    }
    if(Awesomescreen.isDisplayed()) {
      if(!Awesomescreen.handleKeyEvent(ev)){
        this.preventDefaultForVideo(ev);
        return;
      }
    }
    if(SearchResult.isDisplayed()) {
      SearchResult.handleKeyEvent(ev);
      this.preventDefaultForVideo(ev);
      return;
    }
    // in the input area focus (= display keyboard)
    if(document.activeElement.nodeName == 'INPUT') {
      this.preventDefaultForVideo(ev);
      return;
    }

    switch (ev.keyCode) {
    case KeyEvent.DOM_VK_F9:
    case this.colorBar[0].KEY_CODE:
      if(Awesomescreen.isDisplayedTop()) return;
      Toolbar.clickModeButtonBlock();
      break;

    case KeyEvent.DOM_VK_F10:
    case this.colorBar[1].KEY_CODE:
      if(this.getCursorPanMode() == 'pan') return;
      Toolbar.clickZoomButtonBlock();
      break;

    case KeyEvent.DOM_VK_F11:
    case this.colorBar[2].KEY_CODE:
      if(this.getCursorPanMode() == 'pan') return;
      Awesomescreen.handleNewTab();
      break;

    case KeyEvent.DOM_VK_F12:
    case this.colorBar[3].KEY_CODE:
      if(this.getCursorPanMode() == 'pan') return;
      Awesomescreen.createAddNewTab();
      break;

    // Touch pad remote control(Star Mark)
    case KeyEvent.DOM_VK_MYBUTTON:
      Awesomescreen.pinToHome();
      break;

    case KeyEvent.DOM_VK_BACK_SPACE:
      // clear drag mode
      Toolbar.clearDragMode();

      Toolbar.goBack();
      break;

    default:
      if(Browser.sideBlock.dataset.sidebar == 'true'){
        // fall through other key events to side TV
        var tv = window.navigator.mozTV;
        if(tv) {
          var video = document.getElementById('tv');
          var curElement = document.activeElement;
          if(curElement != video) {
            video.focus();
            var newEvt = document.createEvent("KeyboardEvent");
            newEvt.initKeyEvent(ev.type, ev.canBubble, ev.cancelable,
                ev.view, ev.ctrlKey, ev.altKey, ev.shiftKey,
                ev.metaKey, ev.keyCode, ev.charCode);
            video.dispatchEvent(newEvt);
          }
        }
        this.preventDefaultForVideo(ev);
      }
      break;
    }
  },


  /**
   * keypress
   */
  keypress: function browser_keypress(ev) {
    if( (Awesomescreen.isDisplayedList()) && (!(Awesomescreen.isDisplayedDialog())) ){
      ev.preventDefault();
      setTimeout( function() {
        if(Awesomescreen.exeflag && (ev.keyCode == KeyEvent.DOM_VK_UP || ev.keyCode == KeyEvent.DOM_VK_DOWN )){
          Awesomescreen.listDialogKeyCont(ev, ev.target);
        }
      }, 100);
    }

 },

  /**
   * ASR key hook(jump mode)
   */
  asrKeyHook: function browser_asrKeyHook(ev) {
    switch (ev.keyCode) {
    case KeyEvent.DOM_VK_UP :
    case KeyEvent.DOM_VK_LEFT :
      if(this.currentInfo.dom.findAgain) {
        this.currentInfo.dom.findAgain(true, true);
      }
      break;
    case KeyEvent.DOM_VK_DOWN :
    case KeyEvent.DOM_VK_RIGHT :
      if(this.currentInfo.dom.findAgain) {
        this.currentInfo.dom.findAgain(false, true);
      }
      break;
    case KeyEvent.DOM_VK_RETURN :
      if(this.currentInfo.dom.selectLink) {
        this.currentInfo.dom.selectLink();
        this.stopAsrJumpMode();
      }
      break;
    case KeyEvent.DOM_VK_BACK_SPACE:
      this.stopAsrJumpMode();
      break;

    default:
      this.stopAsrJumpMode();
      break;
    }
  },

  /**
   * Stop asr jump mode
   */
  stopAsrJumpMode: function browser_stopAsrJumpMode() {
    if(this.currentInfo.dom.highlight) {
      this.currentInfo.dom.highlight(false);
    }
    this.asrJumpMode = false;
    this.switchCursorMode(true);
  },

  /**
   * location hash change event
   */
  hashChange: function browser_hashChange() {
    Browser.debug("location.hash=" + location.hash);
    var new_url = location.hash.replace("#","");
    //URL format check
    var data = new_url.match(/(http|https):\/\/.+/);
    if(data) {
      location.hash = "";
      Browser.debug("new_url=" + new_url);
      Browser.start_page_url = new_url;
      if( !Browser.currentInfo ) {
        Browser.debug("launching page from start_page_url after tab initialized");
        Browser.launch_from = 5;
      } else {
        Browser.variousWindowErase();
        if(( Browser.currentInfo.url != null ) && ( Browser.currentInfo.url != '' )) {
          var evt = new Object();
          evt.detail = { url: new_url, frameElement: null };
          Awesomescreen.openNewTab(evt);
        } else {
          Browser.navigate(new_url);
        }
      }
    }
  }

};

document.addEventListener('visibilitychange', function browser_VisivilityChange() {
  if( document.hidden ) {
    Browser.debug('browser suspend...');
    Browser.isSuspend = true;
    Browser.variousWindowErase();
    if(Browser.sideBlock.dataset.sidebar == 'true'){
      var video = document.getElementById('tv');
      video.mozSrcObject = null;
    }
    if( Browser.currentInfo ) Browser.refreshBrowserParts();
    Remote.suspend();
  } else {
    Browser.debug('browser resume...');
    Browser.isSuspend = false;
    if(Browser.sideBlock.dataset.sidebar == 'true') {
      var video = document.getElementById('tv');
      if(video.mozSrcObject == null) {
        Browser.initTV();
      }
    }
    //Browser.hashChange();
    Remote.init();
    if(Browser.currentInfo) {
      if(( Browser.currentInfo.url == null ) || ( Browser.currentInfo.url == '' )) {
        Awesomescreen.selectTopSites();
      }
      Browser.refreshBrowserParts();
    }

  }
}, false);

window.onhashchange = Browser.hashChange;

window.addEventListener('load', function browserOnLoad(evt) {
  Browser.debug('browser browserOnLoad...');
  window.removeEventListener('load', browserOnLoad, false);
  var mozL10n = navigator.mozL10n;
  mozL10n.ready(function() {
    // hash change param
    Browser.hashChange();
    Remote.init(); // init TCPSocket
    Browser.init();
  }.bind(this));
});

function actHandle(activity) {
  if (Browser.hasLoaded) {
    Browser.handleActivity(activity);
  } else {
    Browser.waitingActivities.push(activity);
  }
}

if (window.navigator.mozSetMessageHandler) {
  window.navigator.mozSetMessageHandler('activity', actHandle);
}

