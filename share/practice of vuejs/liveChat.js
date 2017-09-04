/**
 * @author: sunxiongying@myhexin.com
 * @date: 2017-07-13 16:01
 * @desc: Live的聊天室
 */

var vm;
var fontSize;
var chatEmptyFlag = false;
var chatAjaxFlag = false;
var chatNumAjaxFlag = false;
var addLiveAjaxFlag = false;
var LSchatShowEditor = 'wap-livechat-showEditor'; /*进入该页面的标记 是否展示 editor*/


/*是否@某人*/
var isAt = '';
/*上下拉动的对象*/
var pullScroll;

var GData = {
    chat:{
        chatList:[]
    },
    toTop:{
        isShow:false
    }
};

function LiveChat(){
    return this.init();
}

LiveChat.prototype = {
    init:function(){
        this.bindEvent();
        this.varInit();
        this.vueInit();
        /*默认触发*/
        vm.showEditorInit();

        this.resetUrl();
    },
    varInit:function(){
        /*编辑器*/
        var editorInit = {
            isShow: false,
            wordLimitNum: 100,
            placeholder:'',
            showCall: function(){
                $('.live-bottom').css({
                    'position':'absolute',
                    'display': 'none'
                });
            },
            sendCall: function(value){
                setTimeout(function(){
                    $('.live-bottom').css({
                        'position': 'fixed',
                        'display': 'block'
                    });
                },800);
                var content = isAt + value;
                var oData = {
                    content:content,
                    sid:vm.GParam.sid,
                    fid:vm.GParam.fid
                };
                vm.addLiveAjax(oData);
            },
            cancelCall: function(){
                setTimeout(function(){
                    $('.live-bottom').css({
                        'position': 'fixed',
                        'display': 'block'
                    });
                },800);
            },
            Gpagestat: initData.GParam.Gpagestat,
            faceInit: {
                isShow : false,
            }
        };

        GData.chat.editorInit = editorInit;
    },
    vueInit:function(){
        GData = $.extend(true,initData , GData);
        
    	vm = new Vue({
			el: '#live-chat',
			data: GData,
            beforeCreate:function(){
                this.A();
            },
            created:function(){
                this.B();  
            },
            mounted:function(){
                this.vueScrollInit();
                this.round();/*40s循环*/
            },
			methods: {
                vueScrollInit:function(){
                    if(this.chat.chatList.length > 0){
                        scrollInit();
                        if(this.chat.chatList.length < 10){
                            pullScroll.upPreloadEnable = false;
                        }
                    }  
                },
                post:function(item,type){
                    /*登录*/
                    if(!isLogin()){
                        doLogin();
                        return false;
                    }

                    if(this.GParam.isGuest == 1 && this.GParam.livestatus == 2){
                        /*是播主或嘉宾，且直播状态是  结束未开启新live 才能发言 给统计代码*/
                        funcStat(this.GParam.Gpagestat+'.chat.input.hosts','sns_live_channel_live_chat.input.hosts');
                    }

                    /*不能发言*/
                    if(canPost() === false){
                        if(type == 'at'){
                            /*是播主，且是at行为，不跳转*/
                            return false;
                        }
                        var LSliveShowEditor = 'wap-live-showEditor';
                        if(type == 'face'){
                            localStorage.setItem(LSliveShowEditor,'2');
                        }else{
                            localStorage.setItem(LSliveShowEditor,'1');
                        }
                        vm.jumpToChannel();
                        return false;
                    }

                    
                    this.showEditor(item,type);
                },
                showEditor:function(item,type){
                    if(canPost() === false){
                        return false;
                    }

                    /*不可以发布*/
                    if(!this.canLive()){
                        return false;
                    }

                    var $editor = this.$refs['editor-child'];
                    $editor.placeholder = '我也来说两句';
                    if(type == 'at'){
                        isAt = '@' + item.nickname+' ';
                        $editor.placeholder = isAt;
                    }else{
                        isAt = '';
                    }

                    var showFace = '';
                    if(type == 'face'){
                        showFace = 'face';
                    }
                    $editor.show(showFace);
                },
                zan:function(item,index){
                    var options = {
                        oData : {
                            pid:item.pid
                        },
                        successCallback:function(){
                            vm.chat.chatList[index].isAgree = 1;
                            vm.chat.chatList[index].zanNum++;
                        }
                    };
                    livePostZan(options);  
                    funcStat(initData.GParam.Gpagestat+'.like');
                },
                toTopFunc:function(){
                    scrollTo(0);
                    this.toTop.isShow = false;
                },
				chatAjax:function(oData, defCall){
                    var self = this;

                    if(chatAjaxFlag){
                        return;
                    }

                    if(chatEmptyFlag && oData.sort == 'up'){    /*下拉且已提示无数据*/
                        return;
                    }

                    chatAjaxFlag = true;

                    $.ajax({
                        url: '/m/live/getUserLiveListBySidPid/',
                        type: 'get',
                        dataType: 'json',
                        data: oData
                    })
                    .done(function(json) {
                        if(json.errorCode === 0){
                            if(oData.sort == 'up'){//加载下面的数据
                                self.chat.chatList = self.chat.chatList.concat(json.result.data);
                            }else{//加载上面的数据
                                self.chat.chatList = json.result.data.concat(self.chat.chatList);
                            }
                        }else if(json.errorCode === 100){
                            if(oData.sort == 'up'){//加载下面的数据
                                chatEmptyFlag = true;
                                pullScroll.loadUpPullHTML = '<span style="color:#666;">没有更多数据了</span>';
                                pullScroll.upPreloadEnable = false;
                            }
                        }else{
                            chatEmptyFlag = true;
                        }

                        /*liveStatus 更改*/
                        if(json.result && json.result.liveStatus && self.GParam.livestatus != parseInt(json.result.liveStatus)){
                            //存在livestatus，直播状态
                            self.GParam.livestatus = parseInt(json.result.liveStatus);
                            self.GParam.isInPage = true;
                        }

                        if($.isFunction(defCall)){
                            defCall();
                        }
                    })
                    .always(function() {
                        chatAjaxFlag = false;
                    });
                },
                getChatNumAjax:function(){
                    var self = this;
                    var oData = {
                        sid:self.GParam.sid
                    };

                    if(chatNumAjaxFlag){
                        return;
                    }
                    chatNumAjaxFlag = true;
                    $.ajax({
                        url: '/m/live/getLiveCountBySid/',
                        type: 'get',
                        dataType: 'json',
                        data: oData
                    })
                    .done(function(json) {
                        if(json.errorCode === 0){
                            self.chat.chatNum = +json.result.count;
                        }
                    })
                    .always(function() {
                        chatNumAjaxFlag = false;
                    });
                },
                addLiveAjax:function(oData){
                    var self = this;
                    if(addLiveAjaxFlag){
                        return;
                    }
                    
                    addLiveAjaxFlag = true;
                    setLoading('消息发送中');

                    $.ajax({
                        url: '/m/live/addShowLive/',
                        type: 'post',
                        dataType: 'json',
                        data: oData
                    })
                    .done(function(json) {
                        if(json.errorCode === 0){
                            if(!self.chat.chatList.length){
                                self.chat.chatList = json.result.data;
                            }else{
                                self.chat.chatList = json.result.data.concat(self.chat.chatList);
                            }

                            self.$refs['editor-child'].cancel();
                            self.chat.chatNum++;
                        }else{
                            alertBox(json.errorMsg);
                        }
                    })
                    .always(function() {
                        addLiveAjaxFlag = false;
                        removeLoading();
                    });
                },
                round:function(){
                    var self = this;
                    setInterval(function(){
                        if(!vm.chat.chatList.length){
                            return false;
                        }
                        var firstChatData = vm.chat.chatList[0];
                        oData = {
                            pid:firstChatData.pid,
                            limit:10,
                            sort:'down',
                            sid:self.GParam.sid
                        };
                        self.chatAjax(oData);
                        self.getChatNumAjax();
                    }, 40000);
                },
                showEditorInit:function(){
                    /*登录*/
                    if(!isLogin()){
                        return false;
                    }
                    
                    if(!!localStorage.getItem(LSchatShowEditor)){
                        var type = localStorage.getItem(LSchatShowEditor);
                        if(type == 1){/*只开编辑器*/
                            this.showEditor();
                        }else if(type == 2){/*只开表情*/
                            this.showEditor(null,'face');
                        }
                        localStorage.setItem(LSchatShowEditor,'0');
                    }   
                },
                canLive:function(){
                    var canlive = true;

                    if(!isLogin()){
                        doLogin();
                        return;
                    }
                    
                    $.ajax({
                        url:'/m/live/canLive/',
                        type:'GET',
                        async: false,
                        dataType:'json',
                        success:function(result){
                            canlive = false;
                            if(result.errorCode === 0){
                                canlive = true;
                            }else if(result.errorCode === -99){
                                //绑定手机号
                                funcStat(initData.GParam.Gpagestat + '.bddialog');
                                confirmBox({
                                    msg:'绑定手机号发帖更顺畅哦！',
                                    rightBtn:'去绑定',
                                    btnLight:'right',
                                    rightBtnEvent:function(){
                                        funcStat(initData.GParam.Gpagestat + '.dialog.bindphone');
                                        pageJumpLink('//i.10jqka.com.cn/mobile/newbindPhone.php?platform=' + getPlatform());
                                    }
                                });
                            }else if(result.errorCode === -24){
                                //登录异常
                                remindBox({
                                    msg:'登录异常，请重新登录！',
                                    btn:'确定',
                                    callback:function(){
                                        doLogin();
                                    }
                                });
                            }else{}
                        },
                        error:function(){
                            canlive = false;
                        }
                    });

                    return canlive;
                }
			}
		});
    },
    bindEvent:function(){
        /*common.js 使用 scrollTo 时需要绑定*/
        scrollToBindEvent();

        $(window).on('scroll',function(e){
            if($(this).scrollTop() < 100){
                vm.toTop.isShow = false;
            }
        });

        //滚动实现去顶部按钮，监听touch事件
        var pageX , pageY, endX, endY, distanceX, distanceY;
        $(window).on('touchstart', function(e){
            pageX = e.changedTouches[0].pageX;
            pageY = e.changedTouches[0].pageY;
        });

        $(window).on('touchmove', function(e){
            if($(this).scrollTop() < 100){
                vm.toTop.isShow = false;
                return;
            }

            endX = e.changedTouches[0].pageX;
            endY = e.changedTouches[0].pageY;

            distanceX = endX - pageX;
            distanceY = endY - pageY;

            if(Math.abs(distanceY) > Math.abs(distanceX)){
                if(distanceY < 0){
                    //下拉
                    vm.toTop.isShow = false;
                }else{
                    vm.toTop.isShow = true;
                }
            }
        });
    },
    //pid定位处理url
    resetUrl: function(){
        if(window.location.href.indexOf('pid=')>-1){
            var newUrl = window.location.pathname;
            history.replaceState({title:document.title},'',newUrl);
        }
    }
};

