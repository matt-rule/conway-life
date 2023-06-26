import * as glMatrix from 'gl-matrix';

import { LifeCell } from './lifecell';
import { GameState } from './gamestate';
import { FiniteGrid } from './finitegrid';
import { SparseMatrixGrid } from './sparsematrix';

export class Renderer {
    // Define members (properties)
    public canvas: HTMLCanvasElement;
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
    public cellWidth: number;
    public borderWidth: number;
    public showGrid: boolean;
    public zoomLevel: number;   // 1.0 is unzoomed, larger values are more zoomed-in.
    
    // Define a constructor
    constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, cellWidth: number, borderWidth: number, 
        showGrid: boolean, zoomLevel: number)
    {
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

        this.cellWidth = cellWidth;
        this.borderWidth = borderWidth;
        this.showGrid = showGrid;

        this.zoomLevel = zoomLevel;
    }

    public drawGrid(): void
    {
        if (!this.shaderProgram || !this.showGrid)
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
        for (let i = 0; i <= this.cellWidth*GameState.gridWidth; i += this.cellWidth) {
            this.gridVertices.push(i, 0);
            this.gridVertices.push(i, this.cellWidth*GameState.gridHeight);
        }

        // Horizontal gridlines
        for (let j = 0; j <= this.cellWidth*GameState.gridHeight; j += this.cellWidth) {
            this.gridVertices.push(0, j);
            this.gridVertices.push(this.cellWidth*GameState.gridWidth, j);
        }

        this.squareVertices = [
            0, 0,
            this.cellWidth, 0,
            0, this.cellWidth,
            this.cellWidth, this.cellWidth
        ];

        this.squareIndices = [
            0, 1, 2,
            2, 1, 3
        ];

        // Left vertical line
        for (let i = 0; i < this.borderWidth; i++) {
            this.borderVertices.push(i, 0);
            this.borderVertices.push(i, this.cellWidth);
        }

        // Right vertical line
        for (let i = this.cellWidth - this.borderWidth; i < this.cellWidth; i++) {
            this.borderVertices.push(i, 0);
            this.borderVertices.push(i, this.cellWidth);
        }

        // Top horizontal line
        for (let i = 0; i < this.borderWidth; i++) {
            this.borderVertices.push(0, i);
            this.borderVertices.push(this.cellWidth, i);
        }

        // Bottom horizontal line
        for (let i = this.cellWidth - this.borderWidth; i < this.cellWidth; i++) {
            this.borderVertices.push(0, i);
            this.borderVertices.push(this.cellWidth, i);
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
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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

    public draw(grid: FiniteGrid | SparseMatrixGrid, cursorCellX: number, cursorCellY: number, brush: boolean[][] | null,
        brushWidth: number, brushHeight: number, showOscillations: boolean): void
    {
        if (grid instanceof FiniteGrid)
            this.drawFiniteGrid(grid.frames[grid.currentFrame], cursorCellX, cursorCellY, brush, brushWidth, brushHeight, showOscillations);
        else if (grid instanceof SparseMatrixGrid)
            this.drawSparse(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight);
    }

    public drawFiniteGrid(frame: LifeCell[][], cursorCellX: number, cursorCellY: number, brush: boolean[][] | null,
        brushWidth: number, brushHeight: number, showOscillations: boolean): void
    {
        if (!this.initialised)
        {
            this.init();
            this.initialised = true;
        }

        if (!this.shaderProgram)
            return;

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        for (let x = 0; x < GameState.gridWidth; x += 1) {
            for (let y = 0; y < GameState.gridHeight; y += 1) {
                if (showOscillations)
                    this.drawSquare(frame[x][y].color, x*this.cellWidth, y*this.cellWidth);

                if (frame[x][y].active)
                    this.drawBorder(x*this.cellWidth, y*this.cellWidth, false);
            }
        }

        if (cursorCellX >= 0 && cursorCellX < GameState.gridWidth && cursorCellY >= 0 && cursorCellY < GameState.gridHeight)
        {
            if (!brush)
            {
                this.drawBorder(cursorCellX*this.cellWidth, cursorCellY*this.cellWidth, true);
            }
            else
            {
                // Calculate offsets to center the brush around the cursor
                const offsetX = Math.floor(brushWidth / 2);
                const offsetY = Math.floor(brushHeight / 2);
        
                // Iterate through each cell in the brush
                for (let brushX = 0; brushX < brushWidth; brushX++) {
                    for (let brushY = 0; brushY < brushHeight; brushY++) {
                        // Calculate the corresponding grid position
                        const gridX = cursorCellX - offsetX + brushX;
                        const gridY = cursorCellY - offsetY + brushY;
        
                        // Check if the position is within the grid boundaries
                        if (gridX >= 0 && gridX < GameState.gridWidth && gridY >= 0 && gridY < GameState.gridHeight) {
                            this.drawBorder(gridX * this.cellWidth, gridY * this.cellWidth, brush[brushX][brushY]);
                        }
                    }
                }
            }
        }

        this.drawGrid();
    }

    public drawSparse(grid : SparseMatrixGrid, cursorCellX: number, cursorCellY: number, brush: boolean[][] | null,
        brushWidth: number, brushHeight: number): void
    {
        
    }
}
