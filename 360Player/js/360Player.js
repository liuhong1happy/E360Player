  var IS360Palyer = function(parentDomElement,videoSrc){
                // 全局变量
                var video,scene,camera,renderer,toolTip,videoImageContext,videoTexture,videoImage,pauseVideo = true;
                var createVideo = function(){
                    video = document.createElement( 'video' );
                    video.src = videoSrc;
                    video.loop = true;
                    video.proload = "metadata";
                    video.load(); 
                };
                var createTooltip = function(){
                    var divElement = document.createElement("div");
                    
                    $(divElement).css({
                        position:"absolute",
                        left:"50%",
                        top:"50%",
                        width:"300px",
                        height:"300px",
                        marginTop:"-150px",
                        marginLeft:"-150px",
                        lineHeight:"44px",
                        textAlign:"center",
                        color:"#ddd",
                        fontSize:"16px",
                        fontWeight:"bold",
                        display:"none"
                    });
                    
                    $(divElement).append('<img src="images/drag_tips.png"  style="width:100%;height:100%;"/>');
                    $(divElement).append('<span style="width:60%;position:absolute;bottom:80px;left:20%;line-height:22px;text-align:center;">请拖拽观看</span>');
                    $(divElement).mousedown(function(){
                        $(divElement).hide();
                    })
                    
                    toolTip = divElement;
                }
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
                    renderer.setSize(window.innerWidth,window.innerHeight ); 
                    renderer.domElement.style.cursor = "move";
                    renderer.domElement.style.zIndex = 0;
                    // append to body
                    parentDomElement.appendChild(renderer.domElement ); 
                    parentDomElement.appendChild(toolTip);
                    
                    $(parentDomElement).append('<img src="images/corner_mask_LT.png"  style="position:absolute;left:0px;top:0px;" />');
                    $(parentDomElement).append('<img src="images/corner_mask_RT.png"  style="position:absolute;right:0px;top:0px;" />');
                    $(parentDomElement).append('<img src="images/corner_mask_RB.png"  style="position:absolute;right:0px;bottom:0px;" />');
                    $(parentDomElement).append('<img src="images/corner_mask_LB.png"   style="position:absolute;left:0px;bottom:0px;" />');
                };

                var addSphere = function(){
                    // geometry
                    var geometry =new THREE.SphereBufferGeometry(1000,32,16);
                    // video image
                    videoImage = document.createElement( 'canvas' );
                    videoImage.width = 1920;
                    videoImage.height = 1080;
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
                    if(requestAnimationFrame){
                        requestAnimationFrame(animation);
                    }else{
                        setTimeout(render,1000/60);
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
                        videoImageContext.drawImage(video, 0, 0 );
                        if (videoTexture) 
                            videoTexture.needsUpdate = true;
                    }
                    renderer.render(scene, camera);
                }
                var getTooltip = function(){
                    return toolTip;
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
                            toolTip.style.display = "none";
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
                    init:function(){
                        createTooltip();
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
                    toolTip:function(){
                        var toolTip = getTooltip();
                        toolTip.style.display = "block";
                        return toolTip;
                    }
                }
        };