(function($) {
    "use strict";
    $(window).on("load", function() { // makes sure the whole site is loaded
        // in browser, URLs can be relative or absolute    
    });


    $(document).ready(function(){
        // detect screen size to adjust div
        detectScreenWidth();
        // initialize some labels
        initLabels();
        // initialize canvas
        canvasInit();
        //predictImage();
        $('#switch').change(function() {
            //console.log(switcher);
            switcher = !switcher;
            switchPrediction();
        });
        $('#button').click(function() {
            erase();
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, w, h);
            $('.label').css({color:"#b9b9b9"});
            $('.label-wrapper').css({background:"transparent", "box-shadow":"0px 0px 0px"});
            $('.progress-bar').css({height:"0%"});
            $('.bar-label').css({color:"#b9b9b9"});
        });
        
        // resize about section as screen changes size
        $(window).resize(function() {
            var size = $(window).width();
            if (size >= 752) {
                $('.arrow-down').css({"display":"none"});
                $('.footer').css({"position":"fixed"});
            } else {
                $('.arrow-down').css({"display":"block"});
                $('.footer').css({"position":"relative"});
            }
        });
    })
    
    // detect browser size to adjust div
    function detectScreenWidth() {
      var screenSize = $(window).width();
      if (screenSize >= 752) {
          $('.arrow-down').css({"display":"none"});
          $('.footer').css({"position":"fixed"});
      } else {
          $('.arrow-down').css({"display":"block"});
          $('.footer').css({"position":"relative"});
      }
    }
    
    var model_num = new KerasJS.Model({
        filepaths: {
            model: '../models/model2.json',
            weights: '../models/model2_weights.buf',
            metadata: '../models/model2_metadata.json'
        },
        gpu: false
    });

    var canvas, ctx, flag = false,
        prevX = 0,
        currX = 0,
        prevY = 0,
        currY = 0,
        dot_flag = false;
    var x = "black",
        y = 27;
    var canvas = $('#myCanvas')[0];
    var w = canvas.width,
        h = canvas.height;
    var switcher = true;

    
    function initLabels() {
        $('.on').css({left:"58%",color: "#48cc9e"});
        $('.off').css({left:"0%",color: "transparent"});
        var element = ["0","1","2","3","4","5","6","7","8","9"];
        for (var i = 0; i < 10; i++) {
            $(text[i]).html(element[i]);
            $(bar_text[i]).html(element[i]);
            $('#title').html("Draw A Digit From 0-9")
        }
    };
    
    function draw() {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = x;
        ctx.lineWidth = y;
        ctx.stroke();
        ctx.closePath();
    };

    function erase() {
        ctx.clearRect(0, 0, w, h);
    };

    function storeCanvas() {
        var imagedata = ctx.getImageData(0,0,w,h);
        var data = imagedata.data;
        // Preprocess input data
        var img_size = 28;
        var smallData = new Float32Array(252 * 252);
        var input = new Float32Array(img_size * img_size);
        var index = 0;

        for (var i = 0; i < data.length; i++) {
            if (i % 4 === 3) {
                var gray = parseFloat(data[i-1]+data[i-2]+data[i-3])/3

                // turn pixel to binary
                gray = (gray > 0) * 255.0;

                // zero-mean and normalize pixels
                smallData[index++] = (255.0 - gray - 127.5) / 255.0;

                //smallData[index++] = 255 - gray;

            }
        }
        for (var i = 0; i < 252; i++) {
            for (var j = 0; j < 252; j++) {
                if (i % 10 === 0 && j % 10 === 0) {
                    input[i/10 * img_size + j/10] = smallData[i * 252 + j];
                }
            }
        }
        // draw small image
        //drawCanvas(input);
        return input;
    };


    /*function drawCanvas(input) {
        var smallCanvas = $('#smallCanvas')[0];
        var ctx_s = smallCanvas.getContext("2d");
        var imgData = ctx_s.createImageData(28,28);
        for (var i = 0; i < imgData.data.length; i+= 4) {
            imgData.data[i] = parseInt(input[i/4] * 255 + 127.5);
            imgData.data[i+1] = parseInt(input[i/4] * 255 + 127.5);
            imgData.data[i+2] = parseInt(input[i/4] * 255 + 127.5);
            imgData.data[i+3] = 255.0;
        }
        ctx_s.putImageData(imgData, 0, 0);
    }

    function predictImage() {
        var smallCanvas = $('#smallCanvas')[0];
        var ctx_s = smallCanvas.getContext("2d");
        var img = document.getElementById("scream");
        ctx_s.drawImage(img, 0, 0);
        var imagedata = ctx_s.getImageData(0,0,28,28);
        var data = imagedata.data;
        var img_size = 28;
        var input = new Float32Array(img_size * img_size);
        var index = 0;
        for (var i = 0; i < data.length; i++) {
            if (i % 4 === 3) {
                var gray = parseFloat(data[i-1]+data[i-2]+data[i-3])/3;
                input[index++] = (gray - 127.5) / 255.0;
            }
        }
        predictModel(input);
    };*/


    var output = false;
    var text = ['#n0', '#n1', '#n2', '#n3', '#n4', '#n5', '#n6', '#n7', '#n8', '#n9'];
    var label = ['#label0', '#label1', '#label2', '#label3', '#label4', '#label5', '#label6', '#label7', '#label8', '#label9'];
    var bar = ['#progress0', '#progress1', '#progress2', '#progress3', '#progress4', '#progress5', '#progress6', '#progress7', '#progress8', '#progress9'];
    var bar_text = ['#bar-l-0', '#bar-l-1', '#bar-l-2', '#bar-l-3', '#bar-l-4', '#bar-l-5', '#bar-l-6', '#bar-l-7', '#bar-l-8', '#bar-l-9'];
    function predictModel(inputImage) {
        model_num.ready().then(() => {
            //console.log(inputImage);
            const inputData = {
                'input': inputImage
            }
            return model_num.predict(inputData);
        })
        .then(outputData =>  {
            var output = outputData.output;
            var maxIdx = 0;
            var globalMax = 0;
            for (var i = 0; i < output.length; i++) {
                output[i] = parseInt(output[i]*100);
                if (output[i] > globalMax) {
                    globalMax = output[i];
                    maxIdx = i;
                }
            }
            for (var i = 0; i < bar.length; i++) {
                if (i !== maxIdx) {
                    $(text[i]).css({color:"#b9b9b9"});
                    $(label[i]).css({background: "#ffffff", "box-shadow":"0px 0px 0px"});
                    $(bar_text[i]).css({color:"#b9b9b9"});
                    $(bar[i]).css({height:output[i] + "%", background:"#b9b9b9"});
                } else {
                    $(text[i]).css({color:"#ffffff"});
                    $(label[i]).css({background: "#48cc9e", "box-shadow":"7px 7px 7px #cccccc"});
                    $(bar_text[i]).css({color:"#48cc9e"});
                    $(bar[i]).css({height:output[i] + "%", background:"#48cc9e"});
                }
            }
        })
        .catch(err => {
            // handle error
            console.log("Cannot predict model!");
        })
    }


    function findxy(res, e) {
        var trans = $('#myCanvas').css('transform').split(/[()]/)[1];
        var offsetL1 = canvas.offsetLeft;
        var offsetL2 = $('.canvas-wrapper')[0].offsetLeft;
        var offsetL3 = $(window).scrollLeft();
        var offsetL4 = parseFloat(trans.split(',')[4]);
        var offsetT1 = canvas.offsetTop;
        var offsetT2 = $('.canvas-wrapper')[0].offsetTop;
        var offsetT3 = $(window).scrollTop();
        if (res == 'down') {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - offsetL1 - offsetL2 + offsetL3 - offsetL4 - 8;
            currY = e.clientY - offsetT1 - offsetT2 + offsetT3 - 8;
            dot_flag = true;
            if (dot_flag) {
                ctx.beginPath();
                ctx.fillStyle = x;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.closePath();
            }
        }
        if (res == 'up' || res == 'out') {
            if (dot_flag) {
                // prepocess canvas data
                var inputImage = storeCanvas();
                // predict model
                predictModel(inputImage);
            }
            dot_flag = false;
        }
        if (res == 'move') {
            if (dot_flag) {
                prevX = currX;
                prevY = currY;
                currX = e.clientX - offsetL1 - offsetL2 + offsetL3 -offsetL4 - 8;
                currY = e.clientY - offsetT1 - offsetT2 + offsetT3 - 8;
                draw();
            }
        }

        // Touch event handle
        if (res == 'touchstart') {
            e.preventDefault();
            prevX = currX;
            prevY = currY;
            currX = e.originalEvent.touches[0].clientX - offsetL1 - offsetL2 + offsetL3 - offsetL4 - 8;
            currY = e.originalEvent.touches[0].clientY - offsetT1 - offsetT2 + offsetT3 - 8;
            dot_flag = true;
            if (dot_flag) {
                ctx.beginPath();
                ctx.fillStyle = x;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.closePath();
            }
        } 
        if (res == 'touchmove') {
            e.preventDefault();
            if (dot_flag) {
                prevX = currX;
                prevY = currY;
                currX = e.originalEvent.touches[0].clientX - offsetL1 - offsetL2 + offsetL3 -offsetL4 - 8;
                currY = e.originalEvent.touches[0].clientY - offsetT1 - offsetT2 + offsetT3 - 8;
                draw();
            }
        }
        if (res == 'touchend') {
            if (dot_flag) {
                // prepocess canvas data
                var inputImage = storeCanvas();
                // predict model
                predictModel(inputImage);
            }
            dot_flag = false;
        }
    };


    function canvasInit() {
        ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, w, h);

        $('#myCanvas').mousemove(function (e) {
            findxy('move', e);
        });
        $('#myCanvas').mousedown(function (e) {
            findxy('down', e);
        });
        $('#myCanvas').mouseup(function (e) {
            findxy('up', e);
        });
        $('#myCanvas').mouseout(function (e) {
            findxy('out', e);
        });

        //touch event
        $('#myCanvas').on("touchstart", function(e) {
            findxy('touchstart', e);
        })
        $('#myCanvas').on("touchmove", function(e) {
            findxy('touchmove', e);
        })
        $('#myCanvas').on("touchend", function(e) {
            findxy('touchend', e);
        })
    };


    function switchPrediction() {
        if (!switcher) {
            model_num = new KerasJS.Model({
                filepaths: {
                    model: '../models/model_l.json',
                    weights: '../models/model_l_weights.buf',
                    metadata: '../models/model_l_metadata.json'
                },
                gpu: false
            });
            $('.on').css({left:"100%",color: "transparent"});
            $('.off').css({left:"45%",color: "#48cc9e"});
            var element = ["A","B","C","D","E","F","G","H","I","J"];
            for (var i = 0; i < 10; i++) {
                $(text[i]).html(element[i]);
                $(bar_text[i]).html(element[i]);
                $('#title').html("Draw An UPPER Letter From A-J")
            }
        } else {
            model_num = new KerasJS.Model({
                filepaths: {
                    model: '../models/model2.json',
                    weights: '../models/model2_weights.buf',
                    metadata: '../models/model2_metadata.json'
                },
                gpu: false
            });
            $('.on').css({left:"58%",color: "#48cc9e"});
            $('.off').css({left:"0%",color: "transparent"});
            var element = ["0","1","2","3","4","5","6","7","8","9"];
            for (var i = 0; i < 10; i++) {
                $(text[i]).html(element[i]);
                $(bar_text[i]).html(element[i]);
                $('#title').html("Draw A Digit From 0-9")
            }
        }
    }
})(jQuery)