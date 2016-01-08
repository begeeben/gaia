const HOUR  =  60 * 60 * 1000;
const FRM_WITDH  = 450;
const FRM_HEIGHT = 800;
const SCALE_MIN = 0.2;
const SCALE_MAX = 2;
const RESIZE = 0.1;
const DEF_SCALE_SIZE = 0.5;
const ST_KEY = "WEBCLIP"
const DEF_SCROLL = 50;
var StorageObj = {
    "scale"  : DEF_SCALE_SIZE,
    "favi"   : null,
    "frm_x"  : 0,
    "frm_y"  : 0,
    "url"    : DEF_URL,
    "capdate": new Date()
};
const PosInfo = JSON.stringify({
    "top"    : 52,
    "left"   : 15,
    "width": 450,
    "height": 800,
});
var PosBolb = new Blob([PosInfo],{type: 'application/json'});
var SCREENSHOT = null;
var DEF_URL = "";
var STOREMODE_ICON = "style/webclip/storemode_image.jpg";
var DEF_ICON = "style/webclip/defaultimage.png";
var DEF_FAVI = "style/webclip/loading.png";
var NETWORK_ONLINE = true;
var ACTIVATION = false;
//////////////////////////////////////////////////////////
/////////// ContentLoaded
//////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function() {

    document.body.setAttribute(
        'lang', navigator.panaSystem.tvstore.get('languageForTranslation'));
    var checkPosInfoPhase = function(end_cb) {
	checkPosInfoPhase.write_appsNV = function(callback) {
	    AppsNV.wirte( 
		PosBolb, "position",
		function(){
//		    console.log(">>>> position write success! ");
		    callback();
		},
		function(){
//		    console.log(">>>> position write error ... ");
		});
	};
	checkPosInfoPhase.onsuccess = function(evt) {
	    if(PosInfo === evt.target.result){
		end_cb();
	    } else {
		checkPosInfoPhase.write_appsNV(end_cb);
	    }
	};
	checkPosInfoPhase.onerror = function(evt) {
	    checkPosInfoPhase.write_appsNV(end_cb);
	};

	AppsNV.read("position","text",
		    checkPosInfoPhase.onsuccess,
		    checkPosInfoPhase.onerror);
    }; 

    var checkCapturePhase = function(end_cb) {
	AppsNV.read("screenshot","url",
		    function(evt){
    			if(evt.target.result){
			    SCREENSHOT = evt.target.result;
    			}
			asyncStorage.getItem(ST_KEY, checkDisclamerPhase);
		    },
		    function(evt){
			SCREENSHOT = null;
			asyncStorage.getItem(ST_KEY, checkDisclamerPhase);
		    });
    };

    var checkDisclamerPhase = function(storage) {
	if(getOnLine()) { // 1 True
    	    if(storage) {
    		Events.setStorageObj(storage);
    	    } else {
    		Events.setStorageObj();
    	    }
	    ACTIVATION = true;
	    Events.createIframe(StorageObj.url);
	    openPhase();
	} else { // 1 disclaimer false
	    NETWORK_ERR_MSG();
	}    
    };
    var openPhase = function(){
    	    if(capture_exist()) {// capture exist True
		Events.capImg.setAttribute("src",SCREENSHOT);
		Events.capImg.addEventListener('load',function(){
		    Events.capImg.classList.remove("disappear");
		    Events.capImg.removeEventListener('load',function(){});
		});
    	    }
	    movePoint.move(); // focus init
    	    BrowserDB.init(function(){
    		BrowserDB.getBookmarks(function(bookmarks) {
    		    widget_bookmarks.importBookmarks(bookmarks);
    		    widget_bookmarks.add();
		    translate_defalut_bk();
    		});
    	    })
    };
    var translate_defalut_bk = function() {
	navigator.mozL10n.ready(function(){
	    movePoint.position[2][1].childNodes[1].childNodes[0].textContent = 
		navigator.mozL10n.get("LT_WCL_RESET_TO_DEF");
	});
    };
    //////////////////////////////////////////////////////////
    /////////// init phase
    //////////////////////////////////////////////////////////
    CHANGE_TO_DEFAULT_PAGE();
    Events.init();
    movePoint.init();
    Cursor.init();
    navigator.mozL10n.ready(function() {
    	var wcl_select  = document.getElementById("wcl_select");
    	var connect_msg = document.getElementById("connect_msg");
    	var translate01 = navigator.mozL10n.get("LT_WCL_SELECT_PAGE");
    	var translate02 = navigator.mozL10n.get("LT_LD_NETWORK_ERROR");
	if(!getOnLine()) {
   	  translate02 = navigator.mozL10n.get("LT_TZ_CLOCK_ERROR_NW");
	}
    	wcl_select.innerHTML  = translate01;
    	connect_msg.innerHTML = translate02;
    }.bind(this));

    checkPosInfoPhase(function(){
        checkCapturePhase();
    });
});

