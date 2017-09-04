// @charset "utf-8";
// liukang@myhexin.com
// 2016-07-14
var sizeRate = document.documentElement.clientWidth/375.0*100;
var loadtime = 30*1000;
var isInApp = getAppVersion() ? true : false;
var platForm = getPlatform();
var firstSetMarquee = true;
var globalWidth = 0;

function chatInit(){
	pushPlayLive();
	
	$('html').css('font-size',sizeRate);
	$('.chat-container').css('opacity','1');

	window.GFid = $('#globalParam').attr('data-fid');
	window.GPagestat = 'sns_live_group_'+window.GFid;
	window.loadN = 0;
	globalWidth = $('.chat-avatar').width();
	var fromid = 'sns_live,ths_all_broadcast,sns_live_chat,sns_live_qs'+
				 $('#globalParam').attr('data-qsid')+',sns_live_'+
				 window.GFid+',sns_live_'+getApp();
	if( isInApp ){
        hxmPageStat({'id':window.GPagestat,'fid':fromid});
    }else{
        idStat(window.GPagestat,fromid,{},'ta');
    }
	
    var videoBarHeight;
	try{
		videoBarHeight = $('.hostVideoBar').height() ? $('.hostVideoBar').height() : 0;
	}catch(e){
		videoBarHeight = 0;
	}

	if( $('.chat-list').length ){
		$('.chat-list').css('min-height',$('.chat-body').height() - 20 - videoBarHeight);
		$('.chat-list').css('padding-top',videoBarHeight + 10 + 'px');

		$('.chat-avatar').css('height',globalWidth);
		$('.chat-rank-avatar').css('height',globalWidth - 3);
		$('.chat-rank-avatar').css('width',globalWidth - 3);		

		if( $('.chat-sg').length >= 30 ){
			$('.load-history-box').show();
			$('.chat-list').css('padding-top','0');
		}

		$('.chat-body').scrollTop($('.chat-list').height() + 18 - $('.chat-body').height() - 2);
	}
	
	loadChatLoop();
	bindEvent();
	pointInit(); //短篇观点相关事件绑定和接口初始化
	chatTabInit();
	// playLiveVideo();
	couponInit();

	/*返回主页的统计代码*/
	$('.chat-ask').click(function(){
        jumpStat(window.GPagestat + '.ask','sns_live_' + window.GFid + '_ask');
	});
}

/**
 * @author: yaoyongfang@myhexin.com
 * @date: 2017-05-22 17:03:27
 * @func: 初始化事件绑定
 */
function bindEvent(){
	imgScale();
	loadChatEvent();
	sendChatEvent();
	chatOperateEvent();
	applyJoinCircle();
	videoBindEvent();
	goToTimerLine(window.GPagestat);
	reportBindEvent();

	//点击切换tab
	$('.wap-container').on('click', '.chat-tab-item', function(){
		var $this = $(this);
		$('.chat-tab-item.active').removeClass('active');
		$this.addClass('active');
		if($this.attr('data-tab') == 'live'){
			$(".chat-slider").removeClass('right').addClass('left');
			$('.chat-service').hide();
			$('.chat-live').show();
			sessionStorage.setItem('chatType','live');

			if(firstSetMarquee){ //第一次点击初始化marquee 
				initMarquee();
			}else{
				setVideoBarMarquee();
			}
		}else{
			//点击服务tab
			$(".chat-slider").removeClass('left').addClass('right');
			$('.chat-live').hide();

			if($this.attr('data-lock') == '0'){
				loadServiceModule($('#globalParam').attr('data-fid'), function(json){
					$('.chat-service').append(json.result);
					$('.chat-service').show();
					chatService.init(); //初始化服务模块的代码
					$this.attr('data-lock','1');

					var autoTrigger = $this.attr('data-focusTrigger');
					if(autoTrigger){
						if(autoTrigger == 'sign' && $('.sign-btn').length){
							//触发签约操作
							$('.sign-btn').trigger('click');
						}else if(autoTrigger == 'order'){
							//触发订阅操作
							$('.chat-service').scrollTop($('.cs-trace-box').offset().top-$('.chat-tabs-wrap').height());
						}else{}
						$this.removeAttr('data-focusTrigger');
					}
				});
			}else{
				$('.chat-service').show();
			}
			sessionStorage.setItem('chatType','service');
			window.marquee.remove();
		}
	});

	//点击直播条
	$('.chat-videoBar-arrow').on('click', function(){
		if($(this).parents('.chat-videoBar').hasClass('living')){
			//视频直播状态
			return;
		}
		//跳转直播间
		if($('#videoInput').attr('data-livertmp')){
			chatCloseVideo($('#videoInput').attr('data-livertmp'), $('#globalParam').attr('data-zbhref'));
		}else{
			window.location.href = httpUrl($('#globalParam').attr('data-zbhref'));
		}
	});
}

