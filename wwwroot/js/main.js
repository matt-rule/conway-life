var canvas = document.getElementById("my_canvas");
var gl = canvas.getContext("webgl2");

if (!gl) {
    alert('Your browser does not support WebGL');
}

canvas.width  = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var cellWidth = 20;
var lastUpdateTime = 0;
var updateIntervalMs = 1000 / 4; // interval per update in milliseconds
var gridWidth = 40;
var gridHeight = 30;
var historyLength = 15;
var grid = new createGrid();
var nextFrame = new createGrid();

function createGrid() {
    var result = new Array(gridWidth);
    for (var x = 0; x < gridWidth; x++) {
        result[x] = new Array(gridHeight);
    
        for (var y = 0; y < gridHeight; y++) {
            result[x][y] = {
                active: false,
                //active: (Math.floor(x / 2) + y) % 2 === 0,    // agar
                history: new Array(15).fill(false)
            };
        }
    }
    return result;
}

var pause = true;

function wrap(x, y) {
    return (x + y) % y;
}

function animate(timestamp) {
    if (pause)
    {
        draw();
        return;
    }
    var elapsedTime = timestamp - lastUpdateTime;
    if (elapsedTime >= updateIntervalMs) {
        lastUpdateTime = timestamp;

        for (var x = 0; x < gridWidth; x++) {
            for (var y = 0; y < gridHeight; y++) {
                var liveNeighbors = 0;

                // Calculate the number of live neighbors
                for (var dx = -1; dx <= 1; dx++) {
                    for (var dy = -1; dy <= 1; dy++) {
                        if (dx !== 0 || dy !== 0) {
                            var nx = wrap(x + dx, gridWidth);
                            var ny = wrap(y + dy, gridHeight);

                            if (grid[nx][ny].active) {
                                liveNeighbors++;
                            }
                        }
                    }
                }

                if (grid[x][y].active && (liveNeighbors < 2 || liveNeighbors > 3)) {
                    nextFrame[x][y].active = false;
                } else if (!grid[x][y].active && liveNeighbors === 3) {
                    nextFrame[x][y].active = true;
                } else {
                    nextFrame[x][y].active = grid[x][y].active;
                }

                // Treat nextFrame[x][y].history as a queue, remove from end and add to beginning
                nextFrame[x][y].history.pop();
                nextFrame[x][y].history.unshift(nextFrame[x][y].active);
            }
        }

        // Copy the contents of nextFrame into grid
        for (var x = 0; x < gridWidth; x++) {
            for (var y = 0; y < gridHeight; y++) {
                grid[x][y].active = nextFrame[x][y].active;
                grid[x][y].history = nextFrame[x][y].history.slice();
            }
        }
    }

    draw();
    requestAnimationFrame(animate);
}

function drawGrid(program, matrixLocation, colorLocation, projectionMatrix)
{
    var gridVertices = [];

    // Vertical lines
    for (var i = 0; i <= cellWidth*gridWidth; i += cellWidth) {
        gridVertices.push(i, 0);
        gridVertices.push(i, cellWidth*gridHeight);
    }

    // Horizontal lines
    for (var j = 0; j <= cellWidth*gridHeight; j += cellWidth) {
        gridVertices.push(0, j);
        gridVertices.push(cellWidth*gridWidth, j);
    }

    var gridVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVertices), gl.STATIC_DRAW);

    var positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    var matrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(matrix, projectionMatrix, [0, 0, 0]);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    gl.uniform4f(colorLocation, 0.3, 0.3, 0.3, 1);
    gl.drawArrays(gl.LINES, 0, gridVertices.length / 2);   
}

function drawSquare(program, matrixLocation, colorLocation, projectionMatrix, size, color, x, y) {
    var squareVertices = [
        0, 0,
        size, 0,
        0, size,
        size, size
    ];

    var squareIndices = [
        0, 1, 2,
        2, 1, 3
    ];

    var squareVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);

    var squareIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);

    var positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    var matrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(matrix, projectionMatrix, [x, y, 0]);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);

    gl.drawElements(gl.TRIANGLES, squareIndices.length, gl.UNSIGNED_SHORT, 0);
}

