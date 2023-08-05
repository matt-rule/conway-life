import * as Constants from "./constants";
import { mat3, vec2 } from "gl-matrix";
import { TexObject } from "./texObject";

export class Renderer {
    public gl: WebGL2RenderingContext | null;
    public width: number | null;
    public height: number | null;
    public shaderProgram: WebGLProgram | null;
    public shaderProgramTextured: WebGLProgram | null;
    public matrixLocation: WebGLUniformLocation | null;
    public matrixLocationTextured: WebGLUniformLocation | null;
    public colorLocation: WebGLUniformLocation | null;
    public squareVertices: number[];
    public squareIndices: number[];
    public squareVertexBuffer: WebGLBuffer | null;
    public squareIndexBuffer: WebGLBuffer | null;
    public squareVerticesTextured: number[];
    public squareIndicesTextured: number[];
    public squareVertexBufferTextured: WebGLBuffer | null;
    public squareIndexBufferTextured: WebGLBuffer | null;
    public texObject: TexObject | null;
    
    public constructor()
    {
        this.gl = null;
        this.width = null;
        this.height = null;
        this.shaderProgram = null;
        this.shaderProgramTextured = null;
        this.matrixLocation = null;
        this.matrixLocationTextured = null;
        this.colorLocation = null;
        this.squareVertices = [];
        this.squareIndices = [];
        this.squareVertexBuffer = null;
        this.squareIndexBuffer = null;
        this.squareVerticesTextured = [];
        this.squareIndicesTextured = [];
        this.squareVertexBufferTextured = null;
        this.squareIndexBufferTextured = null;
        this.texObject = null;
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

    public calcBufferDataTextured(): boolean
    {
        if (!this.gl)
            return false;

        if (this.squareVertexBufferTextured) {
            this.gl.deleteBuffer(this.squareVertexBufferTextured);
            this.squareVertexBufferTextured = null;
        }
        if (this.squareIndexBufferTextured) {
            this.gl.deleteBuffer(this.squareIndexBufferTextured);
            this.squareIndexBufferTextured = null;
        }

        this.squareVerticesTextured = [
            0, 0, 0, 0,
            1, 0, 1, 0,
            0, 1, 0, 1,
            1, 1, 1, 1
        ];

        this.squareIndicesTextured = [
            0, 1, 2,
            2, 1, 3
        ];

        this.squareVertexBufferTextured = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBufferTextured);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.squareVerticesTextured), this.gl.STATIC_DRAW);

        this.squareIndexBufferTextured = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBufferTextured);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.squareIndicesTextured), this.gl.STATIC_DRAW);

        return true;
    }

    public setup_program(): boolean {
        if ( !this.gl )
            return false;

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

        return true;
    }

    public setup_program_textured(): boolean {
        if ( !this.gl )
            return false;

        let vertexShaderSource: string = `
            attribute vec2 position;
            attribute vec2 textureCoord;
            uniform mat3 u_matrix;

            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(u_matrix * vec3(position, 1.0), 1.0);
                v_texCoord = vec2(textureCoord.x, -textureCoord.y);
            }
        `;
        
        let vertexShader: WebGLShader | null = this.gl.createShader(this.gl.VERTEX_SHADER);
        if (!vertexShader)
            return false;
        this.gl.shaderSource(vertexShader, vertexShaderSource);
        this.gl.compileShader(vertexShader);

        if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
            let info = this.gl.getShaderInfoLog(vertexShader);
            console.error('Could not compile shader:\n' + info);
            this.gl.deleteShader(vertexShader);
            return false;
        }

        let fragmentShaderSource: string = `
            precision mediump float;

            varying vec2 v_texCoord;
            uniform sampler2D u_sampler;

            void main(void) {
                gl_FragColor = texture2D(u_sampler, v_texCoord);
            }
        `;

        let fragmentShader: WebGLShader | null = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        if (!fragmentShader)
            return false;
        this.gl.shaderSource(fragmentShader, fragmentShaderSource);
        this.gl.compileShader(fragmentShader);

        if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
            let info = this.gl.getShaderInfoLog(fragmentShader);
            console.error('Could not compile shader:\n' + info);
            this.gl.deleteShader(fragmentShader);
            return false;
        }

        this.shaderProgramTextured = this.gl.createProgram();
        if (!this.shaderProgramTextured)
            return false;

        this.gl.attachShader(this.shaderProgramTextured, vertexShader);
        this.gl.attachShader(this.shaderProgramTextured, fragmentShader);
        this.gl.linkProgram(this.shaderProgramTextured);
        this.gl.useProgram(this.shaderProgramTextured);

        this.matrixLocationTextured = this.gl.getUniformLocation(this.shaderProgramTextured, "u_matrix");
        if (!this.matrixLocationTextured)
            return false;

        return true;
    }

    public init(gl: WebGL2RenderingContext, width: number, height: number, image: HTMLImageElement): boolean {
        this.gl = gl;
        this.width = width;
        this.height = height;

        if ( !this.gl || !this.width || !this.height )
            return false;

        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.clearColor(0.5, 0.0, 0.5, 1.0);
        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.CULL_FACE);

        if ( !this.setup_program() )
            return false;
        if ( !this.setup_program_textured() )
            return false;

        this.texObject = new TexObject( image );
        this.texObject.glInit( gl );

        let success = this.calcBufferData() && this.calcBufferDataTextured();
        return success;
    }

    public draw(squarePosition: vec2) {
        if (!this.gl || !this.shaderProgram || !this.shaderProgramTextured || !this.width || !this.height || !this.matrixLocationTextured )
        {
            return;
        }

        this.gl.useProgram(this.shaderProgramTextured);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBufferTextured);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.squareIndexBufferTextured);

        // Non-textured only
        //let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        // Textured only
        let positionLocation = this.gl.getAttribLocation(this.shaderProgramTextured, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        // Non-textured only
        //this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        // Textured only
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);

        // Textured only
        let texCoordLocation = this.gl.getAttribLocation(this.shaderProgramTextured, "textureCoord");
        this.gl.enableVertexAttribArray(texCoordLocation);
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);

        let projectionMatrix = mat3.create();
        mat3.translate(projectionMatrix, projectionMatrix, [-1, -1]);
        mat3.scale(projectionMatrix, projectionMatrix, [2/this.width, 2/this.height]);

        let modelMatrix = mat3.create();
        mat3.translate(modelMatrix, modelMatrix, squarePosition);
        //mat3.scale(modelMatrix, modelMatrix, [50, 50]);

        let mvp = mat3.create();
        mat3.multiply(mvp, projectionMatrix, modelMatrix);

        // Non-textured only
        //this.gl.uniformMatrix3fv(this.matrixLocation, false, mvp);
        //this.gl.uniform4f(this.colorLocation, 1.0, 0.0, 0.0, 1);

        this.texObject?.glRenderFromCorner( this.gl, this.shaderProgramTextured, mvp,
            this.matrixLocationTextured, this.squareIndices, Constants.BG_TILE_SIZE );
    }
}
