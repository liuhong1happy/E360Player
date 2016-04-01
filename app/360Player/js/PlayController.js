var $iconPlay = $("#icon-play"),$timebar = $("#timebar"),$videoContainer = $("#video-container"),$iconNext = $("#icon-next"),
    $iconPrevious = $("#icon-previous"),$videoList = $("#videolist-container"),$volumeContainer = $("#volume-container"),$playProgress = $("#play-progress"),
    $volumeProgress = $("#volume-progress"),$volumebar = $("#volumebar"),$iconVolume = $("#icon-volume"),$timebarButton = $("#timebar-button"),
    $volumeButton = $("#volume-button"),$loopButton = $("#loop-button"),$container=$("#container"),$controller=$("#controller"),$progress = $("#progress"),
    $videolistControllerButton = $("#videolist-controller-button"),$videolistController=$("#videolist-controller"),$videolistControllerSplitter = $("#videolist-controller-splitter"),
    $videoName = $("#video-name"), $videoPosition = $("#video-position");

var $flatScreenContainer = $("#flat-screen-container"), $flatScreenRect = $("#flat-screen-rect");
var flatScreen = document.getElementById("flat-screen");
var flatScreenContext = flatScreen.getContext( '2d');

var VideoTime = {
    parse:function(time){
        // time 时间戳 单位秒
        time = parseInt(time);
        
        var toTwoChar = function(i){
            return (i/100).toFixed(2).split(".")[1]
        }
        
        if(time<60){
            return "00:"+toTwoChar(time);
        }else if(time<3600){
            return toTwoChar(parseInt(time/60)) +":"+toTwoChar(time%60);
        }else if(time<3600*24){
            var hour = parseInt(time/3600);
            var _time = time%3600;
            return toTwoChar(hour)+":"+ toTwoChar(parseInt(_time/60)) +":"+toTwoChar(_time%60);
        }
    }
}

var PlayerStorage = {
    getPlayList:function(){
        var json = window.localStorage.getItem("playlist");
        var playlist = json==null ?[]:JSON.parse(json);
        for(var i=0;i<playlist.length;i++){
            var file_info = ipcRenderer.sendSync("sync-file-info",playlist[i].src);
            playlist[i].exist = file_info.exist;
            if(file_info.exist){
                playlist[i].name = file_info.name;
                playlist[i].size = file_info.size;
            }
        }
        return playlist;
    },
    setPlayList:function(playlist){
        window.localStorage.setItem("playlist",JSON.stringify(playlist));
    },
    setCurrentPlayer:function(currentplayer){
        window.localStorage.setItem("currentplayer",JSON.stringify(currentplayer));
    },
    getCurrentPlayer:function(){
        var json = window.localStorage.getItem("currentplayer");
        var currentplayer = json==null ?{
            loopType:"all-repeat", // 循环方式 ["循环播放","顺序播放","随机播放","单视频循环","单视频播放"]
            loopIndex:0,
            loopName:"循环播放",
            loopIcon:"icon-loop",
            listWidth:300,
            listShow:true,
            flatShow:true
        }:JSON.parse(json);
        return currentplayer;
    },
}

var ToolTip = function(options){
    var self = {};
    var default_options = {
        content:"状态变化",
        name:"提示"
    }
    this.options = $.extend({},default_options,options);
    this.$parent = $videoContainer;
    this.$content = {};
    this.show = function(options){
        self.options = $.extend({},self.options,options);
        self.$content = $("<div class='tooltip'>"+self.options.content+"</div>").appendTo(self.$parent);
        self.$content.css({
            opacity:1
        })
    }
    this.hide = function(){
        self.$content.animate({opacity:0},3000,"",function(){
            self.$content.remove();
        })
    }
    self = this;
    return this;
}

