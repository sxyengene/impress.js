// @charset "utf-8";
/**
 * [mlive description] 股市直播
 * [auth] yinshangsheng
 * [date] 20160317
 */

var isFollow = false;
var isSign = false;
var canLoadPost = true;
var canLoadLast = true;
var canLoadHistory = true;
var mlive = {
         
    /*** 
    [init description] 初始化
     * @param null
     * @return null
     */
    init : function(){
        mlive._initVariable();
        mlive._loadHistoryLive();
        mlive._doScroll();
        mlive._doClickInApp();
        mlive._doLayoutInApp();
        mlive._bindEvent();
        mlive._askBindEvent();
        mlive.pidAjax();
        
        // mlive.pointReadNumAjax();
    },

    /**
     * [_initVariable description] 初始化全局变量
     * @param null
     * @return null
     */
    _initVariable : function(){
        // var sizeRate = document.documentElement.clientWidth/320.0*100;
        // $('html').css('font-size',sizeRate);
        initFontSize();
        // $('body').show();

        
        window.platForm = getPlatform();
        var browser = {
            versions:function(){
                var u = navigator.userAgent;
                return {
                    iPad: u.indexOf('iPad')>-1
                };
            }(),
        };
        if(browser.versions.iPad){
            window.platForm = 'iPad';
        }

        window.isInApp = getAppVersion() ? true : false;
        window.GMasterid = mlive._strToObject($('#globalParam').data('action')).masterid;
        window.GFid = $('#globalParam').attr('data-fid');
        //获取crumb接口参数
        window.GfollowParmas = mlive._strToObject($('#globalParam').attr('data-follow'))['follow'];
        window.GcrumbParmas = '';
        //single：单人直播间；group：多人直播间
        window.GCircleType = $('#globalParam').attr('data-person');
        window.GPagestat = 'sns_live_' + window.GFid;
        window.GPageType = 1; //1：直播  2：T策略  3：观点
        
        window.GApiFunc = {
            'masterLive'       : mlive._masterLiveAction,
            'masterLiveHistory': mlive._masterLiveHistoryAction,
            'followAndSign'    : mlive._followAndSignAction,
            'showRD'           : mlive._showRD,
            'doSign'           : mlive._doSign,
            'getCrbDoFol'      : mlive._getCrbDoFol,
            'isFollowAction'   : mlive._isFollowAction,
            'doFollow'         : mlive._doFollow,
            'doTraceLayout'    : mlive._doTraceLayout,
            'doNewsLayout'     : mlive._doNewsLayout,
            'doPostLayout'     : mlive._doPostLayout,
            'doAskLayout'      : mlive._doAskLayout,
            'doVideoLayout'    : mlive._doVideoLayout,
            'randomMaster'     : mlive._randomMaster
        };
        if(localStorage.getItem('liveCourse') === '1'){ //如果是从收费活动页进来的话 默认关注 成功后展示导流动画
            localStorage.setItem('liveCourse','0');
            var daoliuObj = new DaoliuCommon({'hand':'left', 'type':'post'});
            showMask();
            daoliuObj.daoliuAnimateInit();
        }
    },

    /**
     * click统计
     */
    clickStat:function(stat,fid){
        var Fid = fid || '';
        funcStat(stat,Fid);
        // if(window.isInApp){

        //     hxmClickStat(window.GPagestat + '.' + stat,Fid);
            
        // }else{
        //     idStat(window.GPagestat + '.' + stat,Fid,{},'ta');
        // }
    },

    /**
     * pageJump统计
     */
    jumpPageStat:function(stat, rid){
        if(window.isInApp){
            hxmJumpPageStat(window.GPagestat + '.' + stat,rid);
        }else{
            idStat(window.GPagestat + '.' + stat,'',{},'ta');
        }
    },

    /**
     * 需要根据tab区分的点击事件统计代码
     */
    tabClickStat:function(num){// 统计代码规则。点击tab时发送， 当前所在tab如（zhibo） 切换到 tab （trace）。发统计代码为 zhibo.trace
        var tabArr = [null,'zhibo','trace','view','ask','video'];
        var stat = tabArr[window.GPageType]+'.'+tabArr[num];
        mlive.clickStat(stat);
    },
    /**
     * pic 需要根据tab区分的点击事件统计代码
     */
    tabPicClickOStat:function(){
        var tabArr = [null,'zhibo.showpic','trace.showpic','view.showpic','ask.showpic'];
        mlive.clickStat(tabArr[window.GPageType]);
    },

    /**
     * 需要根据tab区分的页面跳转统计代码
     */
    tabJumpPageStat:function(obj){
        switch(window.GPageType){
            case 1:
                mlive.jumpPageStat(obj.stat1,obj.rid1);
                break;
            case 2:
                mlive.jumpPageStat(obj.stat2,obj.rid2);
                break;
            case 3:
                mlive.jumpPageStat(obj.stat3,obj.rid3);
                break;
        }
    },

    _bindEvent : function(){
        //页面打开统计
        var qsid = $('#globalParam').attr('data-qsid');
        var fromid = 'sns_live,ths_all_broadcast,sns_live_zhibo,sns_live_' + getApp() + ',sns_live_qs' + qsid; 
        if( window.isInApp ){
            hxmPageStat({'id':window.GPagestat,'fid':fromid});
        }else{
            idStat(window.GPagestat,fromid,{},'ta');
        }

        //TA统计
        TA.log({'id':'c_mobile_qs'+qsid,'fid':'c_p_qs'+qsid});

        var gcxFlag = $('#globalParam').attr('data-gcx');
        if(gcxFlag == 1){
            $('.myadshow').hide();
        }
        
        var link = window.location.href;
        var index = link.indexOf('refCountId=');
        if(index > -1){
            if(link.slice(index + 11,link.length) == 'R_577e345c_275'){
                $('.bottomWrap').show();
            }else{
                $('.bottomWrap').remove();
            }
        }else{
            $('.bottomWrap').remove();  
        }

        ////用户第一次进入一个直播间，底部聊天室入口有个红点提示
        ///点击之后再次进入这个直播间就不会出现红点了
        var showtip = localStorage.getItem('showtip');
        if(showtip && showtip != null){
            var showobj = JSON.parse(showtip);
            if(showobj.indexOf(window.GFid) < 0){
                $('.hostFooter .foot-chattip').addClass('redtip');
            }
        }else{
            $('.hostFooter .foot-chattip').addClass('redtip');
        }

        $('.mlive-chat').click(function(event){
            mlive.jumpPageStat('chat','sns_live_'+window.GFid+'_chat');

            var showtip = localStorage.getItem('showtip');
            var showobj = [];

            if(showtip && showtip != null){
                showobj = JSON.parse(showtip);
            }

            if(showobj.indexOf(window.GFid) < 0){
                showobj.push(window.GFid);
                localStorage.setItem('showtip',JSON.stringify(showobj));
                $('.hostFooter .foot-chattip').removeClass('redtip');
            }
            
        });
        /*返回主页的统计代码*/
        $('.mlive-back').click(function(e){
            //统计
            mlive.jumpPageStat('all','sns_live_index');
        });

        /*wap到pc页面入口阴影悬浮层统计代码*/
        $('.bottomWrap .wrapWord').on('click',function(){
            mlive.clickStat('towebqz');
        });
        $('.bottomWrap .closeBtn').on('click',function(){
            mlive.clickStat('towebqz.close');
        });

        //加关注 取消关注
        $('.hostAdd').on('click',function(event){
            event.stopPropagation();
            if(!isLogin()){
                doLogin();
                return false;
            }
            var param = {
                follow:GfollowParmas
            };
            if($(this).hasClass('hasFollow')){
                //取消关注
                var url = '/ucenter/relation/unFollow/';
                mlive._doAjax(url,param,'doFollow');
            }else{
                //获取crumb 添加关注
                var getCrumbUrl = '/ucenter/relation/getCrumb/';
                mlive._doAjax(getCrumbUrl,param,'getCrbDoFol','get',$(this));
            }
        });

        /*wap手机直播回到pc版直播入口*/
        $('.bottomWrap .closeBtn').on('click',function(){
            $('.bottomWrap').remove();
        });

        //分享，分享页面的链接中加入“isshare=ths”
        $('body').on('click','.mlive-share,.point-see',function(){
            mlive.clickStat('share');

            var nick = $.trim($('.hostNick').text()) + '_同花顺直播';
            var content = $('#globalParam').attr('data-desc');
            var avatar = $('.hostPicture img').prop('src');
            var userid = getcookie('userid');
            var url;
            if( !!$(this).closest('.point-see').length ){
                var pointurl = $(this).parents('.hostLivePoint').attr('data-pointurl');
                url = pointurl.indexOf('?') == -1 ? pointurl + '?isshare=ths&userid=' + userid : pointurl + '&isshare=ths&userid=' + userid; 
            }else{
                url = window.location.href.indexOf('?') == -1 ? window.location.href + '?isshare=ths&userid=' + userid : window.location.href + '&isshare=ths&userid=' + userid; 
            }

            var reg = /^(http:|https:)/;
            if(reg.test(avatar)){
                avatar = avatar.replace(reg,window.location.protocol);
            }else{
                avatar = window.location.protocol + avatar;
            }

            var shareObj = {
                type:'1',
                title:nick,
                content:content,
                bmpRes:'1',
                bmpUrl:avatar,
                url:url,
                actionKey:'1'
            };
            var shareParam = JSON.stringify(shareObj);
            callNativeHandler('hexinShare',shareParam,function(){});

            if(getApp() == 'weixin'){
                $('body').append('<div class="weixin-share-wrap"><img src="//i.thsi.cn/sns/circle/wapcircle/img2/shareWx.png"></div>');
                $('.weixin-share-wrap').click(function(){
                    $(this).remove();
                });
            }
        });

        //跳分时图
        $('.wap-container').on('click','._dollar_',function(event){
            event.preventDefault();
            var $this = $(this);
            if(window.isInApp){
                event.stopPropagation();
                var code = $this.attr('data-code');
                var url = 'client://client.html?action=ymtz^webid=2205^stockcode='+code;

                //统计
                switch(window.GPageType){
                    case 1:
                        hxmJumpNativeStat(window.GPagestat + '.zhibo.stock','2205',{'to_scode':code});
                        break;
                    case 2:
                        hxmJumpNativeStat(window.GPagestat + '.trace.stock','2205',{'to_scode':code});
                        break;
                    case 3:
                        hxmJumpNativeStat(window.GPagestat + '.view.stock','2205',{'to_scode':code});
                        break;
                }

                // window.location.href = url;
                closeVideo(url);
            }
        });
    
        var richFlag = $('#globalParam').attr('data-richtextcontent');
        var imgScale = '.hostLiveImg';
        if(richFlag == 1){
            imgScale = '.hostLiveImg,.hostLiveText img';
        }

        // 图片放大功能
        var mySwiper;
        $('.hostLiveCon').on('click',imgScale,function(event){
            var originImagesDom = $(imgScale);
            var detailImages = [];
            var originImages = [];
            var index = 0;
            var $this = $(this);
            $.each(originImagesDom, function(key,value){
                var imgUrl = $(value).attr('src');
                var reg = /^(http:|https:)/;
                if(reg.test(imgUrl)){
                    imgUrl = imgUrl.replace(reg,window.location.protocol);
                }else{
                    imgUrl = window.location.protocol + imgUrl;
                }
                
                originImages.push(imgUrl);
                detailImages.push((imgUrl).replace(/_small/g, ''));

                if($(value).attr('src') == $this.attr('src')){
                    index = key;
                }
            });
            if( getApp() == 'gsjl' || getApp() == 'ths' || getApp() == 'liejin'){
                callNativeHandler(
                    'displayImageThumbnail',
                    {
                        'currentIndex':index,// 当前点击图片的index
                        'originImages':originImages,// 所有图片的缩略图的url，数组,
                        'detailImages':detailImages // 所有图片的高清图的url，数组
                    },
                    function(data){
                        console.log(data);
                    }
                );
            }else{
                if($this.siblings('.hostLivePoint').length){
                    return ;
                }
                if($('.swiper-mainWrap').length !== 0){
                    if(mySwiper){
                        mySwiper.removeAllSlides();
                        mySwiper.appendSlide('<div class="swiper-slide"><div class="swiper-zoom-container"><img src="'+detailImages[index]+'"></div></div>');
                        $('.swiper-mainWrap').show();
                    }
                    return;
                }
                var swiperSlideStr = '<div class="swiper-slide"><div class="swiper-zoom-container"><img src="'+detailImages[index]+'"></div></div>';
                // 手抄外图片放大
                var swiperWrapStr = '<div class="swiper-mainWrap">'+
                                        '<div class="swiper-close rem16"><i></i><i></i></div>'+
                                        '<div class="swiper-container">'+
                                        '<div class="swiper-wrapper">'+
                                            swiperSlideStr+
                                        '</div>'+
                                        '</div>'+
                                    '</div>';
                $('body').append(swiperWrapStr);
                $('.swiper-close').on('click',function(){
                    $('.swiper-mainWrap').hide();
                });
                mySwiper = new Swiper('.swiper-container', {
                    zoom:true
                });
            }
            //统计
            mlive.tabPicClickOStat();
        });

        //点击跳转视频播放页面 VIDEO
        $('.hostVideo').on('click', '.ths-course-item', function(){
            var videoHref = $(this).attr('data-href');
            if(videoHref){
                window.location.href = httpUrl(videoHref);
            }
        });

        //feed短篇观点点赞功能
        mlive.pointclickEvent();

        //点击投顾观点跳转
        $('.wap-container').on('click', '.livePost', function(e){
            if($(e.target).closest('._dollar_').length && getApp() == 'ths'){
                //点击股票代码
                return;
            }
            var $this = $(this);
            funcStat('sns_live_'+window.GFid+'_chat.article');
            setTimeout(function(){
                window.location.href = $this.attr('data-href');
            },200);
        });

    },
    _askBindEvent:function(){
        //我的提问
        $('.askFootermine').click(function(event) {
            sessionStorage.setItem('showTab','4');
            if(!isLogin()){
                doLogin();
                return false;
            }
            mlive.jumpPageStat('ask.doask');
            window.location.href = $(this).attr('data-href');
        });

        //免费提问
        $('.askFooterFree').click(function(event) {
            sessionStorage.setItem('showTab','4');
            if(!isLogin()){
                doLogin();
                return false;
            }
            mlive.jumpPageStat('ask.doask');
            window.location.href = $(this).attr('data-href');
        });

        //列表页 跳转
        $('.main-container').on('click','.hostACon-list li',function(){
            sessionStorage.setItem('showTab','4');
            mlive.jumpPageStat('ask.tasklist');
            window.location.href = $(this).attr('data-href');
        });
    },

    mliveSuggest:function(){
        var strArr = [
        '<div class="bigD-content bigD-contentc1">',
            '<div class="cficon"></div>',
            '<div class="c777 tac cf-text">',
                '取消关注成功',
            '</div>',
        '</div>',
        '<div class="bigD-content bigD-contentc2"></div>'
        ];

        showBigDialog('',strArr.join(''),function(){
            setTimeout(function(){
                $('.bigD-contentc1').animate({'marginTop':-$('.bigD-contentc1').height()},300,function(){});
                $('.bigD-head').text('猜你喜欢');
            },1500);
        });

        $('.bigD-contentc1').css('marginTop',0);

        var oData = {
            type:'unfollow',
            xfids: window.GFid
        };

        mlive._doAjax('/m/live/randomMasterByWeight/',oData,'randomMaster');
    },

    versionLimit:function(){
        if(window.isInApp){
            //插入逻辑 股市教练 1.2.0以下版本不让打开
            var version = +(getAppVersion().split('.').join(''));
            if(version && version < 120){
                //版本小于120
                mlive.updateConfirm();
                idStat('c_c_lbb_zbtc','',{},'ta');
                return;
            }
        }
    },

    /**
     * [_doClickInApp description] 客户端内绑定点击事件
     * @param null
     * @return null
     */
    _doClickInApp : function(){
        $('.hostInfoMain').on('click',function(event){
            mlive.jumpPageStat('des','sns_live_'+window.GFid+'_des');
            var url = $(this).data('url');
            mlive._doJump(url);
        });

        $('.hostSign').on('click',function(event){
            if(isLogin()){
                if(isSign){
                    return false;
                }
                var url = '/m/live/getSignUrl/?fid=' + window.GFid;
                var params = {};
                mlive._doAjax(url,params,'doSign');
            }
            else {
                doLogin();
            }
        });

        //直播
        $('.hostLive').on('touchstart',function(event){
            event.preventDefault();
            var $this = $(this);
            if(!$this.hasClass('selected')){
                // 统计
                if(!sessionStorage.getItem('showTab')){
                    mlive.tabClickStat(1);
                }
                $('.hostNav').removeClass('selected');
                $this.addClass('selected');
                $('.hostTabContent').addClass('hide');
                $('.hostLiveCon').removeClass('hide');

                $('.commonFooter').addClass('hide');
                $('.hostFooter').removeClass('hide');

                window.GPageType = 1;

                //设置高度
                mlive._setHeight();
            }
        })
        .on('touchmove',function(event){})
        .on('touchend',function(event){});

        //T策略
        $('.hostT').on('touchstart',function(event){
            event.preventDefault();
            var $this = $(this);
            if(!$this.hasClass('selected')){
                //股市教练 版本限制
                mlive.versionLimit();
                // 统计
                if(!sessionStorage.getItem('showTab')){
                    mlive.tabClickStat(2);
                }
                $('.hostNav').removeClass('selected');
                $this.addClass('selected');
                $('.hostTabContent').addClass('hide');
                $('.hostTCon').removeClass('hide');

                $('.commonFooter').addClass('hide');
                $('.hostFooter').removeClass('hide');

                window.GPageType = 2;

                // T策略显示
                if(!$this.attr('hasloadtrace') || $this.attr('hasloadtrace') != '1'){
                    var url = '/m/trace/getTacticListAll/?fid='+ window.GFid;
                    var params = {};
                    mlive._doAjax(url,params,'doTraceLayout');
                }
                else {
                    //设置高度
                    mlive._setHeight();
                }
            }
        })
        .on('touchmove',function(event){})
        .on('touchend',function(event){});

        //新闻
        $('.hostN').on('touchstart',function(event){
            event.preventDefault();
            
            var $this = $(this);
            
            if(!$this.hasClass('selected')){
                //股市教练 版本限制
                mlive.versionLimit();
                // 统计
                if(!sessionStorage.getItem('showTab')){
                    mlive.tabClickStat(3);
                }
                $('.hostNav').removeClass('selected');
                $this.addClass('selected');
                $('.hostTabContent').addClass('hide');
                $('.hostNews').removeClass('hide');

                $('.commonFooter').addClass('hide');
                $('.hostFooter').removeClass('hide');
                window.GPageType = 3;


                var url = '',params={};
                // 资讯服务显示
                if(!$this.attr('hasloadzxfw') || $this.attr('hasloadzxfw') != '1'){
                    url = '/m/live/getNewsList/'+ window.GFid+'/';
                    params = {};
                    mlive._doAjax(url,params,'doNewsLayout');

                }else {
                    //设置高度
                    mlive._setHeight();
                }

                //精选帖子显示
                if(!$this.attr('hasloadpost') || $this.attr('hasloadpost') != '1'){
                    url = '/api.php?method=post.getCirclePostFlow';
                    params = {
                        fid:window.GFid,
                        pid:0,
                        limit:10
                    };
                    mlive._doAjax(url,params,'doPostLayout');
                }
            }
        })
        .on('touchmove',function(event){})
        .on('touchend',function(event){});

        //问答 
        $('.hostA').on('touchstart',function(event){
            event.preventDefault();
            var $this = $(this);
            var isGcx = $('#globalParam').attr('data-gcx');
            var fid = $('#globalParam').attr('data-fid');
            if(!$this.hasClass('selected')){
                //股市教练 版本限制
                mlive.versionLimit();

                //红点
                mlive.askRedPoint();
                // 统计
                if(!sessionStorage.getItem('showTab')){
                    mlive.tabClickStat(4);
                }
                $('.hostNav').removeClass('selected');
                $this.addClass('selected');
                
                $('.hostTabContent').addClass('hide');
                $('.hostACon').removeClass('hide');

                $('.commonFooter').addClass('hide');

                if(isGcx == '1'){ //国成信
                    if(isLogin()){ //登录
                        $.ajax({
                            url: '/m/live/isJoinGcx/',
                            type: 'POST',
                            dataType: 'json',
                            data: {'fid':fid},
                            })
                            .done(function(json) {
                                if(json.errorCode == '0'){ //如果加入了圈子
                                    if(json.result == '1'){
                                        $('.askFooter').removeClass('hide');
                                    }
                                }else{
                                    alertBox(json.errorMsg);
                                }
                        }); 
                    }
                }else{//非国成信
                    $('.askFooter').removeClass('hide');
                }

                window.GPageType = 4;

                // T策略显示
                if(!$this.attr('hasloadask') || $this.attr('hasloadask') != '1'){
                    var url = '/m/live/faq/'+window.GFid+'/';
                    var params = {};
                    mlive._doAjax(url,params,'doAskLayout');
                }
                else {
                    //设置高度
                    mlive._setHeight();
                }
            }
        })
        .on('touchmove',function(event){})
        .on('touchend',function(event){});

        //视频课程 yaoyongfang 2017-03-09 14:26:12
        $('.hostV').on('touchstart', function(event){
            event.preventDefault();
            var $this = $(this);
            if(!$this.hasClass('selected')){
                //股市教练 版本限制
                mlive.versionLimit();
                // 统计
                if(!sessionStorage.getItem('showTab')){
                    mlive.tabClickStat(5);
                }

                //统计代码
                funcStat('sns_live_'+window.GFid+'.course.view', 'sns_live, ths_all_broadcast, sns_live_course');

                $('.hostNav').removeClass('selected');
                $this.addClass('selected');
                //切换主体内容
                $('.hostTabContent').addClass('hide');
                $('.hostVideo').removeClass('hide');

                //隐藏底部bar
                $('.commonFooter').addClass('hide');
                $('.hostFooter').removeClass('hide');

                window.GPageType = 5;

                // 加载课程 ,hasloadVideo标识非第一次点击视频tab，已加载数据
                if(!$this.attr('hasloadVideo') || $this.attr('hasloadVideo') != '1'){
                    var params = {
                        'fid': $('#globalParam').attr('data-fid')
                    };
                    mlive._doAjax('/api.php?method=video.getAllVideoByUid&return=json', params, 'doVideoLayout');
                }
                else {
                    //设置高度
                    mlive._setHeight();
                }
            }
        })
        .on('touchmove',function(event){})
        .on('touchend',function(event){});


        $('.hostTCon').on('click', 'div.hostTDetail',function(event){
            var $this = $(this);

            //统计
            var index = $this.index() + 1;
            var tid = $this.attr('data-tid');
            mlive.jumpPageStat('trace.'+index,'sns_st_details_'+tid);

            if($this.hasClass('noTraceDiv')){
                return false;
            }
            // if( !(getAppVersion() && 'iphone' == getPlatform()) ){
                sessionStorage.setItem('showTab','2');
            // }
            var url = $this.data('url');
            mlive._doJump(url);
        });

        $('.hostNews').on('click', 'div.hostNewsDetail',function(event){
            if(!isLogin()){
                doLogin();
                return;
            }
            
            var $this = $(this);
            var url = $this.data('url');
            localStorage.setItem('traceFromUrl',window.location.href);

            //统计
            var index = $this.index() + 1;
            var nid = $this.attr('data-nid');
            mlive.jumpPageStat('view.zxfw.'+index,'sns_zxfw_newslist_'+nid);

            // if(isbooked == '1'){
            // if( !(getAppVersion() && 'iphone' == getPlatform()) ){
                sessionStorage.setItem('showTab','3');
            // }
            mlive._doJump(url);
        });

        $('.host-view-post').on('click','.view-post-sg',function(event){
            var $this = $(this);

            //统计
            var index = $this.index() + 1;
            var pid = $this.attr('data-pid');
            mlive.jumpPageStat('view.pid.'+index,'sns_live_p'+pid);

            sessionStorage.setItem('showTab','3');
            
            var url = $(this).attr('data-url');
            // window.location.href = url;
            closeVideo(url);
        });

        if(window.GCircleType === 'group'){
            $('.server-box').on('click',function(){
                $('.hostInfoMain').trigger('click');
            });
        }

        if(window.isInApp){
            //股市教练更新提示
            mlive._gsjlUpdate();
        }
    },

    /**
     * 加载历史直播
     */
    _loadHistoryLive : function(){
        $('.hostLiveCon').on('click','.load-history',function(){
            var url = '/api.php?method=live.getLiveList';
            var params = {
                'fid' : window.GFid,
                'pid' : mlive._strToObject($('.hostLiveList').eq($('.hostLiveList').length-1).data('action')).pid,
                'sort': 'up',
                'pagesize': 10,
                'allowHtml':1
            };
            if(canLoadHistory){
                canLoadHistory = false;
                mlive._doAjax(url,params,'masterLiveHistory');
            }
        });
    },

    /**
     * [_doScroll description] 滚动条滚动事件
     * @param null
     * @return null
     */
    _doScroll : function(){
        // var $hostContent = $('.hostContent');
        // var $hostConBar = $('.hostConBar');
        var scrollEnd = 0;
        var touchEnd = true;

        $(window).on('scroll',function(event){
            var scrollTopBottom = $(window).scrollTop();
            var documentHeight = $(document).height();
            var windowHeight = $(window).height();


            var $hostInfoBar = $('.hostInfoBar');
            var $hostLiveCon = $('.hostLiveCon');
            // var $hostLiveList = $('.hostLiveList');
            var $hostTCon = $('.hostTCon');
            var $hostNews = $('.hostNews');
            var $hostACon = $('.hostACon');
            var $hostVideo = $('.hostVideo');   //添加视频tab的主体content
            var scrollTop = $(window).scrollTop();
            var hostLiveConH = $hostLiveCon.height();
            var hostTConH = $hostTCon.height();
            var hostNewsH = $hostNews.height();
            var hostAConH = $hostACon.height();
            var hostVideoH = $hostVideo.height();
            var nowIndex = $(".hostConBar .selected").index();
            var contentHeight = 0;
            switch(nowIndex){
                case 0:
                    contentHeight = hostLiveConH;
                    break;
                case 1:
                    contentHeight = hostTConH;
                    break;
                case 2:
                    contentHeight = hostNewsH;
                    break;
                case 3:
                    contentHeight = hostAConH;
                    break;
                case 4:
                    contentHeight = hostVideoH;
                    break;
            }

            var isSmallTanBodyHeight = contentHeight <= $(window).height() + 15;

            if(scrollTop > 10 && !isSmallTanBodyHeight){
                $hostInfoBar.hide();
                $('.bottomWrap').hide();
                // $hostInfoCare.hide();
                // $hostContent.css('margin-top',$hostConBar.height());
                // $hostConBar.css('top','0');
                mlive._setBarPosition();
            }else{
                $hostInfoBar.show();
                $('.bottomWrap').show();
                // $hostInfoCare.show();
                // $hostContent.css('margin-top',$hostInfoBar.height() + $hostConBar.height());
                // $hostConBar.css('top',$hostInfoBar.height() - 1);
                mlive._setBarPosition();
            }

            setTimeout(function(){
                if(touchEnd){
                    scrollEnd = $(window).scrollTop();
                }
            },1000);


            var url,params,pid;
            //下滑加载更多精选帖子
            if($(".hostConBar li.selected").hasClass('hostN')){
                if(scrollTopBottom >= documentHeight-windowHeight-1){
                    var $nomore = $('.hostNews .hostPostList .kong').length;
                    if($nomore === 0){
                        url = '/api.php?method=post.getCirclePostFlow';
                        pid = $('.host-view-post .view-post-sg').last().attr('data-pid');
                        if(pid !== undefined){
                            params = {
                                fid:window.GFid,
                                pid:pid,
                                limit:10
                            };

                            if(canLoadPost){
                                canLoadPost = false;
                                setLoading();
                                mlive._doAjax(url,params,'doPostLayout');
                            }
                        }
                    }
                }
            }

            //Ask
            if($(".hostConBar li.selected").hasClass('hostA')){
                if(scrollTopBottom >= documentHeight-windowHeight-1){
                    var $nomoreAsk = $('.hostACon .kong').length;
                    if($nomoreAsk === 0){
                        url = '/m/live/getMoreFaq/';
                        pid = $('.hostACon-list li').last().attr('data-pid');
                        if(pid !== undefined){
                            params = {
                                fid:window.GFid,
                                pid:pid,
                                limit:10
                            };

                            if(canLoadPost){
                                canLoadPost = false;
                                setLoading();
                                mlive._doAjax(url,params,'doAskLayout');
                            }
                        }
                    }
                }
            }

            //直播间
            if($(".hostConBar li.selected").hasClass('hostLive')){
                // 下滑加载更多历史
                if( scrollTopBottom >= documentHeight-windowHeight-1 && $('.load-history').is(':visible') ){
                    $('.load-history').trigger('click');
                }

                if(scrollTop === 0){
                    var forbiddenFlag = $('#globalParam').attr('data-pulldownforbidden');
                    if(forbiddenFlag == 1){
                        url = '/api.php?method=live.getLiveList';
                        params = {
                            'fid' : window.GFid,
                            'pid' : mlive._strToObject($('.hostLiveList').eq(0).data('action'))['pid'],
                            'sort': 'down',
                            'pagesize': 10,
                            'pulldown':1,//下拉的情况下，当无数据的时候 errorMsg返回 没有最新的直播了
                            'allowHtml':1
                        };

                        if(canLoadLast){
                            canLoadLast = false;
                            setLoading();
                            mlive._doAjax(url,params,'masterLive');
                        }
                    }
                }
            }
 
            //先暂时全部加载所有视频列表
            //视频,滚动加载视频数据 VIDEO  loadOverData=1的时候说明数据加载完毕 
            // if($(".hostConBar li.selected").hasClass('hostV')){
            //     if($(".hostV").attr('loadOverData') && $(".hostV").attr('loadOverData') === '1'){
            //         //存在loadOverData参数，同时它的参数值为1的时候，return;
            //         return;
            //     }
            //     if(scrollTopBottom >= documentHeight-windowHeight-1){
            //         var fid = $('#globalParam').attr('data-fid');
            //         params = {
            //             'fid':fid
            //         };
            //         mlive._doAjax('/api.php?method=video.getAllVideoByUid&return=json', params, 'doVideoLayout');
            //     }
            // }
        });

        $(document).on('touchstart',function(event){
            touchEnd = false;
        })
        .on('touchmove',function(event){})
        .on('touchend',function(event){
            touchEnd = true;
        });
    },

    /*初始化窗口高度*/
    _setHeight : function(){
        // 设置body高度
        var bodyHeight = $('body').height();
        var windowHeight = $(window).height();
        if(bodyHeight < windowHeight){
            $('body').height(windowHeight);
        }
    },

    /**
     * [_doAjax description] 数据请求
     * @param {[string, object, string]} [url, params, type] [请求的url链接，请求传递的参数, 请求的接口]
     * @return null
     */
    _doAjax : function(url, params, type, ajaxtype, ele){
        var requestMethod = ajaxtype ? ajaxtype : 'get';
        $.ajax({
            type: requestMethod,
            url: url,
            data: params,
            dataType: 'json',
            cache: false
        })
        .done(function(data){
            window.GApiFunc[type](data,params,ele);
        })
        .fail(function(){
        })
        .always(function(){
            canLoadHistory = true;
            canLoadPost = true;
            canLoadLast = true;
            removeLoading();
        });
    },

    /**
     * [_doAjaxJSONP description] 数据请求(jsonp格式---只用于获取热度值)
     * @param {[string, object, string]} [url, params, type] [请求的url链接，请求传递的参数, 请求的接口]
     * @return null
     */
    _doAjaxJSONP : function(url, params, type){
        $.ajax({
            type: 'get',
            url: url,
            data: params,
            dataType: 'jsonp',
            cache: false
        })
        .done(function(data){
            window.GApiFunc[type](data);
        })
        .fail(function(){
        })
        .always(function(){});
    },

    /**
     * [_doJump description] 页面跳转
     * @param {[string]} [url] [跳转的url链接]
     * @return null
     */
    _doJump : function(url){
        // var jumpUrl ;
        // isInApp && 'iphone' == platForm ? (jumpUrl = 'client.html?action=ymtz^url='+url+'^webid=2804^fontzoom=no') : (jumpUrl = url);
        // window.location.href = url;
        closeVideo(url);
    },
    _setBarPosition : function(){
        var $h5video = $('.h5-player');
        if($h5video.length && $h5video.css('display') == 'block'){
            $('.hostConBar').css('top',$h5video.height());
            $('.hostContent').css('margin-top',$h5video.height() + $('.hostConBar').height());
        }else{
            $('.hostConBar').css('top',$('.hostInfoBar').height()-1);
            $('.hostContent').css('margin-top',$('.hostConBar').height() + $('.hostInfoBar').height());
        }
    },
    /**
     * [_doLayoutInApp description] 客户端内页面渲染
     * @return {[type]} [description]
     */
    _doLayoutInApp : function(){
        mlive._setBarPosition();
        var url,params;
        var gcxFlag = $('#globalParam').attr('data-gcx');
        if(  gcxFlag == 1 ){
            url = '/api.php?method=live.getLiveList';
            params = {
                'fid' : window.GFid,
                'pid' : 0,
                'sort': 'down',
                'pagesize': 30
            };
            mlive._doAjax(url,params,'masterLive');
        }else{
            mlive.initPidPos();//定位帖子
        }

        //为了防止IOS 默认加载拉动效果 2000 随便定的
        setTimeout(function(){
            $('#globalParam').attr('data-pulldownforbidden','1');
        },2000);
        
        $(window).scrollTop(1);//为了可以向下拉动加载
        
        if( $('.hostLiveListBox .hostLiveList').length >= 30 && $('.load-history-box').is(':hidden') ){
            $('.load-history-box').show();
        }

        window.setTimeout(function(){
            //有部分安卓机，一开始表现出的高度出现问题，设置300毫秒之后重新计算一遍
             mlive._setBarPosition();
        },300);



        // 弹风险提示框
        var guide = new Guide();
        function riskCallback(){
            guide.run(2);
        }

        function askGuideWrap(){
            setTimeout(function(){
                askGuide();
            }, 500);
        }
        var riskhint = new RiskHint(riskCallback);
        guide.register(1,riskhint.init,riskhint);
        guide.register(2,askGuideWrap);
        guide.run();
        
        // 每30秒刷新直播
        var zbRefreshTime = parseInt(mlive._strToObject($('.hostLiveCon').data('action'))['refreshZB']) * 1000;
        window.setInterval(function(){
            var activeFlag = $('.hostLive').hasClass('selected');
            if(activeFlag === false){//处于直播时，才发该请求
                return false;
            }
            var url = '/api.php?method=live.getLiveList';
            var params = {
                'fid' : window.GFid,
                'pid' : mlive._strToObject($('.hostLiveList').eq(0).data('action'))['pid'],
                'sort': 'down',
                'pagesize': 10,
                'setInterval':1,
                'allowHtml':1                
            };
            mlive._doAjax(url,params,'masterLive');
        },zbRefreshTime);

        // 是否关注
        url = '';
        // url = '//testm.10jqka.com.cn/htdocs/eq/mobileuserinfo/app/newcircle/index.php?op=getLikes&userid='+getUserid();
        // url = '//eq.10jqka.com.cn/mobileuserinfo/app/newcircle/index.php?op=getLikes&userid='+getUserid();
        url = '/ucenter/relation/judgeRelation/';

        if(isLogin()){
            mlive._doAjax(url,{follow:GfollowParmas},'isFollowAction','post');
        }
        
        
        // 热度渲染
        var $hostHot = $('.hostHot');
        var rdkey = $hostHot.data('key');
        url = '//bbsclick.10jqka.com.cn/clicks.php'+
        '?callback=jQuery1110036394974403083324_1436450125321&action=add&app=sns&return=jsonp&_=1459912310931&key='+rdkey+
        '&callback=jQuery111009104661571327597_1459912310929&num=1';
        
        mlive._doAjaxJSONP(url,{},'showRD');
        // 每2分钟更新一次
        var rdRefreshTime = parseInt(mlive._strToObject($hostHot.data('action'))['refreshRD']) * 1000;
        window.setInterval(function(){
            var url = '//bbsclick.10jqka.com.cn/clicks.php'+
            '?callback=jQuery1110036394974403083324_1436450125321&action=add&app=sns&return=jsonp&_=1459912310931&key='+rdkey+
            '&callback=jQuery111009104661571327597_1459912310929&num=1';
            mlive._doAjaxJSONP(url,{},'showRD');
        },rdRefreshTime);

        var isHost = mlive._strToObject($('#globalParam').data('action'))['isHost'];
        var $hostSign = $('.hostSign');

        if(isHost == 1){
            url = '/m/live/isSign/';
            params = {
                'masterid' : window.GMasterid
            };
            var showSign = mlive._strToObject($('#globalParam').data('action'))['showSign'];
            if(showSign == '1'){
                $hostSign.removeClass('hide');
                mlive._doAjax(url,params,'followAndSign');
            }
        }
        
        // 显示选项卡
        var showTab1 = sessionStorage.getItem('showTab');
        switch(showTab1){
            case '2':
                $('.hostT').trigger('touchstart');
                break;
            case '3':
                $('.hostN').trigger('touchstart');
                break;
            case '4':
                $('.hostA').trigger('touchstart');
                break;
            case '5': //添加视频地址的模拟点击
                $('.hostV').trigger('touchstart');
                break;
            default: 
                $('.hostLive').trigger('touchstart');
        }
        sessionStorage.removeItem('showTab');
    },

    /**
     * [_doTraceLayout description] 渲染T策略
     * @param {[object]} [data] [ajax返回数]
     * @return null
     */
    _doTraceLayout : function(data){
        if(data.errorCode !== 0){
            $('.hostTCon').html('<div style="text-align:center;color:#949494;margin-top:200px;" class="noTraceDiv">暂无T策略</div>');
            return false;
        }
        var resultT = data.result;
        var html = '';
        if(resultT.length <= 0){
            html = '<div style="text-align:center;color:#949494;margin-top:200px;" class="noTraceDiv">暂无T策略</div>';
            $('.hostTCon').html(html);
        }else {
            $.each(resultT, function(key, value){//
                var valNum = (parseFloat(value.syl30)*100).toFixed(2);
                showPercent = valNum === 0 ? '0.00' : valNum;
                var color = valNum < 0 ? 'greentxt' : 'redtxt';
                html += '<div class="hostTDetail" data-url="'+value.url+'" data-tid="' + value.tid + '">';
                html += '<div class="hostCL">';
                html += '<i>'+value.name+'</i>';
                html += '<span>'+value.description+'</span>';
                html += '</div>';
                html += '<div class="hostSYL"><i class="'+color+'">'+showPercent+'%</i><span>30天收益</span></div>';
                html += '</div>';
            });
            $('.hostTCon').append(html);
        }
        // 设置body高度
        mlive._setHeight();
        setTimeout(function(){
            $(window).scrollTop(0);
        },500);

        $('.hostT').attr('hasloadtrace',1);
    },

    /**
     * [_doNewsLayout description] 渲染资讯服务
     * @param {[object]} [data] [ajax返回数]
     * @return null
     */
    _doNewsLayout : function(data){

        if(data.errorCode === -1){
            $('.host-view-news').hide();
            return false;
        }

        if(data.errorCode !== 0){
            alertBox('请求数据失败，请稍后再试');
            return false;
        }

        var result = data.result.newslist;
        var newscount = data.result.newscount;
        var html = '';

        if(newscount){
            $('.view-news-num').text(newscount);
        }

        if(!result || result.length <= 0){
            $('.host-view-news').hide();
        }else{
        $.each(result,function(key,value){
                html += '<div class="hostNewsDetail" data-url="'+value.url+'" data-nid="' + value.nid + '">';
                html += '<div class="hostNewsC">';
                html += '<div class="hostNewTitle">'+value.name+'</div>';
                html += '<div class="hostNewCont"><span>总观点数：'+value.count+'</span>';
                if(value.price !== 0){
                    html += '<span class="hostNewPrice"><ins>'+value.price+'</ins>元/月</span>';
                }
                html += '</div></div>';
                html += '<div class="hostNewsIcon"><ins></ins></div>';
                html += '</div>';
            });
            $('.hostNewsList').append(html);
        }
        
        // 设置body高度
        mlive._setHeight();
        setTimeout(function(){
            $(window).scrollTop(0);
        },500);

        $('.hostN').attr('hasloadzxfw',1);
    },

    /**
     * 渲染精选帖子列表
     */
    _doPostLayout : function(result){
        var html = '';
        var postArr = result.result.article;
        var total = result.result.total;
        var url = '';
        var reg = /^(http:|https:)/;
        if(result.errorCode === 0){
            if(postArr && postArr.length > 0){
                if($('.view-post-sg').length > 0){
                    //统计,进入此tab浏览器自动滚动，所以判断非第一次的时候才下拉统计
                    var n = parseInt($('.hostNews').attr('data-n'));
                    mlive.clickStat('view.load.' + n);
                    $('.hostNews').attr('data-n',n+1);
                }

                $.each(postArr,function(key,value){
                    if(reg.test(value.wapUrl)){
                        url = value.wapUrl.replace(reg,window.location.protocol);
                    }else{
                        url = window.location.protocol + value.wapUrl;
                    }
                    
                    //帖子详情页区分来源
                    url += '?from=zhibo';

                    html += '<div class="view-post-sg" data-pid="'+value.pid+'" data-userid="'+value.userid+'" data-url="' + url + '">';
                    html += '<div class="rem14 view-post-title clearfix">';
                    html += '<img class="fl view-post-avatar" src="'+value.avatar+'">';
                    html += '<span class="fl title-txt">'+value.title+'</span>';
                    if(value.isTop === 1){
                        html += '<i class="fl settop-icon"></i>';
                    }
                    html += '</div>';
                    html += '<div class="graytext wdwrap view-post-con">'+value.content+'</div>';
                    html += '<div class="rem12 graytext view-post-bt clearfix">';
                    html += '<div class="fl post-scan">';
                    html += '<i class="scan-icon"></i>';
                    html += '<span class="scan-num">'+value.pv+'</span>';
                    html += '</div>';
                    html += '<div class="fr post-date">'+value.ftime+'</div>';
                    html += '</div></div>';
                });
                $('.hostPostList').append(html);
            }else{
                if($('.host-view-post .view-post-sg').length <= 0){
                    $('.host-view-post .emptyimg').show();
                }else if($('.hostPostList .kong').length <= 0){
                    $('.hostPostList').append('<div class="kong">没有更多了</div>');
                }
                mlive.clickStat('view.bottom');
            }
            if(total){
                $('.view-post-num').text(total);
            }
            $('.hostN').attr('hasloadpost',1);
        }else{
            alertBox(result.errorMsg);
        }
    },    /**
     * 渲染精选帖子列表
     */
    _doAskLayout : function(result){
        var askRender = result.result.html;
        if(result.errorCode === 0){
            if(askRender){
                if($('.hostACon-list li').length > 0){
                    //统计,进入此tab浏览器自动滚动，所以判断非第一次的时候才下拉统计
                    var n = parseInt($('.hostACon').attr('data-n'));
                    mlive.clickStat('ask.load.' + n);
                    $('.hostACon').attr('data-n',n+1);
                    $('.hostACon .hostACon-list').append(askRender);
                }else{
                    $('.hostACon').append(askRender);
                }
            }
            $('.hostA').attr('hasloadask',1);
        }else if(result.errorCode === -3){
            //一进入为空
            if($('.hostACon .kong').length <= 0){
                $('.hostACon').append('<div class="kong">没有更多了</div>');
            }
            mlive.clickStat('ask.bottom');
        }else{
            alertBox(result.errorMsg);
        }
    },

    /**
     * 渲染视频列表 yaoyongfang 2017-03-10 20:56:35
     */
    _doVideoLayout : function(json){
        if(json.errorCode === 0){
            //如果数量小于limit的时候，说明下面没有数据了 
            if(json.result.html){
                $('.ths-course-lists').append(json.result.html);
                var $courseItem = $('.ths-course-item[data-readLock="0"]');
                var keyArr = [];
                $courseItem.each(function(){
                    keyArr.push($(this).attr('data-hotkey'));
                });
                //将数据append之前，获取data-hotkey列表，用于获取播放量 
                mlive.setVideoPlayNum(keyArr.join(','));
            }
            mlive._doVideoListCoverInit();
        }else if(json.errorCode === -1){
            //没有数据
            $('.hostConBar .hostV').attr('loadOverData','1');
            alertBox('没有数据了');
        }else{
            alertBox(json.errorMsg);
        }
        $('.hostConBar .hostV').attr('hasloadVideo','1'); //标识已经点击过次tab按钮，已经加载过数据
    },

    //设置视频播放数量 VIDEO
    setVideoPlayNum: function(hotkeys){
        var keys = '', keyArr = [];
        if(!hotkeys){
            //获取单课程的hotkey和系列课程的hotkeys
            if($('.ths-course-item[data-readLock="0"]').length){
                $('.ths-course-item[data-readLock="0"]').each(function(){
                    keyArr.push($(this).attr('data-hotkey'));
                });
                keys = keyArr.join(',');
            }
        }else{
            keys = hotkeys;
        }

        $.ajax({
            url: '//bbsclick.10jqka.com.cn/clicks.php?callback=jQuery1110036394974403083324_1436450125321&action=getList&app=sns&return=jsonp&_=1436450125322&key='+keys,
            type: 'get',
            dataType: "jsonp",
            jsonp: "callback",
            success: function(json){
                if(json.errorcode === 0){
                    var oResult = json.result;
                    //对未锁住的单课程列表进行遍历
                    $('.ths-course-single[data-readLock="0"]').each(function(){
                        var thiskey = $(this).attr("data-hotkey");
                        var resultkey = oResult[thiskey];
                        if(resultkey){
                            //若当前的key值存在
                            resultkey = resultkey >= 10000 ? (resultkey/10000).toFixed(0) + '万':resultkey;
                            $(this).find('.ths-course-playNum').html(resultkey);
                            //将当前的列表锁住，表示已经获取过阅读量
                            $(this).attr('data-readLock','1');
                        }
                    });
                    //对系列课程的的hotkeys遍历 ，同时累加得到总播放数量
                    $('.ths-course-series[data-readLock="0"]').each(function(){
                        var $this = $(this);
                        var thiskey = $(this).attr("data-hotkey");
                        var thiskeyArr = thiskey.split(','); //拆分hotkey
                        var playNum = 0;
                        //遍历系列课程的key数组
                        for(var i=0; i<thiskeyArr.length; i++){
                            var resultkey = oResult[thiskeyArr[i]];
                            if(resultkey){
                                //若当前的key值存在
                                playNum = playNum + parseInt(resultkey);
                            }
                        }
                        playNum = playNum >= 10000 ? (playNum/10000).toFixed(0) + '万': playNum;
                        $this.find('.ths-course-playNum').html(playNum);
                        //将当前的列表锁住，表示已经获取过阅读量
                        $this.attr('data-readLock','1');
                    });
                }
            },
            complete: function(){}
        });
    },

    /**
     * [_masterLiveAction description] 直播接口返回数据处理
     * @param {[object]} [data] [ajax返回数]
     * @return null
     */
    _masterLiveAction : function(data,params){
        if(data.errorCode != '0'){
            if(params.setInterval && params.setInterval == 1){

            }else{
                alertBox(data.errorMsg);
            }
            return false;
        }
        
        var result = data.result, hotkeyArr = [];
        if(result.length > 0){
            $.each(result, function(key,val){
                var html = '';
                var content = val.content || '';
                var img = '';
                if(!!val.img){
                    img = '<img class="hostLiveImg" src="' + val.img + '" alt="直播间图片" />';
                }

                //音频部分
                var audioStr;
                if(!!val.isAudio){
                    var audioWidth;
                    var time = val.audio.time;
                    if(val.audio.time > 60){
                        time = 60;
                    }
                    audioWidth = (60 + 100 / 60 * time)/100;

                    audioStr = '<div class="clearfix">'+
                        '<div style="width:'+audioWidth+'rem;" class="hostvedio fl" data-src="'+val.audio.url+'">'+
                            '<div class="arrow"></div>'+
                            '<div class="bofang"></div>'+
                            '<div class="bofanggif"></div>'+
                            '<div class="loadinggif"></div>'+
                        '</div>'+
                        '<div class="hostvediolen fl">'+val.audio.time+'"</div>'+
                    '</div>';
                }

                if(window.GCircleType == 'single'){
                    html += '<div class="hostLiveList" data-action="pid='+val.id+'">';
                    html += '<img class="hostLiveTime" src="//i.thsi.cn/sns/circle/wapcircle/mlive/live.png">';
                    html += '<div class="hostLiveBox">';
                    html += '<div class="hostLiveInfo">';
                    html += '<span>'+val.ftime+'</span>';
                    html += '</div>';
                }else if(window.GCircleType == 'group'){
                    html += '<div class="hostLiveList" data-action="pid='+val.id+'" >';
                    html += '<img class="hostLiveAvatar" src="' + val.avatar + '">';
                    html += '<div class="hostLiveBox">';
                    html += '<div class="hostLiveInfo clearfix">';
                    html += '<span class="fl">' + val.nickname + '</span>';
                    html += '<span class="fr">' + val.ftime + '</span>';
                    html += '</div>';
                }

                if(!val.isAudio){//没有音频
                    html += '<div class="hostLiveText">'+content+'</div>';
                    if(val.atNickname && val.atNickname !== ''){//如果有回复的话
                        html += '<div class="blueat hostLiveReply">';
                        html += val.atNickname + '：<span class="c777">' + val.atContent + '</span>';
                        html += '</div>';
                    }
                    html += img;
                }else{//有音频的情况
                    html += audioStr;
                }

                //feed流短篇观点显示阅读，评论和点赞
                if(val.livetype === 4){
                    var activeFlag = parseInt(val.isAgree) === 1 ? '':' new-icons-zanActive';
                    html += '<div class="hostLivePoint clearfix c999 rem14" data-pointHotkey="'+val.hotKey+'" data-pointUrl="'+val.pointUrl+'">';
                    html += '<div class="fl hostLivePoint-item point-see tal" data-funcstatid="sns_live_zkbz_jhgd_share"><i class="new-icons-forward"></i><span class="share-text">分享</span></div>';
                    
                    var replyNumVal = parseInt(val.replyNum) > 0 ? val.replyNum:'评论';
                    html += ['<div class="fl hostLivePoint-item point-cmt tac" data-funcstatid="sns_live_zkbz_jhgd_comment">',
                            '<i class="new-icons-info"></i>',
                            '<span class="point-num">'+replyNumVal+'</span>',
                            '</div>'].join('');
                    var agreeVal = parseInt(val.agreeNum) > 0 ? val.agreeNum:'赞';
                    html += ['<div class="fl hostLivePoint-item point-zan tar" data-funcstatid="sns_live_zkbz_jhgd_like">',
                            '<i class="new-icons-zan '+activeFlag+'"></i>',
                            '<span class="point-num">'+agreeVal+'</span>',
                            '</div>'].join('');
                    html += '</div>';

                    //添加bbsclick的id
                    hotkeyArr.push(val.hotKey);
                }

                html += '</div></div>';
                
                $(".hostLiveListBox").prepend(html);
            });

            //feed短篇观点遍历阅读数据
            // mlive.pointReadNumAjax(hotkeyArr.join(','));
        }
    },

    /**
     * [_masterLiveHistoryAction description] 直播接口返回数据处理,加载历史
     * @param {[object]} [data] [ajax返回数]
     * @return null
     */
    _masterLiveHistoryAction : function(data){
        if(data.errorCode == -20){
            //统计
            mlive.clickStat('zhibo.bottom');
            $('.load-history-box').hide();
            $('.hostLiveListBox').append('<div class="c999 tac" style="height:0.40rem;line-height:0.40rem;">没有更多了</div>');
            alertBox(data.errorMsg);
            return false;
        }
        
        if(data.errorCode != '0'){
            alertBox(data.errorMsg);
            return false;
        }
        
        var result = data.result, hotkeyArr = [];
        if(result.length > 0){
            $.each(result, function(key,val){
                var html = '';
                var content = val.content || '';
                var img = '';
                if(!!val.img){
                    img = '<img class="hostLiveImg" src="' + val.img + '" alt="直播间图片" />';
                }

                //音频部分
                var audioStr;
                if(!!val.isAudio){
                    var audioWidth;
                    var time = val.audio.time;
                    if(val.audio.time > 60){
                        time = 60;
                    }
                    audioWidth = (60 + 100 / 60 * time)/100;

                    audioStr = '<div class="clearfix">'+
                        '<div style="width:'+audioWidth+'rem;" class="hostvedio fl" data-src="'+val.audio.url+'">'+
                            '<div class="arrow"></div>'+
                            '<div class="bofang"></div>'+
                            '<div class="bofanggif"></div>'+
                            '<div class="loadinggif"></div>'+
                        '</div>'+
                        '<div class="hostvediolen fl">'+val.audio.time+'"</div>'+
                    '</div>';
                }

                if(window.GCircleType == 'single'){
                    html += '<div class="hostLiveList" data-action="pid='+val.id+'">';
                    html += '<img class="hostLiveTime" src="//i.thsi.cn/sns/circle/wapcircle/mlive/live.png">';
                    html += '<div class="hostLiveBox">';
                    html += '<div class="hostLiveInfo">';
                    html += '<span>'+val.ftime+'</span>';
                    html += '</div>';
                    // html += '<div class="hostLiveText">'+content+'</div>';
                }else if(window.GCircleType == 'group'){
                    html += '<div class="hostLiveList" data-action="pid='+val.id+'" >';
                    html += '<img class="hostLiveAvatar" src="' + val.avatar + '">';
                    html += '<div class="hostLiveBox">';
                    html += '<div class="hostLiveInfo clearfix">';
                    html += '<span class="fl">' + val.nickname + '</span>';
                    html += '<span class="fr">' + val.ftime + '</span>';
                    html += '</div>';
                    // html += '<div class="hostLiveText">' + content + '</div>';
                }

                if(!val.isAudio){//没有音频
                    html += '<div class="hostLiveText">'+content+'</div>';
                    if(val.atNickname && val.atNickname !== ''){//如果有回复的话
                        html += '<div class="blueat hostLiveReply">';
                        html += val.atNickname + '：<span class="c777">' + val.atContent + '</span>';
                        html += '</div>';
                    }
                    html += img;
                }else{//有音频的情况
                    html += audioStr;
                }


                // if(val.atNickname && val.atNickname !== ''){
                //     html += '<div class="blueat hostLiveReply">';
                //     html += val.atNickname + '：<span class="c777">' + val.atContent + '</span>';
                //     html += '</div>';
                // }

                // html = html + img;

                //feed流短篇观点显示阅读，评论和点赞
                if(val.livetype === 4){
                    var activeFlag = parseInt(val.isAgree) === 1 ? '':' new-icons-zanActive';
                    html += '<div class="hostLivePoint clearfix c999 rem14" data-pointHotkey="'+val.hotKey+'" data-pointUrl="'+val.pointUrl+'">';
                    html += '<div class="fl hostLivePoint-item point-see tal" data-funcstatid="sns_live_zkbz_jhgd_share"><i class="new-icons-forward"></i><span class="share-text">分享</span></div>';

                    var replyNumVal = parseInt(val.replyNum) > 0 ? val.replyNum:'评论';
                    html += ['<div class="fl hostLivePoint-item point-cmt tac" data-funcstatid="sns_live_zkbz_jhgd_comment">',
                            '<i class="new-icons-info"></i>',
                            '<span class="point-num">'+replyNumVal+'</span>',
                        '</div>'].join('');

                    var agreeVal = parseInt(val.agreeNum) > 0 ? val.agreeNum:'赞';
                    html += ['<div class="fl hostLivePoint-item point-zan tar " data-funcstatid="sns_live_zkbz_jhgd_like">',
                            '<i class="new-icons-zan '+activeFlag+'"></i>',
                            '<span class="point-num">'+agreeVal+'</span>',
                            '</div>'].join('');
                    html += '</div>';

                    //添加bbsclick的ID到数组
                    hotkeyArr.push(val.hotKey);
                }
                html += '</div></div>';
                
                $(".hostLiveListBox").append(html);
            });

            //统计
            var n = parseInt($('.hostLiveCon').attr('data-n'));
            mlive.clickStat('zhibo.load.' + n);
            $('.hostLiveCon').attr('data-n',n+1);

            //定位
            var posPid = getParam('pid');
            var firstFlag = $('.hostLiveListBox').attr('data-first');
            if(!!posPid && firstFlag != '1'){
                if( $('[data-action="pid='+posPid+'"]').length ){
                    var $livetext = $('[data-action="pid='+posPid+'"]').find('.hostLiveText');
                    $livetext.css('background-color','#efefef').animate({'background-color':'#fff'}, 2000);
                }
                $(window).scrollTop(2);
                $('.load-history-box').show();
                $('.hostLiveListBox').attr('data-first','1');
            }

            //feed短篇观点遍历阅读数据
            // mlive.pointReadNumAjax(hotkeyArr.join(','));
        }
    },

    /**
     * [_followAndSignAction description] 关注和签约接口返回数据处理
     * @param {[object]} [data] [ajax返回数据]
     * @return null
     */
    _followAndSignAction : function(data){
        if(data.errorCode != '0'){
            return false;
        }
        var sign = data.result.sign;

        isSign = '0'== sign ? false : true;

        var $hostSign = $('.hostSign');
        if(isSign){
            $hostSign.text('已签约').addClass('hasSign');
        }
        
        $hostSign.removeClass('hide');
    },

    _doFollow:function(json){
        var neverShow = localStorage.getItem(window.GstrNeverShow);//直播分流标志。当月不再显示
        if(json.errorcode != '0'){
            alertBox(json.errorMsg);
            return false;
        }

        // 关注做缓存
        if(isFollow){
            //已关注，用户现在的行为是取消关注
            //统计
            
            mlive.clickStat('cfocus');

            isFollow = false;
            $('.hostAdd').text('关注').removeClass('hasFollow');
            //如果 需要显示直播分流   逻辑是 当月需要显示
            var date = new Date();
            if(!neverShow && neverShow != date.getMonth()){
                mlive.mliveSuggest();
            }else{
                alertBox('取消关注成功');
            }
        }else{
            //未关注，用户现在的行为是加关注
            //统计
            mlive.clickStat('focus','sns_c_fol');
            
            isFollow = true;
            $('.hostAdd').text('已关注').addClass('hasFollow');
            alertBox('关注成功');
            
        }
    },

    _randomMaster:function(json){
        if(json.errorCode === 0){
            $('.bigD-contentc2').append(json.result);

            //直播推荐绑定事件
            $('.list-suggest-ul li').off().click(function(){
                var url = $(this).attr('data-url');
                //统计代码
                var index = +$(this).index() +1;
                var fid = url.match(/\/(\d*).html/);
                mlive.jumpPageStat('dialogguess.'+index,'sns_live_'+fid);

                if( url ){
                    // window.location.href = url;
                    closeVideo(url);
                }
            });

            $('.bigD-close').off().click(function(event) {
                mlive.clickStat('dialogguess.quxiao');
                hideMask();
                $('.bigDialog').hide();
            });

            $('.bigD-seemore').off().click(function(event) {
                mlive.jumpPageStat('dialogguess.more','sns_live_index');

                // window.location.href = '/m/zhibo/index.html';
                closeVideo('/m/zhibo/index.html');
            });

            $('.nomoreinput').off().click(function(event) { 
                if( $('.nomoreinput').prop('checked') ){
                    //打上勾
                    mlive.clickStat('dialoguess.never');
                    var date = new Date();
                    var month = date.getMonth();
                    localStorage.setItem(window.GstrNeverShow,month);
                }else{
                    //取消打勾
                    localStorage.setItem(window.GstrNeverShow,'');
                }
            });
        }else{
            alertBox(json.errorMsg);
        }
    },

    /**
     * [_getCrbDoFol description] 获取crumb参数 -> 拼接是否关注接口参数
     * @param {[object]} [data] [ajax返回数据]
     * @return null
     */
    _getCrbDoFol : function(data,params,ele){
        if(data.errorcode === 0){
            GcrumbParmas = data.result;
            var that = ele;
            var url = '';
            params = {
                follow:mlive._strToObject(that.attr('data-action'))['follow'],
                crumb:GcrumbParmas
            };

            // 添加关注
            url = '/ucenter/relation/addFollow/';
            mlive._doAjax(url,params,'doFollow');
        }
    },

    /**
     * [_getCrbCheckFol description] 获取crumb参数 -> 拼接判断是否关注接口参数
     * @param {[object]} [data] [ajax返回数据]
     * @return null
     */
    _getCrbCheckFol : function(data){
        if(data.errorcode === 0){
            GcrumbParmas = data.result;
           
        }
    },

    /**
     * [_isFollowAction description] 关注接口返回数据处理 -> 判断是否关注
     * @param {[object]} [data] [ajax返回数据]
     * @return null
     */
    _isFollowAction : function(data){

        var follow = '0';

        if(data.errorcode === 0){
            if(data.result == '0' || data.result == '3'){ //未关注
                follow = '0';
            }else if(data.result == '1' || data.result == '2'){ //已关注
                follow = '1';
            }
        }
        
        isFollow = '0' == follow ? false : true;
        
        //已关注的推进队列 功能在 我的feed流中使用 asset/index.js
        var str = localStorage.getItem('mliveMylikesStr');//最近进入我关注的人的圈子的数组  1,2,3  fid1 为最近登录的圈子
        var fidArr,index;
        var $hostAdd = $('.hostAdd');
        if(isFollow){
            $hostAdd.text('已关注').addClass('hasFollow');

            if(!!str){
                fidArr = str.split(',');
                index = $.inArray(window.GFid,fidArr);
                if(index == -1){//-1不存在
                    fidArr.unshift(window.GFid);
                }else{
                    fidArr.splice(index,1);//删除对应的arr
                    fidArr.unshift(window.GFid);
                }
            }else{
                fidArr = [];
                fidArr.unshift(window.GFid);
            }
            localStorage.setItem( 'mliveMylikesStr', fidArr.join(',') );
        }else{
            $hostAdd.text('关注').removeClass('hasFollow');
            //未关注的情况下，删除关注列表
            if(!!str){
                fidArr = str.split(',');
                index = $.inArray(window.GFid,fidArr);
                if(index != -1){//-1不存在
                    fidArr.splice(index,1);//删除对应的arr
                }
            }
            // if(localStorage.getItem('liveCourse') === '1'){ //如果是从收费活动页进来的话 默认关注展示导流动画
            //     $hostAdd.trigger('click');
            // }
        }
    },

    /**
     * [_showRD description] 显示热度渲染
     * @param  {[object]} data [ajax返回数据]
     * @return null
     */
    _showRD : function(data){
        if(data.errorcode != '0'){
            alertBox(data.errormsg);
            return false;
        }
        var rdValue = 0;
        $.each(data.result, function(key,val){
            rdValue = val;
        });
        $('.hostHot').text(rdValue);
    },

    /**
     * [_doSign description] 签约操作
     * @param  {[object]} data [ajax返回数据]
     * @return null
     */
    _doSign : function(data){
        if(data.errorCode == '-11'){
            // 绑定手机号
            // 统计
            mlive.clickStat('dialogbind');
            var goBindTel = function(){
                mlive.clickStat('dialogbind.ok');
                // window.location.href = '//i.10jqka.com.cn/mobile/newbindPhone.php?platform=' + platForm;
                closeVideo('//i.10jqka.com.cn/mobile/newbindPhone.php?platform=' + window.platForm);
            };
            var goCancel = function(){
                mlive.clickStat('dialogbind.quxiao');
            };
            confirmBox({
                msg:'签约前需要先绑定手机号',
                btnLight:'right',
                leftBtnEvent:goCancel,
                rightBtnEvent:goBindTel
            });
            return false;
        }
        else if(data.errorCode != '0'){
            alertBox(data.errorMsg);
            return false;
        }
        // 统计
        mlive.jumpPageStat('sign','sns_live_'+$('#globalParam').attr('data-creatorid')+'_sign');
        var url = data.result;
        // window.location.href = url;
        closeVideo(url);
    },

    /**
     * [_strToObject description] 字符串转对象
     * @param  {[string]} [str] [形如：uid=12907325&pid=14&cid=34 字符串]
     * @return {[object]}     [返回： {uid:12907325, pid:14, cid:34} 对象]
     */
    _strToObject : function(str){
        var args = {};

        if(typeof str == "undefined" ||  str.indexOf('=') == -1 ){
            return args;
        }
        var pairs = str.split("&");
        for(var i = 0, len = pairs.length; i < len; i++){
            var pos = pairs[i].indexOf('=');
            var argsName = pairs[i].substring(0, pos);
            var value = pairs[i].substring(pos + 1);
            args[argsName] = value;
        }
        return args;
    },

    /**
     * [_mtimeFormat description] 时间戳转换
     * @param  {[int]} [mtime,foramt] [整型时间戳(s),格式化字符串]
     * @return {[str]} [format] [返回格式：10:42]
     */
    _mtimeFormat : function(mtime,format){
        var newDate = new Date();
        newDate.setTime(mtime * 1000);
        var date = {
              "M+": newDate.getMonth() + 1,
              "d+": newDate.getDate(),
              "h+": newDate.getHours(),
              "m+": newDate.getMinutes(),
              "s+": newDate.getSeconds(),
              "q+": Math.floor((newDate.getMonth() + 3) / 3),
              "S+": newDate.getMilliseconds()
       };
       if (/(y+)/i.test(format)) {
              format = format.replace(RegExp.$1, (newDate.getFullYear() + '').substr(4 - RegExp.$1.length));
       }
       for (var k in date) {
              if (new RegExp("(" + k + ")").test(format)) {
                     format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
              }
       }
       return format;
    },
    /**
     * [_ description] 股市教练1.2.0版本以内自动更新机制
     * @param null
     * @return null
     */
    _gsjlUpdate : function(){
        var version = +(getAppVersion().split('.').join(''));
        if(version && version < 120){
            //版本小于120
            var date = new Date();
            var today = date.getDate();
            var updateTxt = 'sns-zhibo-gsjlupdate';
            var updateFlag = localStorage.getItem(updateTxt);
            if( typeof updateFlag == "undefined" || updateFlag != today){
                //弹窗
                localStorage.setItem(updateTxt,today);
                mlive.updateConfirm();
                idStat('c_p_lbb_zbtc','',{},'ta');
            }
        }
    },
    /**
     * [_ description] 打开股市教练 更新弹窗
     * @param null
     * @return null
     */
    updateConfirm : function(){
        var right = function(){
            // window.location.href = '//t.10jqka.com.cn/app/wapdownload/#refCountId=R_575cb77c_537';
            closeVideo('//t.10jqka.com.cn/app/wapdownload/#refCountId=R_575cb77c_537');
        };
        confirmBox({
            msg:'<div>APP版本过低！</div><div class="mt10 p010">新版聊天室等更多精彩内容，立即升级体验！</div>',
            leftBtn:'下次再说',
            rightBtn:'立即升级',
            btnLight:'right',
            rightBtnEvent:right
        });
    },
    //初始化，定位pid
    initPidPos:function(){
        var pid = getParam('pid');
        if(!!pid){
            url = '/api.php?method=live.getLiveList';
            params = {
                'fid' : window.GFid,
                'pid' : pid,
                'sort': 'up',
                'pagesize': 30,
                'hasCurrent':1,
                'allowHtml':1
            };
            $('.hostLiveListBox').empty();
            mlive._doAjax(url,params,'masterLiveHistory');
        }
    },
    /**
     * [_doLayoutInApp description] 问答请求红点
     * @return {[type]} [description]
     */
    askRedPoint : function(){
        if(!isLogin()){
            return false;
        }
        $.ajax({
            url: '/newcircle/message/getunread/',
            type: 'get',
            dataType: 'json'
        })
        .done(function(json) {
            if(json.errorCode === 0){
                if(json.result.answernum > 0){
                    $('.askminehint').css('visibility','visible');
                }
            }
            else{
                alertBox(json.errorMsg);
            }
        })
        .fail(function(){
            alertBox('未读消息获取失败');
        });
    },

    //手抄首页推荐位优化，根据链接是否带clickid，判断是否发送请求
    pidAjax:function(){
        if(getParam('clickid') && parseInt(getParam('clickid')) > 0){
            var newUrl,usearch,searArr;
            var url = window.location.href;
            var oData = {};
            var newSearch = [];
            var r = 0;
            oData.clickid = getParam('clickid');
            if(getParam('type')){
                oData.type = getParam('type');
            }
            $.ajax({
                url: '/m/Live/addClickLiveData',
                type: 'POST',
                data: oData,
                dataType: 'JSON',
                success: function(json){   
                }
            });
            usearch = url.split('?')[1];
            searArr = usearch.split('&');
            for(var i = 0;i < searArr.length;i++ ){
                if((searArr[i].indexOf('clickid') === -1) && (searArr[i].indexOf('type') === -1)){
                    newSearch[r++] = searArr[i];
                }
            }
            if(newSearch.length >= 1){
                newSearch = newSearch.join('&');
                newUrl = url.split('?')[0] + '?' + newSearch;
            }else{
                newUrl = url.split('?')[0];
            }
            history.replaceState({title:document.title},'',newUrl);
        }
    },
    /**
     * @author: yaoyongfang@myhexin.com
     * @date: 2017-02-28 17:04:44
     * @func: feed短篇直播获取阅读数量 bbsclick
     * @remove:2017-05-23 10:51 准备删除。陈斌的需求。改成分享按钮。这段取数据的可以删除。
     */
    pointReadNumAjax:function(res){
        // var key = '', keyArr = [], $hotkeyItem;
        // if(!res){
        //     //不存在res的时候，遍历存在的需要获取阅读数量的
        //     $hotkeyItem = $('[data-pointHotkey]');
        //     if(!$hotkeyItem.length){
        //         //数据为空
        //         return;
        //     }
        //     $hotkeyItem.each(function(){
        //         keyArr.push($(this).attr('data-pointHotkey'));
        //     });
        //     key = keyArr.join(',');
        // }else{
        //     key = res;
        // }

        // $.ajax({
        //     type: 'GET',
        //     url: '//bbsclick.10jqka.com.cn/clicks.php?callback=jQuery1110036394974403083324_1436450125321&action=getList&app=sns&return=jsonp&_=1436450125322&key='+key,
        //     dataType: 'jsonp',
        //     jsonp: 'callback',
        //     success: function(json){
        //         if( json.errorcode === 0 ){
        //             var hotkeyObj = json.result;
        //             $('[data-pointHotkey]').each(function(){
        //                 //对这个回答的上层结构添加鼠标手势，可点击指引
        //                 $(this).parents('.hostLiveBox').css('cursor','pointer');

        //                 var thiskey = $(this).attr('data-pointHotkey');
        //                 var thisHotkeyVal = hotkeyObj[thiskey];
        //                 if(thisHotkeyVal){
        //                     //做超过10万处理
        //                     thisHotkeyVal = thisHotkeyVal >= 100000 ? (thisHotkeyVal/10000).toFixed(0):thisHotkeyVal;
        //                     $(this).find('.point-see .point-num').html(thisHotkeyVal);
        //                 }
        //             });
        //         }
        //     },
        //     error: function(){}
        // });
    },
    /**
     * @author: yaoyongfang@myhexin.com
     * @date: 2017-02-28 18:56:30
     * @func: 点赞接口和点击跳转事件
     */
    pointclickEvent:function(){
        var zanFlag = false;
        $('.hostLiveListBox').on('click','.point-zan',function(){
            var $this = $(this);

            if(!isLogin()){
                doLogin();
                return false;
            }

            if($this.find('.new-icons-zan').hasClass('new-icons-zanActive')){
                alertBox('您已经点过赞了');
                return;
            }
            
            var dataAction = strToObject($(this).parents('.hostLiveList').attr('data-action'));
            if(zanFlag){
               return; 
            }
            $.ajax({
                url: '/newcircle/point/addPointAgree/',
                type: 'post',
                dataType: 'json',
                data: {pid: dataAction.pid},
                beforeSend: function(){
                    zanFlag = true;
                },
                success: function(json){
                    if(json.errorCode === 0){
                        var pointNum = $this.find('.point-num').html();
                        if($.trim(pointNum) !== '赞'){
                            pointNum = parseInt(pointNum)+1;
                        }else{
                            pointNum = 1;
                        }
                        $this.find('.new-icons-zan').addClass('new-icons-zanActive');
                        $this.find('.point-num').html(pointNum);
                        alertBox('点赞成功');
                    }else{
                        alertBox(json.errorMsg);
                    }
                },
                complete:function(){
                    zanFlag = false;
                }
            });
        });

        //点击跳转绑定事件
        $('.wap-container').on('click','.hostLiveList',function(e){
            if($(this).find('.hostLivePoint').length){
                var jumpUrl = $(this).find('.hostLivePoint').attr('data-pointUrl');

                if($(e.target).closest('._dollar_').length){
                    //点击股票代码
                    return;
                }

                if(!$(e.target).closest('.hostLivePoint').length){
                    //非操作栏发送统计代码
                    funcStat('sns_live_zkbz_jhgd_read');
                }

                if($(e.target).closest('.point-cmt').length){
                    //点击评论
                    jumpUrl = jumpUrl + '?to=cmt';
                }

                if(jumpUrl.length && !$(e.target).closest('.point-zan').length && !$(e.target).closest('.point-see').length){
                    window.location.href = jumpUrl;
                }
            }
        });
    },
    /**
     * @author: yaoyongfang@myhexin.com
     * @date: 2017-03-27 10:00:19
     * @func: 初始化配置视频课程选项的list的图片
     */
    _doVideoListCoverInit:function(){
        var coverIndex = 1;
        var $img = $('.ths-course-item .ths-course-img');
        $img.each(function(){
            var $this = $(this);
            if(!$this.attr('data-original').length){
                //不存在封面
                $this.attr('data-original', '//i.thsi.cn/sns/circle/wapcircle/video/cover/video-course-'+coverIndex+'.jpg');
                coverIndex = coverIndex%24+1; //总共24张封面
            }
        });
        $img.picLazyLoad();
    }
};