//////////////////////////////////////////////////////////
/////////// events 
//////////////////////////////////////////////////////////
var Events = {};
Events.init = function(storage) {
    this.need_cap = false;
    this.mainTitle = document.getElementById('main_title');
    this.changeTitle = document.getElementById('change_title');
    this.loading = document.getElementById('loading');
    this.clip        = document.getElementById('clip');
    this.buttonBox   = document.getElementById('button_box');
    this.capImg      = document.getElementById('cap_img');
    this.capMsg      = document.getElementById('cap_msg');
    this.connectMsg  = document.getElementById('connect_msg');
    this.page        = document.getElementById('page');
    this.title       = document.getElementById('cp-title');
    this.icon        = document.getElementById('icon');
    this.iconChange  = document.getElementById('img_change');
    this.iconSetting = document.getElementById('img_setting');
    this.iconSmall   = document.getElementById('img_small');
    this.iconBig     = document.getElementById('img_big');
    this.iconLeft    = document.getElementById('img_left');
    this.iconRight   = document.getElementById('img_right');
    this.iconUp      = document.getElementById('img_up');
    this.iconDown    = document.getElementById('img_down');
    this.iconReturn  = document.getElementById('img_return');
    this.frmbase     = document.getElementById('frmbase');
    this.bar         = document.getElementById('bar');
    this.select_page = document.getElementById('select_page');
    this.bk_bar      = document.getElementById('bk_bar');
    this.bk_return   = document.getElementById('bk_return');
    this.addEvents();
};
Events.createIframe = function(url) {
    var create_frame = document.createElement('iframe');
    create_frame.id = "frm";
    create_frame.setAttribute("mozbrowser",true);
    create_frame.setAttribute("remote"    ,true);
    create_frame.setAttribute("scrolling" ,"no");
    create_frame.src = url;
    this.frmB  = document.getElementById('frmbase');
    this.frmB.appendChild(create_frame);
    this.frm   = document.getElementById('frm');
    this.frmS  = document.getElementById('frm').style;
    this.iframeAddEvents(this.frm);
};
Events.capture = function(callback) {
    if(!callback)
	callback = function(){};
    // Capture screenshot for tab thumbnail
    if (this.frm.getScreenshot) {
	var resize = 1 / StorageObj.scale;
        this.frm.getScreenshot(FRM_WITDH * resize ,FRM_HEIGHT * resize).onsuccess =
            (function(e) {
		var bolbData = e.target.result;
		StorageObj.capdate = new Date();
		Events.save(callback, bolbData);
            }).bind(this);
    }
};
Events.setStorageObj = function(storage){
    if(storage) {
    	StorageObj.url = storage.url || DEF_URL;
    	StorageObj.favi = storage.favi || null;
    	StorageObj.scale  = this.checkNaN(storage.scale || DEF_SCALE_SIZE);
    	StorageObj.frm_x  = this.checkNaN(storage.frm_x || 0);
    	StorageObj.frm_y  = this.checkNaN(storage.frm_y || 0);
	StorageObj.capdate = storage.capdate;
    } else {
    	StorageObj.url = DEF_URL;
    	StorageObj.favi = null;
    	StorageObj.scale  = DEF_SCALE_SIZE;
    	StorageObj.frm_x  = 0;
    	StorageObj.frm_y  = 0;
	StorageObj.capdate = new Date();
    }
};