/*初始化设置tab, 通过参数
	1、to=service 切换服务浮层
	2、to=sign
	3、to=order
	4、sessionStorage 
*/
function chatTabInit(){
	var type1 = getParam('to');
	var type2 = sessionStorage.getItem('chatType');
	var type = type1.length ? type1 : (type2.length ? type2 : 'live');

	switch(type){
		case 'service':
			$('.chat-tab-item[data-tab="service"]').trigger('click');
			break;
		case 'sign':
			$('[data-tab="service"]').attr('data-focusTrigger','sign');
			$('.chat-tab-item[data-tab="service"]').trigger('click');
			break;
		case 'order':
			$('[data-tab="service"]').attr('data-focusTrigger','order');
			$('.chat-tab-item[data-tab="service"]').trigger('click');
			break;
		case 'live':
			$('.chat-tab-item[data-tab="live"]').trigger('click');
			break;
	}
}

/**
 * @author: yaoyongfang@myhexin.com
 * @date: 2017-05-23 11:23:25
 * @func: 跑马灯展示播主最新信息
 */
function initMarquee(){
	getNewInfoAjax(function(json){
		var content ;
		if(!json.result || !json.result[0]){
			content = getNewAdviserInfo();
		}else{
			var resObj = json.result[0];
			content = resObj.content;
			if(!content.length){
				if(!resObj.img){
					//无图无文字
					content = '暂无直播内容';
				}else{
					//有图无文字
					content = '[图片]';
				}
			}
		}
		setVideoBarMarquee(content);
		setInterval(function(){
			setVideoBarMarquee();
		},40000);
		firstSetMarquee = false;
	});
}

//设置marquee
function setVideoBarMarquee(str){
	var $slider = $('.chat-newInfo .newInfo-slider');
	var txt;
	if(str){
		txt = str;
	}else{
		txt = $.trim(getNewAdviserInfo());
	}
	if(txt.length){
		if($slider.length){
			if($slider.text() !== '暂无直播内容' && txt == '暂无直播内容'){
				//老数据为存在数据，新数据为无数据，保留老数据
				return;
			}
			$slider.remove();
		}

		// if(txt == '暂无直播内容'){
		// 	//暂无直播不滚动
		// 	dom = '<div class="newInfo-slider">'+txt+'</div>';
		// }else{
		// 	dom = '<marquee behavior="scroll" direction="left" scrollamount="3" class="newInfo-slider">'+txt+'</marquee>';
		// }
		// $newInfo.append(dom);
		if(txt == $('.chat-newInfo .marqueue-body').text()){
			return;
		}
		if(!$('.chat-newInfo .marqueue-body').length){
			window.marquee.init({
				box:'.chat-newInfo',
				data:txt
			});
		}else{
			window.marquee.reInit(txt);
		}
	}
	firstSetMarquee = false;
}

//获取最新的一条播主信息
function getNewInfoAjax(callback){
	var url = '/api.php?method=live.getLiveList';
    var params = {
        'fid' : window.GFid,
        'pid': 0,
        'sort': 'down',
        'pagesize': 1,
        'pulldown': 0,
        'allowHtml': 0
    };
	$.ajax({
		url: url,
		type: 'get',
		dataType: 'json',
		data: params,
		success: function(json){
			if(callback && $.isFunction(callback)){
				callback(json);
			}
		}
	});
}

//当前聊天流里面获取播主最新的信息
function getNewAdviserInfo(){
	var txt  ='';
	var $adviser;
	if(parseInt($('#globalParam').attr('data-creator'))){
		//播主
		$adviser = $('.chat-sg.mine').last();
	}else{
		//非播主
		$adviser = $('.chat-sg.master').last();
	}

	if($adviser && $adviser.length){
		if($adviser.find('.livePost').length){
			//长文，获取title
			txt = $adviser.find('.livePost').text().slice(0,150);
		}else if($adviser.find('.chat-rankBox').length){
			//战报取标题
			txt = $adviser.find('.chat-title').text();
		}else{
			if(!$adviser.find('.chat-txt').length && $adviser.find('.hostvedio').length){
				//路演信息
				txt = '语音消息，暂不支持查看';
			}else{
				txt = $.trim($adviser.find('.chat-txt').text());
				if(!txt.length && $adviser.find('.chat-txt img').length){
					var $img = $adviser.find('.chat-txt img');
					if($img && $img.attr('title').length){
						txt = $img.attr('title');
					}else{
						txt = '[图片]';
					}
				}
			}
		}
	}else{
		txt = '暂无直播内容';
	}
	return txt;
}

/**
 * @author: yaoyongfang@myhexin.com
 * @date: 2017-05-23 10:10:54
 * @func: 点击服务tab加载数据
 */
var loadServiceFlag = true;
function loadServiceModule(fid, callback){
	if(!loadServiceFlag){
		return;
	}
	loadServiceFlag = false;
	$.ajax({
		url: '/m/live/chatServiceAjax/',
		type: 'get',
		dataType: 'json',
		data: {fid: fid},
		beforeSend: function(){
			setLoading();
		},
		success: function(json){
			if(json.errorCode === 0){
				if(callback && $.isFunction(callback)){
					callback(json);
				}
			}else{
				alertBox(json.errorMsg);
			}
		},
		complete: function(){
			loadServiceFlag = true;
			removeLoading();
		}
	});
}

/**
 * 从一个push的链接进来，需要直接打开视频直播
 * @return {[type]} [description]
 */
