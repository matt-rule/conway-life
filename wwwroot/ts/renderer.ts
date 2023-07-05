import * as glMatrix from 'gl-matrix';

import { LifeCell } from './lifecell';
import { FiniteGrid } from './finitegrid';
import { SparseMatrixGrid } from './sparsematrix';
import { Vec } from './vec';
import { Brush } from './brush';
import { View } from './view';

export class Renderer {
    // Define members (properties)
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    public initialised: boolean;
    public shaderProgram: WebGLProgram | null;
    public squareVertices: number[];
    public squareIndices: number[];
    public borderVertices: number[];
    public borderIndices: number[];
    public vertLineVertices: number[];
    public vertLineIndices: number[];
    public horizLineVertices: number[];
    public horizLineIndices: number[];
    public projectionMatrix: glMatrix.mat4;
    public matrixLocation: WebGLUniformLocation | null;
    public colorLocation: WebGLUniformLocation | null;
    public positionLocation: number;
    public squareVertexBuffer: WebGLBuffer | null;
    public squareIndexBuffer: WebGLBuffer | null;
    public borderVertexBuffer: WebGLBuffer | null;
    public borderIndexBuffer: WebGLBuffer | null;
    public vertLineVertexBuffer: WebGLBuffer | null;
    public vertLineIndexBuffer: WebGLBuffer | null;
    public horizLineVertexBuffer: WebGLBuffer | null;
    public horizLineIndexBuffer: WebGLBuffer | null;
    public borderWidth: number;
    public showGrid: boolean;
    
