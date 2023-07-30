import { vec2, vec3, mat3, mat4 } from "gl-matrix";

const ITERATION_COUNT: number = 500;

export enum MouseWheelMovement {
    Up = 0,
    Down = 1
}

export class Renderer {
    // Define members (properties)
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    public initialised: boolean;
    public shaderProgram: WebGLProgram | null;
    public squareVertices: number[];
    public squareIndices: number[];
    public MatrixShaderLocation : WebGLUniformLocation | null = null;
    public UniformWindowCoordsLocation : WebGLUniformLocation | null = null;
    public UniformIterationsLocation : WebGLUniformLocation | null = null;
    public positionLocation: number;
    public squareVertexBuffer: WebGLBuffer | null;
    public squareIndexBuffer: WebGLBuffer | null;
    public borderWidth: number;
    public showGrid: boolean;

    public MandelbrotZoomFactor: number = 0.4;
    private ViewMatrix: mat3 = mat3.create();
    private ProjectionMatrix: mat3 = mat3.create();
    private ScreenCentre : vec2 = vec2.fromValues(-0.5, -0.5);
    private DynamicMandelbrotViewPositionWorld : vec2 = vec2.fromValues(0.0, 0.0);
    private CommitMandelbrotViewPositionWorld : vec2 = vec2.fromValues(0.0, 0.0);
    // store screen position not world, to avoid a translated view disrupting mouse move calculations
    public startDragMousePosScreen: vec2 | null = null;
    
