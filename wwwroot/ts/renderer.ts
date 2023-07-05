import * as glMatrix from 'gl-matrix';

import { LifeCell } from './lifecell';
import { FiniteGrid } from './finitegrid';
import { SparseMatrixGrid } from './sparsematrix';
import { Vec } from './vec';
import { Brush } from './brush';

export class Renderer {
    // Define members (properties)
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    public initialised: boolean;
    public shaderProgram: WebGLProgram | null;
    public finiteGridVertices: number[];
    public squareVertices: number[];
    public squareIndices: number[];
    public borderVertices: number[];
    public borderIndices: number[];
    public projectionMatrix: glMatrix.mat4;
    public matrixLocation: WebGLUniformLocation | null;
    public colorLocation: WebGLUniformLocation | null;
    public positionLocation: number;
    public finiteGridVertexBuffer: WebGLBuffer | null;
    public squareVertexBuffer: WebGLBuffer | null;
    public squareIndexBuffer: WebGLBuffer | null;
    public borderVertexBuffer: WebGLBuffer | null;
    public borderIndexBuffer: WebGLBuffer | null;
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
        this.finiteGridVertices = [];
        this.squareVertices = [];
        this.squareIndices = [];
        this.borderVertices = [];
        this.borderIndices = [];

        this.projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(this.projectionMatrix, 0, this.gl.canvas.width, this.gl.canvas.height, 0, -1, 1);

        this.matrixLocation = null;
        this.colorLocation = null;
        this.positionLocation = -1;
        this.finiteGridVertexBuffer = null;
        this.squareVertexBuffer = null;
        this.squareIndexBuffer = null;
        this.borderVertexBuffer = null;
        this.borderIndexBuffer = null;

        this.cellWidth = cellWidth;
        this.borderWidth = borderWidth;
        this.showGrid = showGrid;