// function playLiveVideo(){
// 	if(window.location.href.indexOf('preparelive=1') > 0){
// 		var url = window.location.origin + window.location.pathname + '?startlive=1';
// 		window.location.href = 'client.html?action=livevideo^url='+url+'^title=';
// 		return;
// 	}

// 	if(window.location.href.indexOf('startlive=1') > 0){
//         var html =
//         '<a class="bbs db video-go-live" href="javascript:void(0);">'+
//         '    <span class="lightblue">更多投顾服务</span>'+
//         '    <i class="go-live-icon"></i>'+
//         '</a>';

//         $('.chat-container').prepend(html);

//         $('.video-go-live').click(function(){
//         	funcStat(window.GPagestat + '.moretgfw');
//         	var videoSource = $('#videoInput').attr('data-livertmp');
//         	if(videoSource && videoSource !== ''){
// 		        action = {"url":videoSource,"action":2, "title":$("title").text()};
// 		        callNativeHandler(
// 		            'plVideoControl',
// 		            JSON.stringify(action)
// 		        );
//         	}
//         	var url = $('.hostVideoContent').attr('data-href') + '?chatvideo=1';
//             window.location.href = url;
//         });
//     }
// }

function pushPlayLive(){
	if(window.location.href.indexOf('pushlive=1') > 0){
		var url = window.location.origin + window.location.pathname;
		window.location.href = 'client.html?action=livevideo^url='+(httpUrl(url)+'?startlive=1')+'^title=';
		return;
	}
}

/**
 * 图片放大功能
 */
 var mySwiper;
function imgScale(){
    $('.chat-body').on('click','.chat-img',function(event){
        
        
        var originImagesDom = $('.chat-img');
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

        if(!isInApp){
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
            return false;
        }

        funcStat(window.GPagestat + '.showpic');
    });
}

/**
 * 加载中图标
 */
function loading(loadtxt){
	var loadArr = [];
	loadArr.push(
		'<li class="loading por">',
			'<div class="weui_loading">',
	            '<div class="weui_loading_leaf weui_loading_leaf_0"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_1"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_2"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_3"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_4"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_5"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_6"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_7"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_8"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_9"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_10"></div>',
	            '<div class="weui_loading_leaf weui_loading_leaf_11"></div>',
        	'</div>',
        	'<span class="loading-txt">' + loadtxt + '</span>',
		'</li>'
	);
	return loadArr.join('');
}

/**
 * 加载聊天的触发事件
 * 1.上拉加载
 * 2.下拉加载
 * 3.轮询加载
 * 4.点击消息更新提示加载
 */
function loadChatEvent(){
	$('.chat-container').on('click','.load-history',function(){
		var param = {
			loading:1,
			oData:{
				fid   : window.GFid,
				sort  : 'up',
				master: 0,
				pid   : $('.chat-sg').first().attr('data-pid')
			}
		};

		loadChatAjax(param,function(result){
			if(result.errorCode === 0){
				window.loadN ++;
				funcStat(window.GPagestat + '.load.' + window.loadN);

				$('.chat-list').prepend(result.result);
				var offsetTop = $('[data-pid="' + param.oData.pid + '"].chat-sg').position().top;
				$('.chat-body').scrollTop(offsetTop);
				$('.load-history-box').show();
			}else{
				if(result.errorCode === -3){
					$('.chat-list').prepend('<li class="c999 tac" style="height:0.40rem;line-height:0.40rem;">没有更多了</li>');
					funcStat(window.GPagestat + '.top');
				}else{
					alertBox(result.errorMsg);
					$('.load-history-box').show();
				}
			}
		});
	});

    $('.chat-body').on('scroll',function(){
		var st = $(this).scrollTop();
		var bh = $(this).height();
		var sh = $('.chat-list').height()+18;
		var param;

		//底部上拉加载
		if(st >= sh - bh){
			param = {
				loading:1,
				oData:{
					fid   : window.GFid,
					sort  : 'down',
					master: 0,
					pid   : $('.chat-sg').last().attr('data-pid')
				}
			};
			loadChatAjax(param,function(result){
				funcStat(window.GPagestat + '.load.new');
				if(result.errorCode === 0){
					$('.chat-list').append(result.result);
				}else{
					// alertBox(result.errorMsg);
					$('.chat-body').scrollTop($('.chat-list').height() + 18 - $('.chat-body').height() - 2);
				}
			});
		}

		if(st <= 2 && $('.load-history').is(':visible')){
			$('.load-history').trigger('click');
		}
	});

	//点击投顾观点跳转
    $('.chat-container').on('click', '.livePost', function(e){
    	if($(e.target).closest('._dollar_').length && getApp() == 'ths'){
            //点击股票代码
            return;
        }
        var $this = $(this);
        funcStat(window.GPagestat+'.article');
        setTimeout(function(){
        	window.location.href = $this.attr('data-href');
        },200);
    });
}

/**
 * 轮询加载聊天
 */