var PlayController = function(){
    var self = {};
    this.playlist = PlayerStorage.getPlayList();
    this.loopTypes = [{id:"all-repeat",name:"循环播放",className:"icon-loop"},{id:"order",name:"顺序播放",className:"icon-list"},{id:"shuffle",name:"随机播放",className:"icon-shuffle"},{id:"repeat-once",name:"单视频循环",className:"icon-loop2"},{id:"once",name:"单视频播放",className:"icon-switch"}]
    this.current = {
        index:0,
        video:{
            name:null
        },
        player:PlayerStorage.getCurrentPlayer()
    };
    this.player = null;
    this.initPlayer = function(){
        
        var player  = new E360Palyer(document.getElementById("video-container"),null);
        player.init();
        player.resize($videoContainer.width(),$videoContainer.height());
        player.play();
        window.onresize = function(){
            player.resize($videoContainer.width(),$videoContainer.height());
        }
        player.addEventListener("playing",this.onplaying)
        player.addEventListener("ended",this.onended)
        self.player = player;
    }
    this.initController = function(){
        $iconPlay.click(function(e){
            self.togglePlay();
            var paused = self.player.getVideoPaused();
            var tooltip = new ToolTip();
            tooltip.show({
                content:"播放控制<span style='color:darkcyan;'>"+(paused?"暂停":"播放")+"</span>"
            })
            tooltip.hide();
        });
        $videoContainer.dblclick(function(e){
            self.togglePlay();
            var paused = self.player.getVideoPaused();
            var tooltip = new ToolTip();
            tooltip.show({
                content:"播放控制<span style='color:darkcyan;'>"+(paused?"暂停":"播放")+"</span>"
            })
            tooltip.hide();
        })
        $iconNext.click(function(e){
            self.playNextVideo();
            var tooltip = new ToolTip();
            tooltip.show({
                content:"播放控制<span style='color:darkcyan;'>下一视频</span>"
            })
            tooltip.hide();
        })
        $iconPrevious.click(function(e){
            self.playPrevVideo();
            var tooltip = new ToolTip();
            tooltip.show({
                content:"播放控制<span style='color:darkcyan;'>上一视频</span>"
            })
            tooltip.hide();
        })
        var hoverStatus = $iconPlay.hasClass("icon-play2");
        $timebarButton.hover(function(e){
            self.player.pause();
        },function(e){
            if(hoverStatus) self.player.pause();
            else self.player.play();
        })
        
        var moving = false,currentLeft = 0, downPositoin = {x:0,y:0},mousePosition = {x:0,y:0},currentWidthSum = 0,currentDuration = 0,currentPlayStatus=true;
        var handleMouseDown = function(e){
            if(moving) moving = false;
            downPositoin = {
                x:e.clientX,
                y:e.clientY
            }
            currentLeft = parseFloat($timebarButton.css("left"));
            currentWidthSum = parseFloat($playProgress.width());
            currentPlayStatus = $iconPlay.hasClass("icon-play2");
            currentDuration = self.player.getVideoDuration();
            self.player.pause();
            moving = true;
            e.stopPropagation(); 
            return false;
        }

        var handleMouseMove = function(e){
            if(moving){
                self.player.pause();
                
                mousePosition = {
                    x:e.clientX,
                    y:e.clientY
                }

                var dx = mousePosition.x - downPositoin.x;
                currentLeft = currentLeft + dx;
                
                if(currentLeft>currentWidthSum) { currentLeft = currentWidthSum;}
                if(currentLeft<0){ currentLeft= 0; }
                
                var percent = currentWidthSum==0? 0: currentLeft / currentWidthSum*100;
                self.player.setVideoCurrentTime(currentDuration*percent/100);
                $timebarButton.css({
                    left:percent+"%"
                })
                $timebar.css({
                    width:percent+"%"
                })
                downPositoin = {
                    x:e.clientX,
                    y:e.clientY
                }
            }
            e.stopPropagation(); 
            return false;
        }

        var handleMouseUp = function(e){
            if(moving){
                mousePosition = {
                    x:e.clientX,
                    y:e.clientY
                }

                var dx = mousePosition.x - downPositoin.x;
                currentLeft = currentLeft + dx;
                
                if(currentLeft>currentWidthSum) { currentLeft = currentWidthSum;}
                if(currentLeft<0){ currentLeft= 0; }
                
                var percent = currentWidthSum==0? 0: currentLeft / currentWidthSum*100;
                
                self.player.setVideoCurrentTime(currentDuration*percent/100);
                $timebarButton.css({
                    left:percent+"%"
                })
                $timebar.css({
                    width:percent+"%"
                })
                downPositoin = {
                    x:e.clientX,
                    y:e.clientY
                }
                moving = false;

                if(currentPlayStatus) self.player.pause();
                else self.player.play();
            }
            e.stopPropagation(); 
            return false;
        }

        $timebarButton.mousedown(handleMouseDown);
        $timebarButton.mousemove(handleMouseMove);
        $timebarButton.mouseup(handleMouseUp);
        window.addEventListener("mousemove",handleMouseMove);
        window.addEventListener("mouseup",handleMouseUp);
        
        $container.mousemove(function(e){
            if(e.clientY+200>window.innerHeight){
                $controller.css({height:50});
            }else{
                $controller.css({height:0});
            }
        })
        $container.hover(function(e){
            $videolistController.show();
        },function(){
            $controller.css({height:0});
            $volumeContainer.hide();
            $videolistController.hide();
        })
        
        $progress.click(function(e){
            currentDuration = self.player.getVideoDuration();
           
            var mousePosition = {
                    x:e.pageX,
                    y:e.pageY
            };
            var widthSum = parseFloat($playProgress.width());
            var left =parseFloat($playProgress.css("left"));
            var percent = (mousePosition.x - left)*100 / widthSum;
            
            self.player.setVideoCurrentTime(currentDuration*percent/100);
            $timebarButton.css({
                left:percent+"%"
            })
            $timebar.css({
                width:percent+"%"
            })
            e.stopPropagation();
            return false;
        })
    }
    this.updatePlayList = function(){
        $videoList.find(".video-list-item").remove();
        $videoList.find(".video-list-none").remove();
        var existPlayList = self.playlist.filter(function(ele,pos){
            return ele.exist;
        })
        if(existPlayList.length>0){
            $iconNext.removeClass("disabled");
            $iconPrevious.removeClass("disabled");
        }else{
            $iconNext.addClass("disabled");
            $iconPrevious.addClass("disabled");
        }
        

        

        
        if(self.playlist.length>0){
            var index = 0;
            for(var i=0;i<self.playlist.length;i++){
                var exist = self.playlist[i].exist;
                
                var active = self.playlist[i].src == self.current.video.src;
                
                var $videoListItem = $('<div class="video-list-item'+(active?" active":"") +(exist?"":" disabled")+'" id="video-list-item-'+i+'" data-i="'+i+'" data-index="'+index+'" draggable="true"></div>').appendTo($videoList);
                var $itemName = $('<span class="item-name'+(exist?"":" disabled")+'" data-i="'+i+'" data-index="'+index+'" title="'+self.playlist[i].name+'" >'+self.playlist[i].name+'</span>').appendTo($videoListItem);
                
                var $itemClose = $('<span class="item-close" title="删除" id="item-close-'+i+'" data-index="'+i+'">&times;</span>').appendTo($videoListItem);
                $itemClose.click(function(e){
                    e = e || event;
                    var target = e.target || e.srcElement;
                    var index = $(target).attr("data-index");
                    controller.removeVideoFromList(index);
                    e.stopPropagation();
                    return false;
                })
                
                $videoListItem.unbind("dragstart",self.handleDragStart);
                $videoListItem.bind("dragstart",self.handleDragStart);
                
                if(exist){
                    $videoListItem.unbind("dblclick",self.handleDbClick);
                    $videoListItem.bind("dblclick",self.handleDbClick);
                    index ++;
                }
            }
            
            $videoList.unbind("dropover",self.handleDropOver);
            $videoList.bind("dropover",self.handleDropOver);
            $videoList.unbind("drop",self.handleDrop);
            $videoList.bind("drop",self.handleDrop);
        }else{
            $videoList.append("<span class='video-list-none' style='padding:10px;color:#999;display:block;text-align:center;'>播放列表没有视频<span>");
        }
        $videolistController.unbind("click",self.togglePlayList);
        $videolistController.bind("click",self.togglePlayList);
        self.saveStorage();
    }
    this.initPlayList = function(){
        self.updatePlayList();
        
        var show = !!self.current.player.listshow;
        var currentRight =0;
        if(show){
            currentRight = self.current.player.listWidth;   
            $videoContainer.removeClass("toggle");
            $videoList.removeClass("toggle");
            $videolistControllerButton.removeClass("icon-previous2");
            $videolistControllerButton.addClass("icon-next2");
        }else{
            $videoContainer.addClass("toggle");
            $videoList.addClass("toggle");
            $videolistControllerButton.addClass("icon-previous2");
            $videolistControllerButton.removeClass("icon-next2");
        }
        self.current.player.listshow = show;
        $videoContainer.css({
            right:currentRight
        })
        $videoList.css({
            width:currentRight
        })
        self.resizePlayer();
        self.saveStorage();
        
        var moving = false,currentRight = 0, downPositoin = {x:0,y:0},mousePosition = {x:0,y:0};
        var handleMouseDown = function(e){
            if(moving) moving = false;
            downPositoin = {
                x:e.clientX,
                y:e.clientY
            }
            currentRight = self.current.player.listWidth;
            moving = true;
            e.stopPropagation(); 
            return false;
        }

        var handleMouseMove = function(e){
            if(moving){
                mousePosition = {
                    x:e.clientX,
                    y:e.clientY
                }

                var dx = mousePosition.x - downPositoin.x;
                currentRight = currentRight - dx;
                if(currentRight>400) { currentRight = 400;}
                if(currentRight<100){ currentRight= 100; }

                $videoList.css({
                    width:currentRight
                });
                $videoContainer.css({
                    right:currentRight
                })
                downPositoin = {
                    x:e.clientX,
                    y:e.clientY
                }
                self.current.player.listWidth = currentRight;
                self.resizePlayer();
                self.saveStorage();
            }
            e.stopPropagation(); 
            return false;
        }

        var handleMouseUp = function(e){
            if(moving){
                mousePosition = {
                    x:e.clientX,
                    y:e.clientY
                }

                var dx = mousePosition.x - downPositoin.x;
                currentRight = currentRight - dx;
                if(currentRight>400) { currentRight = 400;}
                if(currentRight<100){ currentRight= 100; }

                $videoList.css({
                    width:currentRight
                });
                $videoContainer.css({
                    right:currentRight
                })
                downPositoin = {
                    x:e.clientX,
                    y:e.clientY
                }
                self.current.player.listWidth = currentRight;
                self.resizePlayer();
                self.saveStorage();
                moving = false;
            }
            e.stopPropagation(); 
            return false;
        }        
        
        $videolistControllerSplitter.mousedown(handleMouseDown);
        $videolistControllerSplitter.mousemove(handleMouseMove);
        $videolistControllerSplitter.mouseup(handleMouseUp);
        window.addEventListener("mousemove",handleMouseMove);
        window.addEventListener("mouseup",handleMouseUp);
    }
    this.initVolume = function(){
        $iconVolume.click(function(e){
            $volumeContainer.toggle();
            e.stopPropagation();
            return false;
        })
        var volume = self.player.getVideoVolume();
        $volumebar.css({
            height:volume*100+"%"
        })
        $volumeButton.css({
            bottom:volume*200-9
        })

        var moving = false,currentBottom = 0, downPositoin = {x:0,y:0},mousePosition = {x:0,y:0};
        var handleMouseDown = function(e){
            if(moving) moving = false;
            downPositoin = {
                x:e.clientX,
                y:e.clientY
            }
            var volume = self.player.getVideoVolume();
            currentBottom = volume*200-9;
            moving = true;
            e.stopPropagation(); 
            return false;
        }

        var handleMouseMove = function(e){
            if(moving){
                mousePosition = {
                    x:e.clientX,
                    y:e.clientY
                }

                var dy = mousePosition.y - downPositoin.y;
                currentBottom = currentBottom - dy;
                if(currentBottom>191) { currentBottom = 191;}
                if(currentBottom<-9){ currentBottom= -9; }

                self.player.setVideoVolume((currentBottom+9)/200);
                $volumebar.css({
                    height:(currentBottom+9)/200*100+"%"
                })
                $volumeButton.css({
                    bottom:currentBottom
                })
                downPositoin = {
                    x:e.clientX,
                    y:e.clientY
                }
            }
            e.stopPropagation(); 
            return false;
        }

        var handleMouseUp = function(e){
            if(moving){
                mousePosition = {
                    x:e.clientX,
                    y:e.clientY
                }

                var dy = mousePosition.y - downPositoin.y;
                currentBottom = currentBottom - dy;
                if(currentBottom>191) { currentBottom = 191;}
                if(currentBottom<-9){ currentBottom= -9; }

                self.player.setVideoVolume((currentBottom+9)/200);
                $volumebar.css({
                    height:(currentBottom+9)/200*100+"%"
                })
                $volumeButton.css({
                    bottom:currentBottom
                })
                downPositoin = {
                    x:e.clientX,
                    y:e.clientY
                }
                moving = false;
                $container.unbind("click",handleHideVolume);
                setTimeout(function(){
                    $container.bind("click",handleHideVolume);
                },200)
            }
            e.stopPropagation(); 
            return false;
        }

        var handleHideVolume = function(e){
            $volumeContainer.hide();
            console.log("hide click")
            e.stopPropagation(); 
            return false;
        }    
        
        $volumeProgress.click(function(e){
            if(!moving){
                var mousePosition = {
                        x:e.pageX,
                        y:e.pageY
                };
                var volume = ($container.height() - mousePosition.y - 58) / 200;
                if(volume>1) volume =1;
                if(volume<0) volume = 0;
                self.player.setVideoVolume(volume);
                $volumebar.css({
                    height:volume*100+"%"
                })
                $volumeButton.css({
                    bottom:volume*200-9
                })
            }
            e.stopPropagation();
            return false;
        })
        $volumeContainer.click(function(e){
            e.stopPropagation();
            return false;
        })
        
        $volumeButton.mousedown(handleMouseDown);
        $volumeButton.mousemove(handleMouseMove);
        $volumeButton.mouseup(handleMouseUp);
        window.addEventListener("mousemove",handleMouseMove);
        window.addEventListener("mouseup",handleMouseUp);

        $container.bind("click",handleHideVolume);
    }
    this.initLoopType = function(){
        $loopButton.click(function(e){
            var player = self.current.player;
            var loopTypes = self.loopTypes;
            $loopButton.removeClass(player.loopIcon);
            player.loopIndex = (player.loopIndex+1) % loopTypes.length;
            var loopType = loopTypes[player.loopIndex];
            player.loopIcon = loopType.className;
            player.loopName = loopType.name;
            player.loopType = loopType.id;
            $loopButton.addClass(player.loopIcon);
            $loopButton.attr("title",player.loopName);
            var tooltip = new ToolTip();
            tooltip.show({
                content:"循环播放方式切换为<span style='color:darkcyan;'>"+player.loopName+"</span>"
            })
            tooltip.hide();
            e.stopPropagation();
            return false;
        })
    }
    this.initFlatScreen = function(){
        self.current.player.flatShow ? $flatScreenContainer.show() : $flatScreenContainer.hide();
        
        $flatScreenContainer.click(function(e){
            var left = parseFloat(e.pageX) - parseFloat($flatScreenContainer.position().left);
            var width = parseFloat($flatScreenContainer.width());
            var v = left*360 / width;
            var fov = self.player.getVideoFov();
            self.player.setPlayerPhiDelta(360-v-fov);
        })
    }
    this.togglePlay = function(){
        var paused = self.player.getVideoPaused();
        if(paused){
            self.player.play();
            $iconPlay.removeClass("icon-play2").addClass("icon-pause");
        }else{
            self.player.pause();
            $iconPlay.addClass("icon-play2").removeClass("icon-pause");
        }
    }
    this.playPrevVideo = function(){
        var existPlayList = self.playlist.filter(function(ele,pos){
            return ele.exist;
        })
        if(existPlayList.length>0){
            var index = self.current.index;
            index = (index+existPlayList.length-1)%existPlayList.length;
            var filePath = existPlayList[index].src;
            // 修改播放器视频路径并开始播放
            self.player.pause();
            self.player.setVideoSrc(filePath);
            self.togglePlay();
            self.player.play();
            self.current.index = index;
            self.current.video = existPlayList[index];
        }
    }
    this.playNextVideo = function(){
        var existPlayList = self.playlist.filter(function(ele,pos){
            return ele.exist;
        })
        if(existPlayList.length>0){
            var index = self.current.index;
            index = (index+1)%existPlayList.length;
            var filePath = existPlayList[index].src;
            // 修改播放器视频路径并开始播放
            self.player.pause();
            self.player.setVideoSrc(filePath);
            self.togglePlay();
            self.player.play();
            self.current.index = index;
            self.current.video = existPlayList[index];
        }
    }
    this.addVideoToList = function(file_info){
        var existPlayList = self.playlist.filter(function(ele,pos){
            return ele.exist;
        })
        var exists = existPlayList.filter(function(ele,pos){
            ele.index = pos;
            return ele.src == file_info.src;
        });
        if(exists.length>0){
            self.current.index = exists[0].index;
            self.current.video = existPlayList[self.current.index];
        }else{
            self.playlist.push(file_info);
            existPlayList.push(file_info);
            self.current.index = existPlayList.length-1;
            self.current.video = existPlayList[self.current.index];
        }
        // 修改播放器视频路径并开始播放
        self.player.pause();
        self.player.setVideoSrc(file_info.src);
        self.player.play();
        // 更新播放列表
        self.updatePlayList();
    }
    this.removeVideoFromList = function(index){
        var i = parseInt(index);
        self.playlist.splice(i,1);
        var existPlayList = self.playlist.filter(function(ele,pos){
            return ele.exist;
        })
        if(self.current.index == i){
            self.current.index = (self.current.index-1)%existPlayList.length;
        }
        if(self.current.index>i){
             self.current.index = self.current.index-1;
        }
        // 更新播放列表
        self.updatePlayList();
    }

    this.playVideoByIndex = function(index){
        index = parseInt(index);
        var existPlayList = self.playlist.filter(function(ele,pos){
            return ele.exist;
        })
        var filePath = existPlayList[index].src;
        // 修改播放器视频路径并开始播放
        self.player.pause();
        self.player.setVideoSrc(filePath);
        self.player.play();
        self.current.index = index;
        self.current.video = existPlayList[self.current.index];
        // 更新播放列表
        self.updatePlayList();
    }

    this.togglePlayList = function(){
        var show = $videoContainer.hasClass("toggle");
        var currentRight =0;
        if(show){
            currentRight = self.current.player.listWidth;   
        }
        self.current.player.listshow = show;
        $videoContainer.css({
            right:currentRight
        })
        $videoList.css({
            width:currentRight
        })
        $videoContainer.toggleClass('toggle');
        $videoList.toggleClass('toggle');
        self.resizePlayer();
        self.saveStorage();
        $videolistControllerButton.toggleClass(function(index,oldClass){
            return oldClass.indexOf("icon-next2") !=-1?"icon-previous2":"icon-next2";
        },true);
        $videolistControllerButton.toggleClass(function(index,oldClass){
            return oldClass.indexOf("icon-next2")>5?"icon-previous2":"icon-next2";
        },false);
    }
    
    this.togglePlayControl = function(){
        $container.toggleClass('toggle');
        $controller.toggleClass('toggle');
        self.resizePlayer();
    }
    
    this.toggleFlatScreen = function(){
        $flatScreenContainer.toggle();
        var display = $flatScreenContainer.css("display");
        var show = display!="none";
        self.current.player.flatShow = show;
        self.saveStorage();
    }
    
    this.resizePlayer = function(){
        for(var i=0;i<60;i++){
            setTimeout(function(){
                var width = $videoContainer.width();
                var height = $videoContainer.height();
                self.player.resize(width,height);
            },30*i)
        }
    }
    
    this.setFullScreen = function(flag){
        if(flag){
             $videoList.show();
             $videoContainer.css({"width":"auto"});
        }else{
            $videoList.hide();
            $videoContainer.css({"width":"100%"});
        }
    }
    
    this.init = function(){
        self.initPlayer();
        self.initController();
        self.initPlayList();
        self.initVolume();
        self.initLoopType();
        self.initFlatScreen();
    }
    
    this.onplaying = function(video){
        var duration = self.player.getVideoDuration();
        var currentTime = self.player.getVideoCurrentTime();
        var width = self.player.getVideoWidth();
        var height = self.player.getVideoHeight();
        var fov = self.player.getVideoFov();
        var phi = self.player.getPlayerPhiDelta();
        var rect_width = fov*2;
        var rect_right = phi%360;
        var rect_left = (360-rect_right)-fov*2;
        var rect_height = 360/width*height;
        if(rect_left<0) rect_width = rect_left+rect_width;
        if(rect_right<0) rect_width = rect_width+rect_right;
        $flatScreenRect.css({
            width:rect_width,
            right:rect_right<0?0:rect_right,
            left:rect_left<0?0:rect_left,
            height:rect_height/2
        })
        $flatScreenContainer.css({
            height:rect_height/2
        })
        flatScreenContext.drawImage(video, 0, 0,width,height, 0,-rect_height/2,360,rect_height*2);
        
        if(duration && !isNaN(duration) && currentTime && !isNaN(currentTime) ){
            $timebar.css({
                width: (currentTime*100/duration)+ "%"
            })
            $timebarButton.css({
                left: (currentTime*100/duration)+ "%"
            })
        }
        if(self.current.video && self.current.video.name){
            self.current.video.duration = duration;
            self.current.video.currentTime = currentTime;
            self.current.video.height = height;
            self.current.video.width = width;
            self.current.video.paused = false;
            document.title = "360度全景视频播放器-"+self.current.video.name
            
            $videoName.text(self.current.video.name);
            $videoPosition.text( VideoTime.parse(currentTime)+" / "+ VideoTime.parse(duration));
        }else{
             document.title = "360度全景视频播放器"
        }
    }
    this.onended = function(){
        var existPlayList = self.playlist.filter(function(ele,pos){
            return ele.exist;
        })
        if(existPlayList.length==0) return;
        if(self.current.player.loopType == "repeat-once") return;
        if(self.current.player.loopType == "once"){
            self.player.pause();
            self.player.setVideoCurrentTime(0);
        }
        if(self.current.player.loopType == "order"){
            if(self.current.index==existPlayList.length-1){
                self.player.pause();
                self.player.setVideoCurrentTime(0);
                return;
            }
            var index = (self.current.index+1) % existPlayList.length;
            var src = existPlayList[index].src;
            self.player.pause();
            self.player.setVideoSrc(src);
            self.player.setVideoCurrentTime(0);
            self.player.play();
            self.current.index = index;
        }
        if(self.current.player.loopType == "all-repeat"){
            var index = (self.current.index+1) % existPlayList.length;
            var src = existPlayList[index].src;
            self.player.pause();
            self.player.setVideoSrc(src);
            self.player.setVideoCurrentTime(0);
            self.player.play();
            self.current.index = index;
        }

        if(self.current.player.loopType == "shuffle"){
            var index = new Date().valueOf();
            index = (index+1) % existPlayList.length;
            var src = existPlayList[index].src;
            self.player.pause();
            self.player.setVideoSrc(src);
            self.player.setVideoCurrentTime(0);
            self.player.play();
            self.current.index = index;
        }
        self.current.video = existPlayList[self.current.index];
        self.current.video.currentTime = 0;
        self.updatePlayList();
        
        ipcRenderer.sendSync("sync-clear-history",null);
    }
    
    this.saveStorage = function(){
        PlayerStorage.setPlayList(self.playlist);
        PlayerStorage.setCurrentPlayer(self.current.player);
    }
    this.handleDragStart = function(e){
            e = e || event;
            var target = e.target || e.srcElement;
            var index = $(target).attr("data-i");
            event.dataTransfer.setData("video-list-drag-index",index);
        };
    this.handleDropOver = function(e){
            e = e || event;
            e.preventDefault();
        };
    this.handleDrop = function(e){
            e = e || event;
            var target = e.target || e.srcElement;
            e.preventDefault();
            var index = parseInt(event.dataTransfer.getData("video-list-drag-index"));
            if(target.id=="videolist-container"){
                var deleteObj = self.playlist.splice(index,1);
                self.playlist.push(deleteObj[0]);
                self.updatePlayList();
            }
            if(target.className.indexOf("video-list-item") !=-1 || target.className.indexOf("item-name")!=-1){
                var exchangeIndex = $(target).attr("data-i");
                var deleteObj = self.playlist.splice(index,1);
                self.playlist.splice(exchangeIndex,0, deleteObj[0]);
                self.updatePlayList();
            }
        }
    this.handleDbClick = function(e){
        e = e || event;
        var target = e.target || e.srcElement;
        var index = $(target).attr("data-index");
        controller.playVideoByIndex(index);
    }
    self = this;
    return this;
}