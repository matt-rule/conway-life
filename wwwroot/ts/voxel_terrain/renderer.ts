import { Game } from "./game";

export class Renderer
{
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    public width: number;
    public height: number;
    
    constructor( canvas: HTMLCanvasElement, gl: WebGL2RenderingContext )
    {
        this.canvas = canvas;
        this.gl = gl;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    public init()
    {
        let gl = this.gl;

        gl.viewport(0, 0, this.width, this.height);
        gl.clearColor( 0.2, 0.59, 0.93, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.CULL_FACE);

        // if ( !this.setup_program_textured() )
        //     return false;
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
        gl.disable(gl.CULL_FACE);
    }

    public draw ( game: Game )
    {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
}