function loadChatLoop(){
	if($('.chat-ban').length){
		return;
	}
	
	var loopTime = parseInt($('#globalParam').attr('data-loop'));

	window.setInterval(function(){
		var param = {
			loading : 0,
			oData : {
				fid   : window.GFid,
				sort  : 'down',
				master: 0,
				pid   : $('.chat-sg').last().attr('data-pid')
			}
		};

		loadChatAjax(param,function(result){
			var $cl = $('.chat-list');
			var $cb = $('.chat-body');
			var $ch = $('.chat-hint');
			
			if(result.errorCode === 0){
				if(result.result !== ''){
					var st = $cb.scrollTop();
					var bh = $cb.height();
					var sh = $cl.height();

					//滚动条差不多在底部时，加载出新消息后直接滚动到底部显示
					//否则show出新消息提示条，滚动条不滚动到底部
					if(sh - bh - st <= 20){
						$cl.append(result.result);
						$cb.scrollTop(sh + 18 - bh - 2);
					}else{
						$cl.append(result.result);
						$ch.show().animate({top:'-0.35rem'},200,function(event){
							window.setTimeout(function(){
								$ch.animate({top:'0'},200,function(){
									$(this).hide();
								});
							},2000);
						});
					}
				}
			}
		});
	},loopTime);

	//点击新消息提示
	$('.chat-hint').click(function(){
		var bh = $('.chat-body').height();
		var sh = $('.chat-list').height();
		$('.chat-body').scrollTop(sh + 18 - bh - 2);
	});
}

/**
 * 加载聊天
 */
var loadFlag = false;
function loadChatAjax(param,func){
	if(loadFlag){
		return false;
	}

	//加载周期不小于2秒,防止上下拉加载一次性出现几次请求
	if( (new Date).getTime() - loadtime < 2000 ){
		return false;
	}

	loadFlag = true;
	$.ajax({
		url:'/m/live/getChatList/',
		type:'GET',
		data:param.oData,
		dataType:'json',
		beforeSend:function(){
			if(param.loading == 1){
				var $cb = $('.chat-body');
				var $cl = $('.chat-list');
				if(param.oData.sort === 'up'){
					$cl.prepend(loading('正在努力加载中'));
					$('.load-history-box').hide();
					$cb.scrollTop(0);
				}else{
					$cl.append(loading('正在努力加载中'));
					$cb.scrollTop($cl.height() + 18 - $cb.height() - 2);
				}
			}
		},
		success:function(result){
			if($('.chat-body .loading').length > 0){
				$('.chat-body .loading').remove();
			}
			// 聊天轮询中 体验券相关
			if(result.ticketInfo){ //有新体验券
				if($('.receive-wait').length === 0){ //进入直播间没有
					if(result.ticketInfo.html){
						$('.wap-container').append(result.ticketInfo.html);
						couponCountDown(result.ticketInfo.countDown);
						$('#globalParam').attr('data-ticketid',result.ticketInfo.ticketid);
						$('.coupon-enter').show();
					}
				}
			}
			func(result);
			$('.chat-avatar').css('height',globalWidth);
			$('.chat-rank-avatar').css('height',globalWidth - 3);
			$('.chat-rank-avatar').css('width',globalWidth - 3);
			pointReadNumAjax(); //获取阅读数量
			if(!firstSetMarquee){
				setVideoBarMarquee(); //重置marquee
			}
		},
		error:function(){
			if($('.chat-body .loading').length > 0){
				$('.chat-body .loading').remove();
			}
			alertBox('加载失败');
		},
		complete:function(){
			loadFlag = false;
			loadtime = (new Date()).getTime();
		}
	});
}

/**
 * 编辑、发送聊天的事件绑定
 */