    // Define a constructor
    constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, cellWidth: number, borderWidth: number, 
        showGrid: boolean, zoomLevel: number)
    {
        this.canvas = canvas;
        this.gl = gl;
        this.initialised = false;
        this.shaderProgram = null;
        this.squareVertices = [];
        this.squareIndices = [];
        this.borderVertices = [];
        this.borderIndices = [];
        this.vertLineVertices = [];
        this.vertLineIndices = [];
        this.horizLineVertices = [];
        this.horizLineIndices = [];

        this.projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(this.projectionMatrix, 0, this.gl.canvas.width, this.gl.canvas.height, 0, -1, 1);

        this.matrixLocation = null;
        this.colorLocation = null;
        this.positionLocation = -1;
        this.squareVertexBuffer = null;
        this.squareIndexBuffer = null;
        this.borderVertexBuffer = null;
        this.borderIndexBuffer = null;
        this.vertLineVertexBuffer = null;
        this.vertLineIndexBuffer = null;
        this.horizLineVertexBuffer = null;
        this.horizLineIndexBuffer = null;

        this.borderWidth = borderWidth;
        this.showGrid = showGrid;
    }
    
    public drawFiniteGrid(grid: FiniteGrid, view: View, viewPositionScreenCoords: Vec): void
    {
        if (!this.shaderProgram || !this.showGrid)
            return;

        let translatedMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(translatedMatrix, this.projectionMatrix, [-viewPositionScreenCoords.x, -viewPositionScreenCoords.y, 0]);
        let scaledMatrix = glMatrix.mat4.create();
        glMatrix.mat4.scale(scaledMatrix, translatedMatrix, [view.cellWidth, view.cellWidth, 0]);
        // Using these matrices, things are now in world space (grid coordinates)

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.uniform4f(this.colorLocation, 0.3, 0.3, 0.3, 1);

        let gridPosMatrix = glMatrix.mat4.create();
        let scaled2Matrix = glMatrix.mat4.create();

        // --- Vertical lines ---
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertLineVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertLineIndexBuffer);

        // Re-specify the attribute pointers because the buffer changed
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        for (let x = 0; x <= grid.size.x; x++) {
            glMatrix.mat4.translate(gridPosMatrix, scaledMatrix, [x, 0, 0]);
            glMatrix.mat4.scale(scaled2Matrix, gridPosMatrix, [grid.size.x, grid.size.y, 0]);
            this.gl.uniformMatrix4fv(this.matrixLocation, false, scaled2Matrix);
            this.gl.drawElements(this.gl.LINES, this.vertLineIndices.length, this.gl.UNSIGNED_SHORT, 0);
        }
        
        // --- Horizontal lines ---
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.horizLineVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.horizLineIndexBuffer);
        
        // Re-specify the attribute pointers because the buffer changed
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        for (let y = 0; y <= grid.size.y; y++) {
            glMatrix.mat4.translate(gridPosMatrix, scaledMatrix, [0, y, 0]);
            glMatrix.mat4.scale(scaled2Matrix, gridPosMatrix, [grid.size.x, grid.size.y, 0]);
            this.gl.uniformMatrix4fv(this.matrixLocation, false, scaled2Matrix);
            this.gl.drawElements(this.gl.LINES, this.horizLineIndices.length, this.gl.UNSIGNED_SHORT, 0);
        }
    }

    public drawSparseMatrixGrid(viewPositionScreenCoords: Vec): void
    {
        if (!this.shaderProgram || !this.showGrid)
            return;

        // if zoomed out too far, return

        // --- draw vertical lines ---
        // use the modulus of the horizontal translation
        // determine how many points to draw based on the zoom level
        // determine a set of points on a horizontal axis to start each vertical line at, in the range 0..canvas width
        // create a scale matrix to scale by the zoom level and also consider screen size
        // for each vertical line:
            // apply translation and scaling in the right order
            // draw the vertical line

        // --- draw horizontal lines ---
    }

    public drawSquare(view: View, color: number[], pos: Vec) {
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
        glMatrix.mat4.scale(scaledMatrix, translatedMatrix, [view.cellWidth, view.cellWidth, 0]);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, scaledMatrix);
        this.gl.uniform4f(this.colorLocation, color[0], color[1], color[2], 1);

        this.gl.drawElements(this.gl.TRIANGLES, this.squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    public drawBorder(view: View, pos: Vec, selected: boolean) {
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
        glMatrix.mat4.scale(scaledMatrix, translatedMatrix, [view.cellWidth, view.cellWidth, 0]);
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
        this.borderVertices = [];
        
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
        if (this.vertLineVertexBuffer) {
            this.gl.deleteBuffer(this.vertLineVertexBuffer);
            this.vertLineVertexBuffer = null;
        }
        if (this.vertLineIndexBuffer) {
            this.gl.deleteBuffer(this.vertLineIndexBuffer);
            this.vertLineIndexBuffer = null;
        }
        if (this.horizLineVertexBuffer) {
            this.gl.deleteBuffer(this.horizLineIndexBuffer);
            this.horizLineIndexBuffer = null;
        }
        if (this.horizLineIndexBuffer) {
            this.gl.deleteBuffer(this.horizLineIndexBuffer);
            this.horizLineIndexBuffer = null;
        }

        this.vertLineVertices.push(0, 0);
        this.vertLineVertices.push(0, 1);
        this.vertLineIndices = [0, 1];

        this.horizLineVertices.push(0, 0);
        this.horizLineVertices.push(1, 0);
        this.horizLineIndices = [0, 1];

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
        
        this.vertLineVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertLineVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertLineVertices), this.gl.STATIC_DRAW);

        this.vertLineIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertLineIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertLineIndices), this.gl.STATIC_DRAW);

        this.horizLineVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.horizLineVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.horizLineVertices), this.gl.STATIC_DRAW);

        this.horizLineIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.horizLineIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.horizLineIndices), this.gl.STATIC_DRAW);

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
        this.squareVertices = [];
        this.squareIndices = [];
        this.borderVertices = [];
        this.borderIndices = [];
        this.vertLineVertices = [];
        this.vertLineIndices = [];
        this.horizLineVertices = [];
        this.horizLineIndices = [];
    
        // Delete WebGL buffers
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
        if (this.vertLineVertexBuffer) {
            this.gl.deleteBuffer(this.vertLineVertexBuffer);
            this.vertLineVertexBuffer = null;
        }
        if (this.vertLineIndexBuffer) {
            this.gl.deleteBuffer(this.vertLineIndexBuffer);
            this.vertLineIndexBuffer = null;
        }
        if (this.horizLineVertexBuffer) {
            this.gl.deleteBuffer(this.horizLineVertexBuffer);
            this.horizLineVertexBuffer = null;
        }
        if (this.horizLineIndexBuffer) {
            this.gl.deleteBuffer(this.horizLineIndexBuffer);
            this.horizLineIndexBuffer = null;
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

    public draw(grid: FiniteGrid | SparseMatrixGrid, view: View, cursorCellPos: Vec | null, brush: Brush | null, showOscillations: boolean, viewPositionScreenCoords: Vec): void
    {
        if (grid instanceof FiniteGrid)
            this.drawGameWithFiniteGrid(grid, grid.frames[grid.currentFrame], view, cursorCellPos, brush, showOscillations, viewPositionScreenCoords);
        else if (grid instanceof SparseMatrixGrid)
            this.drawGameWithSparseMatrix(grid, view, cursorCellPos, brush, viewPositionScreenCoords);
    }

    public drawGameWithFiniteGrid(grid: FiniteGrid, frame: LifeCell[][], view: View, cursorCellPos: Vec | null, brush: Brush | null, showOscillations: boolean, viewPositionScreenCoords: Vec): void
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
                let pos: Vec = new Vec(x, y).multiply(view.cellWidth).subtract(viewPositionScreenCoords);
                if (showOscillations)
                {
                    const color = frame[x][y].color;
                    if (color)
                        this.drawSquare(view, color, pos);
                }

                if (frame[x][y].active)
                    this.drawBorder(view, pos, false);
            }
        }

        if (cursorCellPos && cursorCellPos.x >= 0 && cursorCellPos.x < grid.size.x && cursorCellPos.y >= 0 && cursorCellPos.y < grid.size.y)
        {
            if (!brush)
            {
                this.drawBorder(view, cursorCellPos.multiply(view.cellWidth).subtract(viewPositionScreenCoords), true);
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
                            this.drawBorder(view, gridXY.multiply(view.cellWidth).subtract(viewPositionScreenCoords), brush.pattern[brushX][brushY]);
                        }
                    }
                }
            }
        }

        this.drawFiniteGrid(grid, view, viewPositionScreenCoords);
    }

    public drawGameWithSparseMatrix(grid: SparseMatrixGrid, view: View, cursorCellPos: Vec | null, brush: Brush | null, viewPositionScreenCoords: Vec): void
    {
        
    }
}