// 点击播放视频和音频
var videoInterval;
var play = {
    playing : {
        videoStat : 1,
    },
    bt : {},
    init:function(){
        this.BindClickAction();
        if(getPlatform() === 'gphone' && getInnerVersion() >= "G037.08.145"){
            $('.playState').show();
        }else{
            $('.playState').hide();
        }
    },
    BindClickAction:function(){
        var $this = this;
        $('.playState')
        .on('click',function(){//点击播放视频
            $('.attenAlert').show();
            $('.attenAlertVideo').removeClass('hide');
            
        });

        // 音频弹窗
        $('.canvas')
        .on('click',function(){//close canvas
            $('.attenAlert').hide();
            $('.attenAlertVideo').addClass('hide');
        });



        // 视频弹窗
        $('.attenAlertVideo')
        .on('click','.attenAlertBtnCancel',function(){//听声音
            
            $('.canvas').click();
              
        })
        .on('click','.attenAlertBtnYes',function(){//看视频
            $('.canvas').click();
            $this.bt.videoStartTime = parseInt(+new Date()/1000);
            $this.playVideo();
        });

        $(window).on('touchstart',function(){
            if($this.playing.videoStat === 0){
                clearInterval(videoInterval);
                $this.playing.videoStat = 1;
            }
        });
    },
    // 播放视频
    playVideo : function (){
        var strUrl = $('#videoPlayBtn').attr('videourl');
        // var that = this;
        $('.canvas').click();
        callNativeHandler(
            'startPlugin',
            {
                'params': {'url':strUrl ,'title': '直播视频'},
                'cname': 'com.hexin.videoplayplugin.VideoPlayerActivityWithNoSD',
                'pname': 'com.hexin.videoplayplugin',
                'scheme': 'thsvideo'
            },
            function(data) {
            }
        );
        videoInterval = setInterval(function(){
            // hxmClickStat(pageStatId + '.video.ht',{'bt':that.bt.videoStartTime});
        },10000);
       
        this.playing.videoStat = 0;
    },

};


