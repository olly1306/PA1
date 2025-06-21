'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let shProgramWebCam;            // A shader program for webcam.
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let stereoCam;                  // Object holding stereo camera and its parameters

let iTextureWebCam = null;
let texture_object = null; 
let video;

function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
    this.iColor = -1;
    this.iModelViewMatrix = -1;
    this.iProjectionMatrix = -1;
    this.iSampler = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (video.readyState >= 2) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, iTextureWebCam);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }

    shProgramWebCam.Use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, iTextureWebCam);
    gl.uniform1i(shProgramWebCam.iSampler, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    shProgram.Use();

    let modelView = getIsActive() ? getRotationMatrix() : spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    const colorPolygon = new Float32Array([0.5, 0.5, 0.5, 1]);
    const colorEdge    = new Float32Array([1, 1, 1, 1]);

    let matrLeftFrustum = stereoCam.calcLeftFrustum();
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrLeftFrustum);

    let translateLeftEye = m4.translation(stereoCam.eyeSeparation/2, 0, 0);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateLeftEye, matAccum0);
    let matAccum2 = m4.multiply(translateToPointZero, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture_object);
    gl.uniform1i(shProgram.iSampler, 0);

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 0);

    gl.colorMask(true, false, false, true);
    gl.uniform4fv(shProgram.iColor, colorPolygon);
    surface.draw();
    gl.uniform4fv(shProgram.iColor, colorEdge);
    surface.drawWireframe(shProgram);

    gl.clear(gl.DEPTH_BUFFER_BIT);

    let matrRightFrustum = stereoCam.calcRightFrustum();
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrRightFrustum);

    let translateRightEye = m4.translation(-stereoCam.eyeSeparation/2, 0, 0);

    matAccum0 = m4.multiply(rotateToPointZero, modelView);
    matAccum1 = m4.multiply(translateRightEye, matAccum0);
    matAccum2 = m4.multiply(translateToPointZero, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);

    gl.colorMask(false, true, true, true);
    gl.uniform4fv(shProgram.iColor, colorPolygon);
    surface.draw();
    gl.uniform4fv(shProgram.iColor, colorEdge);
    surface.drawWireframe(shProgram);

    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);

    requestAnimationFrame(draw);
}


function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "ProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");

    shProgram.iTextureCoords = gl.getAttribLocation(prog, "aTextureCoord");
    shProgram.iSampler = gl.getUniformLocation(prog, "uSampler");

    let progWebCam = createProgram(gl, vertexShaderWebCamSource, fragmentShaderWebCamSource);
    shProgramWebCam = new ShaderProgram('WebCam', progWebCam);
    shProgramWebCam.Use();

    shProgramWebCam.iSampler = gl.getUniformLocation(progWebCam, "video");

    const L = 5.0;     
    const T = 3.0;     
    const B = 0.5;     
    const uSteps = 60;
    const vSteps = 60;

    surface = new Model(gl, uSteps, vSteps, L, T, B);

    stereoCam = new StereoCamera(
        0.5,                                      
        15.0,                                     
        gl.canvas.width / gl.canvas.height,       
        0.35,
        8.0,  
        25.0 
    );

    gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);

    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader: " + gl.getShaderInfoLog(vsh));
    }

    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);

    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader: " + gl.getShaderInfoLog(fsh));
    }

    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(prog));
    }

    return prog;
}

function LoadTexture() {
    texture_object = gl.createTexture();
    let image = new Image();
    image.src = 'wall.jpg';
    image.crossOrigin = 'anonymous';

    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture_object);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        draw();
    };
}

function CreateWebCamTexture(width, height)
{
    let textureID = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureID);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    return textureID;
}

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl2");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL(); 
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    LoadTexture();
   
    document.getElementById("eyeSeparation").addEventListener("input", function() {
        stereoCam.eyeSeparation = parseFloat(this.value);
    });
    document.getElementById("fieldOfView").addEventListener("input", function() {
        stereoCam.fieldOfView = parseFloat(this.value);
    });
    document.getElementById("nearClipping").addEventListener("input", function() {
        stereoCam.nearClipping = parseFloat(this.value);
    });
    document.getElementById("convergence").addEventListener("input", function() {
        stereoCam.convergence = parseFloat(this.value);
    });

    document.getElementById("connectBtn").addEventListener("click", function() {
        const ip = document.getElementById("serverIP").value;
        connectToSensorServer(ip);
    });

    video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    let constraints = { video: true };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        let track = stream.getVideoTracks()[0];
        let settings = track.getSettings();

        let vidWidth = settings.width || video.videoWidth || 640;
        let vidHeight = settings.height || video.videoHeight || 480;
        iTextureWebCam = CreateWebCamTexture(vidWidth, vidHeight);
        video.play();
    })
        .catch(function(err) {
            console.log(err.name + ": " + err.message);
        });

    requestAnimationFrame(draw);

    spaceball = new TrackballRotator(canvas, draw, 0);
}