Events.modStorageObj = function(uu, ff, xx, yy, ss) {
    StorageObj.url   = uu || DEF_URL;
    StorageObj.favi  = ff || null;
    StorageObj.scale = this.checkNaN(ss || DEF_SCALE_SIZE);
    StorageObj.frm_x = this.checkNaN(xx || 0);
    StorageObj.frm_y = this.checkNaN(yy || 0);
    StorageObj.capdate = new Date();
    asyncStorage.setItem(ST_KEY, StorageObj, function(){});
};
Events.addEvents = function() {
    this.loading.addEventListener('error', function(){
	this.loading.setAttribute("style", "display:none")}.bind(this));
    this.loading.addEventListener('load', function(){
	this.loading.setAttribute("style", "display:block")}.bind(this));

    this.clip.addEventListener('touchend', this.jumpToBrowser.bind(this));
    this.clip.addEventListener('click',    this.jumpToBrowser.bind(this));
    this.iconSetting.addEventListener('touchend', function(evt){this.changePage(evt);}.bind(this));
    this.iconSetting.addEventListener('click', function(evt){this.changePage(evt);}.bind(this));
    this.iconSmall.addEventListener('touchend', function(evt){this.small(evt);}.bind(this));
    this.iconSmall.addEventListener('click',    function(evt){this.small(evt);}.bind(this));
    this.iconBig.addEventListener('touchend', function(evt){this.big(evt);}.bind(this));
    this.iconBig.addEventListener('click',    function(evt){this.big(evt);}.bind(this));
    this.iconLeft.addEventListener('touchend', function(evt){this.left(evt);}.bind(this));
    this.iconLeft.addEventListener('click',    function(evt){this.left(evt);}.bind(this));
    this.iconRight.addEventListener('touchend', function(evt){this.right(evt);}.bind(this));
    this.iconRight.addEventListener('click',    function(evt){this.right(evt);}.bind(this));
    this.iconUp.addEventListener('touchend', function(evt){this.up(evt);}.bind(this));
    this.iconUp.addEventListener('click',    function(evt){this.up(evt);}.bind(this));
    this.iconDown.addEventListener('touchend', function(evt){this.down(evt);}.bind(this));
    this.iconDown.addEventListener('click',    function(evt){this.down(evt);}.bind(this));
    this.iconReturn.addEventListener('touchend', function(evt){this.changePage(evt);}.bind(this));
    this.iconReturn.addEventListener('click', function(evt){this.changePage(evt);}.bind(this));
    this.iconChange.addEventListener('touchend', function(evt){this.change(evt);}.bind(this));
    this.iconChange.addEventListener('click',   function(evt){this.change(evt);}.bind(this));
    this.bk_return.addEventListener('touchend', function(evt){this.change(evt);}.bind(this), false);
    this.bk_return.addEventListener('click',    function(evt){this.change(evt);}.bind(this), false);
    window.addEventListener('blur', function(evt){
	if(Events.need_cap && movePoint.p_pos == 1 ) { // main page
	    Events.need_cap = false;
	    Events.capture();
	}
    }.bind(this));
};

Events.jumpToBrowser = function() {
    if(!NETWORK_ONLINE){
    	return;
    }
    try {
	new MozActivity({
	    name: "pana_apps_launch",
	    data: {
		"productid":"0077777700160002",
		"arg":{
		    "launch_from":5,
		    "url":StorageObj.url
		}
	    }
	});
    } catch(e) {
	console.log(e);
    }
};

Events.iconDisplay = function() {
    this.icon.classList.toggle("hide");
};

Events.titleDisplay = function() {
    this.iconSetting.classList.toggle("hide");
};

