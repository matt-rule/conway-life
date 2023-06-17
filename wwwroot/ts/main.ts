import * as glMatrix from 'gl-matrix';

interface LifeCell {
    active: boolean;
    history: boolean[];
}

function createGrid(gridWidth : number, gridHeight : number, historyLength : number): LifeCell[][] {
    const result: LifeCell[][] = new Array(gridWidth);
    for (let x = 0; x < gridWidth; x++) {
        result[x] = new Array<LifeCell>(gridHeight);

        for (let y = 0; y < gridHeight; y++) {
            result[x][y] = {
                active: false,
                history: new Array(historyLength).fill(false)
            };
        }
    }
    return result;
}

let canvas : HTMLElement | null = document.getElementById("my_canvas");

if (!(canvas instanceof HTMLCanvasElement)) {
    alert('Canvas element not found');
}
else
{
    let gl : WebGL2RenderingContext | null = canvas.getContext("webgl2");

    if (!gl) {
        alert('Your browser does not support WebGL');
    }
    
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    let cellWidth : number = 20;
    let lastUpdateTime : number = 0;
    let updateIntervalMs : number = 1000 / 4; // interval per update in milliseconds
    let gridWidth : number = 40;
    let gridHeight : number = 30;
    let historyLength : number = 15;
    let grid : LifeCell[][] = createGrid(gridWidth, gridHeight, historyLength);
    let nextFrame : LifeCell[][] = createGrid(gridWidth, gridHeight, historyLength);

    let pause : boolean = true;

    function wrap(x : number, y : number) {
        return (x + y) % y;
    }

    function animate(timestamp : any): void {
        if (pause)
        {
            draw();
            return;
        }
        let elapsedTime : number = timestamp - lastUpdateTime;
        if (elapsedTime >= updateIntervalMs) {
            lastUpdateTime = timestamp;

            for (let x = 0; x < gridWidth; x++) {
                for (let y = 0; y < gridHeight; y++) {
                    let liveNeighbors = 0;

                    // Calculate the number of live neighbors
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx !== 0 || dy !== 0) {
                                let nx = wrap(x + dx, gridWidth);
                                let ny = wrap(y + dy, gridHeight);

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
            for (let x = 0; x < gridWidth; x++) {
                for (let y = 0; y < gridHeight; y++) {
                    grid[x][y].active = nextFrame[x][y].active;
                    grid[x][y].history = nextFrame[x][y].history.slice();
                }
            }
        }

        draw();
        requestAnimationFrame(animate);
    }

    function drawGrid(program: any, matrixLocation: any, colorLocation: any, projectionMatrix: any): void
    {
        if (!gl)
            return;

        let gridVertices = [];

        // Vertical lines
        for (let i = 0; i <= cellWidth*gridWidth; i += cellWidth) {
            gridVertices.push(i, 0);
            gridVertices.push(i, cellWidth*gridHeight);
        }

        // Horizontal lines
        for (let j = 0; j <= cellWidth*gridHeight; j += cellWidth) {
            gridVertices.push(0, j);
            gridVertices.push(cellWidth*gridWidth, j);
        }

        let gridVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVertices), gl.STATIC_DRAW);

        let positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, projectionMatrix, [0, 0, 0]);
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        gl.uniform4f(colorLocation, 0.3, 0.3, 0.3, 1);
        gl.drawArrays(gl.LINES, 0, gridVertices.length / 2);   
    }

    function drawSquare(program : WebGLProgram, matrixLocation : WebGLUniformLocation | null, colorLocation : WebGLUniformLocation | null,
        projectionMatrix : glMatrix.mat4, size : number, color : number[], x : number, y : number) {
        if (!gl)
            return;

        let squareVertices = [
            0, 0,
            size, 0,
            0, size,
            size, size
        ];

        let squareIndices = [
            0, 1, 2,
            2, 1, 3
        ];

        let squareVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);

        let squareIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);

        let positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, projectionMatrix, [x, y, 0]);
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);

        gl.drawElements(gl.TRIANGLES, squareIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    function drawBorder(program : WebGLProgram, matrixLocation : WebGLUniformLocation | null, colorLocation : WebGLUniformLocation | null,
        projectionMatrix : glMatrix.mat4, borderWidth : number, cellWidth : number, x : number, y : number) {
        if (!gl)
            return;

        let borderVertices = [];

        // Left vertical line
        for (let i = 0; i < borderWidth; i++) {
            borderVertices.push(i, 0);
            borderVertices.push(i, cellWidth);
        }

        // Right vertical line
        for (let i = cellWidth - borderWidth; i < cellWidth; i++) {
            borderVertices.push(i, 0);
            borderVertices.push(i, cellWidth);
        }

        // Top horizontal line
        for (let i = 0; i < borderWidth; i++) {
            borderVertices.push(0, i);
            borderVertices.push(cellWidth, i);
        }

        // Bottom horizontal line
        for (let i = cellWidth - borderWidth; i < cellWidth; i++) {
            borderVertices.push(0, i);
            borderVertices.push(cellWidth, i);
        }

        let borderVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, borderVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(borderVertices), gl.STATIC_DRAW);

        let positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, projectionMatrix, [x, y, 0]);
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        gl.uniform4f(colorLocation, 0.4, 0.45, 0.4, 1);

        gl.drawArrays(gl.LINES, 0, borderVertices.length / 2);   
    }

    function countRepeatingPattern(arr : boolean[], patternLen : number) : number {
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
        if (!gl)
            return;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);

        let vertexShaderSource : string = `
            attribute vec2 position;
            uniform mat4 u_matrix;
            
            void main() {
                gl_Position = u_matrix * vec4(position, 0.0, 1.0);
            }
        `;
        
        let vertexShader : WebGLShader | null = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader)
            return;
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        let fragmentShaderSource : string = `
            precision mediump float;
            uniform vec4 u_color;
            
            void main() {
                gl_FragColor = u_color;
            }
        `;

        let fragmentShader : WebGLShader | null = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader)
            return;
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        let program : WebGLProgram | null = gl.createProgram();
        if (!program)
            return;

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        let projectionMatrix : glMatrix.mat4 = glMatrix.mat4.create();
        glMatrix.mat4.ortho(projectionMatrix, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

        let matrixLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, "u_matrix");
        let colorLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, "u_color");

        for (let x = 0; x < gridWidth; x += 1) {
            for (let y = 0; y < gridHeight; y += 1) {

                let r_repeats = countRepeatingPattern(grid[x][y].history, 2);
                let g_repeats = countRepeatingPattern(grid[x][y].history, 5);
                let b_repeats = countRepeatingPattern(grid[x][y].history, 3);

                let r = (1.0 / 6) * r_repeats;    // floor(15/2) - 1
                let g = (1.0 / 2) * g_repeats;    // 15/5 - 1
                let b = (1.0 / 4) * b_repeats;    // 15/3 - 1

                if (r_repeats<3 && b_repeats<2)
                {
                    let repeats_6 = countRepeatingPattern(grid[x][y].history, 6);
                    let val_6 = (1.0 / 2) * repeats_6;
                    r = val_6;
                    b = val_6;
                }

                let color = [r,g,b,1];

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
            for (let x = 0; x < gridWidth; x++) {
                for (let y = 0; y < gridHeight; y++) {
                    grid[x][y].active = false;
                }
            }
        
            draw();
        }
    });

    if (canvas) {
        canvas.addEventListener('mousedown', function(event) {
            if (!canvas)
                return;
                
            let rect = canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;

            let cellX = Math.floor(mouseX / cellWidth);
            let cellY = Math.floor(mouseY / cellWidth);

            if (cellX >= 0 && cellX < gridWidth && cellY >= 0 && cellY < gridHeight) {
                if (event.button === 0) {           // Left mouse button
                    grid[cellX][cellY].active = !grid[cellX][cellY].active;
                }
                // if (event.button === 2) {           // Right mouse button
                    
                // }
            }

            draw();
        });
    }

    if (canvas) {
        canvas.addEventListener('contextmenu', function(event) {
            event.preventDefault();
        });
    }

    requestAnimationFrame(animate);
}