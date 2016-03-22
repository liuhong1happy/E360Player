var $iconPlay = $("#icon-play"),$timebar = $("#timebar"),$videoContainer = $("#video-container"),$iconNext = $("#icon-next"),
    $iconPrevious = $("#icon-previous"),$videoList = $("#videolist-container"),$volumeContainer = $("#volume-container"),$playProgress = $("#play-progress"),
    $volumeProgress = $("#volume-progress"),$volumebar = $("#volumebar"),$iconVolume = $("#icon-volume"),$timebarButton = $("#timebar-button"),
    $volumeButton = $("#volume-button"),$loopButton = $("#loop-button"),$container=$("#container"),$controller=$("#controller"),
    $videolistControllerButton = $("#videolist-controller-button"),$videolistController=$("#videolist-controller");

var PlayController = function(){
    var self = {};
    this.playlist = ["test.mp4"];
    this.loopTypes = [{id:"all-repeat",name:"循环播放",className:"icon-loop"},{id:"order",name:"顺序播放",className:"icon-list"},{id:"shuffle",name:"随机播放",className:"icon-shuffle"},{id:"repeat-once",name:"单视频循环",className:"icon-loop2"},{id:"once",name:"单视频播放",className:"icon-switch"}]
    this.current = {
        index:0,
        video:{
            currentTime:0,// 视频播放到什么位置(s)
            src:"test.mp4",// 视频播放源 // 视频的高宽
            duration:3600,// 视频总长度(s)
            width:3600, // 视频的宽度
            height:7200, // 视频的高度
            paused:true
        },
        player:{
            loopType:"all-repeat", // 循环方式 ["循环播放","顺序播放","随机播放","单视频循环","单视频播放"]
            loopIndex:0,
            loopName:"循环播放",
            loopIcon:"icon-loop"
        }
    };
    this.player = null;
    this.initPlayer = function(){
        var player  = new E360Palyer(document.getElementById("video-container"),"test.mp4");
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
        });
        $videoContainer.dblclick(function(e){
            self.togglePlay();
        })
        $iconNext.click(function(e){
            self.playNextVideo();
        })
        $iconPrevious.click(function(e){
            self.playPrevVideo();
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
        
        $container.hover(function(){
            $controller.animate({height:50},500);
        },function(){
            $controller.animate({height:0},1000);
            $volumeContainer.hide();
        })
        
        
    }
    this.initPlayList = function(){
        $videoList.find(".video-list-item").remove();
        if(self.playlist.length>0){
            for(var i=0;i<self.playlist.length;i++){
                var $videoListItem = $('<div class="video-list-item" id="video-list-item-'+i+'" data-index="'+i+'"></div>').appendTo($videoList);
                var $itemName = $('<span class="item-name" data-index="'+i+'">'+self.playlist[i]+'</span>').appendTo($videoListItem);
                var $itemClose = $('<span class="item-close" id="item-close-'+i+'" data-index="'+i+'">&times;</span>').appendTo($videoListItem);
                $itemClose.click(function(e){
                    e = e || event;
                    var target = e.target || e.srcElement;
                    var index = $(target).attr("data-index");
                    controller.removeVideoFromList(index);
                })
                $videoListItem.dblclick(function(e){
                    e = e || event;
                    var target = e.target || e.srcElement;
                    var index = $(target).attr("data-index");
                    controller.playVideoByIndex(index);
                })
            }
        }else{
            $videoList.append("<span class='video-list-item' style='padding:10px;color:#999;'>暂且没有视频可以播放<span>");
        }
        $videolistController.click(function(e){
            self.togglePlayList();
        })
    }
    this.initVolume = function(){
        $iconVolume.click(function(e){
            $volumeContainer.toggle();
            e.stopPropagation();
            return false;
        })
        $volumeContainer.click(function(e){
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
        if(self.playlist.length>0){
            var index = self.current.index;
            index = (index+self.playlist.length-1)%self.playlist.length;
            var filePath = self.playlist[index];
            // 修改播放器视频路径并开始播放
            self.player.pause();
            self.player.setVideoSrc(filePath);
            self.togglePlay();
            self.player.play();
            self.current.index = index;
        }
    }
    this.playNextVideo = function(){
        if(self.playlist.length>0){
            var index = self.current.index;
            index = (index+1)%self.playlist.length;
            var filePath = self.playlist[index];
            // 修改播放器视频路径并开始播放
            self.player.pause();
            self.player.setVideoSrc(filePath);
            self.togglePlay();
            self.player.play();
            self.current.index = index;
        }
    }
    this.addVideoToList = function(filePath){
        self.playlist.push(filePath);
        // 修改播放器视频路径并开始播放
        self.player.pause();
        self.player.setVideoSrc(filePath);
        self.player.play();
        self.current.index = self.playlist.length-1;

        // 更新播放列表
        self.initPlayList();
    }
    this.removeVideoFromList = function(index){
        var i = parseInt(index);
        self.playlist.splice(i,1);
        if(self.current.index == i){
            self.player.pause();   
            self.current.index = self.current.index%self.playlist.length;

            var filePath = self.playlist[self.current.index];
            // 修改播放器视频路径并开始播放
            self.player.pause();
            self.player.setVideoSrc(filePath);
            self.player.play();
        }
        if(self.current.index>i){
             self.current.index = self.current.index-1;
        }
        // 更新播放列表
        self.initPlayList();
    }

    this.playVideoByIndex = function(index){
        var index = parseInt(index);
        var filePath = self.playlist[index];
        // 修改播放器视频路径并开始播放
        self.player.pause();
        self.player.setVideoSrc(filePath);
        self.player.play();
        self.current.index = index;
    }

    this.togglePlayList = function(){
        $videoContainer.toggleClass('toggle');
        $videoList.toggleClass('toggle');
        self.resizePlayer();
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
    
    this.resizePlayer = function(){
        for(var i=0;i<60;i++){
            setTimeout(function(){
                var width = $videoContainer.width();
                var height = $videoContainer.height();
                self.player.resize(width,height);
            },30*i)
        }
    }
    
    this.init = function(){
        self.initPlayer();
        self.initController();
        self.initPlayList();
        self.initVolume();
        self.initLoopType();
    }
    this.onplaying = function(){
        var duration = self.player.getVideoDuration();
        var currentTime = self.player.getVideoCurrentTime();
        if(duration && !isNaN(duration) && currentTime && !isNaN(currentTime) ){
            $timebar.css({
                width: (currentTime*100/duration)+ "%"
            })
            $timebarButton.css({
                left: (currentTime*100/duration)+ "%"
            })
        }
    }
    this.onended = function(){
        if(self.current.player.loopType == "repeat-once") return;
        if(self.current.player.loopType == "once"){
            self.player.pause();
            self.player.setVideoCurrentTime(0);
        }
        if(self.current.player.loopType == "order"){
            if(self.current.index==self.playlist.length-1){
                self.player.pause();
                self.player.setVideoCurrentTime(0);
                return;
            }
            var index = (self.current.index+1) % self.playlist.length;
            var src = self.playlist[index];
            self.player.pause();
            self.player.setVideoSrc(src);
            self.player.setVideoCurrentTime(0);
            self.player.play();
            self.current.index = index;
        }
        if(self.current.player.loopType == "all-repeat"){
            var index = (self.current.index+1) % self.playlist.length;
            var src = self.playlist[index];
            self.player.pause();
            self.player.setVideoSrc(src);
            self.player.setVideoCurrentTime(0);
            self.player.play();
            self.current.index = index;
        }

        if(self.current.player.loopType == "shuffle"){
            var index = new Date().valueOf();
            index = (index+1) % self.playlist.length;
            var src = self.playlist[index];
            self.player.pause();
            self.player.setVideoSrc(src);
            self.player.setVideoCurrentTime(0);
            self.player.play();
            self.current.index = index;
        }
    }
    self = this;
    return this;
}