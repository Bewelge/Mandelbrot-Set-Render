var MandelBrotRender = (function () {
    var cnv1 = null;
    var cnv = null;
    var cnvT = null;
    var ctxT = null;
    var ctx = null;
    var ctx1 = null;
    var cnvBG;
    var ctxBG;
    var cnvW = 0;
    var cnvH = 0;
    var theImg = null;
    var cnvBG = null;
    var ctxBG = null;
    var dt = null;
    var highestMSE = 0;
    var tileSizeW = 0;
    var tileSizeH = 0;
    var iterations = 0;
    var width;
    var height;
    var maxThreshold = 1E5;
    var gp = null;
    var viewBox = 4;//0.000012152792193295453;
    var viewBoxPos = {x:0,y:0}/*{
        x: -0.5016423276004731,
        y: 0.6039078201222063
    };*/ //{x: -1.402, y: 0.0};;
    var gpu;
    var calcSet;
    var calcSetDiv;
    var render;
    var newDt;
    var setImgDt;
    var gl;
    var canvas;
    var mouseX = 0;
    var mouseY = 0;
    var scale = 1;
    var zoomScale = 1;
    var originx = 0;
    var originy = 0;
    var zoom = 1;
    var tmpCtx = null;
    var tmpCnv = null;
    var ready = false;
    var lastTime = 1000;
    var delay = false;
    var cnvW;
    var cnvH;
    var minZoom=0.00004;//0.000042152792193295453;
    var maxZoom=400;;
var settings;
    function quit() {

    }
    function start(el) {
        width =  Math.floor($(el).width()*0.8);//window.innerWidth || document.documentElement.clientWidth / 1 || document.body.clientWidth / 1;
        height = Math.floor($(el).height()*0.8);//window.innerHeight || document.documentElement.clientHeight / 1 || document.body.clientHeight / 1;
        
        iterations = Math.floor(Math.min(width, height));
        height = width = iterations;
        tileSizeW = tileSizeH = Math.max(1, Math.floor(Math.min(width, height) / iterations) / 1);
        
        let mLeft = 0;
        let mTop = 0;
        hlfSize = Math.floor(Math.min(width, height) / 2);
        qrtSize = Math.floor(hlfSize / 2);
        cnvW = tileSizeW * iterations;
        cnvH = tileSizeH * iterations;

        cnvBG = document.createElement("canvas");
        cnvBG.width = cnvW;
        cnvBG.height = cnvH;
        cnvBG.style.position = "absolute";
        cnvBG.style.zIndex = 2;
        cnvBG.style.pointerEvents ="none";
        cnvBG.style.marginTop="10vh";
        cnvBG.id = "BG";
        el.appendChild(cnvBG);
        ctxBG = cnvBG.getContext("2d");
        ctxBG.lineCap = ctxBG.lineJoin = "round";





            canvas = document.createElement("canvas");
            canvas.width = cnvW;
            canvas.height = cnvH;
            canvas.id = "renderCanvas";
            /*canvas.style.position = "absolute";*/
            
            canvas.addEventListener("mousemove", mouseMove);
            canvas.addEventListener("mousewheel", myMouseWheel);
            canvas.addEventListener("click", mouseClick);
            canvas.style.height = "fit-content";
            canvas.style.marginTop = "10vh";
            el.appendChild(canvas);
            gl = canvas.getContext('webgl', {
                premultipliedAlpha: false
            });
        
        
            gpu = new GPU({
                canvas,
                webGl: gl
            })
        
            createKernel();


        let zoomBar = createDiv("zoomBar","zoomBar");
        /*zoomBar.style.width = width*0.2+"px";
        zoomBar.style.height = height+"px";
        zoomBar.style.position = "absolute";
        zoomBar.style.left = ($(el).width() - width )/2 - width * 0.2+"px";
        zoomBar.style.top = 0+"px";*/
        zoomBar.className = "qs_container";
        zoomBar.height="200px";
        zoomBar.id ="#null";

        let zoomInHandle = document.createElement("input");
         zoomInHandle.id="zoomInHandle"
         zoomInHandle.className = "zoomInHandle qs_button";
         zoomInHandle.value = "Zoom In";
         zoomInHandle.type = "button";
         
        zoomInHandle.addEventListener("click",function() {
            viewBox=viewBox*0.9
            runKernels();
        })


        zoomBar.appendChild(zoomInHandle);

         let zoomOutHandle = document.createElement("input");
         zoomOutHandle.id="zoomOutHandle"
         zoomOutHandle.className = "zoomOutHandle qs_button";
         zoomOutHandle.value = "Zoom Out";
         zoomOutHandle.type = "button";
        zoomOutHandle.addEventListener("click",function() {
            viewBox=viewBox/0.9
            runKernels();
        })


        zoomBar.appendChild(zoomOutHandle);

        let settingsBar = createDiv("settingsBar","settingsBar");
        settingsBar.style.width= width*0.2+"px";
        settingsBar.style.height= height+"px";
        settingsBar.style.left = "5px";
        settingsBar.style.top = "5%";

        $(el).append(settingsBar);
        let footer = createDiv("footer","footer");
        footer.style.width = "100%";
        footer.style.height = "9vh";
        footer.style.fontSize = "2vh";
        footer.style.position = "absolute";
        footer.style.top = "1vh";
        footer.style.font = "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace";
        footer.innerHTML ="<b style='font-size:2.5vh'>The Mandelbrot Set</b></br><em>Click to move to a point. Scroll to zoom in/out.</em>"
        $(el).append(footer);

        settings = QuickSettings.create(50, 50, "Settings", document.getElementById("mainWindow"));
        settings.addBoolean("Draw Axes", true, function(that){
            drawTheGrid=that;
        });
        /*settings.addButton("Zoom In",function() {
            viewBox=viewBox*0.9
            runKernels();
        })*/
        let zoomHandle = createDiv("zoomHandle","zoomHandle");
        zoomHandle.innerHTML =2/viewBox;
        settings.addElement("Zoom:",zoomHandle);
        settings.addElement("",zoomBar);
        let iteratAm = createDiv("iterationAmount","iterationAmount");
        iteratAm.innerHTML = Math.floor(iterationAmount);
        settings.addElement("Iterations:",iteratAm);
        settings.addBoolean("Auto Iteration Amount",true,function(that){
            if (autoIteration==true) {
                settings.enableControl("Set Iterations");
                autoIteration=false;
            } else {
                settings.disableControl("Set Iterations");
                autoIteration=true;
            }
            
        })
        settings.addRange("Set Iterations",1,10000,100,1,function(val){
            updateIterationAmount(val);
            if(!delay) {
                delay=true;
                runKernels();
                window.setTimeout(function() {
                    delay=false;
                },50);
            }
        });
        settings.disableControl("Set Iterations");
       


        /*settings.addNumber("Current Zoom",minZoom,maxZoom,2/viewBox,viewBox/2,function(val) {
            console.log(val);
            if (!isNaN(val)) {
                val = Math.min(Math.max(val,minZoom),maxZoom);
                //document.getElementById("zoomToIn").value = val;
                viewBox = val;
                if (ready) {
                    runKernels();
                }
            }
            //runKernels();
        })
        settings.bindNumber("x",-2,2,0,0.01,viewBoxPos);
        settings.addNumber("y",-2,2,0,0.01,viewBoxPos)
        settings.bindNumber("Iterations",-2,2,iterationAmount,0.01,iterationAmount);// {
           
        settings.addNumber("Canvas Size",1,5000,iterations,10,function(val) {
            if (!isNaN(val)) {
                //document.getElementById("zoomToIn").value = val;
                setCanvasSize(val);
                
            }
        })*/
        //pure cpu function - veery slow.
        //drawSet();

        //gpu kernels
        updateIterationAmount();
        runKernels(el,cnvW,cnvH);

        drawStuff();

    }
    function setCanvasSize(size) {
        iterations = width = height = size;
        
        
        
            tileSizeW = tileSizeH = Math.max(1, Math.floor(Math.min(width, height) / iterations) / 1);
            
            cnvW = tileSizeW * iterations;
            cnvH = tileSizeH * iterations;

            
            cnvBG.width = cnvW;
            cnvBG.height = cnvH;
            canvas.width = cnvW;
            canvas.height = cnvH;


            updateIterationAmount();
            runKernels();
    }
    function setDrawBoard() {
        if (drawTheGrid) {
            drawTheGrid=false;
        } else {
            drawTheGrid=true;
        }
    }
    function zoomToLv() {
        let val = document.getElementById("zoomToIn").value;
            if (!isNaN(val)) {
                val = Math.min(Math.max(val,minZoom),maxZoom);
                document.getElementById("zoomToIn").value = val;
                viewBox = val;
                runKernels();
            }
    }
    function moveToCoords(x,y) {

    }
    function setIterationAmount(am) {

    }
    var autoIteration = true;
    var lastIterationAmount=0;
    function updateIterationAmount(am) {
        if (autoIteration || !am) {

            iterationAmount = Math.sqrt(5*Math.sqrt(Math.abs(1-Math.sqrt(5*(viewBox/(tileSizeW*iterations))))))*166.5;
        } else {
            iterationAmount = am;

        }
        if (lastIterationAmount!=iterationAmount) {
            lastIterationAmount=iterationAmount;
            document.getElementById("iterationAmount").innerHTML = iterationAmount;
        }
    }
    function drawStuff() {
        ctxBG.clearRect(0,0,tileSizeW*iterations,tileSizeH*iterations);

        if(drawTheGrid){
            drawGrid();
        }
        window.requestAnimationFrame(drawStuff);
    }
    var curDiv = 1;
    var drawTheGrid = true;
    function drawGrid() {
        ctxBG.lineWidth = 2;
        let sc = cnvW/viewBox;
        
        let y = cnvH/2+Math.min(cnvH/2-15,Math.max(15-cnvH/2,sc * viewBoxPos.y))//xaxis
        
        let x = cnvW/2-Math.min(cnvH/2-15,Math.max(15-cnvW/2,sc * viewBoxPos.x))//yaxis

        let realy = cnvH/2-sc * viewBoxPos.y//xaxis
        
        let realx = cnvW/2-sc * viewBoxPos.x//yaxis
        
        ctxBG.strokeStyle="rgba(255,255,255,0.8)";

        //x-axis
        ctxBG.beginPath();
        ctxBG.moveTo(0,y);
        ctxBG.lineTo(cnvW,y);
        ctxBG.strokeStyle="rgba(255,255,255,0.5)";
        ctxBG.lineWidth = 4;
        ctxBG.stroke();
        ctxBG.strokeStyle="rgba(0,0,0,1)";
        ctxBG.lineWidth = 1;
        ctxBG.stroke();
        ctxBG.closePath();

        //yaxis
        ctxBG.beginPath();
        ctxBG.moveTo(x,0);
        ctxBG.lineTo(x,cnvH);
        ctxBG.strokeStyle="rgba(255,255,255,0.5)";
        ctxBG.lineWidth = 4;
        ctxBG.stroke();
        ctxBG.strokeStyle="rgba(0,0,0,1)";
        ctxBG.lineWidth = 1;
        ctxBG.stroke();
        ctxBG.closePath();

        if ( viewBox/curDiv < 2) {
            curDiv*=0.5;
        } else if (viewBox/curDiv>4) {
            curDiv*=2;
        }
        let startX = Math.floor((viewBoxPos.x-viewBox/2)/curDiv)-1;//viewBoxPos.x*Math.floor(viewBox / curDiv);
        let startY = Math.floor((viewBoxPos.y-viewBox/2)/curDiv);//viewBoxPos.y*Math.floor(viewBox / curDiv);
        let stepSize = curDiv;//cnvW / Math.floor(viewBox/curDiv);


        let rat = 1-viewBox/curDiv / 4;
        let am = Math.floor(viewBox/curDiv)+4;

        //xaxis positive labels
        ctxBG.strokeStyle="rgba(255,255,255,1)";
        ctxBG.lineWidth = 4;
        ctxBG.beginPath();
        for (let i = 1; i < am; i++) {
            if (Math.floor(1000*(i+startX)*stepSize)/1000 != 0) {
                ctxBG.fillText(Math.floor(1000*(i+startX)*stepSize)/1000 ,
                    (realx+sc*(i+startX)*stepSize),y-10);
                ctxBG.moveTo(realx+sc*(i+startX)*stepSize,y-5);
                ctxBG.lineTo(realx+sc*(i+startX)*stepSize,y+5);
                
            }

        }
        ctxBG.stroke();
        ctxBG.strokeStyle="rgba(0,0,0,1)";
        ctxBG.lineWidth = 2;
        ctxBG.stroke();
        ctxBG.closePath();

        ctxBG.beginPath();
        ctxBG.strokeStyle="rgba(255,255,255,1)";
        ctxBG.lineWidth = 4;

        //yax pos
        ctxBG.beginPath();
        for (let i = 0; i < am; i++) {
            if (Math.floor(1000*(i+startY)*stepSize)/1000  != 0) {
                ctxBG.fillText(Math.floor(1000*(i+startY)*stepSize)/1000 ,
                             x+10,cnvH-realy-(sc*(i+startY)*stepSize));
                ctxBG.moveTo(x+5, cnvH-realy-(sc*(i+startY)*stepSize));
                ctxBG.lineTo(x-5, cnvH-realy-(sc*(i+startY)*stepSize));     
            }
        }
    
        ctxBG.stroke();
        ctxBG.strokeStyle="rgba(0,0,0,1)";
        ctxBG.lineWidth = 2;
        ctxBG.stroke();
        ctxBG.closePath();

        ctxBG.strokeStyle="rgba(255,255,255,1)";
        ctxBG.lineWidth = 4;


        

        ctxBG.fillStyle="rgba(255,255,255,1)";
        ctxBG.strokeStyle="rgba(255,255,255,0.2)";
        ctxBG.fillText("("+Math.floor(10000*viewBoxPos.x)/10000+","+Math.floor(10000*viewBoxPos.y)/10000+")",
                    cnvW/2,cnvH/2);    



        ctxBG.setLineDash([5,5,9]);
        ctxBG.lineWidth=2;
        ctxBG.beginPath();
        ctxBG.moveTo(x,mouseY);
        ctxBG.lineTo(mouseX,mouseY);

        ctxBG.moveTo(mouseX,y);
        ctxBG.lineTo(mouseX,mouseY);
        ctxBG.stroke();
        ctxBG.closePath();
        ctxBG.setLineDash([]);
        let tx2 = "("+Math.floor(100*(-viewBoxPos.x/2+mouseX/sc))/100+","+Math.floor(100*(viewBoxPos.y-mouseY/sc))/100+")";
        if (mouseY>=cnvW/2) {
            ctxBG.fillText(tx2,
                        mouseX-ctxBG.measureText(tx2).width/2,mouseY+25);
            
        } else {
            ctxBG.fillText(tx2,
                        mouseX-ctxBG.measureText(tx2).width/2,mouseY-15);
        }
        
        
    }
    function createKernel() {
        /*if (!calcSet) {*/
            calcSet = gpu.createKernel(function(iterations, vb, vbPosX, vbPosY, iters) {
                    let mult = 100;
                    let con = vb  / iterations;
                  
                  let totIts = 0;
                  let totMagn = 0;

                    let origA = this.thread.x  * con   + vbPosX -  vb / 2;
                    let origB = this.thread.y  * con   + vbPosY -  vb / 2;
                    let sA = origA+con*0.25;
                    let sB = origB+con*0.25;
                    let a = sA;
                    let b = sB;
                    let tmpA = sA;
                    let tmpB = sB;
                    let powA = a  * a;
                    let powB = b  * b;
                    let its = 0;
                    let magn = Math.sqrt(powA + powB);
                    while (its < iters && magn < 2) {
                        tmpA = powA - powB + sA;
                        tmpB = a * b  * 2 + sB ;

                        a = tmpA;
                        b = tmpB;

                        powA = a * a;
                        powB = b * b;
                        magn = Math.sqrt(powA + powB);
                        its++;
                    }
                    totIts+=its;
                    totMagn+=magn;

                    
                    sA = origA-con*0.25;
                    sB = origB-con*0.25;
                    a=sA;
                    b=sB;
                    tmpA = sA;
                    tmpB = sB;
                    powA = a * a;
                    powB = b * b;
                    its = 0;
                    magn = Math.sqrt(powA + powB);
                    while (its < iters && magn < 2) {
                        tmpA = powA - powB + sA;
                        tmpB = a * b  * 2 + sB ;

                        a = tmpA;
                        b = tmpB;

                        powA = a * a;
                        powB = b * b;
                        magn = Math.sqrt(powA + powB);
                        its++;
                    }
                    totIts+=its;
                    totMagn+=magn;

                    
                    sA = origA+con*0.25;
                    sB = origB-con*0.25;
                    a=sA;
                    b=sB;
                    tmpA = sA;
                    tmpB = sB;
                    powA = a * a;
                    powB = b * b;
                    its = 0;
                    magn = Math.sqrt(powA + powB);
                    while (its < iters && magn < 2) {
                        tmpA = powA - powB + sA;
                        tmpB = a * b  * 2 + sB ;

                        a = tmpA;
                        b = tmpB;


                        powA = a * a;
                        powB = b * b;
                        magn = Math.sqrt(powA + powB);
                        its++;
                    }
                    totIts+=its;
                    totMagn+=magn;

                    
                    sA = origA-con*0.25;
                    sB = origB+con*0.25;
                    a=sA;
                    b=sB;
                    tmpA = sA;
                    tmpB = sB;
                    powA = a * a;
                    powB = b * b;
                    its = 0;
                    magn = Math.sqrt(powA + powB);
                    while (its < iters && magn < 2) {
                        tmpA = powA - powB + sA;
                        tmpB = a * b  * 2 + sB ;

                        a = tmpA;
                        b = tmpB;

                        powA = a * a;
                        powB = b * b;
                        magn = Math.sqrt(powA + powB);
                        its++;
                    }
                    totIts+=its;
                    totMagn+=magn;

                    if (totMagn/4 < 2) {
                        this.color(0, 0, 0, 1 );
                    } else if (totIts<iters/8){
                        
                        this.color(
                        (totIts/(iters/4))%255,
                        0,
                        0,
                        Math.max(0.1, 1-(Math.ceil(totIts/10))%9/10));
                    } else if (totIts<iters/6){
                        this.color(
                        (totIts/(iters))%255,
                        0,
                        (totIts/(iters))%255,
                        Math.max(0.1, 1-(Math.ceil(totIts/10))%9/10));
                        
                    } else if (totIts<iters/4){
                        this.color(
                        0,
                        0,
                        (totIts/(iters/4))*255%255,
                        Math.max(0.1, 1-(Math.ceil(totIts/10))%9/10));
                        
                        
                    }else if (totIts<iters/2){
                        this.color(
                        0,
                        (totIts/(iters/4))%255,
                        (totIts/(iters/4))%255,
                        Math.max(0.1, 1-(Math.ceil(totIts/10))%9/10));
                        
                    } else if (totIts<iters/1){
                        
                        this.color(
                        0,
                        (totIts/(iters*2))*10%255,
                        0,
                        Math.max(0.1, 1-(Math.ceil(totIts))%9/10));
                    } else if (totIts<iters/0.1){
                        this.color(
                        (totIts/(iters/4))%255,
                        (totIts/(iters/4))%255,
                        0,
                        Math.max(0.1, 1-(Math.ceil(totIts/10))%9/10));
                        
                    } else {
                        this.color(
                        0,
                        (totIts/(iters/4))%255,
                        (totIts/(iters/4))%255,
                        Math.max(0.5, 1-(Math.ceil(totIts/10))%9/10));
                    }

                }).setOutput([iterations, iterations])
                .setGraphical(true);
        /*}*/
    }
    function runKernels(el,wd,ht) {
        let t = performance.now();
        
        

        

        calcSet(iterations, viewBox, viewBoxPos.x, viewBoxPos.y, iterationAmount);

        let t1 = performance.now();
        lastTime = t1 - t;
        ready = true;

    }
    var desPosX = 0;
    var desPosY = 0;
    var iterationAmount = 100;
    function renderCPU(set) {
        /*for (let i = 0;i<newDt.data.length-3;i+=4) {
        let x = (i/4)%iterations;

        let y = Math.floor(i/4/iterations);
        if (set[y][x]>=100) {
            newDt.data[i] = 0;//Math.min(255,50*set[x][y]);
            newDt.data[i+1] = 0;//Math.min(255,50*set[x][y]);
            newDt.data[i+2] = 0;//Math.min(255,50*set[x][y]);
            newDt.data[i+3] = 255;
            
        } else {
            newDt.data[i] = 0;//Math.max(0,100-set[x][y]);
            newDt.data[i+1] = set[y][x]*4%255;//Math.max(0,100-set[x][y]);
            newDt.data[i+2] = 255-set[y][x]*2%255;//Math.max(0,100-set[x][y]);
            newDt.data[i+3] = (set[y][x]+1)*10%255;
        }
   }*/
    }

    function myMouseWheel(event) {
        if (moving) {
            return;
        }
        event.preventDefault();
        if (delay) {
            return;
        }
        delay = true;
        let evDel = event.wheelDelta/Math.abs(event.wheelDelta)*Math.min(500,Math.abs(event.wheelDelta));
        var wheel = -(evDel) / 100; //n or -n

        zoom = 1 + Math.min(5,wheel) / 10;
        let rect = canvas.getBoundingClientRect();
        let mX = event.clientX - rect.left - rect.width / 2;
        let mY = event.clientY - rect.top - rect.height / 2;
        let bool = false;
        let tmpVB = Math.min(Math.max(viewBox * zoom,minZoom),maxZoom);
        viewBox = tmpVB;
        bool = true;
        if (viewBox * zoom < maxZoom && viewBox * zoom > minZoom) {
        }
        if (bool) {
            document.getElementById("zoomHandle").innerHTML ="x"+Math.floor(100*2/viewBox)/100;
            if (autoIteration) {
                updateIterationAmount();
            }
            runKernels();
        }
        window.setTimeout(function() {
            delay = false;
        }, 50)

    }


    function mouseMove(e) {

        let rect = e.target.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }

    function mouseClick(e) {
        if (moving) {
            return
        }
        let rect = e.target.getBoundingClientRect();
        mouseX = e.clientX /*- rect.left*/;
        mouseY = e.clientY /*- rect.top*/;
        let dis = Distance(mouseX, mouseY, rect.left + rect.width / 2, rect.top + rect.height / 2);
        let ang = angle(mouseX, mouseY, rect.left + rect.width / 2, rect.top + rect.height / 2);
        let convX = viewBoxPos.x - dis * viewBox / rect.width * Math.cos(ang);
        let convY = viewBoxPos.y + dis * viewBox / rect.height * Math.sin(ang);
        console.log(convX, convY);
        if (Math.abs(convX) < 2) {
            //viewBoxPos.x = convX;
            desPosX=convX;
        }
        if (Math.abs(convY) < 2) {
            //viewBoxPos.y = convY;
            desPosY=convY;
        }
        //runKernels();
        moveTick();
    }
    var moving=false
    function moveTick() {
        viewBoxPos.x=desPosX;
        viewBoxPos.y=desPosY;
        runKernels();

return;


        let bool = false;

        if (!delay) {
            let dis = Distance(desPosX,desPosY,viewBoxPos.x,viewBoxPos.y);
            let siz = Math.max(dis/5,5*viewBox/iterations);
            let ang = angle(desPosX,desPosY,viewBoxPos.x,viewBoxPos.y);
            if (dis>siz) {
                viewBoxPos.x-=siz*Math.cos(ang);
                viewBoxPos.y-=siz*Math.sin(ang);
                runKernels();
                delay=true;
                window.setTimeout(function() {
                    delay = false;
                }, 50)
            } else {
                viewBoxPos.x = desPosX;
                viewBoxPos.y = desPosY;
                bool=true;
            }
        }

        if (!bool) {
            moving = window.requestAnimationFrame(moveTick);
        } else {
            moving = false;
        }
    }
    function mouseMoveCnv(e) {
        let rect = cnv.getBoundingClientRect();
        mouseX = Math.floor(e.clientX - rect.x);
        mouseY = Math.floor(e.clientY - rect.y);
    }

    var tickSpeed = 50;



    var lastTick = 0;
    var ticker = 0;
    var theLoop = null;

    function rerunWhenReady() {

        if (!ready) {} else {
            ready = false;

            tmpCtx = null;
            tmpCnv = null;
            zoomScale = 1;
            viewBox *= 0.95;
            runKernels();

            interval = window.setInterval(function() {
                if (ready) {
                    rerunWhenReady();
                    clearInterval(interval);
                }
            }, 10)
        }
    }

    function tick() {
        var now = window.performance.now(); // current time in ms

        var deltaTime = now - lastTick; // amount of time elapsed since last tick

        lastTick = now;


        ticker += deltaTime;

        while (ticker > tickSpeed) {
            ticker -= tickSpeed;
        }
        theLoop = window.requestAnimationFrame(tick);

    }
    var set = [];


    //super slow.
    function drawSet() {
        let tot = 0;
        let count = 0;
        console.time("Start");
        set = [];
        for (let yCord = viewBoxPos.y; yCord < viewBoxPos.y + viewBox; yCord += viewBox / iterations) {
            set.push([]);
            for (let xCord = viewBoxPos.x; xCord < viewBoxPos.x + viewBox; xCord += viewBox / iterations) {
                let num = math.complex(xCord, yCord);
                let div = getInterpolatedDiv(num, num, 0);

                if (!isFinite(div.div.re) || !isFinite(div.div.im)) {

                    set[Math.floor(((yCord - viewBoxPos.y) * iterations / viewBox))].push(getColor1(div.iterations, 0.1));
                   

                    count++;
                } else {
                    set[Math.floor(((yCord - viewBoxPos.y) * iterations / viewBox))].push("rgba(0,0,0," + div.iterations / 1000 + ")");
                   

                }
                tot++;
                
            }
        }
        let xMod = iterations / 4 + iterations / 2;
        for (let i = 0; i < set.length; i++) {
            for (let j = 0; j < set[i].length; j++) {
                let w = ctxBG.canvas.width;
                let h = ctxBG.canvas.height;
                ctxBG.fillStyle = set[i][j];
                ctxBG.fillRect(j * tileSizeW - tileSizeW / 2, i * tileSizeH - tileSizeH / 2, tileSizeW, tileSizeH);
            }
        }
        console.timeEnd("Start");
    }

    function getInterpolatedDiv(C0, Cn, it) {
        let divs = [];
        for (let i = 0; i < 4; i++) {
            divs.push(getDivergance(C0, C0, it))
        }
        return averageDivs(divs); //{div: Cn1, iterations: it};

    }

    function averageDivs(divs) {
        let divI = 0;
        let divR = 0;
        let it = 0;
        for (let key in divs) {
            it += divs[key].iterations
            divR += divs[key].div.re;
            divI += divs[key].div.im;
        }
        return {
            div: {
                re: divR / divs.length,
                im: divI / divs.length
            },
            iterations: it / divs.length
        };
    }

    function getDivergance(C0, Cn, it) {
        let Cn1 = math.add(math.multiply(Cn, Cn), C0);
        for (var it = 1; it < 100 && isFinite(Cn1.re) && isFinite(Cn1.im); it++) {
            Cn1 = math.add(math.multiply(Cn1, Cn1), C0);
        }
        return {
            div: Cn1,
            iterations: it
        };
    }

    function createDiv(id, className, w, h, t, l, mL, mT, abs) {
        let tmpDiv = document.createElement("div");
        tmpDiv.style.width = w;
        tmpDiv.style.height = h;
        tmpDiv.style.marginTop = mT;
        tmpDiv.style.marginLeft = mL;
        tmpDiv.id = id;
        tmpDiv.className = className;
        if (abs) {
            tmpDiv.style.position = "absolute";
        }
        return tmpDiv;
    }

    function createCanvas(w, h, mL, mT, id, className, L, T, abs) {

        let tmpCnv = document.createElement("canvas");
        tmpCnv.id = id;
        tmpCnv.className = className;
        tmpCnv.width = w;
        tmpCnv.height = h;
        tmpCnv.style.marginTop = mT + "px";
        tmpCnv.style.marginLeft = mL + "px";
        if (abs) {
            tmpCnv.style.position = "absolute";
        }
        return tmpCnv;
    }
    var dummyContext = document.createElement("canvas");

    function hslToRgbString(h, s, l, a) {
        // a = a || 1;
        a = Math.floor(a * 100) / 100;
        dummyContext.fillStyle = 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ' )';
        //str = (String) dummyContext.fillStyle;
        return dummyContext.fillStyle;
    }
    var hi = 1e99;
    var lo = -1e99;


    function getColor1(n, a) {
        return "rgba(0," + Math.min(200, (Math.floor(n) * 4)) + ",0," + (n * 0.02) + ")";
    }

    function Distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
    }

    function angle(p1x, p1y, p2x, p2y) {

        return Math.atan2(p2y - p1y, p2x - p1x);

    }



    function count(that, arr) {
        let am = 0;
        for (let key in arr) {
            if (that == arr[key]) {
                am++;
            }
        }
        return am;
    }

    function countUntil(that, arr, key) {
        let am = 0;
        for (let kei = 0; kei < key; kei++) {
            if (that == arr[kei]) {
                am++;
            }
        }
        return am;
    }

    function countFrom(that, arr, key) {
        let am = 0;
        for (let kei = key + 1; kei < arr.length; kei++) {
            if (that == arr[kei]) {
                am++;
            }
        }
        return am;
    }
    return {
        init: function(el) {
            start(el);
        },
        renderSet: function() {
            runKernels();
        },
        getViewBox: function() {
            return {
                x:viewBoxPos.x,
                y:viewBoxPos.y,
                size:viewBox,
                scale: viewBox / cnvW,

            }
        },
        setIterations: function(val) {
            iterationAmount=val;

            runKernels();
        },
        getIterations: function() {
            return iterationAmount;
        },
        setDrawGrid: function(bool) {
            drawTheGrid = bool;
        },
        setCanvasSize: function(size) {
            iterations = width = height = size;
        
        
        
            tileSizeW = tileSizeH = Math.max(1, Math.floor(Math.min(width, height) / iterations) / 1);
            
            cnvW = tileSizeW * iterations;
            cnvH = tileSizeH * iterations;

            
            cnvBG.width = cnvW;
            cnvBG.height = cnvH;
            canvas.width = cnvW;
            canvas.height = cnvH;


            updateIterationAmount();
            runKernels();
        },
        setMinZoom: function(zoom) {
            minZoom=zoom;
        },
        setmaxZoom:function(zoom) {
            maxZoom = zoom;
        },
        setZoom:function(zoom) {
            viewBox = 4/zoom;
            document.getElementById("zoomHandle").innerHTML ="x"+Math.floor(100*2/viewBox)/100;
            runKernels();
        }
    }
})()