Events.iframeAddEvents = function(obj_id) {
    obj_id.addEventListener('mozbrowsererror', function(e) {
	if(NETWORK_ONLINE) {
	    NETWORK_ONLINE = false;
	    Events.frm.stop();
	    NETWORK_ERR_MSG();

	    if(getOnLine()) {
		Events.iconSetting.classList.remove("hide");
		Events.capImg.setAttribute("src",DEF_ICON);
		Events.capMsg.setAttribute("style","background-color:transparent; opacity:1;");
		movePoint.setp_num(0);
		movePoint.move();
	    }
	}
    });
    obj_id.addEventListener('mozbrowserloadend', function(e) {
	this.is_loading = false;
	if(e.target.src.length <= 0) {
	    return;
	}
	this.frm.scrollBy(StorageObj.frm_x, StorageObj.frm_y);
	var self = this;
	this.wait_mozbrowsererror = setTimeout(function() {
	    if (self.is_loading) {
	      return;
	    }
	    Events.iconSetting.classList.remove("hide");
	    Events.loading.setAttribute("src",StorageObj.favi);
	    Events.loading.classList.remove("loading_act");
	    ACTIVATION = false;
	    Events.capImg.classList.add("disappear");

	    var now = new Date();
	    var calc_time = now - StorageObj.capdate;
	    if(NETWORK_ONLINE && (calc_time > HOUR || capture_exist() == false)) {
		Events.capture();
	    }
	},1000);
    }.bind(this));

    obj_id.addEventListener('mozbrowserloadstart', function(e) {
	this.is_loading = true;
	if(this.wait_mozbrowsererror) {
	    clearTimeout(this.wait_mozbrowsererror);
	    this.wait_mozbrowsererror = null;
	}
	if(e.target.src.length <= 0) {
	    return;
	}
	NETWORK_ONLINE = true;
	Events.frm.zoom(StorageObj.scale);
	Events.loading.setAttribute("src",DEF_FAVI);
	Events.loading.classList.remove("disappear");
	Events.loading.classList.add("loading_act");
    }.bind(this));
    this.frm.addEventListener('mozbrowsertitlechange', function(e) {
	document.getElementById('title').textContent = e.detail;
    });
};

Events.changePage = function(evt) {
    var tgt = evt.currentTarget;

    if(tgt == this.iconSetting) {
	movePoint.setp_num(7);
	movePoint.setp_pos(1);
	this.bar.setAttribute("style", "pointer-events:none;");
	this.buttonBox.classList.add("show");
    }else if(tgt == this.iconReturn) {
	if(this.need_cap) {
	    this.need_cap = false;
	    this.capture();
	}
	movePoint.setp_num(0);
	movePoint.setp_pos(0);
	this.bar.setAttribute("style", "pointer-events:auto;");
	this.buttonBox.classList.remove("show");
    }
    movePoint.move();
    evt.stopPropagation();
    this.titleDisplay();
    this.iconDisplay();
};
Events.small = function(evt) {
    if(!NETWORK_ONLINE) {
	return;
    }
    if(!this.need_cap)
	this.need_cap = true;

    if(evt.type == "click") {
	movePoint.setp_num(2);
	movePoint.move();
    }
    if( StorageObj.scale > SCALE_MIN ) {
	StorageObj.scale = Math.round((StorageObj.scale - RESIZE)* 10)/10;
    }
    this.frm.zoom(StorageObj.scale);
}

Events.big = function(evt) {
    if(!NETWORK_ONLINE) {
	return;
    }
    if(!this.need_cap)
	this.need_cap = true;

    if(evt.type == "click") {
	movePoint.setp_num(1);
	movePoint.move();
    }
    if( StorageObj.scale < SCALE_MAX ) {
	StorageObj.scale = Math.round((StorageObj.scale + RESIZE)* 10)/10;
    }
    this.frm.zoom(StorageObj.scale);
}

Events.left = function(evt) {
    if(!NETWORK_ONLINE) {
	return;
    }
    if(!this.need_cap)
	this.need_cap = true;

    if(evt.type == "click") {
	movePoint.setp_num(5);
	movePoint.move();
    }
    this.frm.scrollBy(-DEF_SCROLL, 0);
    StorageObj.frm_x -= DEF_SCROLL;
};

Events.right = function(evt) {
    if(!NETWORK_ONLINE) {
	return;
    }
    if(!this.need_cap)
	this.need_cap = true;

    if(evt.type == "click") {
	movePoint.setp_num(6);
	movePoint.move();
    }
    this.frm.scrollBy(DEF_SCROLL, 0);
    StorageObj.frm_x += DEF_SCROLL;
};

Events.up = function(evt) {
    if(!NETWORK_ONLINE) {
	return;
    }
    if(!this.need_cap)
	this.need_cap = true;

    if(evt.type == "click") {
	movePoint.setp_num(3);
	movePoint.move();
    }
    this.frm.scrollBy(0, -DEF_SCROLL);
    StorageObj.frm_y -= DEF_SCROLL;
};

Events.down = function(evt) {
    if(!NETWORK_ONLINE){
	return;
    }
    if(!this.need_cap)
	this.need_cap = true;

    if(evt.type == "click") {
	movePoint.setp_num(4);
	movePoint.move();
    }
    this.frm.scrollBy(0, DEF_SCROLL);
    StorageObj.frm_y += DEF_SCROLL;
};

