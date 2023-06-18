import * as glMatrix from 'gl-matrix';

interface LifeCell {
    active: boolean;
    history: boolean[];
}

const cellWidth : number = 20;
const gridWidth : number = 40;
const gridHeight : number = 30;
const historyLength : number = 15;
const updateIntervalMs : number = 1000 / 4; // milliseconds between each update

function createGrid(): LifeCell[][] {
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

class Renderer {
    // Define members (properties)
    public canvas: HTMLElement;
    public gl: WebGL2RenderingContext;

    // Define a constructor
    constructor(canvas: HTMLElement, gl: WebGL2RenderingContext) {
        this.canvas = canvas;
        this.gl = gl;
    }

    public drawGrid(program: any, matrixLocation: any, colorLocation: any, projectionMatrix: any): void
    {
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

        let gridVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gridVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(gridVertices), this.gl.STATIC_DRAW);

        let positionLocation = this.gl.getAttribLocation(program, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, projectionMatrix, [0, 0, 0]);
        this.gl.uniformMatrix4fv(matrixLocation, false, matrix);

        this.gl.uniform4f(colorLocation, 0.3, 0.3, 0.3, 1);
        this.gl.drawArrays(this.gl.LINES, 0, gridVertices.length / 2);   
    }

    public drawSquare(program : WebGLProgram, matrixLocation : WebGLUniformLocation | null, colorLocation : WebGLUniformLocation | null,
        projectionMatrix : glMatrix.mat4, size : number, color : number[], x : number, y : number) {

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

        let squareVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, squareVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(squareVertices), this.gl.STATIC_DRAW);

        let squareIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareIndices), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, squareVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);

        let positionLocation = this.gl.getAttribLocation(program, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, projectionMatrix, [x, y, 0]);
        this.gl.uniformMatrix4fv(matrixLocation, false, matrix);

        this.gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);

        this.gl.drawElements(this.gl.TRIANGLES, squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    public drawBorder(program : WebGLProgram, matrixLocation : WebGLUniformLocation | null, colorLocation : WebGLUniformLocation | null,
        projectionMatrix : glMatrix.mat4, borderWidth : number, cellWidth : number, x : number, y : number) {

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

        let borderVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, borderVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(borderVertices), this.gl.STATIC_DRAW);

        let positionLocation = this.gl.getAttribLocation(program, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, projectionMatrix, [x, y, 0]);
        this.gl.uniformMatrix4fv(matrixLocation, false, matrix);

        this.gl.uniform4f(colorLocation, 0.4, 0.45, 0.4, 1);

        this.gl.drawArrays(this.gl.LINES, 0, borderVertices.length / 2);   
    }

    public countRepeatingPattern(arr : boolean[], patternLen : number) : number {
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
    
    public draw(): void
    {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.CULL_FACE);

        let vertexShaderSource : string = `
            attribute vec2 position;
            uniform mat4 u_matrix;
            
            void main() {
                gl_Position = u_matrix * vec4(position, 0.0, 1.0);
            }
        `;
        
        let vertexShader : WebGLShader | null = this.gl.createShader(this.gl.VERTEX_SHADER);
        if (!vertexShader)
            return;
        this.gl.shaderSource(vertexShader, vertexShaderSource);
        this.gl.compileShader(vertexShader);

        let fragmentShaderSource : string = `
            precision mediump float;
            uniform vec4 u_color;
            
            void main() {
                gl_FragColor = u_color;
            }
        `;

        let fragmentShader : WebGLShader | null = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        if (!fragmentShader)
            return;
        this.gl.shaderSource(fragmentShader, fragmentShaderSource);
        this.gl.compileShader(fragmentShader);

        let program : WebGLProgram | null = this.gl.createProgram();
        if (!program)
            return;

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        this.gl.useProgram(program);

        let projectionMatrix : glMatrix.mat4 = glMatrix.mat4.create();
        glMatrix.mat4.ortho(projectionMatrix, 0, this.gl.canvas.width, this.gl.canvas.height, 0, -1, 1);

        let matrixLocation : WebGLUniformLocation | null = this.gl.getUniformLocation(program, "u_matrix");
        let colorLocation : WebGLUniformLocation | null = this.gl.getUniformLocation(program, "u_color");

        for (let x = 0; x < gridWidth; x += 1) {
            for (let y = 0; y < gridHeight; y += 1) {

                let r_repeats = this.countRepeatingPattern(thisFrame[x][y].history, 2);
                let g_repeats = this.countRepeatingPattern(thisFrame[x][y].history, 5);
                let b_repeats = this.countRepeatingPattern(thisFrame[x][y].history, 3);

                let r = (1.0 / 6) * r_repeats;    // floor(15/2) - 1
                let g = (1.0 / 2) * g_repeats;    // 15/5 - 1
                let b = (1.0 / 4) * b_repeats;    // 15/3 - 1

                if (r_repeats<3 && b_repeats<2)
                {
                    let repeats_6 = this.countRepeatingPattern(thisFrame[x][y].history, 6);
                    let val_6 = (1.0 / 2) * repeats_6;
                    r = val_6;
                    b = val_6;
                }

                let color = [r,g,b,1];

                this.drawSquare(program, matrixLocation, colorLocation, projectionMatrix, cellWidth, color, x*cellWidth, y*cellWidth);

                if (thisFrame[x][y].active)
                this.drawBorder(program, matrixLocation, colorLocation, projectionMatrix, 3, cellWidth, x*cellWidth, y*cellWidth);
            }
        }

        this.drawGrid(program, matrixLocation, colorLocation, projectionMatrix);
    }
}