        this.zoomLevel = zoomLevel;
    }
    
    public drawGrid(viewPosition: Vec): void
    {
        if (!this.shaderProgram || !this.showGrid)
            return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.finiteGridVertexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let translatedMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(translatedMatrix, this.projectionMatrix, [-viewPosition.x, -viewPosition.y, 0]);
        let scaledMatrix = glMatrix.mat4.create();
        glMatrix.mat4.scale(scaledMatrix, translatedMatrix, [this.cellWidth, this.cellWidth, 0]);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, scaledMatrix);

        this.gl.uniform4f(this.colorLocation, 0.3, 0.3, 0.3, 1);
        this.gl.drawArrays(this.gl.LINES, 0, this.finiteGridVertices.length / 2);   
    }

    public drawSquare(color: number[], pos: Vec) {
        if (!this.shaderProgram)
            return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let translatedMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(translatedMatrix, this.projectionMatrix, [pos.x, pos.y, 0]);
        let scaledMatrix = glMatrix.mat4.create();
        glMatrix.mat4.scale(scaledMatrix, translatedMatrix, [this.cellWidth, this.cellWidth, 0]);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, scaledMatrix);
        this.gl.uniform4f(this.colorLocation, color[0], color[1], color[2], 1);

        this.gl.drawElements(this.gl.TRIANGLES, this.squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    public drawBorder(pos: Vec, selected: boolean) {
        if (!this.shaderProgram)
            return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.borderIndexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let translatedMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(translatedMatrix, this.projectionMatrix, [pos.x, pos.y, 0]);
        let scaledMatrix = glMatrix.mat4.create();
        glMatrix.mat4.scale(scaledMatrix, translatedMatrix, [this.cellWidth, this.cellWidth, 0]);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, scaledMatrix);

        if (selected) {
            this.gl.uniform4f(this.colorLocation, 0.6, 0.6, 0.6, 1);
        }
        else {
            this.gl.uniform4f(this.colorLocation, 0.4, 0.4, 0.4, 1);
        }

        this.gl.drawElements(this.gl.TRIANGLES, this.borderIndices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    public calcBufferData(grid: FiniteGrid | SparseMatrixGrid): void
    {
        // Clear the arrays
        this.finiteGridVertices = [];
        this.borderVertices = [];
        
        // Delete existing buffers
        if (this.finiteGridVertexBuffer) {
            this.gl.deleteBuffer(this.finiteGridVertexBuffer);
            this.finiteGridVertexBuffer = null;
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
        if (this.borderIndexBuffer) {
            this.gl.deleteBuffer(this.borderVertexBuffer);
            this.borderIndexBuffer = null;
        }

        if (grid instanceof FiniteGrid)
        {
            // Vertical gridlines
            for (let i = 0; i <= grid.size.x; i += 1) {
                this.finiteGridVertices.push(i, 0);
                this.finiteGridVertices.push(i, grid.size.y);
            }

            // Horizontal gridlines
            for (let j = 0; j <= grid.size.y; j += 1) {
                this.finiteGridVertices.push(0, j);
                this.finiteGridVertices.push(grid.size.x, j);
            }
        }
        else
        {
            // TODO
        }

        this.squareVertices = [
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ];

        this.squareIndices = [
            0, 1, 2,
            2, 1, 3
        ];

        let halfWidth = this.borderWidth/2;

        // Left vertical line
        this.borderVertices.push(-halfWidth, 0);
        this.borderVertices.push(+halfWidth, 0);
        this.borderVertices.push(+halfWidth, 1);
        this.borderVertices.push(-halfWidth, 1);

        // Right vertical line
        this.borderVertices.push(1-halfWidth, 0);
        this.borderVertices.push(1+halfWidth, 0);
        this.borderVertices.push(1+halfWidth, 1);
        this.borderVertices.push(1-halfWidth, 1);

        // Top horizontal line
        this.borderVertices.push(0, -halfWidth);
        this.borderVertices.push(0, +halfWidth);
        this.borderVertices.push(1, +halfWidth);
        this.borderVertices.push(1, -halfWidth);

        // Bottom horizontal line
        this.borderVertices.push(0, 1-halfWidth);
        this.borderVertices.push(0, 1+halfWidth);
        this.borderVertices.push(1, 1+halfWidth);
        this.borderVertices.push(1, 1-halfWidth);

        this.borderIndices = [
            0, 1, 2,
            0, 2, 3,
            4, 5, 6,
            4, 6, 7,
            8, 9, 10,
            8, 10, 11,
            12, 13, 14,
            12, 14, 15
        ];

        if (grid instanceof FiniteGrid)
        {
            this.finiteGridVertexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.finiteGridVertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.finiteGridVertices), this.gl.STATIC_DRAW);
        }
        else
        {
            // TODO
        }

        this.squareVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.squareVertices), this.gl.STATIC_DRAW);

        this.squareIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.squareIndices), this.gl.STATIC_DRAW);
        
        this.borderVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.borderVertices), this.gl.STATIC_DRAW);
        
        this.borderIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.borderIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.borderIndices), this.gl.STATIC_DRAW);
    }

    public init(grid: FiniteGrid | SparseMatrixGrid): void
    {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.CULL_FACE);

        let vertexShaderSource: string = `
            attribute vec2 position;
            uniform mat4 u_matrix;
            
            void main() {
                gl_Position = u_matrix * vec4(position, 0.0, 1.0);
            }
        `;
        
        let vertexShader: WebGLShader | null = this.gl.createShader(this.gl.VERTEX_SHADER);
        if (!vertexShader)
            return;
        this.gl.shaderSource(vertexShader, vertexShaderSource);
        this.gl.compileShader(vertexShader);

        let fragmentShaderSource: string = `
            precision mediump float;
            uniform vec4 u_color;
            
            void main() {
                gl_FragColor = u_color;
            }
        `;

        let fragmentShader: WebGLShader | null = this.gl.createShader(this.gl.FRAGMENT_SHADER);
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

        this.calcBufferData(grid);
    }

    public cleanup(): void {
        this.finiteGridVertices = [];
        this.squareVertices = [];
        this.squareIndices = [];
        this.borderVertices = [];
        this.borderIndices = [];
    
        // Delete WebGL buffers
        if (this.finiteGridVertexBuffer) {
            this.gl.deleteBuffer(this.finiteGridVertexBuffer);
            this.finiteGridVertexBuffer = null;
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
        if (this.borderIndexBuffer) {
            this.gl.deleteBuffer(this.borderIndexBuffer);
            this.borderIndexBuffer = null;
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

    public draw(grid: FiniteGrid | SparseMatrixGrid, cursorCellPos: Vec | null, brush: Brush | null, showOscillations: boolean, viewPosition: Vec): void
    {
        if (grid instanceof FiniteGrid)
            this.drawFiniteGrid(grid, grid.frames[grid.currentFrame], cursorCellPos, brush, showOscillations, viewPosition);
        else if (grid instanceof SparseMatrixGrid)
            this.drawSparse(grid, cursorCellPos, brush, viewPosition);
    }

    public drawFiniteGrid(grid: FiniteGrid, frame: LifeCell[][], cursorCellPos: Vec | null, brush: Brush | null, showOscillations: boolean, viewPosition: Vec): void
    {
        if (!this.initialised)
        {
            this.init(grid);
            this.initialised = true;
        }

        if (!this.shaderProgram)
            return;

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        for (let x = 0; x < grid.size.x; x += 1) {
            for (let y = 0; y < grid.size.y; y += 1)
            {
                let pos: Vec = new Vec(x, y).multiply(this.cellWidth).subtract(viewPosition);
                if (showOscillations)
                    this.drawSquare(frame[x][y].color, pos);

                if (frame[x][y].active)
                    this.drawBorder(pos, false);
            }
        }

        if (cursorCellPos && cursorCellPos.x >= 0 && cursorCellPos.x < grid.size.x && cursorCellPos.y >= 0 && cursorCellPos.y < grid.size.y)
        {
            if (!brush)
            {
                this.drawBorder(cursorCellPos.multiply(this.cellWidth).subtract(viewPosition), true);
            }
            else
            {
                // Calculate offsets to center the brush around the cursor
                const offset: Vec = brush.size.divide(2).floor();
        
                // Iterate through each cell in the brush
                for (let brushX = 0; brushX < brush.size.x; brushX++) {
                    for (let brushY = 0; brushY < brush.size.y; brushY++) {
                        // Calculate the corresponding grid position
                        let brushXY = new Vec(brushX, brushY);
                        let gridXY: Vec = cursorCellPos.subtract(offset).add(brushXY);
        
                        // Check if the position is within the grid boundaries
                        if (gridXY.x >= 0 && gridXY.x < grid.size.x && gridXY.y >= 0 && gridXY.y < grid.size.y) {
                            this.drawBorder(gridXY.multiply(this.cellWidth).subtract(viewPosition), brush.pattern[brushX][brushY]);
                        }
                    }
                }
            }
        }

        this.drawGrid(viewPosition);
    }

    public drawSparse(grid: SparseMatrixGrid, cursorCellPos: Vec | null, brush: Brush | null, viewPosition: Vec): void
    {
        
    }
}