Events.change = function(evt) {
    if(this.need_cap) {
	this.need_cap = false;
	this.capture();
    }
    var tgt = "";
    if(evt){
	tgt = evt.currentTarget;
    }
    if(tgt == this.iconChange) {
    	movePoint.setp_num(0);
    	movePoint.setp_pos(2);
	this.title.setAttribute("style","top:10px");
	widget_bookmarks.scroll_init();
    }else {
    	movePoint.setp_num(7);
    	movePoint.setp_pos(1);
	this.title.setAttribute("style","top:0px");
    }
    movePoint.move();
    this.mainTitle.classList.toggle("hide");
    this.changeTitle.classList.toggle("hide");
    this.page.classList.toggle("hide");
    this.bar.classList.toggle("hide");
    this.select_page.classList.toggle("hide");
    this.bk_bar.classList.toggle("hide");
};

Events.goToMain = function(evt) {
    SCREENSHOT = null;
    movePoint.setp_num(1);
    movePoint.setp_pos(0);
    this.title.setAttribute("style","top:0px");

    movePoint.move();

    if(!NETWORK_ONLINE) {
	Events.title.classList.remove("hide");
	Events.capImg.classList.add("disappear");
	Events.capMsg.setAttribute("style","");
	Events.capImg.setAttribute("style","");
    }

    this.mainTitle.classList.remove("hide");
    this.changeTitle.classList.add("hide");
    this.page.classList.remove("hide");
    this.select_page.classList.add("hide");
    this.bk_bar.classList.add("hide");

    this.bar.classList.remove("hide");
    this.bar.setAttribute("style", "pointer-events:auto;");
    this.buttonBox.classList.remove("show");

    this.icon.classList.toggle("hide");
};

Events.checkNaN = function(num, def) {
    if(isReallyNaN(num))
	return def;
    if(num == undefined)
	return def;

    return num;
};

Events.save = function(callback,bolbData) {
    AppsNV.wirte(
	bolbData, "screenshot",
	function(){ //// success callback
	    asyncStorage.setItem(ST_KEY, StorageObj, callback);
	},
	function(){
//	    console.log(">>>> write error ... ");
	});
};

//////////////////////////////////////////////////////////
/////////// cursor function
//////////////////////////////////////////////////////////
var Cursor = {};
Cursor.init = function(cursor_el) {
    this.cursor_el = null;
    this.keyDef = {
	UP:    38, DOWN:   40, LEFT:    37, RIGHT: 39,
	ENTER: 13, RETURN:  8, ESCAPE:   3, MENU: 114,
	VK_0:  48, VK_1:   49, VK_2:    50, VK_3:  51, VK_4: 52,
	VK_5:  53, VK_6:   54, VK_7:    55, VK_8:  56, VK_9: 57,
	VK_UP:33, VK_DOWN:34
    };
    // prepare event
    window.addEventListener('keydown', this);
    window.addEventListener('keypress', this);
    window.addEventListener('keyup', this);
};
Cursor.handleEvent = function(ev) {
    if (!ev) {
	return;
    }
    switch(ev.type) {
    case 'keypress':
	this.keyHook(ev.type, ev.keyCode);	
	break;
    }
};
Cursor.moveCursor = function(el) {
    if (el) {
	el.focus();
    }
};
Cursor.keyHook = function(up_down, key) {
    if (up_down === 'keypress') {
	switch(key) {
	case this.keyDef.VK_UP:
	case this.keyDef.UP:
	    movePoint.up();
	    break;
	case this.keyDef.VK_DOWN:
	case this.keyDef.DOWN:
	    movePoint.down();
	    break;
	case this.keyDef.ENTER:
	    movePoint.enter();
	    break;
	}
    }
};

//////////////////////////////////////////////////////////
/////////// movePoint function
//////////////////////////////////////////////////////////
var movePoint = {};
movePoint.init = function() {
    this.p_pos = 0;
    this.p_num = 1;
    this.tab_num = 0;
    this.position = [
	[Events.iconSetting,Events.clip],
	[
	    Events.iconChange,Events.iconBig, Events.iconSmall,Events.iconUp,
	    Events.iconDown, Events.iconLeft, Events.iconRight, Events.iconReturn
	],
	[]
    ];
    this.position.forEach(function(array){
	array.forEach(function(el){
	    el.tabIndex = this.tab_num;
	    this.tab_num++;
	}.bind(this));
    }.bind(this));
    widget_bookmarks.init();
};
movePoint.setp_num = function(num) {
    this.p_num = num;
};
movePoint.setp_pos = function(pos) {
    this.p_pos = pos;
};

