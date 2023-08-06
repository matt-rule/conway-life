import * as Constants from "./constants";
import { mat3, vec2 } from "gl-matrix";
import { SpriteTexObject } from "./spriteTexObject";
import { TexObject } from "./texObject";
import { ActiveLevel } from "./activeLevel";

export type ImagesDictionary = {[key: string]: HTMLImageElement};
type TexObjectDictionary = {[key: number]: TexObject};
type SpriteTexObjectDictionary = {[key: number]: SpriteTexObject};

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
    public texObjectDictionary: TexObjectDictionary;
    public spriteTexObjectDictionary: SpriteTexObjectDictionary;
    public level: ActiveLevel | null;
    
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
        this.texObjectDictionary = {};
        this.spriteTexObjectDictionary = {};
        this.level = null;
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

    public init(gl: WebGL2RenderingContext, width: number, height: number, stillImages: ImagesDictionary, animatedImages: ImagesDictionary ): boolean {
        this.gl = gl;
        this.width = width;
        this.height = height;

        if ( !this.gl || !this.width || !this.height )
            return false;

        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.clearColor(0.5, 0.0, 0.5, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.gl.disable(this.gl.CULL_FACE);

        if ( !this.setup_program() )
            return false;
        if ( !this.setup_program_textured() )
            return false;

        this.texObjectDictionary = {};
        this.texObjectDictionary[ Constants.TEX_ID_LAVA_BOMB ] = new TexObject(stillImages[ "assets/hot_rocks/lava-bomb.png" ]);
        this.texObjectDictionary[ Constants.TEX_ID_ROCK ] = new TexObject(stillImages[ "assets/hot_rocks/tile.png" ]);
        this.texObjectDictionary[ Constants.TEX_ID_BG ] = new TexObject(stillImages[ "assets/hot_rocks/bg1.png" ]);
        this.texObjectDictionary[ Constants.TEX_ID_STANDING ] = new TexObject(stillImages[ "assets/hot_rocks/sprite-standing.png" ]);
        this.texObjectDictionary[ Constants.TEX_ID_SPITTER ] = new TexObject(stillImages[ "assets/hot_rocks/spitter.png" ]);
        this.texObjectDictionary[ Constants.TEX_ID_BULLET ] = new TexObject(stillImages[ "assets/hot_rocks/lava-bullet-2.png" ]);
        this.texObjectDictionary[ Constants.TEX_ID_FLAG_RED ] = new TexObject(stillImages[ "assets/hot_rocks/flag-red.png" ]);
        this.texObjectDictionary[ Constants.TEX_ID_FLAG_WHITE ] = new TexObject(stillImages[ "assets/hot_rocks/flag-white.png" ]);
        this.texObjectDictionary[ Constants.TEX_ID_FLAME_SPITTER ] = new TexObject(stillImages[ "assets/hot_rocks/spitter-flame.png" ]);
        
        // The Number() is necessary because Object.keys returns an array of strings, even for number keys
        Object.keys(this.texObjectDictionary).forEach(key => {
            this.texObjectDictionary[Number(key)].glInit( gl );
        });

        this.spriteTexObjectDictionary = {};
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/sprite-suit.png" ], 256, 8 );
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/sprite-font.png" ], 32, 95 );
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/sprite-lava-lake.png" ], 128, 2 );
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/sprite-lava-surface.png" ], 128, 2 );
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/sprite-flames-big.png" ], 256, Constants.SPRITE_FLAMES_FRAMES );

        this.level = new ActiveLevel();

        let success = this.calcBufferData() && this.calcBufferDataTextured();
        return success;
    }

    public worldToScreenScaleFactor ( screenWidth: number ) {
        return screenWidth / (Constants.TILE_SIZE * Constants.LEVEL_EXT_WIDTH);
    }

    public renderVictoryScreen( screenWidth: number, screenHeight: number ): void
    {

    }

    public renderLevel( gameWon : boolean, projectionMatrix: mat3, screenWidth: number, screenHeight: number ): void
    //public renderLevel( level: ActiveLevel, screenWidth: number, screenHeight: number ): void
    {
        if ( !this.gl || !this.level || !this.shaderProgramTextured || !this.matrixLocationTextured )
            return;

        if (gameWon)
        {
            this.renderVictoryScreen(screenWidth, screenHeight);
            return;
        }

        let scaleFactor: number = this.worldToScreenScaleFactor(screenWidth);
        let scaledProjMatrix = mat3.create();
        mat3.scale( scaledProjMatrix, projectionMatrix, vec2.fromValues( scaleFactor * 0.5, scaleFactor * 0.5 ));

        for ( let x: number = -1; x < Constants.LEVEL_WIDTH +3; ++x )
        {
            this.texObjectDictionary[ Constants.TEX_ID_ROCK ].glRenderFromCorner( this.gl, this.shaderProgramTextured, scaledProjMatrix,
                this.matrixLocationTextured, this.squareIndices, vec2.fromValues( Constants.BG_TILE_SIZE*x, 0 ), Constants.BG_TILE_SIZE );
        }
        
        this.texObjectDictionary[ Constants.TEX_ID_STANDING ].glRenderFromCorner( this.gl, this.shaderProgramTextured, scaledProjMatrix,
            this.matrixLocationTextured, this.squareIndices, this.level.mcPosition, Constants.SPRITE_SUIT_SIZE );
    }

    public draw(gameWon: boolean) {
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

        //let mvp = mat3.create();
        //mat3.multiply(mvp, projectionMatrix, modelMatrix);

        // Non-textured only
        //this.gl.uniformMatrix3fv(this.matrixLocation, false, mvp);
        //this.gl.uniform4f(this.colorLocation, 1.0, 0.0, 0.0, 1);

        this.renderLevel( gameWon, projectionMatrix, this.width, this.height );
    }
}
