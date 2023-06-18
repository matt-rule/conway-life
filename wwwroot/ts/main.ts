import * as glMatrix from 'gl-matrix';

interface LifeCell {
    active: boolean;
    color: number[];
}

const cellWidth: number = 20;
const gridWidth: number = 40;
const gridHeight: number = 30;
const historyLength: number = 15;
const updatesPerSecond: number = 8;
const updateIntervalMs: number = 1000 / updatesPerSecond; // milliseconds between each update
const borderWidth = 3;

let currentFrame: number = 0;
let history: boolean[][][] = createHistory();

function createGrid(): LifeCell[][] {
    const result: LifeCell[][] = new Array(gridWidth);
    for (let x = 0; x < gridWidth; x++) {
        result[x] = new Array<LifeCell>(gridHeight);

        for (let y = 0; y < gridHeight; y++) {
            result[x][y] = {
                active: false,
                color: [0,0,0]
            };
        }
    }
    return result;
}

function createHistory(): boolean[][][] {
    const result: boolean[][][] = new Array(gridWidth);
    for (let x = 0; x < gridWidth; x++) {
        result[x] = new Array(gridHeight);
        for (let y = 0; y < gridHeight; y++) {
            result[x][y] = new Array(historyLength).fill(false);
        }
    }
    return result;
}

class Renderer {
    // Define members (properties)
    public canvas: HTMLElement;
    public gl: WebGL2RenderingContext;
    public initialised: boolean;
    public shaderProgram: WebGLProgram | null;
    public gridVertices: number[];
    public squareVertices: number[];
    public squareIndices: number[];
    public borderVertices: number[];
    public borderIndices: number[];
    public projectionMatrix: glMatrix.mat4;
    public matrixLocation: WebGLUniformLocation | null;
    public colorLocation: WebGLUniformLocation | null;
    public positionLocation: number;
    public gridVertexBuffer: WebGLBuffer | null;
    public squareVertexBuffer: WebGLBuffer | null;
    public squareIndexBuffer: WebGLBuffer | null;
    public borderVertexBuffer: WebGLBuffer | null;
    
    // Define a constructor
    constructor(canvas: HTMLElement, gl: WebGL2RenderingContext) {
        this.canvas = canvas;
        this.gl = gl;
        this.initialised = false;
        this.shaderProgram = null;
        this.gridVertices = [];
        this.squareVertices = [];
        this.squareIndices = [];
        this.borderVertices = [];
        this.borderIndices = [];

        this.projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(this.projectionMatrix, 0, this.gl.canvas.width, this.gl.canvas.height, 0, -1, 1);

        this.matrixLocation = null;
        this.colorLocation = null;
        this.positionLocation = -1;
        this.gridVertexBuffer = null;
        this.squareVertexBuffer = null;
        this.squareIndexBuffer = null;
        this.borderVertexBuffer = null;
    }

    public drawGrid(): void
    {
        if (!this.shaderProgram)
            return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridVertexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, this.projectionMatrix, [0, 0, 0]);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

        this.gl.uniform4f(this.colorLocation, 0.3, 0.3, 0.3, 1);
        this.gl.drawArrays(this.gl.LINES, 0, this.gridVertices.length / 2);   
    }

    public drawSquare(color : number[], x : number, y : number) {
        if (!this.shaderProgram)
            return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, this.projectionMatrix, [x, y, 0]);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

        this.gl.uniform4f(this.colorLocation, color[0], color[1], color[2], 1);

        this.gl.drawElements(this.gl.TRIANGLES, this.squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    public drawBorder(x : number, y : number) {
        if (!this.shaderProgram)
            return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderVertexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, this.projectionMatrix, [x, y, 0]);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

        this.gl.uniform4f(this.colorLocation, 0.4, 0.45, 0.4, 1);

        this.gl.drawArrays(this.gl.LINES, 0, this.borderVertices.length / 2);   
    }
    
    public init(): void
    {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
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

        this.shaderProgram  = this.gl.createProgram();
        if (!this.shaderProgram)
            return;

        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);
        this.gl.useProgram(this.shaderProgram);

        this.matrixLocation = this.gl.getUniformLocation(this.shaderProgram, "u_matrix");
        this.colorLocation = this.gl.getUniformLocation(this.shaderProgram, "u_color");

        // Vertical gridlines
        for (let i = 0; i <= cellWidth*gridWidth; i += cellWidth) {
            this.gridVertices.push(i, 0);
            this.gridVertices.push(i, cellWidth*gridHeight);
        }

        // Horizontal gridlines
        for (let j = 0; j <= cellWidth*gridHeight; j += cellWidth) {
            this.gridVertices.push(0, j);
            this.gridVertices.push(cellWidth*gridWidth, j);
        }

        this.squareVertices = [
            0, 0,
            cellWidth, 0,
            0, cellWidth,
            cellWidth, cellWidth
        ];

        this.squareIndices = [
            0, 1, 2,
            2, 1, 3
        ];

        // Left vertical line
        for (let i = 0; i < borderWidth; i++) {
            this.borderVertices.push(i, 0);
            this.borderVertices.push(i, cellWidth);
        }

        // Right vertical line
        for (let i = cellWidth - borderWidth; i < cellWidth; i++) {
            this.borderVertices.push(i, 0);
            this.borderVertices.push(i, cellWidth);
        }

        // Top horizontal line
        for (let i = 0; i < borderWidth; i++) {
            this.borderVertices.push(0, i);
            this.borderVertices.push(cellWidth, i);
        }

        // Bottom horizontal line
        for (let i = cellWidth - borderWidth; i < cellWidth; i++) {
            this.borderVertices.push(0, i);
            this.borderVertices.push(cellWidth, i);
        }

        this.gridVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gridVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.gridVertices), this.gl.STATIC_DRAW);

        this.squareVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.squareVertices), this.gl.STATIC_DRAW);

        this.squareIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.squareIndices), this.gl.STATIC_DRAW);
        
        this.borderVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.borderVertices), this.gl.STATIC_DRAW);
    }

    public draw(frame: LifeCell[][]): void
    {
        if (!this.initialised)
        {
            this.init();
            this.initialised = true;
        }

        if (!this.shaderProgram)
            return;

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        for (let x = 0; x < gridWidth; x += 1) {
            for (let y = 0; y < gridHeight; y += 1) {
                this.drawSquare(frame[x][y].color, x*cellWidth, y*cellWidth);

                if (frame[x][y].active)
                    this.drawBorder(x*cellWidth, y*cellWidth);
            }
        }

        this.drawGrid();
    }
}

