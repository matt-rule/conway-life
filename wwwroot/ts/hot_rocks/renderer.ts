import { mat3 } from "gl-matrix";

export class Renderer {
    public gl: WebGL2RenderingContext | null;
    public width: number | null;
    public height: number | null;
    public shaderProgram: WebGLProgram | null;
    public matrixLocation: WebGLUniformLocation | null;
    public colorLocation: WebGLUniformLocation | null;
    public squareVertices: number[];
    public squareIndices: number[];
    public squareVertexBuffer: WebGLBuffer | null;
    public squareIndexBuffer: WebGLBuffer | null;
    
    public constructor()
    {
        this.gl = null;
        this.width = null;
        this.height = null;
        this.shaderProgram = null;
        this.matrixLocation = null;
        this.colorLocation = null;
        this.squareVertices = [];
        this.squareIndices = [];
        this.squareVertexBuffer = null;
        this.squareIndexBuffer = null;
    }

    public calcBufferData(): boolean
    {
        if (!this.gl)
            return false;

        if (this.squareVertexBuffer) {
            this.gl.deleteBuffer(this.squareVertexBuffer);
            this.squareVertexBuffer = null;
        }
        if (this.squareIndexBuffer) {
            this.gl.deleteBuffer(this.squareIndexBuffer);
            this.squareIndexBuffer = null;
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

        this.squareVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.squareVertices), this.gl.STATIC_DRAW);

        this.squareIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.squareIndices), this.gl.STATIC_DRAW);

        return true;
    }

    public init(gl: WebGL2RenderingContext, width: number, height: number): boolean {
        this.gl = gl;
        this.width = width;
        this.height = height;

        if ( !this.gl || !this.width || !this.height )
            return false;

        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.clearColor(0.5, 0.0, 0.5, 1.0);
        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.CULL_FACE);

        let vertexShaderSource: string = `
            attribute vec2 position;
            uniform mat3 u_matrix;
            
            void main() {
                gl_Position = vec4(u_matrix * vec3(position, 1.0), 1.0);
            }
        `;
        
        let vertexShader: WebGLShader | null = this.gl.createShader(this.gl.VERTEX_SHADER);
        if (!vertexShader)
            return false;
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
            return false;
        this.gl.shaderSource(fragmentShader, fragmentShaderSource);
        this.gl.compileShader(fragmentShader);

        this.shaderProgram = this.gl.createProgram();
        if (!this.shaderProgram)
            return false;

        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);
        this.gl.useProgram(this.shaderProgram);

        this.matrixLocation = this.gl.getUniformLocation(this.shaderProgram, "u_matrix");
        if (!this.matrixLocation)
            return false;
        this.colorLocation = this.gl.getUniformLocation(this.shaderProgram, "u_color");
        if (!this.colorLocation)
            return false;

        return this.calcBufferData();
    }

    public draw() {
        if (!this.gl || !this.shaderProgram || !this.width || !this.height)
        {
            return;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBuffer);

        let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        let projectionMatrix = mat3.create();
        mat3.translate(projectionMatrix, projectionMatrix, [-1, -1]);
        mat3.scale(projectionMatrix, projectionMatrix, [2/this.width, 2/this.height]);

        let modelMatrix = mat3.create();
        mat3.translate(modelMatrix, modelMatrix, [200, 100]);
        mat3.scale(modelMatrix, modelMatrix, [50, 50]);

        let mvp = mat3.create();
        mat3.multiply(mvp, projectionMatrix, modelMatrix);

        this.gl.uniformMatrix3fv(this.matrixLocation, false, mvp);
        this.gl.uniform4f(this.colorLocation, 1.0, 0.0, 0.0, 1);

        this.gl.drawElements(this.gl.TRIANGLES, this.squareIndices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}