function videoBindEvent(){
    //路演
    var audio = new Audio;
    $('.hostLiveListBox').on('click','.hostvedio',function(event) {
        var date = new Date();
        var dataSrc = $(this).attr('data-src');
        $('.hostvedio').removeClass('vedioplaying').removeClass('vedioloading');
        if( !dataSrc ){ 
            //未暂停
            return false;
        }else if( audio && !audio.paused && audio.src.indexOf(dataSrc) > -1 ){//已经暂停返回true   未暂停false
            audio.pause();
        }else{
            audio.src = dataSrc + '?time=' + date.getTime();
            $(this).addClass('vedioloading');
            audio.play();
        }
        return false;
    });

    $(audio).on('ended',function(){
        $('.hostvedio').removeClass('vedioplaying');
    });

    //已经准备好了
    $(audio).on('canplaythrough',function(){
        $('.hostvedio.vedioloading').removeClass('vedioloading').addClass('vedioplaying');
    });
}

//问答新手引导
function askGuide(){
    var txt = 'wapliveaskguide';
    var askGuideFlag = localStorage.getItem(txt);
    if( typeof askGuideFlag == "undefined" || askGuideFlag != '1'){
        //弹窗
        localStorage.setItem(txt,'1');
        var $hostA = $('.hostA');
        var $hostInfoBar = $('.hostInfoBar');
        var $hostConBar = $('.hostConBar');
        var $h5video = $('.h5-player');
        $hostA.trigger('touchstart');
        $hostConBar.addClass('z1200');

        showMask();
        var strArr = [
            '<div class="wapliveaskguide">',
                '<img src="//i.thsi.cn/sns/circle/wapcircle/mlive/wapliveaskguide.png" alt="" />',
            '</div>'
        ];
        $('body').append(strArr.join(''));

        if($h5video.length && $h5video.css('display') == 'block'){
            $('.wapliveaskguide').css('top',$h5video.height() + $hostConBar.height() + 20);
        }else{
            $('.wapliveaskguide').css('top',$hostInfoBar.height() + $hostConBar.height() + 20);
        }
        

        //guide
        $('.wapliveaskguide').click(function(event) {
            hideMask();
            $('.wapliveaskguide').hide();
            $hostConBar.removeClass('z1200');
        });
        //点击隐藏
        $('.pop_mask1').click(function(){
            $('.wapliveaskguide').trigger('click');
        });
    }
}