class GameRules {
    private static wrap(x : number, y : number) {
        return (x + y) % y;
    }

    public static update(thisFrame : LifeCell[][], nextFrame : LifeCell[][]) {
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                let liveNeighbors = 0;

                // Calculate the number of live neighbors
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx !== 0 || dy !== 0) {
                            let nx = this.wrap(x + dx, gridWidth);
                            let ny = this.wrap(y + dy, gridHeight);

                            if (thisFrame[nx][ny].active) {
                                liveNeighbors++;
                            }
                        }
                    }
                }

                if (thisFrame[x][y].active && (liveNeighbors < 2 || liveNeighbors > 3)) {
                    nextFrame[x][y].active = false;
                } else if (!thisFrame[x][y].active && liveNeighbors === 3) {
                    nextFrame[x][y].active = true;
                } else {
                    nextFrame[x][y].active = thisFrame[x][y].active;
                }

                // Treat nextFrame[x][y].history as a queue, remove from end and add to beginning
                nextFrame[x][y].history.pop();
                nextFrame[x][y].history.unshift(nextFrame[x][y].active);
            }
        }

        // Copy the contents of nextFrame into thisFrame
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                thisFrame[x][y].active = nextFrame[x][y].active;
                thisFrame[x][y].history = nextFrame[x][y].history.slice();
            }
        }
    }
}

let canvas : HTMLElement | null = document.getElementById("my_canvas");
let lastUpdateTime : number = 0;
let thisFrame : LifeCell[][] = createGrid();
let nextFrame : LifeCell[][] = createGrid();
let pause : boolean = true;

if (!(canvas instanceof HTMLCanvasElement)) {
    alert('Canvas element not found');
}
else
{
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    let gl : WebGL2RenderingContext | null = canvas.getContext("webgl2");

    if (!gl) {
        alert('Your browser does not support WebGL');
    }
    else
    {
        let renderer = new Renderer(canvas, gl);

        function animate(timestamp : any): void {
            if (pause)
            {
                renderer.draw();
                return;
            }
            let elapsedTime : number = timestamp - lastUpdateTime;
            if (elapsedTime >= updateIntervalMs) {
                lastUpdateTime = timestamp;
                GameRules.update(thisFrame, nextFrame);
            }
    
            renderer.draw();
            requestAnimationFrame(animate);
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
                        thisFrame[x][y].active = false;
                    }
                }
            
                renderer.draw();
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
                        thisFrame[cellX][cellY].active = !thisFrame[cellX][cellY].active;
                    }
                    // if (event.button === 2) {           // Right mouse button
                        
                    // }
                }

                renderer.draw();
            });
        }

        if (canvas) {
            canvas.addEventListener('contextmenu', function(event) {
                event.preventDefault();
            });
        }

        requestAnimationFrame(animate);
    }
}