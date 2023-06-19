import * as glMatrix from 'gl-matrix';

interface LifeCell {
    active: boolean;
    color: number[];
}

const historyLength: number = 15;
const borderWidth = 3;

let currentFrame: number = 0;
let cellWidth: number = 20;
let gridWidth: number = 40;
let gridHeight: number = 30;
let history: boolean[][][] = createHistory();
let cursorCellX: number = -1;
let cursorCellY: number = -1;
let timestepMs = 125;

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
        if (!this.shaderProgram || !showGrid)
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

    public drawBorder(x: number, y: number, selected: boolean) {
        if (!this.shaderProgram)
            return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderVertexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let matrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(matrix, this.projectionMatrix, [x, y, 0]);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

        if (selected) {
            this.gl.uniform4f(this.colorLocation, 0.6, 0.6, 0.6, 1);
        }
        else {
            this.gl.uniform4f(this.colorLocation, 0.4, 0.4, 0.4, 1);
        }

        this.gl.drawArrays(this.gl.LINES, 0, this.borderVertices.length / 2);   
    }

    public calcBufferData(): void
    {
        // Clear the arrays
        this.gridVertices.length = 0;
        this.borderVertices.length = 0;
        
        // Delete existing buffers
        if (this.gridVertexBuffer) {
            this.gl.deleteBuffer(this.gridVertexBuffer);
        }
        if (this.squareVertexBuffer) {
            this.gl.deleteBuffer(this.squareVertexBuffer);
        }
        if (this.squareIndexBuffer) {
            this.gl.deleteBuffer(this.squareIndexBuffer);
        }
        if (this.borderVertexBuffer) {
            this.gl.deleteBuffer(this.borderVertexBuffer);
        }

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

    public init(): void
    {
        this.gl.viewport(0, 0, cellWidth*gridWidth, cellWidth*gridHeight);
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

        this.calcBufferData();
    }

    public cleanup(): void {
        // Clear the arrays
        this.gridVertices.length = 0;
        this.squareVertices.length = 0;
        this.squareIndices.length = 0;
        this.borderVertices.length = 0;
        this.borderIndices.length = 0;
    
        // Delete WebGL buffers
        if (this.gridVertexBuffer) {
            this.gl.deleteBuffer(this.gridVertexBuffer);
            this.gridVertexBuffer = null;
        }
        if (this.squareVertexBuffer) {
            this.gl.deleteBuffer(this.squareVertexBuffer);
            this.squareVertexBuffer = null;
        }
        if (this.squareIndexBuffer) {
            this.gl.deleteBuffer(this.squareIndexBuffer);
            this.squareIndexBuffer = null;
        }
        if (this.borderVertexBuffer) {
            this.gl.deleteBuffer(this.borderVertexBuffer);
            this.borderVertexBuffer = null;
        }
    
        // Delete shader program if it exists
        if (this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram);
            this.shaderProgram = null;
        }
    
        // Reset other properties
        this.initialised = false;
        this.matrixLocation = null;
        this.colorLocation = null;
        this.positionLocation = 0;
    
        // Optionally, you could also reset the projection matrix to identity
        glMatrix.mat4.identity(this.projectionMatrix);
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
                if (detectOscillations)
                    this.drawSquare(frame[x][y].color, x*cellWidth, y*cellWidth);

                if (frame[x][y].active)
                    this.drawBorder(x*cellWidth, y*cellWidth, false);
            }
        }

        if (cursorCellX >= 0 && cursorCellX < gridWidth && cursorCellY >= 0 && cursorCellY < gridHeight) {
            this.drawBorder(cursorCellX*cellWidth, cursorCellY*cellWidth, true);
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

                if (detectOscillations)
                {
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
        }

        currentFrame = (currentFrame+1) % 2;
    }
}

let canvas : HTMLCanvasElement | null = document.getElementById("my_canvas") as HTMLCanvasElement;
let lastUpdateTime : number = 0;
let frames: LifeCell[][][] = [createGrid(), createGrid()];
let pause : boolean = true;
let showGrid : boolean = true;
let detectOscillations : boolean = true;

