import * as Constants from "./constants";
import { mat3, vec2 } from "gl-matrix";
import { SpriteTexObject } from "./spriteTexObject";
import { TexObject } from "./texObject";
import { ActiveLevel, CharacterFacing } from "./activeLevel";

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
    public uvOffsetLocation: WebGLUniformLocation | null;
    public uvScaleLocation: WebGLUniformLocation | null;
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
        this.uvOffsetLocation = null;
        this.uvScaleLocation = null;
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
            1, 1,
            20, 1,
            1, 20,
            20, 20
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
            uniform vec2 u_uvOffset;
            uniform vec2 u_uvScale;
            uniform mat3 u_matrix;

            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(u_matrix * vec3(position, 1.0), 1.0);
                v_texCoord = vec2(textureCoord.x, -textureCoord.y) * u_uvScale + u_uvOffset;
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
        this.uvOffsetLocation = this.gl.getUniformLocation(this.shaderProgramTextured, "u_uvOffset");
        this.uvScaleLocation = this.gl.getUniformLocation(this.shaderProgramTextured, "u_uvScale");
        if (!this.matrixLocationTextured)
            return false;

        return true;
    }

    public init(gl: WebGL2RenderingContext, levelBlockData: number[][], width: number, height: number, stillImages: ImagesDictionary, animatedImages: ImagesDictionary ): boolean {
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
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/hot_rocks/sprite-suit.png" ], 256, 8 );
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/hot_rocks/sprite-font.png" ], 32, 95 );
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/hot_rocks/sprite-lava-lake.png" ], 128, 2 );
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/hot_rocks/sprite-lava-surface.png" ], 128, 2 );
        this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_SUIT ] = new SpriteTexObject( animatedImages[ "assets/hot_rocks/sprite-flames-big.png" ], 256, Constants.SPRITE_FLAMES_FRAMES );

        Object.keys(this.spriteTexObjectDictionary).forEach(key => {
            this.spriteTexObjectDictionary[Number(key)].glInit( gl );
        });

        this.level = new ActiveLevel(levelBlockData);

        let success = this.calcBufferData() && this.calcBufferDataTextured();
        return success;
    }

    // provided in world coords
    public getWorldToScreenOffset(): vec2
    {
        if (!this.level)
            return vec2.fromValues(0,0);

        let result: vec2 = vec2.fromValues(Constants.TILE_SIZE, Constants.TILE_SIZE);
        if ( this.level.mcPosition[1] > Constants.TILE_SIZE * 12 )
            vec2.add(result, result, vec2.fromValues(0.0, Constants.TILE_SIZE * 12 - this.level.mcPosition[1]));

        return result;
    }

    public worldToScreenScaleFactor ( screenWidth: number ): number {
        return screenWidth / (Constants.TILE_SIZE * Constants.LEVEL_EXT_WIDTH);
    }

    public renderVictoryScreen( screenWidth: number, screenHeight: number ): void
    {

    }

    public renderLevel( gameWon : boolean, levelBlockData: number[][], projectionMatrix: mat3, screenWidth: number, screenHeight: number ): void
    //public renderLevel( level: ActiveLevel, screenWidth: number, screenHeight: number ): void
    {
        if ( !this.gl || !this.level || !this.shaderProgramTextured || !this.matrixLocationTextured || !this.uvOffsetLocation || !this.uvScaleLocation )
            return;

        if (gameWon)
        {
            this.renderVictoryScreen(screenWidth, screenHeight);
            return;
        }

        // scale by screen width relative to tile size*number of tiles
        let scaleFactor: number = this.worldToScreenScaleFactor(screenWidth);

        // Render background
        {
            let viewMatrix = mat3.create();
            mat3.scale( viewMatrix, viewMatrix, vec2.fromValues( scaleFactor * 0.5, scaleFactor * 0.5 ));

            // Account for border
            mat3.translate( viewMatrix, viewMatrix, vec2.fromValues( Constants.BG_TILE_SIZE, Constants.BG_TILE_SIZE ) );

            // If they are more than x tiles up
            if ( this.level.mcPosition[1] > Constants.TILE_SIZE * 12)
            {
                // character appears some distance from the bottom of the screen
                mat3.translate( viewMatrix, viewMatrix, vec2.fromValues( 0, Constants.TILE_SIZE * 12 ) );
                // account for character position in level
                mat3.translate( viewMatrix, viewMatrix, vec2.fromValues( 0, -this.level.mcPosition[1] ) );
            }

            let mvp: mat3 = mat3.create();
            mat3.multiply( mvp, projectionMatrix, viewMatrix );

            for ( let x: number = -1; x <= Constants.LEVEL_WIDTH +2; ++x )
                for ( let y: number = -1; y <= Constants.LEVEL_HEIGHT +2; ++y )
                {
                    this.texObjectDictionary[ Constants.TEX_ID_BG ].glRenderFromCorner( this.gl, this.shaderProgramTextured, mvp,
                        this.matrixLocationTextured, this.uvOffsetLocation, this.uvScaleLocation, this.squareIndices,
                        vec2.fromValues( Constants.BG_TILE_SIZE*x, Constants.BG_TILE_SIZE*y ), Constants.BG_TILE_SIZE );
                }
        }

        // Set up matrices for foreground objects
        let viewMatrix = mat3.create();
        mat3.scale( viewMatrix, viewMatrix, vec2.fromValues( scaleFactor, scaleFactor ));

        // Account for border
        let offset: vec2 = this.getWorldToScreenOffset();
        mat3.translate( viewMatrix, viewMatrix, offset );

        let mvp: mat3 = mat3.create();
        mat3.multiply( mvp, projectionMatrix, viewMatrix );

        // let lavaFrameToRender: number = (this.level.lavaAnimationLoopValue * Constants.LAVA_LAKE_SPRITE_FRAMES);
        // if (lavaFrameToRender < 0)
        //     lavaFrameToRender = 0;
        // if (lavaFrameToRender >= Constants.LAVA_LAKE_SPRITE_FRAMES)
        //     lavaFrameToRender = Constants.LAVA_LAKE_SPRITE_FRAMES - 1;

        // // Render lava surface.
        // for ( let x: number = -1; x <= Constants.LEVEL_WIDTH +2; ++x )
        // {
        //     this.spriteTexObjectDictionary[ Constants.TEX_ID_SPRITE_LAVA_SURFACE ].glRenderFromCorner(
        //         this.gl, this.shaderProgramTextured, mvp, this.matrixLocationTextured, this.squareIndices,
        //         vec2.fromValues( Constants.TILE_SIZE*x, Constants.TILE_SIZE*y ), lavaFrameToRender, Constants.TILE_SIZE );

        //     GL.Translate(
        //         x * Constants.LAVA_SURFACE_SPRITE_SIZE,
        //         Level.LavaHeight - Constants.LAVA_SURFACE_SPRITE_SIZE, 0);
        //     if (spriteTexObjects.TryGetValue(Constants.TEX_ID_SPRITE_LAVA_SURFACE, out SpriteTexObject lavaSurfaceTexObject))
        //         lavaSurfaceTexObject.GlRenderFromCorner(Constants.LAVA_SURFACE_SPRITE_SIZE, lavaFrameToRender);
        // }

        // Render tiles
        for ( let x: number = -1; x <= Constants.LEVEL_WIDTH +2; ++x )
            for ( let y: number = -1; y <= Constants.LEVEL_HEIGHT +2; ++y )
            {
                let textureToUse: number = -1;

                if
                (
                    x < 0
                    || x >= Constants.LEVEL_WIDTH
                    || y < 0
                    || y >= Constants.LEVEL_HEIGHT
                )
                {
                    textureToUse = Constants.TEX_ID_ROCK;
                    this.texObjectDictionary[ Constants.TEX_ID_ROCK ].glRenderFromCorner( this.gl, this.shaderProgramTextured, mvp,
                        this.matrixLocationTextured, this.uvOffsetLocation, this.uvScaleLocation,
                        this.squareIndices, vec2.fromValues( Constants.TILE_SIZE*x, Constants.TILE_SIZE*y ), Constants.TILE_SIZE );
                }
                else
                {
                    switch ( levelBlockData[x][y] )
                    {
                        case Constants.TILE_ID_ROCK:
                            textureToUse = Constants.TEX_ID_ROCK;
                            break;
                        case Constants.TILE_ID_SPITTER:
                            textureToUse = Constants.TEX_ID_SPITTER;
                            break;
                        case Constants.TILE_ID_FLAG_RED:
                            textureToUse = Constants.TEX_ID_FLAG_RED;
                            break;
                        case Constants.TILE_ID_FLAG_WHITE:
                            textureToUse = Constants.TEX_ID_FLAG_WHITE;
                            break;
                        case Constants.TILE_ID_FLAME_SPITTER:
                            textureToUse = Constants.TEX_ID_FLAME_SPITTER;
                            break;
                        case Constants.TILE_ID_EMPTY:
                        default:
                            break;
                    }

                    if ( textureToUse != -1 )
                        this.texObjectDictionary[ textureToUse ].glRenderFromCorner( this.gl, this.shaderProgramTextured, mvp,
                            this.matrixLocationTextured, this.uvOffsetLocation, this.uvScaleLocation,
                            this.squareIndices, vec2.fromValues( Constants.TILE_SIZE*x, Constants.TILE_SIZE*y ), Constants.TILE_SIZE );
                }
            }
        
        // if (! this.level.mcRunning )
        // {

        // }
        // else
        // {

        // }

        this.texObjectDictionary[ Constants.TEX_ID_STANDING ].glRenderFromCorner( this.gl, this.shaderProgramTextured, mvp,
            this.matrixLocationTextured, this.uvOffsetLocation, this.uvScaleLocation,
            this.squareIndices, this.level.mcPosition, Constants.SPRITE_SUIT_SIZE, this.level.facing == CharacterFacing.Right );
    }

    public draw( gameWon: boolean, levelBlockData: number[][] ) {
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

        this.renderLevel( gameWon, levelBlockData, projectionMatrix, this.width, this.height );
    }
}