function sendChatEvent(){
	var inputHeight = $('#chatInput').height() - 2;
	$('#chatInput').on("input", function () {
		var chatVal = $.trim( $(this).val() );
		if(chatVal.length > 0){
			$('#chatSubmit').removeClass('btn-disable').addClass('btn-able');
		}else{
			$('#chatSubmit').removeClass('btn-able').addClass('btn-disable');
		}


		var opts = {
            maxHeight : inputHeight * 4,
            minHeight : inputHeight
        };

        var height,style = this.style;
        style.height = opts.minHeight + 'px';

        if (this.scrollHeight > opts.minHeight) {
            if (opts.maxHeight && this.scrollHeight > opts.maxHeight) {
                height = opts.maxHeight;
            } else {
                height = this.scrollHeight;
            }
            style.height = height  + 'px';
        }
    });

	$('#chatInput').on('click',function(event){

		//第三方输入法没有把输入框顶起，需要将滚动条滚到底部才能显示出输入框
		window.setTimeout(function(){
			$('html,body').scrollTop($(document).height() - $(window).height() - 2);
		},200);
		
		var $input = $(this);
		
		var isCreator = $('#globalParam').attr('data-creator');
		var isMember = $('#globalParam').attr('data-member');
		var isApply = $('#globalParam').attr('data-apply');
		var joinStatus = $('#globalParam').attr('data-join');

		//isCreator，0：非播主，1：播主
		//isMember，0：非成员，1：成员
		//isApply，0：不在进圈申请中；1：进圈申请中
		//joinStatus，0：自由加入；1：申请加入；2：已关闭加入

		if( $input.attr('chat-check') === '1' ){
			showTextarea();
			return false;
		}

		if( !isLogin() ){
			$input.blur();
			doLogin();
			return false;
		}

		if(isMember != '1' && isCreator != '1'){
			funcStat(window.GPagestat + '.joinf');

			//非播主、非成员，需要进入圈子才能发言
			$input.blur();

			if(isApply == '1'){
				$input.blur();
				remindBox({
					msg:'您的申请正在审核中',
					btn:'知道了'
				});
				return false;
			}

			if(joinStatus == '0'){
				confirmBox({
                	msg:'加入才能发言哦',
                	rightBtn:'加入',
                	btnLight:'right',
                	leftBtnEvent:function(){
                		funcStat('dialog.canceljoin');
                	},
                	rightBtnEvent:function(){
                		//统计
						funcStat('dialog.jointishi');

						joinCircleAjax(function(result){
							if(result.errorCode === 0){
								$('.confirm').hide();
								hideMask();
								alertBox('加入成功');
								window.setTimeout(function(){
									var href = window.location.href;
									closeVideo(href);
								},1000);
							}else{
								alertBox(result.errorMsg);
							}
						});
                	}
                });
			}else if(joinStatus == '1'){
				applyJoinCircleAjax(function($alert,result){
					if(result.errorCode === 0){
						$('#globalParam').attr('data-apply','1');
						alertBox('已提交申请');
						$alert.remove();
						hideMask();
					}else{
						alertBox(result.errorMsg);
					}
				});
			}else if(joinStatus == '2'){
				funcStat(window.GPagestat + '.dialog.joinclose');
				remindBox({
					msg:'播主已关闭加入',
					btn:'知道了'
				});
			}

			return false;
		}

		if($input.attr('data-ajax') == '1'){
			return false;
		}

		$input.blur();
		$input.attr('data-ajax','1');
		$.ajax({
			url:'/m/live/canLive/',
			type:'GET',
			async: false,
			dataType:'json',
			success:function(result){
				if(result.errorCode === 0){
					$input.focus();
					showTextarea();
					$input.attr('chat-check',1); //1:有权限发布
				}else if(result.errorCode === -99){
					$input.blur();
					//绑定手机号
					funcStat(window.GPagestat + '.bddialog');
					confirmBox({
						msg:'绑定手机号发帖更顺畅哦！',
						rightBtn:'去绑定',
						btnLight:'right',
						rightBtnEvent:function(){
							funcStat(window.GPagestat + '.dialog.bindphone');
							closeVideo('//i.10jqka.com.cn/mobile/newbindPhone.php?platform=' + platForm);
						}
					});
				}else if(result.errorCode === -24){
					$input.blur();
					//登录异常
					remindBox({
						msg:'登录异常，请重新登录！',
						btn:'确定',
						callback:function(){
							doLogin();
						}
					});
				}else{
					$input.blur();
					alertBox(result.errorMsg);
				}
			},
			complete:function(){
				$input.attr('data-ajax','0');
			}
		});
	});

	$('#chatSubmit').click(function(){
		sendChatAjax($('#chatInput'));
	});

	$('.top-input-cancel').click(function(){
		$('.chat-foot').show();
		$('.chat-top-input').hide();
		hideMask();
		$('.chat-body').scrollTop($('.chat-list').height() + 18 - $('.chat-body').height() - 2);
	});

	$('.top-input-send').click(function(){
		sendChatAjax($('#topInput'));
	});
}

/**
 * 发送聊天事件
 */