if (!canvas) {
    alert('Canvas element not found');
}
else
{
    canvas.width = cellWidth*gridWidth;
    canvas.height = cellWidth*gridHeight;
    canvas.style.width = `${cellWidth*gridWidth}px`;
    canvas.style.height = `${cellWidth*gridHeight}px`;
    canvas.style.maxWidth = `${cellWidth*gridWidth}px`;
    canvas.style.maxHeight = `${cellWidth*gridHeight}px`;
    let gl : WebGL2RenderingContext | null = canvas.getContext("webgl2");

    if (!gl) {
        alert('Your browser does not support WebGL');
    }
    else
    {
        let renderer = new Renderer(canvas, gl);

        function resizeCanvas(width: number, height: number): void {
            if (!canvas)
                return;
    
            renderer.cleanup();
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.style.maxWidth = `${width}px`;
            canvas.style.maxHeight = `${height}px`;
            gl = canvas.getContext("webgl2");
            if (!gl) {
                return;
            }
            renderer = new Renderer(canvas, gl);
            renderer.draw(frames[currentFrame]);
        }

        function animate(timestamp : any): void {
            if (pause)
            {
                renderer.draw(frames[currentFrame]);
                return;
            }
            let elapsedTime : number = timestamp - lastUpdateTime;
            if (elapsedTime >= timestepMs) {
                lastUpdateTime = timestamp;
                GameRules.update(frames);
            }
    
            renderer.draw(frames[currentFrame]);
            requestAnimationFrame(animate);
        }
        
        document.addEventListener('keydown', function(event) {
            if (event.code === 'Space') {
                event.preventDefault();
                pause = !pause;
                const pauseButton = document.getElementById('pause-button');
                if (pauseButton)
                pauseButton.textContent = pause ? '▶️' : '⏸️';
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
            window.addEventListener('mousemove', function(event) {
                if (!canvas)
                    return;
                
                let rect = canvas.getBoundingClientRect();
                let mouseX = event.clientX - rect.left;
                let mouseY = event.clientY - rect.top;

                cursorCellX = Math.floor(mouseX / cellWidth);
                cursorCellY = Math.floor(mouseY / cellWidth);

                console.log('x:', cursorCellX);
                console.log('y:', cursorCellY);

                renderer.draw(frames[currentFrame]);
            });
        }

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

        document.addEventListener('DOMContentLoaded', () => {
            const resetButton = document.getElementById('reset-button');
            const pauseButton = document.getElementById('pause-button');
            const timestepEdit = document.getElementById('timestep-edit') as HTMLInputElement;
            const cellSizeEdit = document.getElementById('cell-size-edit') as HTMLInputElement;
            const gridWidthEdit = document.getElementById('grid-width-edit') as HTMLInputElement;
            const gridHeightEdit = document.getElementById('grid-height-edit') as HTMLInputElement;
            const showGridCheckBox = document.getElementById('show-grid-checkbox') as HTMLInputElement;
            const detectOscillationsCheckBox = document.getElementById('detect-oscillations-checkbox') as HTMLInputElement;
            const tooltip = document.getElementById('tooltip');
        
            if (resetButton == null || pauseButton == null || timestepEdit == null || showGridCheckBox == null || tooltip == null)
                return;
        
            resetButton.addEventListener('mousemove', (event) => {
                tooltip.style.display = 'inline';
                tooltip.textContent = 'Reset (R)';
                tooltip.style.left = (event.pageX + 10) + 'px';
                tooltip.style.top = (event.pageY + 10) + 'px';
            });
        
            resetButton.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        
            resetButton.addEventListener('click', () => {
                let thisFrame: LifeCell[][] = frames[currentFrame];
                for (let x = 0; x < gridWidth; x++) {
                    for (let y = 0; y < gridHeight; y++) {
                        thisFrame[x][y].active = false;
                    }
                }
            
                renderer.draw(thisFrame);
            });
        
            pauseButton.addEventListener('mousemove', (event) => {
                tooltip.style.display = 'inline';
                tooltip.textContent = 'Pause (spacebar)';
                tooltip.style.left = (event.pageX + 10) + 'px';
                tooltip.style.top = (event.pageY + 10) + 'px';
            });
        
            pauseButton.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        
            pauseButton.addEventListener('click', () => {
                pause = !pause;
                pauseButton.textContent = pause ? '▶️' : '⏸️';
                if (!pause)
                    requestAnimationFrame(animate);
            });

            showGridCheckBox.addEventListener('click', () => {
                showGrid = showGridCheckBox.checked;
                renderer.draw(frames[currentFrame]);
            });

            timestepEdit.addEventListener('input', () => {
                const value = timestepEdit.value;
                const numericValue = parseInt(value, 10);

                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                }

                if (numericValue >= 15 && numericValue <= 1000) {
                    timestepMs = numericValue;
                    console.log(`timestepMs has been set to: ${timestepMs}`);
                } else {
                    console.log('Value must be between 15 and 1000 inclusive');
                }
            });

            cellSizeEdit.addEventListener('input', () => {
                const value = cellSizeEdit.value;
                const numericValue = parseInt(value, 10);

                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                }

                if (numericValue >= 1 && numericValue <= 50) {
                    cellWidth = numericValue;
                    console.log(`cellWidth has been set to: ${cellWidth}`);
                } else {
                    console.log('Value must be between 1 and 50 inclusive');
                }

                resizeCanvas(cellWidth*gridWidth, cellWidth*gridHeight);
            });

            gridWidthEdit.addEventListener('input', () => {
                const value = gridWidthEdit.value;
                const numericValue = parseInt(value, 10);
                
                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                }

                if (numericValue >= 3 && numericValue <= 100) {
                    gridWidth = numericValue;
                    console.log(`gridWidth has been set to: ${gridWidth}`);
                } else {
                    console.log('Value must be between 3 and 100 inclusive');
                }

                frames = [createGrid(), createGrid()];
                history = createHistory();
                resizeCanvas(cellWidth*gridWidth, cellWidth*gridHeight);
            });

            gridHeightEdit.addEventListener('input', () => {
                const value = gridHeightEdit.value;
                const numericValue = parseInt(value, 10);
                
                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                }

                if (numericValue >= 3 && numericValue <= 100) {
                    gridHeight = numericValue;
                    console.log(`gridHeight has been set to: ${gridHeight}`);
                } else {
                    console.log('Value must be between 3 and 100 inclusive');
                }

                frames = [createGrid(), createGrid()];
                history = createHistory();
                resizeCanvas(cellWidth*gridWidth, cellWidth*gridHeight);
            });

            detectOscillationsCheckBox.addEventListener('click', () => {
                detectOscillations = detectOscillationsCheckBox.checked;
                renderer.draw(frames[currentFrame]);
            });
        });
        
        requestAnimationFrame(animate);
    }
}
