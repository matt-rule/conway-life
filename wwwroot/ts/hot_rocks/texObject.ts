import { mat3, vec2 } from "gl-matrix";

export class TexObject {
    public bitmap: HTMLImageElement | null = null;
    public texture: WebGLTexture | null = null;         // new

    public constructor( bitmap: HTMLImageElement )
    {
        this.bitmap = bitmap;   // TODO consider passing by reference, make sure this is not a clone operation
    }

    public glInit( gl: WebGL2RenderingContext ): void {
        if (!this.bitmap)
            return;

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.bitmap);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    public glRenderFromCorner( gl: WebGL2RenderingContext, shaderProgramTextured: WebGLProgram,
        mat: mat3, matLocationTextured: WebGLUniformLocation, squareIndices: number[], scale: number, flip: boolean = false )
    {
        let aMat = mat3.create();
        mat3.scale ( aMat, mat, vec2.fromValues( scale, scale ) );

        if (flip)
        {
            mat3.translate( aMat, aMat, vec2.fromValues( 1.0, 0.0 ) );
            mat3.scale( aMat, aMat, vec2.fromValues( -1.0, 1.0 ) );
        }

        gl.uniformMatrix3fv( matLocationTextured, false, aMat );

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(shaderProgramTextured, "u_sampler"), 0);

        gl.drawElements(gl.TRIANGLES, squareIndices.length, gl.UNSIGNED_SHORT, 0);
    }
};