function drawBorder(program, matrixLocation, colorLocation, projectionMatrix, borderWidth, cellWidth, x, y) {
    var borderVertices = [];

    // Left vertical line
    for (var i = 0; i < borderWidth; i++) {
        borderVertices.push(i, 0);
        borderVertices.push(i, cellWidth);
    }

    // Right vertical line
    for (var i = cellWidth - borderWidth; i < cellWidth; i++) {
        borderVertices.push(i, 0);
        borderVertices.push(i, cellWidth);
    }

    // Top horizontal line
    for (var i = 0; i < borderWidth; i++) {
        borderVertices.push(0, i);
        borderVertices.push(cellWidth, i);
    }

    // Bottom horizontal line
    for (var i = cellWidth - borderWidth; i < cellWidth; i++) {
        borderVertices.push(0, i);
        borderVertices.push(cellWidth, i);
    }

    var borderVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, borderVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(borderVertices), gl.STATIC_DRAW);

    var positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    var matrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(matrix, projectionMatrix, [x, y, 0]);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    gl.uniform4f(colorLocation, 0.4, 0.45, 0.4, 1);

    gl.drawArrays(gl.LINES, 0, borderVertices.length / 2);   
}

function countRepeatingPattern(arr, patternLen) {
    if (patternLen <= 0 || patternLen > arr.length) {
        return 0;
    }
    
    const pattern = arr.slice(0, patternLen);

    if (pattern.every(value => value === false))
        return 0;
    
    let count = 0;
    let patternIndex = 0;
    
    // Loop through the array to see how many times pattern repeats consecutively
    for (let i = patternLen; i < arr.length; i++) {
        if (arr[i] === pattern[patternIndex]) {
            patternIndex = (patternIndex + 1) % patternLen;
            if (patternIndex === patternLen-1) {
                count++;
            }
        } else {
            break;
        }
    }

    return count;
}

function draw()
{
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    var vertexShaderSource = `
        attribute vec2 position;
        uniform mat4 u_matrix;
        
        void main() {
            gl_Position = u_matrix * vec4(position, 0.0, 1.0);
        }
    `;
    
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    var fragmentShaderSource = `
        precision mediump float;
        uniform vec4 u_color;
        
        void main() {
            gl_FragColor = u_color;
        }
    `;
    
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    var projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.ortho(projectionMatrix, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    var colorLocation = gl.getUniformLocation(program, "u_color");

    for (var x = 0; x < gridWidth; x += 1) {
        for (var y = 0; y < gridHeight; y += 1) {

            var r_repeats = countRepeatingPattern(grid[x][y].history, 2);
            var g_repeats = countRepeatingPattern(grid[x][y].history, 5);
            var b_repeats = countRepeatingPattern(grid[x][y].history, 3);

            var r = (1.0 / 6) * r_repeats;    // floor(15/2) - 1
            var g = (1.0 / 2) * g_repeats;    // 15/5 - 1
            var b = (1.0 / 4) * b_repeats;    // 15/3 - 1

            if (r_repeats<3 && b_repeats<2)
            {
                var repeats_6 = countRepeatingPattern(grid[x][y].history, 6);
                var val_6 = (1.0 / 2) * repeats_6;
                r = val_6;
                b = val_6;
            }

            var color = [r,g,b,1];

            drawSquare(program, matrixLocation, colorLocation, projectionMatrix, cellWidth, color, x*cellWidth, y*cellWidth);

            if (grid[x][y].active)
                drawBorder(program, matrixLocation, colorLocation, projectionMatrix, 3, cellWidth, x*cellWidth, y*cellWidth);
        }
    }

    drawGrid(program, matrixLocation, colorLocation, projectionMatrix);
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        pause = !pause;
        if (!pause)
            requestAnimationFrame(animate);
    }
    if (event.code === 'KeyR') {
        for (var x = 0; x < gridWidth; x++) {
            for (var y = 0; y < gridHeight; y++) {
                grid[x][y].active = false;
            }
        }
    
        draw();
    }
});

canvas.addEventListener('mousedown', function(event) {
    var rect = canvas.getBoundingClientRect();
    var mouseX = event.clientX - rect.left;
    var mouseY = event.clientY - rect.top;

    var cellX = Math.floor(mouseX / cellWidth);
    var cellY = Math.floor(mouseY / cellWidth);

    if (cellX >= 0 && cellX < gridWidth && cellY >= 0 && cellY < gridHeight) {
        if (event.button === 0) {           // Left mouse button
            grid[cellX][cellY].active = !grid[cellX][cellY].active;
        }
        // if (event.button === 2) {           // Right mouse button
            
        // }
    }

    draw();
});

canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

requestAnimationFrame(animate);