var submitFlag = false;
function sendChatAjax($input){
	var chatVal = $.trim( $input.val() );

	funcStat(window.GPagestat + '.fatie');

	if(submitFlag){
		return false;
	}

	if( !isLogin() ){
		doLogin();
		return false;
	}
	
	if( chatVal.length <= 0 ){
		alertBox('请输入内容');
		return false;
	}

	if( chatVal.length > 150 ){
		alertBox('发布内容不得多于150个字');
        return false;
    }

    var oData = {
		fid     : window.GFid,
		content : chatVal
	};

    submitFlag = true;
    $.ajax({
		url:'/m/live/addLive/',
		type:'GET',
		data:oData,
		dataType:'json',
		success:function(result){
			var $cl;
			var $cb;
			if(result.errorCode === 0){
				funcStat(window.GPagestat + '.fatie.success',window.GPagestat+'.fatie');

				$cl = $('.chat-list');
				$cb = $('.chat-body');

				$input.val('');
				if($('.chat-list .chat-empty').length > 0){
					$('.chat-list .chat-empty').remove();
				}
				$cl.append(result.result);
				$cb.scrollTop($cl.height() + 18 - $cb.height() - 2);
				$('.chat-avatar').css('height',globalWidth);
				$('.chat-rank-avatar').css('height',globalWidth - 3);
				$('.chat-rank-avatar').css('width',globalWidth - 3);

				$('#chatInput').css('height','0.28rem');

				if( $input.attr('id') === 'topInput' ){
					$('.top-input-cancel').trigger('click');
				}else{
					$('#chatSubmit').removeClass('btn-able').addClass('btn-disable');
				}

				if(!firstSetMarquee){
					setVideoBarMarquee(); //重置marquee
				}
			}else if(result.errorCode === -3 || result.errorCode === -50){
				//审核中状态
				funcStat(window.GPagestat + '.fatie.success',window.GPagestat+'.fatie');
				
				$cl = $('.chat-list');
				$cb = $('.chat-body');
				
				$input.val('');
				alertBox(result.errorMsg);
				
				$cb.scrollTop($cl.height() + 18 - $cb.height() - 2);
				$('#chatInput').css('height','0.28rem');
				
				if( $input.attr('id') === 'topInput' ){
					$('.top-input-cancel').trigger('click');
				}else{
					$('#chatSubmit').removeClass('btn-able').addClass('btn-disable');
				}
			}else if(result.errorCode === -23){
				funcStat(window.GPagestat + '.fatie.fail',window.GPagestat+'.fatie');
				TA.log({'id':'mo_5790a753_986'});
				TA.log({'id':'mo_zbjlts_' + window.GFid});
				remindBox({
					msg:'发言人好多，稍等一会吧',
					btn:'确定',
					callback:function(){
						funcStat(window.GPagestat + '.dialog.postmuch');
					}
				});
			}else if(result.errorCode === -99){
				funcStat(window.GPagestat + '.fatie.fail',window.GPagestat+'.fatie');
				applyJoinCircleAjax(function($alert,result){
					if(result.errorCode === 0){
						$('#globalParam').attr('data-apply','1');
						alertBox('已提交申请');
						$alert.remove();
						hideMask();
					}else{
						alertBox(result.errorMsg);
					}
				});
			}else{
				funcStat(window.GPagestat + '.fatie.fail',window.GPagestat+'.fatie');
				alertBox(result.errorMsg);
			}
		},
		error:function(){
			funcStat(window.GPagestat + '.fatie.fail',window.GPagestat+'.fatie');
			alertBox('操作失败');
		},
		complete:function(){
			submitFlag = false;
		}
	});
}

/**
 * 隐藏底部输入框，显示顶部输入框
 * @return {[type]} [description]
 */
function showTextarea(){
	if(getApp() == 'ths' && platForm != 'iphone'){
		$('.chat-foot').hide();
		$('.chat-top-input').show();
		$('#topInput').focus();
		showMask();
		$('.chat-body').scrollTop($('.chat-list').height() + 18 - $('.chat-body').height() - 2);
	}
}

/**
 * 对消息的举报
 */
var touchtime = 0;
function chatOperateEvent(){
	var $op = $('.chat-operate');

	//举报
	$op.find('.report-btn').click(function(){

		funcStat(window.GPagestat + '.menu.report');

		if( !isLogin() ){
			doLogin();
			return false;
		}
		
		var oData = {
    		userid      : $op.attr('target-uid'),
			pid   		: $op.attr('target-pid'),
			resourceid  : 3
		};
		$.ajax({
			url:'/newcircle/report/addreport/',
			type:'post',
			data:oData,
			dataType:'json',
			success:function(result){
				if(result.errorCode === 0){
					alertBox('举报成功');
				}else{
					alertBox(result.errorMsg);
				}
			},
			error:function(){
				alertBox('举报失败');
			},
			complete:function(){
				$op.animate({bottom:'-150px'},200,function(){
					$(this).hide();
					hideMask();
				});
			}
		});
	});

	//取消
	$op.find('.report-close').click(function(){
		$op.animate({bottom:'-150px'},200,function(){
			$(this).hide();
			hideMask();
		});
	});

	$('body').on({
		touchstart:function(event){
			var $tgt = $(event.target);
			var tgtpid = $tgt.parents('.chat-sg').attr('data-pid');
			var tgtuid = $tgt.parents('.chat-sg').attr('data-uid');
			touchtime = window.setTimeout(function(){
				//实现长按
				touchtime = 0;
				showMask();
				$op.attr('target-pid',tgtpid).attr('target-uid',tgtuid);
				$op.show().animate({bottom:'10px'},200);
				funcStat(window.GPagestat + '.menu');
			},500);
		},
		touchmove:function(){
			window.clearTimeout(touchtime);
			touchtime = 0;
		},
		touchend:function(){
			window.clearTimeout(touchtime);
			return;
		}
	},'.chat-content');
}

/**
 * 加入才能浏览圈子的页面
 * 申请加入||直接加入
 */
function applyJoinCircle(){
	$('.chat-ban-btn').click(function(){
		if( !isLogin() ){
			doLogin();
			return false;
		}

		funcStat(window.GPagestat + '.joina');

		var isapply = $(this).attr('data-type');
		if(isapply == '1'){
			//申请加入
			applyJoinCircleAjax(function($alert,result){
				if(result.errorCode === 0){
					alertBox('已提交申请');
					$('.chat-ban .chat-ban-btn').remove();
					$('.chat-ban').append('<a href="javascript:void(0);" class="graybtn chat-in-check">申请审核中</a>');
					$alert.remove();
					hideMask();
				}else{
					alertBox(result.errorMsg);
				}
			});
		}else{
			//直接加入
			joinCircleAjax(function(result){
				if(result.errorCode === 0){
					alertBox(result.errorMsg);
					window.setTimeout(function(){
						var href = window.location.href;
						closeVideo(href);
					},1000);
				}else{
					alertBox(result.errorMsg);
				}
			});
		}
	});
}