class GameRules {
    private static wrap(x : number, y : number) {
        return (x + y) % y;
    }

    public static countRepeatingPattern(arr : boolean[], patternLen : number) : number {
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

    public static update(frames: LifeCell[][][]) {
        let thisFrame: LifeCell[][] = frames[currentFrame];
        let nextFrame: LifeCell[][] = frames[(currentFrame+1) % 2];

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

                let active: boolean = false;
                if (thisFrame[x][y].active && (liveNeighbors < 2 || liveNeighbors > 3)) {
                    active = false;
                } else if (!thisFrame[x][y].active && liveNeighbors === 3) {
                    active = true;
                } else {
                    active = thisFrame[x][y].active;
                }
                nextFrame[x][y].active = active;

                //Treat history as a queue, remove from end and add to beginning
                let thisCellHistory = history[x][y];
                thisCellHistory.pop();
                thisCellHistory.unshift(active);

                let r_repeats = this.countRepeatingPattern(thisCellHistory, 2);
                let g_repeats = this.countRepeatingPattern(thisCellHistory, 5);
                let b_repeats = this.countRepeatingPattern(thisCellHistory, 3);

                let r = (1.0 / 6) * r_repeats;    // floor(15/2) - 1
                let g = (1.0 / 2) * g_repeats;    // 15/5 - 1
                let b = (1.0 / 4) * b_repeats;    // 15/3 - 1

                if (r_repeats<3 && b_repeats<2)
                {
                    let repeats_6 = this.countRepeatingPattern(thisCellHistory, 6);
                    let val_6 = (1.0 / 2) * repeats_6;
                    r = val_6;
                    b = val_6;
                }

                nextFrame[x][y].color = [r,g,b];
            }
        }

        currentFrame = (currentFrame+1) % 2;
    }
}

let canvas : HTMLElement | null = document.getElementById("my_canvas");
let lastUpdateTime : number = 0;
let frames: LifeCell[][][] = [createGrid(), createGrid()];
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
                renderer.draw(frames[currentFrame]);
                return;
            }
            let elapsedTime : number = timestamp - lastUpdateTime;
            if (elapsedTime >= updateIntervalMs) {
                lastUpdateTime = timestamp;
                GameRules.update(frames);
            }
    
            renderer.draw(frames[currentFrame]);
            requestAnimationFrame(animate);
        }
        
        document.addEventListener('keydown', function(event) {
            if (event.code === 'Space') {
                pause = !pause;
                if (!pause)
                    requestAnimationFrame(animate);
            }

            let thisFrame: LifeCell[][] = frames[currentFrame];
            if (event.code === 'KeyR') {
                for (let x = 0; x < gridWidth; x++) {
                    for (let y = 0; y < gridHeight; y++) {
                        thisFrame[x][y].active = false;
                    }
                }
            
                renderer.draw(thisFrame);
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

                let thisFrame: LifeCell[][] = frames[currentFrame];
                if (cellX >= 0 && cellX < gridWidth && cellY >= 0 && cellY < gridHeight) {
                    if (event.button === 0) {           // Left mouse button
                        thisFrame[cellX][cellY].active = !thisFrame[cellX][cellY].active;
                    }
                    // if (event.button === 2) {           // Right mouse button
                        
                    // }
                }

                renderer.draw(thisFrame);
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