movePoint.returnTabNum = function() {
    return this.tab_num;
};
movePoint.addTabNum = function() {
    this.tab_num++;
};

movePoint.move = function() {
    Cursor.moveCursor(movePoint.position[this.p_pos][this.p_num]);
};
movePoint.blur = function() {
    movePoint.position[this.p_pos][this.p_num].blur();
};

movePoint.enter = function() {
    if(is_offline()){
	return;
    }
    this.customEvent(this.p_num);
};

movePoint.up = function() {
    if(ACTIVATION || is_offline()){
	return;
    }
    switch(this.p_pos) {
    case 0:
	if(NETWORK_ONLINE) {
	    if(this.p_num > 0 && this.p_num <= this.position[0].length){
		this.p_num--;
	    } else {
		this.p_num = this.position[0].length -1;
	    }
	} else {
	    this.p_num = 0;
	}
	this.move();
	break;
    case 1:
	if(this.p_num > 0 && this.p_num <= this.position[1].length){
	    this.p_num--;
	} else {
	    this.p_num = this.position[1].length -1;
	}
	this.move();
	break;
    case 2:
	widget_bookmarks.up();
	break;
    default:
	break;
    }
};

movePoint.down = function() {
    if(ACTIVATION || is_offline()){
	return;
    }
    switch(this.p_pos) {
    case 0:
	if(NETWORK_ONLINE) {
	    if(this.p_num >= 0 && this.p_num < this.position[0].length -1){
		this.p_num++;
	    } else {
		this.p_num = 0;
	    }
	} else {
	    this.p_num = 0;
	}
	this.move();
	break;
    case 1:
	if(this.p_num >= 0 && this.p_num < this.position[1].length -1){
	    this.p_num++;
	} else {
	    this.p_num = 0;
	}
	this.move();
	break;
    case 2:
	widget_bookmarks.down();
	break;
    default:
	break;
    }
};

movePoint.customEvent = function(num) {
    var elm = this.position[this.p_pos][this.p_num];
    var e = new CustomEvent("touchend");
    elm.dispatchEvent(e);
};

//////////////////////////////////////////////////////////
/////////// widget_bookmarks function
//////////////////////////////////////////////////////////
var widget_bookmarks = {};
widget_bookmarks.init =function() {
    this.tgt = document.getElementById("bookmarks");
    this.tgt.addEventListener('transitionend', function(evt){
	if(evt.target === this.tgt){
	    this.scroll_fg = true;
	}
    }.bind(this));

    this.distance = 95;
    this.def_top = 2;
    this.def_btm = 8;
    this.scroll = 0;
    this.scroll_top = this.def_top;
    this.scroll_bottom = this.def_btm;
    this.scroll_fg = true;

    this.bk_data = {};

    this.bk = document.createElement('div');
    this.bk.classList.add('bk');

    this.icon = document.createElement('div');
    this.icon.classList.add('bk-icon');

    this.icon.node01 = document.createElement('img');
    this.icon.node01.classList.add('bk-icon-content');

    this.icon.appendChild(this.icon.node01);

    this.item = document.createElement('div');
    this.item.classList.add('bk-page');


    this.item.node01 = document.createElement('div');
    this.item.node01.classList.add('bk_content');
    this.item.node01.innerHTML = "Reset to default";
    this.item.appendChild(this.item.node01);

    this.bk.appendChild(this.icon);
    this.bk.appendChild(this.item);

};