    // Define a constructor
    constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, borderWidth: number, showGrid: boolean)
    {
        this.canvas = canvas;
        this.gl = gl;
        this.initialised = false;
        this.shaderProgram = null;
        this.squareVertices = [];
        this.squareIndices = [];

        this.positionLocation = -1;
        this.squareVertexBuffer = null;
        this.squareIndexBuffer = null;

        this.borderWidth = borderWidth;
        this.showGrid = showGrid;
    }

    private updateMatrices(): void
    {
        let screenWidthHeightRatio: number = this.canvas.width / this.canvas.height;
        this.ViewMatrix = mat3.create();

        mat3.translate(this.ViewMatrix, this.ViewMatrix, vec2.fromValues(this.DynamicMandelbrotViewPositionWorld[0], this.DynamicMandelbrotViewPositionWorld[1]));
        mat3.scale(this.ViewMatrix, this.ViewMatrix, vec2.fromValues(1/this.MandelbrotZoomFactor, 1/this.MandelbrotZoomFactor));
        
        this.ProjectionMatrix = mat3.create();
        mat3.scale(this.ProjectionMatrix, this.ProjectionMatrix, vec2.fromValues(screenWidthHeightRatio, 1.0));
        mat3.translate(this.ProjectionMatrix, this.ProjectionMatrix, vec2.fromValues(this.ScreenCentre[0], this.ScreenCentre[1]));
    }

    public drawSquare() {
        if (!this.shaderProgram)
            return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        this.updateMatrices();
        this.gl.uniform2f(this.UniformWindowCoordsLocation, this.canvas.width, this.canvas.height);

        // A non-standard matrix used for positioning Mandelbrot within the drawn rect.
        let frag_shader_matrix: mat3 = mat3.create();
        mat3.multiply(frag_shader_matrix, this.ViewMatrix, this.ProjectionMatrix);
        this.gl.uniformMatrix3fv(this.MatrixShaderLocation, false, frag_shader_matrix);
        this.gl.uniform1f(this.UniformIterationsLocation, ITERATION_COUNT);

        this.gl.drawElements(this.gl.TRIANGLES, this.squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    public calcBufferData(): void
    {
        // Clear the arrays
        
        if (this.squareVertexBuffer) {
            this.gl.deleteBuffer(this.squareVertexBuffer);
            this.squareVertexBuffer = null;
        }
        if (this.squareIndexBuffer) {
            this.gl.deleteBuffer(this.squareIndexBuffer);
            this.squareIndexBuffer = null;
        }

        this.squareVertices = [
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ];

        this.squareIndices = [
            0, 1, 2,
            2, 1, 3
        ];

        let halfWidth = this.borderWidth/2;

        this.squareVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.squareVertices), this.gl.STATIC_DRAW);

        this.squareIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.squareIndices), this.gl.STATIC_DRAW);
        
    }

    public init(): void
    {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.CULL_FACE);

        let vertexShaderSource: string = `
        precision mediump float;

        attribute vec4 position;
        
        void main(void) {
            gl_Position = position;
        }
        `;
        
        let vertexShader: WebGLShader | null = this.gl.createShader(this.gl.VERTEX_SHADER);
        if (!vertexShader)
            return;
        this.gl.shaderSource(vertexShader, vertexShaderSource);
        this.gl.compileShader(vertexShader);

        let fragmentShaderSource: string = `
            precision mediump float;

            const int MAX_ITERATIONS = 500;

            uniform vec2 window_coords;
            uniform mat3 mandelbrot_view_matrix;
            uniform float mandelbrot_iterations;
            
            vec4 colour_from_iteration(float iteration)
            {
                float i = mod(iteration, 300.0);
            
                if (i < 50.0)
                {
                    return vec4(
                        0.0,
                        i * 0.02,
                        1.0,
                        1.0);
                }
                else if (i < 100.0)
                {
                    return vec4(
                        0.0,
                        1.0,
                        (100.0 - i) * 0.02,
                        1.0);
                }
                else if (i < 150.0)
                {
                    return vec4(
                        (i - 100.0) * 0.02,
                        1.0,
                        0.0,
                        1.0);
                }
                else if (i < 200.0)
                {
                    return vec4(
                        1.0,
                        (200.0 - i) * 0.02,
                        0.0,
                        1.0);
                }
                else if (i < 250.0)
                {
                    return vec4(
                        1.0,
                        0.0,
                        (i - 200.0) * 0.02,
                        1.0);
                }
                else if (i < 300.0)
                {
                    return vec4(
                        (300.0 - i) * 0.02,
                        0.0,
                        1.0,
                        1.0);
                }
                return vec4(0, 0, 0, 1);
            }
            
            void main(void)
            {
                vec3 normalised_window_coords = vec3(
                    gl_FragCoord.x / window_coords.x,
                    gl_FragCoord.y / window_coords.y,
                    1.0);
            
                vec3 interp_mandelbrot_pos = mandelbrot_view_matrix * normalised_window_coords;
            
                float iteration = 0.0;
                float x = 0.0;
                float y = 0.0;
                for (int i = 0; i < MAX_ITERATIONS; i++)
                {
                    float f = float(i);
                    if ((f < mandelbrot_iterations) && (x * x + y * y < 4.0))
                    {
                        float nextX = x * x - y * y + interp_mandelbrot_pos.x;
                        float nextY = 2.0 * x * y + interp_mandelbrot_pos.y;
                        x = nextX;
                        y = nextY;
                        iteration = iteration + 1.0;
                    }
                }
                
                if (iteration > mandelbrot_iterations - 1.0)
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                else
                    gl_FragColor = colour_from_iteration(iteration);
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

        this.MatrixShaderLocation = this.gl.getUniformLocation(this.shaderProgram, 'mandelbrot_view_matrix');
        this.UniformWindowCoordsLocation = this.gl.getUniformLocation(this.shaderProgram, 'window_coords');
        this.UniformIterationsLocation = this.gl.getUniformLocation(this.shaderProgram, 'mandelbrot_iterations');

        this.calcBufferData();
    }

    public cleanup(): void {
        this.squareVertices = [];
        this.squareIndices = [];
    
        // Delete WebGL buffers
        if (this.squareVertexBuffer) {
            this.gl.deleteBuffer(this.squareVertexBuffer);
            this.squareVertexBuffer = null;
        }
        if (this.squareIndexBuffer) {
            this.gl.deleteBuffer(this.squareIndexBuffer);
            this.squareIndexBuffer = null;
        }
    
        // Delete shader program if it exists
        if (this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram);
            this.shaderProgram = null;
        }
    
        // Reset other properties
        this.initialised = false;
        this.positionLocation = 0;
    }

    public draw(canvas: HTMLCanvasElement | null): void
    {
        if (!canvas)
            return;

        if (!this.initialised)
        {
            this.init();
            this.initialised = true;
        }

        if (!this.shaderProgram)
            return;

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        const color = [1,1,1];
        if (color)
            this.drawSquare();
    }

    public processZoom(clientX : number, clientY : number, direction : MouseWheelMovement): void {
        if (this.startDragMousePosScreen)
            return;

        let mousePosScreenNormalised: vec2 = vec2.fromValues(
            clientX / this.canvas.width,
            1.0 - clientY / this.canvas.height
        );

        let mvp: mat3 = mat3.create();
        mat3.multiply(mvp, this.ViewMatrix, this.ProjectionMatrix);

        let mousePosWorldCoords: vec2 = vec2.create();
        vec2.transformMat3(mousePosWorldCoords, mousePosScreenNormalised, mvp);

        let oldZoomFactor = this.MandelbrotZoomFactor;
        if (direction === MouseWheelMovement.Up) {
            this.MandelbrotZoomFactor *= 1.25;
        }
        else if (direction === MouseWheelMovement.Down) {
            this.MandelbrotZoomFactor *= 0.8;
        }

        let zoomFactorChange = this.MandelbrotZoomFactor / oldZoomFactor;

        let viewRelativeToCursor: vec2 = vec2.create();
        vec2.subtract(viewRelativeToCursor, this.DynamicMandelbrotViewPositionWorld, mousePosWorldCoords);

        // If zooming in and zoom factor is bigger, view is going to move TOWARDS the mouse cursor
        let viewRelativeToCursorScaled: vec2 = vec2.create();
        vec2.scale(viewRelativeToCursorScaled, viewRelativeToCursor, 1/zoomFactorChange);
        vec2.add(this.DynamicMandelbrotViewPositionWorld, mousePosWorldCoords, viewRelativeToCursorScaled);
        vec2.copy(this.CommitMandelbrotViewPositionWorld, this.DynamicMandelbrotViewPositionWorld);
    }

    public processMouseDown(clientX : number, clientY : number): void {
        if ( this.startDragMousePosScreen )
            return;

        this.startDragMousePosScreen = vec2.fromValues(
            clientX, 1.0 - clientY
        );
    }

    public processMouseMove(clientX : number, clientY : number): void {
        if ( !this.startDragMousePosScreen )
            return;

        let dragMousePosScreen = vec2.fromValues(
            clientX, 1.0 - clientY
        );
        let dragVectorScreen: vec2 = vec2.create();
        vec2.subtract(dragVectorScreen, dragMousePosScreen, this.startDragMousePosScreen);

        let dragVectorScaledDown: vec2 = vec2.fromValues(
            dragVectorScreen[0] / this.canvas.height,   // both height; intentional
            dragVectorScreen[1] / this.canvas.height
        );

        let dragVectorScaledUp: vec2 = vec2.create();
        vec2.scale(dragVectorScaledUp, dragVectorScaledDown, 1/this.MandelbrotZoomFactor);

        // TODO: work out why this is subtract not add.
        vec2.subtract(this.DynamicMandelbrotViewPositionWorld, this.CommitMandelbrotViewPositionWorld, dragVectorScaledUp);
    }

    public processMouseUp(clientX : number, clientY : number): void {
        if ( !this.startDragMousePosScreen )
            return;
            
        this.processMouseMove(clientX, clientY);
        vec2.copy(this.CommitMandelbrotViewPositionWorld, this.DynamicMandelbrotViewPositionWorld);
        this.startDragMousePosScreen = null;
    }
}