var player,playTimer;
var h5video = {
    init: function(){
        if($('.h5-player').length <= 0){
            return false;
        }

        $('.h5-player').show();
        $('.hostInfoBar').hide();
        
        if( $('#h5-video').length > 0 ){
            var scriptsArr = [
                '//s.thsi.cn/sns/sea-modules/jquery/videojs/video.min.js',
                '//s.thsi.cn/sns/sea-modules/jquery/videojs/videojs-contrib-hls.min.js'
            ];
            h5video.loadVideoJs(scriptsArr,function(){
                var cssPath = '//s.thsi.cn/sns/sea-modules/jquery/videojs/video-js.min.css';
                h5video.loadVideoCss(cssPath,function(){
                    player = videojs('h5-video');
                    h5video.videoPlayerBindEvent();
                });
            });
        }

        $('.video-close').click(function(){
            try{
                player.dispose();
            }catch(e){}
            
            $('.h5-player').remove();
            $('.hostInfoBar').show();
            mlive._setBarPosition();
        });
    },
    loadVideoJs:function(scriptsArr,callback){
        //加载js，若有多个js需要串行加载，通过递归加载
        var HEAD = document.getElementsByTagName('head').item(0) || document.documentElement;
        var s = [];
        var scriptsLen = scriptsArr.length - 1;
        var loadProcess = function(i){
            s[i] = document.createElement('script');
            s[i].setAttribute('type','text/javascript');
            s[i].onload = s[i].onreadystatechange = function(){
                if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete' ){
                    this.onload = this.onreadystatechange = null;
                    if(i != scriptsLen){
                        loadProcess(i + 1);
                    }else if( typeof(callback) == 'function' ){
                        callback();
                    }
                }
            };
            s[i].setAttribute('src',scriptsArr[i]);
            HEAD.appendChild(s[i]);
        };
        loadProcess(0);
    },
    loadVideoCss:function(path,callback){
        var HEAD = document.getElementsByTagName('head').item(0) || document.documentElement;
        var videocss = document.createElement('link');
        videocss.setAttribute('rel','stylesheet');
        videocss.setAttribute('type','text/css');
        videocss.setAttribute('href',path);
        HEAD.appendChild(videocss);
        videocss.onload = videocss.onreadystatechange = function() {
            callback();
        };
    },
    videoPlayerBindEvent: function(){
        $('.play-start .video-icon').click(function(){
            $('.play-start').hide();

            var today = (new Date()).getDate();
            var h5VideoRecord = {};

            if(h5video.checkPlayTime() >= 15){
                player.dispose();
                $('.play-end').show();
                return false;
            }else{
                alertBox('您每天有15分钟的试看时间，若想观看完整视频直播，请下载股市教练');
                player.play();
            }
            
            playTimer = window.setInterval(function(){
                var h5VideoTime = h5video.checkPlayTime();
                
                if(h5VideoTime >= 15){
                    player.dispose();
                    $('.play-end').show();
                    window.clearTimeout(playTimer);
                }else{
                    if( !player.paused() ){
                        h5VideoTime ++;
                        h5VideoRecord[today] = h5VideoTime;
                        localStorage.setItem('h5VideoRecord',JSON.stringify(h5VideoRecord));
                    }
                }
            },1000*60);
        });
    },
    checkPlayTime:function(){
        var today = (new Date()).getDate();
        var h5VideoRecord = JSON.parse(localStorage.getItem('h5VideoRecord'));
        if(!!h5VideoRecord && h5VideoRecord[today] !== undefined){
            return h5VideoRecord[today];
        }
        return 0;
    }
};