widget_bookmarks.add =function() {
    var src = null;

    var moveToDefault = function(){
	Events.modStorageObj(DEF_URL, "", 0, 0, Events.scale);
	AppsNV.delete(
	    "screenshot",function(){
		Events.goToMain();
		Events.frm.src = StorageObj.url;
		ACTIVATION = true;
	    },function(){
		Events.goToMain();
		Events.frm.src = StorageObj.url;
		ACTIVATION = true;
	    });

    };
    var changeEvent = function(evt){
	var tab_num = 0;
	for(var i = 0; i < movePoint.position[2].length; i++){
	    if(evt.currentTarget.tabIndex == movePoint.position[2][i].tabIndex) {
		tab_num = i;
		break;
	    }
	}

	var self = widget_bookmarks;
	Events.modStorageObj(self.bk_data[tab_num -2].uri,
			     self.bk_data[tab_num -2].iconUri,
			     0, 0, Events.scale);
	AppsNV.delete(
	    "screenshot",function(){
		Events.goToMain();
		Events.frm.src = StorageObj.url;
		ACTIVATION = true;
	    },function(){
		Events.goToMain();
		Events.frm.src = StorageObj.url;
		ACTIVATION = true;
	    });
    };

    Events.bk_return.tabIndex = movePoint.returnTabNum();
    movePoint.addTabNum();
    movePoint.position[2].push(Events.bk_return);

    src = this.bk.cloneNode(true);
    src.addEventListener('touchend', moveToDefault.bind(this));	// for FxOS
    src.addEventListener('click',    moveToDefault.bind(this));	// for browser
    src.tabIndex = movePoint.returnTabNum();
    movePoint.addTabNum();
    this.tgt.appendChild(src);
    movePoint.position[2].push(src);

    for(var i=0; i < this.bk_data.length; i++) {
    	src = null;
    	src = this.bk.cloneNode(true);
    	src.childNodes[1].childNodes[0].textContent =this.bk_data[i].title;
    	src.childNodes[0].childNodes[0].setAttribute("src",this.bk_data[i].iconUri);
    	src.childNodes[0].childNodes[0].addEventListener('error', function(e){
    	    e.currentTarget.setAttribute("style", "display:none")}.bind(this));
    	src.childNodes[0].childNodes[0].addEventListener('load', function(e){
    	    e.currentTarget.setAttribute("style", "display:block")}.bind(this));
    	src.addEventListener('touchend', function(evt){changeEvent(evt);}.bind(this));
    	src.addEventListener('click',    function(evt){changeEvent(evt);}.bind(this));
    	src.tabIndex = movePoint.returnTabNum();
    	movePoint.addTabNum();

    	this.tgt.appendChild(src);
    	movePoint.position[2].push(src);
    }
};

widget_bookmarks.importBookmarks =function(bookmarks) {
    this.bk_data = bookmarks;
};

widget_bookmarks.down =function() {
    if(this.scroll_fg) {
	var self = movePoint;
	if(self.p_num >= 0 && self.p_num < self.position[2].length -1){
	    movePoint.p_num++;
	}
	self.move();
	if(self.p_num > this.scroll_bottom && this.scroll_bottom < self.position[2].length -1){
	    this.scroll_fg = false;
	    this.scroll -= this.distance;
	    this.scroll_top++;
	    this.scroll_bottom++;
     	    this.tgt.style.transform ="translateY(" + this.scroll + "px)";
	}
    }
};
widget_bookmarks.up =function() {
    if(this.scroll_fg) {
	var self = movePoint;
	if(self.p_num > 0 && self.p_num <= self.position[2].length){
	    self.p_num--;
	}
	self.move();
	if (self.p_num < this.scroll_top && self.p_num >= this.def_top){
	    this.scroll_fg = false;
	    this.scroll += this.distance;
    	    this.scroll_top--;
    	    this.scroll_bottom--;
	    this.tgt.style.transform ="translateY(" + this.scroll + "px)";
	}
    }
};
widget_bookmarks.scroll_init =function() {
    this.distance = 95;
    this.def_top = 2;
    this.def_btm = 8;
    this.scroll = 0;
    this.scroll_top = this.def_top;
    this.scroll_bottom = this.def_btm;
    this.scroll_fg = true;
    this.tgt.style.transform ="translateY(0px)";
};
//////////////////////////////////////////////////////////
/////////// fileReadWrite function
//////////////////////////////////////////////////////////
var AppsNV = {};
AppsNV.read = function(file_name, type, onsuccess, onerror) {

    var reader = new FileReader();
    reader.onload = function(evt) {onsuccess(evt);};
    reader.onerror = function(evt) {onerror(evt);};

    var device = navigator.getDeviceStorage("apps_nv");
    var req = device.get("webclip/" + file_name);
    req.onsuccess = function(evt){
	var file = evt.target.result;
	if(type == "url"){
	    reader.readAsDataURL(file);
	} else {
	    reader.readAsText(file);
	}
    }
    req.onerror = function(evt){onerror(evt);};
};
AppsNV.wirte = function(bolbData,file_name,onsuccess,onerror) {
    var tmp_filename = "webclip/" + file_name + ".tmp";
    var success_filename = "webclip/" + file_name;
    var device = navigator.getDeviceStorage("apps_nv");
    var req = device.delete(tmp_filename);
    req.onsuccess = function(evt){
	var req2 = device.addNamed(bolbData, tmp_filename);
	req2.onsuccess = function(evt){
	    if(evt.target && evt.target.readyState === 'done'){
		device.rename(tmp_filename, success_filename);
		onsuccess();
	    }
	};
	req2.onerror = function(evt){onerror(evt)};
    }
    req.onerror = function(evt){onerror(evt)};
};
AppsNV.delete = function(file_name,onsuccess,onerror) {

    var tmp_filename = "webclip/" + file_name;
    var device = navigator.getDeviceStorage("apps_nv");
    var req = device.delete(tmp_filename);

    req.onsuccess = function(evt){onsuccess(evt);};
    req.onerror = function(evt){onerror(evt);};
};

