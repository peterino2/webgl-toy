main();


let squareRotation = 0.0;
let deltaTime = 0.0;

function initShaderProgram(gl, vsSource, fsSource)
{
    const vss = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fss = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shader = gl.createProgram();
    gl.attachShader(shader, vss);
    gl.attachShader(shader, fss);
    gl.linkProgram(shader);

    if(!gl.getProgramParameter(shader, gl.LINK_STATUS))
    {
        alert(`unable to initialize the shader program: ${gl.getProgramInfoLog(shader)}`, )
        return null;
    }

    return shader;
}

function loadShader(gl, type, source)
{
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert(`an error occurred while compiling the ${type} shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initBuffers(gl)
{
    return {
        position: initPositionBuffer(gl),
        color: initColorBuffer(gl),
    };
}

function initColorBuffer(gl)
{
    const colors = [
        1.0, 1.0, 1.0, 1.0, //
        1.0, 0.0, 0.0, 1.0, //
        0.0, 1.0, 0.0, 1.0, //
        0.0, 0.0, 1.0, 1.0, //
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return colorBuffer;
}

function initPositionBuffer(gl){
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}


function drawScene(gl, programInfo, buffers, squareRotation)
{
    gl.clearColor(0.0,0.0,0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    const fieldOfView = (45 * Math.PI) / 180;
    
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    const zNear = 0.1;
    const zFar = 10000.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();

    mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        [0.0, 0.0, -6.0],
    );

    mat4.rotate(modelViewMatrix, modelViewMatrix, squareRotation, [0,0,1]);

    setPositionAttribute(gl, buffers, programInfo);
    setColorAttribute(gl, buffers, programInfo);

    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
    );
    
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix,
    );

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
    
}

function setColorAttribute(gl, buffers, programInfo)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        4,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

function setPositionAttribute(gl, buffers, programInfo)
{
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;

    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

function main() 
{
    const fsSource = `
        varying lowp vec4 vColor;

        void main() {
          gl_FragColor = vColor;
        }
      `;

    // Vertex shader program
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main() {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
          vColor = aVertexColor;
        }
      `;
    const canvas = document.querySelector("#glcanvas");
    const gl = canvas.getContext("webgl");
    
    if(gl == null)
    {
        alert("unable to initialize webgl");
        return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        },
    }

    let buffers = initBuffers(gl);

    let then = 0;

    function render(now)
    {
        now *= 0.001;
        deltaTime = now - then;
        then = now;
        
        drawScene(gl, programInfo, buffers, squareRotation)
        squareRotation += deltaTime;

        requestAnimationFrame(render)
    }

    requestAnimationFrame(render);
}