/**
 * 加入圈子
 */
var joinFlag = false;
function joinCircleAjax(successFunc){
	if(joinFlag === true){
		return false;
	}

	if( !isLogin() ){
		doLogin();
		return false;
	}

	var oData = {
		fid  : window.GFid
	};

	joinFlag = true;
	$.ajax({
		url:'/newcircle/group/join/',
		type:'GET',
		data:oData,
		dataType:'json',
		success:function(result){
			successFunc(result);
		},
		error:function(){
			alertBox('操作失败');
		},
		complete:function(){
			joinFlag = false;
		}
	});
}

/**
 * 申请入圈
 */
var applyFlag = false;
function applyJoinCircleAjax(successFunc){

	var joinReason = '请填写申请理由,不少于5个字';
	//猎金圈子特殊化需求
	if(parseInt($('#globalParam').attr('data-fid')) === 17902 ){
		joinReason = '申请格式：你的姓名+交易账号';
	}

	sendformBox({
		title:'加入才能发言哦',
		leftBtn:'取消',
		rightBtn:'加入',
		rows:6,
		placeholder: joinReason,
		leftFunc:function(){
			funcStat(window.GPagestat + '.dialog.cancelreason');
			$('.sendform').remove();
			hideMask();
		},
		rightFunc:function($alert){

			funcStat(window.GPagestat + '.dialog.joinreason');

			if(applyFlag === true){
				return false;
			}

			if( !isLogin() ){
				doLogin();
				return false;
			}

			var reason = $.trim( $alert.find('textarea').val() );
			if(reason === ''){
				alertBox('请填写你的申请理由');
				return false;
			}
			if(reason.length <= 5){
				alertBox('申请理由需要超过5个字');
				return false;
			}

			var oData = {
				fid      : window.GFid,
				reason   : reason
			};

			applyFlag = true;
			$.ajax({
				url:'/newcircle/group/join/',
				type:'GET',
				data:oData,
				dataType:'json',
				success:function(result){
					successFunc($alert,result);
				},
				error:function(){
					alertBox('提交申请失败');
				},
				complete:function(){
					applyFlag = false;
				}
			});
		}
	});
}