//////////////////////////////////////////////////////////
/////////// watchdog
//////////////////////////////////////////////////////////
var watchdog = {};
var TIMEOUT = 30; //30sec
watchdog.init = function(){
    this.time = 0;
    this.intervalID;
};

watchdog.start = function(){
    this.intervalID = setInterval(this.counter.bind(this),1000);
};
watchdog.stop = function(){
    clearInterval(this.intervalID);
    this.time = 0;
};

watchdog.counter = function(){
    this.time++;
    if(this.time >= TIMEOUT){
	this.stop();
    }
};
//////////////////////////////////////////////////////////
/////////// others function
//////////////////////////////////////////////////////////

function isReallyNaN(x) {
    return x !== x;
};

function checkStoreMode() {
  return navigator.panaSystem.tvstore.get('storeMode');
};

function getOnLine() {
  return navigator.onLine;
}

function is_offline(){
    return !getOnLine();
};

function capture_exist() {
    return (SCREENSHOT != null);
};

function NETWORK_ERR_MSG() {
    ACTIVATION = false;   // activation end
    if(checkStoreMode() && is_offline() ){
	Events.capImg.setAttribute("src",STOREMODE_ICON);
	Events.capImg.classList.remove("disappear");
	Events.capMsg.setAttribute("style","background-color:transparent; opacity:1;");
	Events.capMsg.childNodes[1].setAttribute("style","top:830px;");
    } else if(capture_exist()) {// capture exist True
    	Events.capImg.setAttribute("src",SCREENSHOT);
    	Events.capMsg.setAttribute("style","opacity:0.8;");
    } else {
	Events.capImg.setAttribute("src",DEF_ICON);
	Events.capMsg.setAttribute("style","background-color:transparent; opacity:1;");
    }
    movePoint.blur();
    Events.iconSetting.classList.add("hide");
    Events.title.classList.add("hide");
    Events.capImg.setAttribute("style","opacity:1;");
};

function CHANGE_TO_DEFAULT_PAGE() {
    var country = navigator.panaSystem.tvstore.get('countryEnv');
    switch(country) {
    case "JP":
	DEF_URL = "http://panasonic.jp/viera/bookmark_01.html";
	break;
    case "AU":
	DEF_URL = "http://www.panasonic.com/au/consumer.html";
	break;
    case "NZ":
	DEF_URL = "http://www.trademe.co.nz/";
	break;
    case "TH":
	DEF_URL = "http://www.sanook.com";
	break;
    case "MY":
	DEF_URL = "http://www.panasonic.com/my/home/";
	break;
    case "ID":
	DEF_URL = "http://www.panasonic.com/id/home.html";
	break;
    case "VN":
	DEF_URL = "http://www.panasonic.com/vn/home.html";
	break;
    case "IN":
	DEF_URL = "http://www.panasonic.com/in/home/";
	break;
    case "IL":
	DEF_URL = "http://www.walla.co.il/";
	break;
    default:
	DEF_URL = "http://www.panasonic.com";
    }
};
