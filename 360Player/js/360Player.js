 // 视频预加载
var PreloadVideo = function(src,percent,callback){
    var video = document.createElement('video');
    video.src = src;
    console.log(src);
    video.load();
    var duration = video.duration;
    if(!percent) percent = 30;
    
    var queryBufferedPercent = function(){
        if( video.buffered.length<=0 || (video.buffered.end(0)*100/duration)<percent) {
            if(video.buffered.length<=0){
                console.log("video loading 0");
            }else{
                var buffered = 0;
                for(var i=0;i<video.buffered.length;i++){
                    buffered += video.buffered.end(i);
                }
                video.currentTime = buffered;
                console.log("video loading "+video.currentTime);
            }
            setTimeout(queryBufferedPercent,1000);
        }
        else{
            console.log("video loaded")
            callback();
        }
    }
    queryBufferedPercent();
}  

var E360Palyer = function(parentDomElement,videoSrc){
        // 全局变量
        var video,scene,camera,renderer,videoImageContext,videoTexture,videoImage,pauseVideo = true,events={};
        var createVideo = function(){
            video = document.createElement( 'video' );
            video.src = videoSrc;
            video.loop = false;
            video.preload = "meta";
            video.load(); 
        };
        var createScene = function(){
            scene = new THREE.Scene(); 
        };
        var addCamera = function(){
            // Camera
            camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
            camera.position.set(0,0,0);
            scene.add(camera);
        };
        var createRenderer = function(){
            // renderer
            if (Detector.webgl )
                renderer = new THREE.WebGLRenderer( {antialias:true} );
            else
                renderer = new THREE.CanvasRenderer(); 
            renderer.setSize(parentDomElement.innerWidth,parentDomElement.innerHeight ); 
            renderer.domElement.style.cursor = "move";
            renderer.domElement.style.zIndex = 0;
            // append to body
            parentDomElement.appendChild(renderer.domElement ); 
        };

        var addSphere = function(){
            // geometry
            var geometry =new THREE.SphereBufferGeometry(1000,32,16);
            // video image
            videoImage = document.createElement( 'canvas' );
            
            videoImage.width = 1920;
            videoImage.height = 960;
            // old video
//                    videoImage.width = 1920*2;
//                    videoImage.height = 1920;

            // video image context
            videoImageContext = videoImage.getContext( '2d' );
            videoImageContext.fillStyle = '#000000';
            videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
            // video texture
            videoTexture = new THREE.Texture(videoImage );
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            // material
            var material = new THREE.MeshBasicMaterial( { map: videoTexture, overdraw: true, side:THREE.DoubleSide } );
            // sphere
            var sphere = new THREE.Mesh( geometry, material ); 
            scene.add(sphere);

            setTimeout(render,1000)
        };

        var addLight = function(){
                // light
                var light = new THREE.PointLight(0xffffff);
                light.position.set(0, 0, 0);
                scene.add(light);
        };

        var animation = function(){
            if(pauseVideo) return;
            if(events.playing)  events.playing(video);
            if(requestAnimationFrame){
                requestAnimationFrame(animation);
            }else{
                setTimeout(animation,1000/60);
            }
            render();
            update();
        }

        var update = function(){
            var z = Math.sin(thetaDelta * Math.PI / 180)* Math.cos(phiDelta * Math.PI / 180);
            var x = Math.sin(thetaDelta * Math.PI / 180)* Math.sin(phiDelta * Math.PI / 180);
            var y = -Math.cos(thetaDelta * Math.PI / 180);
            camera.lookAt(new THREE.Vector3(x, y, z));
        }
        var render = function(){
            if (video.readyState === video.HAVE_ENOUGH_DATA ) 
            {
                videoImage.width = video.videoWidth;
                videoImage.height = video.videoHeight;
                videoImageContext.drawImage(video, 0, 0 );
                if (videoTexture) 
                    videoTexture.needsUpdate = true;
            }
            renderer.render(scene, camera);
        }

        /* 鼠标操作 */
        var phiDelta = 0;
        var thetaDelta = 90;
        var rotateStart = new THREE.Vector2();
        var rotateEnd = new THREE.Vector2();
        var rotateDelta = new THREE.Vector2();
        var isMoving = false;
        var setMouseEvent = function(){
                renderer.domElement.onmousedown = function(event){
                    isMoving = true;
                    rotateStart.set(event.clientX, event.clientY);
                }
                renderer.domElement.onmouseup = function(event){
                    isMoving = false;
                }
                window.onmouseup = function(event){
                    isMoving = false;
                }
                // 修复禁止用户观看顶部和底部
                window.onmousemove = renderer.domElement.onmousemove = function(event){
                    if(isMoving){
                        // 修复禁止用户观看顶部和底部
                        if(thetaDelta>175){ thetaDelta=175;return;}
                        if(thetaDelta<5){ thetaDelta = 5;return;}

                        endPos = {x:event.clientX, y:event.clientY};
                        rotateEnd.set(event.clientX, event.clientY);
                        rotateDelta.subVectors(rotateEnd, rotateStart );
                        thetaDelta += rotateDelta.y/2;
                        phiDelta += rotateDelta.x/2;
                        rotateStart.set(rotateEnd.x,rotateEnd.y);

                        // 修复禁止用户观看顶部和底部
                        if(phiDelta>360) phiDelta = phiDelta%360; 
                        if(thetaDelta>175){ thetaDelta=175;}
                        if(thetaDelta<5){ thetaDelta = 5;}
                    }
                }
        }    
        return {
            play : function(){
                if(pauseVideo)  {
                    video.play();
                    pauseVideo = false;
                    animation();
                }
            },
            pause:function(){
                video.pause();
                pauseVideo = true;
            },
            setVideoSrc:function(videoSrc){
                video.src = videoSrc;
                video.loop = false;
                video.preload = "meta";
                video.load(); 
            },
            init:function(){
                createVideo();
                createScene();
                addCamera();
                createRenderer();
                addSphere();
                addLight();
                setMouseEvent();
            },
            resize:function(width,height){
                renderer.setSize(width, height); 
            },
            setVideoCurrentTime:function(currentTime){
                video.currentTime = currentTime;
            },
            addEventListener:function(type,callback){
                switch(type){
                    case "playing":
                        events.playing = callback;
                        break;
                    case "ended":
                        video.onended = callback;
                        break;
                }
            },
            getVideoCurrentTime:function(){
                return video.currentTime;
            },
            getVideoDuration:function(){
                return video.duration;
            },
            getVideoPaused:function(){
                return video.paused;
            },
            getVideoVolume:function(){
                return video.volume;
            },
            setVideoVolume:function(volume){
                video.volume = volume;
            }
        }
    };