import * as Constants from "./constants"
import { Game } from "./game";
import { TexObject } from "../texObject";
import { mat4 } from "gl-matrix";
import { NumberValue } from "d3";

export type ImagesDictionary = {[key: string]: HTMLImageElement};
type TexObjectDictionary = {[key: number]: TexObject};

function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export class Renderer
{
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    public width: number;
    public height: number;
    public shaderProgram: WebGLProgram | null;
    public matrixLocation: WebGLUniformLocation | null;
    public samplerLocation: WebGLUniformLocation | null;
    public positionLocation: number;
    public texCoordLocation: number;
    public cubeVertexBuffer: WebGLBuffer | null;
    public cubeIndexBuffer: WebGLBuffer | null;
    public texObjectDictionary: TexObjectDictionary;

    public cubeVertices: number[];
    public cubeIndices: number[];
    
    constructor( canvas: HTMLCanvasElement, gl: WebGL2RenderingContext )
    {
        this.canvas = canvas;
        this.gl = gl;
        this.width = canvas.width;
        this.height = canvas.height;
        this.shaderProgram = null;
        this.matrixLocation = null;
        this.samplerLocation = null;
        this.positionLocation = 0;
        this.texCoordLocation = 0;
        this.cubeVertexBuffer = null;
        this.cubeIndexBuffer = null;
        this.texObjectDictionary = {};

        this.cubeVertices = [

            // +Z
            0, 0, 1, 0, 0,     // v1
            1, 0, 1, 1, 0,     // v2
            0, 1, 1, 0, 1,     // v3
            1, 1, 1, 1, 1,     // v4

            // -Z
            0, 0, 0, 0, 0,     // v1
            0, 1, 0, 0, 1,     // v2
            1, 0, 0, 1, 0,     // v3
            1, 1, 0, 1, 1,     // v4

            // +X
            1, 0, 0, 0, 0,     // v1
            1, 1, 0, 1, 0,     // v2
            1, 0, 1, 0, 1,     // v3
            1, 1, 1, 1, 1,     // v4

            // -X
            0, 0, 0, 0, 0,     // v1
            0, 0, 1, 0, 1,     // v2
            0, 1, 0, 1, 0,     // v3
            0, 1, 1, 1, 1,     // v4

            // +Y
            0, 1, 0, 0, 0,     // v1
            0, 1, 1, 1, 0,     // v2
            1, 1, 0, 0, 1,     // v3
            1, 1, 1, 1, 1,     // v4

            // -Y
            0, 0, 0, 0, 0,     // v1
            1, 0, 0, 0, 1,     // v2
            0, 0, 1, 1, 0,     // v3
            1, 0, 1, 1, 1      // v4

        ];

        this.cubeIndices = [

            // +Z
            0, 1, 2,
            2, 1, 3,

            // -Z
            4, 5, 6,
            6, 5, 7,

            // +X
            8, 9, 10,
            10, 9, 11,

            // -X
            12, 13, 14,
            14, 13, 15,

            // +Y
            16, 17, 18,
            18, 17, 19,
            
            // -Y
            20, 21, 22,
            22, 21, 23

        ];
    }

    public setup_program_textured(): boolean {
        let gl = this.gl;

        let vertexShaderSource: string = `
            precision mediump float;

            attribute vec3 position; // Vertex position
            attribute vec2 texCoord; // Vertex texture coordinates

            varying vec2 v_fragTexCoord; // For passing to the fragment shader

            uniform mat4 u_mvp;

            void main()
            {
                v_fragTexCoord = texCoord;
                gl_Position = u_mvp * vec4(position, 1.0);
            }
        `;
        
        let vertexShader: WebGLShader | null = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader)
            return false;
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            let info = gl.getShaderInfoLog(vertexShader);
            console.error('Could not compile shader:\n' + info);
            gl.deleteShader(vertexShader);
            return false;
        }

        let fragmentShaderSource: string = `
            precision mediump float;

            varying vec2 v_fragTexCoord;

            uniform sampler2D u_sampler; // Texture sampler

            void main()
            {
                gl_FragColor = texture2D(u_sampler, v_fragTexCoord);
            }
        `;

        let fragmentShader: WebGLShader | null = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader)
            return false;
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            let info = gl.getShaderInfoLog(fragmentShader);
            console.error('Could not compile shader:\n' + info);
            gl.deleteShader(fragmentShader);
            return false;
        }

        this.shaderProgram = gl.createProgram();
        if (!this.shaderProgram)
            return false;

        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);
        gl.useProgram(this.shaderProgram);

        this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "position");
        this.texCoordLocation = this.gl.getAttribLocation(this.shaderProgram, "texCoord");
        this.matrixLocation = gl.getUniformLocation(this.shaderProgram, "u_mvp");
        this.samplerLocation = gl.getUniformLocation(this.shaderProgram, "u_sampler")
        if (!this.matrixLocation || !this.samplerLocation)
            return false;

        return true;
    }

    public init( images: ImagesDictionary ): boolean
    {
        if (this.cubeVertexBuffer) {
            this.gl.deleteBuffer(this.cubeVertexBuffer);
            this.cubeVertexBuffer = null;
        }
        if (this.cubeIndexBuffer) {
            this.gl.deleteBuffer(this.cubeIndexBuffer);
            this.cubeIndexBuffer = null;
        }
        
        let gl = this.gl;

        gl.viewport(0, 0, this.width, this.height);
        gl.clearColor( 0.2, 0.59, 0.93, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.cubeVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cubeVertices), this.gl.STATIC_DRAW);

        this.cubeIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.cubeIndices), this.gl.STATIC_DRAW);

        if ( !this.setup_program_textured() )
            return false;

        this.texObjectDictionary = {};
        this.texObjectDictionary[ Constants.TEX_ID_ICE ] = new TexObject(images[ "assets/voxel_terrain/ice.png" ]);
        
        // The Number() is necessary because Object.keys returns an array of strings, even for number keys
        Object.keys(this.texObjectDictionary).forEach(key => {
            this.texObjectDictionary[Number(key)].glInit( gl );
        });

        return true;
    }

    public onResize( width: number, height: number )
    {
        this.width = width;
        this.height = height;
        let gl = this.gl;

        gl.viewport(0, 0, this.width, this.height);
        gl.clearColor( 0.2, 0.59, 0.93, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    }

    public draw ( game: Game )
    {
        if (!this.shaderProgram)
            return;

        let gl = this.gl;

        gl.useProgram(this.shaderProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texObjectDictionary[ Constants.TEX_ID_ICE ].texture);
        gl.uniform1i(this.samplerLocation, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cubeIndexBuffer);

        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);

        gl.enableVertexAttribArray(this.texCoordLocation);
        gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

        let modelMatrix = mat4.create();
        let viewMatrix = mat4.create();
        let projMatrix = mat4.create();
        mat4.identity(modelMatrix);
        mat4.lookAt(viewMatrix, [Math.cos(game.rotationAngle) * 5, Math.sin(game.rotationAngle / 3) * 4 - 2, Math.sin(game.rotationAngle) * 5], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(projMatrix, degreesToRadians(45), this.width / this.height, 0.1, 1000.0);

        let mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, viewMatrix, modelMatrix)
        mat4.multiply(mvpMatrix, projMatrix, mvpMatrix);

        gl.uniformMatrix4fv(this.matrixLocation, false, mvpMatrix);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, this.cubeIndices.length, gl.UNSIGNED_SHORT, 0);

        // --- old code below ---

        // let modelMatrix = mat3.create();
        // mat3.translate( modelMatrix, modelMatrix, position );           // world space translation

        // mat3.scale ( modelMatrix, modelMatrix, vec2.fromValues( scale, scale ) );           // applying this appears to be causing a translation
        // if (flip)
        // {
        //     mat3.translate( modelMatrix, modelMatrix, vec2.fromValues( 1.0, 0.0 ) );
        //     mat3.scale( modelMatrix, modelMatrix, vec2.fromValues( -1.0, 1.0 ) );           // this also appears to be causing a translation
        // }

        // let mvp = mat3.create();
        // mat3.multiply( mvp, currentMatrix, modelMatrix )
        // gl.uniformMatrix3fv( matLocationTextured, false, mvp );

        // let uvOffset: vec2 = [frame / this.frameCount + 0.01, -0.02];    // these tiny numbers are meant to get rid of artifacts on the edges
        // let uvScale: vec2 = [1 / this.frameCount - 0.02, 1.0 - 0.04];
        // gl.uniform2fv(uvOffsetLocation, uvOffset);
        // gl.uniform2fv(uvScaleLocation, uvScale);

        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // gl.uniform1i(samplerLocation, 0);

        // gl.drawElements(gl.TRIANGLES, squareIndices.length, gl.UNSIGNED_SHORT, 0);
    }
}