function videoBindEvent(){
    //路演
    var audio = new Audio;
    $('.chat-body').on('click','.hostvedio',function(event) {
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

/**
 * @author: yaoyongfang@myhexin.com
 * @date: 2017-04-20 17:12:51
 * @func: 添加短篇观点操作栏的js操作
 */
function pointInit(){
	pointReadNumAjax();
	pointZanBindEvent();
}
//请求阅读数量
function pointReadNumAjax(res){
    var key = '', keyArr = [], $hotkeyItem;
    if(!res){
        //不存在res的时候，遍历存在的需要获取阅读数量的
        $hotkeyItem = $('[data-pointHotkey]');
	    if(!$hotkeyItem.length){
	        //数据为空
	        return;
	    }
        $hotkeyItem.each(function(){
	        keyArr.push($(this).attr('data-pointHotkey'));
	    });
	    key = keyArr.join(',');
    }else{
        key = res;
    }

    $.ajax({
        type: 'GET',
        url: '//bbsclick.10jqka.com.cn/clicks.php?callback=jQuery1110036394974403083324_1436450125321&action=getList&app=sns&return=jsonp&_=1436450125322&key='+key,
        dataType: 'jsonp',
        jsonp: 'callback',
        success: function(json){
            if( json.errorcode === 0 ){
                var hotkeyObj = json.result;
                $('[data-pointHotkey]').each(function(){
                    //对这个回答的上层结构添加鼠标手势，可点击指引
                    var thiskey = $(this).attr('data-pointHotkey');
                    var thisHotkeyVal = hotkeyObj[thiskey];
                    //做超过10万处理
                    if(thisHotkeyVal){
	                    thisHotkeyVal = thisHotkeyVal >= 100000 ? (thisHotkeyVal/10000).toFixed(0)+'万':thisHotkeyVal;
	                    $(this).find('.chat-operate-read span').html(thisHotkeyVal);
                    }
                });
            }
        },
        error: function(){}
    });
}
//点赞，评论跳转
var zanFlag = false;
function pointZanBindEvent(){
	$('.wap-container').on('click', '.chat-operate-zan', function(){
		var $this = $(this);
        if(!isLogin()){
            doLogin();
            return false;
        }

        if($this.find('.chat-icon-zan').hasClass('active')){
            alertBox('您已经点过赞了');
            return;
        }
        
        var dataAction = strToObject($(this).parents('.chat-operateBox').attr('data-pointAction'));
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
                    var pointNum = $this.find('[data-num]').attr('data-num');
                    pointNum = parseInt(pointNum)+1;
                    $this.find('i').addClass('active');
                    $this.find('[data-num]').html(pointNum).attr('data-num',pointNum);
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
	$('.wap-container').on('click', '.chat-point .chat-content', function(e){
		var href = httpUrl($(this).find('.chat-operateBox').attr('data-pointHref'));
		if($(e.target).closest('.chat-operate-zan,.wap-idicons').length){
			//点赞
			return;
		}
		if($(e.target).closest('.chat-bubble').length){
			// funcStat('sc_live_qlms_jhgd_read');
		}
		if($(e.target).closest('.chat-operate-cmt').length){
			href = href+'?to=cmt';
		}
		window.location.href = href;
	});
}

//比赛消息 推送报名点击
function reportBindEvent(){
	$('.wap-container').on('click','.chat-btnBox-btn',function(){
		var url = httpUrl($(this).attr('data-shareUrl'));
		funcStat('sns_live_group_'+window.GFid+'.bmtz');
		window.location.href = url;
	});
}

/**
*author:lixinyi
*title:体验券领取
*date:2017-05-08
*desc:体验券领取相关
*/
function couponInit(){
	var timeCount = parseInt($('#globalParam').attr('data-countdown'));
	var hasCoupon = $('#globalParam').attr('data-canReceiveTicket') || 1;
	if(hasCoupon == '1'){
		couponCountDown(timeCount);
		$('.coupon-enter').show();
	}
	couponEventBind();
}

// 倒计时
function couponCountDown(timeCount){
	var min = parseInt(timeCount/60);
	var sec = parseInt(timeCount%60);
	var timer = setTimeout(function(){
		if(timeCount === 0){
			clearTimeout(timer);
			$('.coupon-operate').addClass('active');
			$('.coupon-enter .time-countdown').hide();
			$('.receive-wait .coupon-timecount').text('快去开启红包');
			return false;
		}
		timeCount--;
		couponCountDown(timeCount);
	},1000);
	if(timeCount < 10){ //小于10秒
		if(timeCount === 0){
			$('.coupon-enter .time-countnum').text('');
		}else{
			$('.coupon-enter .time-countnum').text('00:'+'0'+timeCount);
			$('.coupon-timecount .time-countnum').text(timeCount);	
		}
	}else if(timeCount >= 10 && timeCount < 60){ //小于1分钟 大于10秒
		$('.time-countnum').text('00:'+timeCount);
		$('.coupon-timecount .time-countnum').text(timeCount);	
	}else if(timeCount >= 60){ //大于1分钟
		if(min < 10){ //小于10分钟
			if(sec < 10){ //小于10秒
				$('.time-countnum').text('0'+min+':'+'0'+sec);
			}else{
				$('.time-countnum').text('0'+min+':'+sec);
			}
		}else{
			if(sec < 10){ //小于10秒
				$('.time-countnum').text(min+':'+'0'+sec);
			}else{
				$('.time-countnum').text(min+':'+sec);
			}
		}
	}
}

// 事件绑定
function couponEventBind(){

	// 体验券入口 打开体验券
	$('.wap-container').on('click','.coupon-enter',function(){
		if(!isLogin()){
			doLogin();
			return;
		}
		showMask();
		$('.receive-wait').show();
		$(this).hide();
	});

	// 关闭体验券 
	$('.wap-container').on('click','.coupon-close',function(){
		var self = $(this);
		hideMask();
		self.closest('.coupon-receive').hide();
		if(self.hasClass('active')){ // 是否已经抢过
			$('.coupon-enter').show();
		}
	});

	// 领取体验券
	$('.wap-container').on('click','.coupon-operate',function(){
		if($(this).hasClass('active')){  //倒计时结束才能抢
			$(this).addClass('couponRotate');
			var random = Math.random()*2000;
			setTimeout(function(){
				couponReceiveAjax();
			},random);
		}
	});

	$(document).on('click','.pop_mask1',function(){
		if($('.coupon-receive').css('display') != 'none'){
			$('.wap-container .coupon-close').trigger('click');
		}
	});
	
}

// 领取体验券ajax
var couponFlag = false;
function couponReceiveAjax(){
	if(couponFlag){
		return false;
	}
	couponFlag = true;
	var oData = {
		ticketid:$('#globalParam').attr('data-ticketid')
	};
	$.ajax({
		url:'/m/live/receiveTicket/',
		type:'GET',
		data:oData,
		dataType:'json',
		success:function(result){
			// 只要成功发了请求 就应该隐藏入口 和 待领取体验券
			$('.receive-wait').hide();
			$('.coupon-enter').hide();
			$('.coupon-operate').removeClass('couponRotate');
			$('.receive-wait .coupon-close').removeClass('active'); // 关闭
			// 领取成功 领取失败都一样 延迟3S隐藏
			if(result.result.html){
				$('.wap-container').append(result.result.html);
				setTimeout(function(){
					$('.wap-container .coupon-close').trigger('click');
				},3000);
			}
		},
		error:function(result){
			alertBox('您的网络开了小差哦');
			couponFlag = false;
		},
		complete:function(){
			couponFlag = false;
		}
	});
	
}

$(document).ready(function(){
	chatInit();

	$(".chat-ask").on('click',function(){
		var url = $(this).data('href');
		closeVideo(url);
	});

	addCircleVipTip(window.GPagestat, $('.wap-container')); //加V
	new DaoliuCommon();
});