/*   讨论区 发言。
*       审核下线 -2 live已结束且开启新live -1 待审核 0 进行中 1 结束未开启新live 2
*    用户     0               0                   1           1           1
*    播主     0               0                   0           0           1
*    at功能 可以回复1   跳转 0  什么都不做 2
*    用户     2               2                   1           1           1
*    播主     2               2                   2           2           1 
/

/*是否可以发言*/
function canPost(){
    var flag = true;
    if(vm.GParam.isGuest == 1){
        /*是播主*/
        if( vm.GParam.livestatus == 2 ){

        }else{
            flag = false;
        }
    }else{
        /*非播主*/
        if(vm.GParam.livestatus == 1 || vm.GParam.livestatus == 2){
            
        }else{
            flag = false;
            /*审核下线 -2 live已结束且开启新live -1*/
        }
    }

    return flag;
}

 /**
 * 上拉加载更多，下拉加载最新
 * @return {[type]} [description]
 */
function scrollInit(){
    pullScroll = $('.live-list').pullScroll({
        el:'.live-ul',
        downPullEnable:true,/*上面的数据*/
        upPullEnable:false,/*下面的数据*/
        upPreloadEnable: true,
        downPullEvent:function(){/*上面的数据*/
            var firstChatData = vm.chat.chatList[0];

            oData = {
                pid:firstChatData.pid,
                limit:10,
                sort:'down',
                sid:vm.GParam.sid
            };
            return setDeferred(function(defCall){
                vm.chatAjax(oData,defCall);
                vm.getChatNumAjax();
            });
        },
        upPullEvent:function(){/*下面的数据*/
            var lastChatData = vm.chat.chatList[vm.chat.chatList.length - 1];

            oData = {
                pid:lastChatData.pid,
                limit:10,
                sort:'up',
                sid:vm.GParam.sid
            };

            return setDeferred(function(defCall){
                vm.chatAjax(oData,defCall);
            });
        }
    });
}

$(document).ready(function(){
	fontSize = initFontSize();
    goToTimerLine(initData.GParam.Gpagestat);
	new LiveChat();
});