//导流活动新加func yaoyongfang 20170113
//添加链接带参数锚点
function pageParamMao(){
    //参数待ask，模拟点击问答按钮
    if(window.location.href.indexOf('from=ask')>0){
        $('.hostA').trigger('touchstart');
        // localStorage.setItem('forAskDaoliu',1);
    }
}

//财聚购买送T策略一个月的活动
//yaoyongfang 20170220
//测试圈子使用12007 线上使用 17943 
function cjActivityGift(){
    //非该圈子或者非手抄不不会出现该活动 
    if($('#globalParam').attr('data-fid') !== '17943' || getApp() !== 'ths'){
        return;
    }

    var ajaxFlag = false;
    if(ajaxFlag){
        return;
    }

    var fid = $('#globalParam').attr('data-fid');

    $.ajax({
        url: '/m/trace/isQualification/',
        type: 'get',
        dataType: 'json',
        beforeSend: function(){
            ajaxFlag = true;
        },
        success: function(json){
            if(json.errorCode === 0){
                //添加领取优惠券dom结构
                var html = ['<div class="qsActivity-wrap">',
                                '<div class="qsActivity-close"></div>',
                                '<div class="qsActivity-btn"></div>',
                            '</div>'].join('');
                var btnHtml = '<div class="qsActivity-ctrlbtn"></div>';
                $('.wap-container').append(html);
                $('.wap-container').append(btnHtml);
                funcStat('sns_live_'+fid+'.lingjiang','',{});
                //缓存中存在是否第一次显示弹窗的flag,第一次显示弹窗，之后都显示按钮
                if(localStorage.getItem('qsAZhiboFlag') && localStorage.getItem('qsAZhiboFlag') === '1'){
                    $('.qsActivity-ctrlbtn').show();
                }else{
                    $('.qsActivity-wrap').show();
                    showMask();
                    localStorage.setItem('qsAZhiboFlag','1');
                }
                //浮层中的关闭按钮
                $('.qsActivity-close').on('click',function(){
                    $('.qsActivity-wrap').hide();
                    $('.qsActivity-ctrlbtn').show();
                    hideMask();
                    funcStat('sns_live_'+fid+'.lingjiang.close','',{});
                });
                //领取按钮
                $('.qsActivity-btn').on('click',function(){
                    funcStat('sns_live_'+fid+'.lingjiang.kaitong','',{});
                    setTimeout(function(){
                        window.location.href = '//t.10jqka.com.cn/m/trace/getPrizeTip/?type=qsActivityRisk&from=tactic&origin=zhibo';
                    },100);
                });
                //页面中获取免费T策略的按钮点击
                $('.qsActivity-ctrlbtn').on('click',function(){
                    $('.qsActivity-wrap').show();
                    $('.qsActivity-ctrlbtn').hide();
                    showMask();
                    funcStat('sns_live_'+fid+'.lingjiangclick','',{});
                });
            }else{
                //已领取之后浏览器回滚，再次点击请求后，去除dom结构
                if($('.qsActivity-wrap').length){
                    $('.qsActivity-wrap').remove();
                }
                if($('.qsActivity-ctrlbtn').length){
                    $('.qsActivity-ctrlbtn').remove();
                }
            }
        },
        complete: function(){
            ajaxFlag = false;
        }
    });
}

function shareWeixin(){
    if(getApp() == 'weixin'){
        citeWxJs();
    }
}

$(document).ready(function() {

    if($('#videoInput').attr('data-livertmp').length && getApp() == 'ths' && window.location.href.indexOf('playlive=1') == -1){
        //在直播,同时未跳转过client
        pageVideoJumpLink(window.location.origin+window.location.pathname+'?playlive=1');
        // return;
    }

    if(window.GCircleType == 'single'){
        play.init();
    }

    mlive.init();
    //不在核新产品内使用
    if( navigator.userAgent.toLowerCase().indexOf('hexin') < 0 ){
        h5video.init();
    }
    
    videoBindEvent();

    pageParamMao();

    cjActivityGift();

    new DaoliuCommon();
    shareWeixin();
});