import { mat3, vec2 } from "gl-matrix";

export class SpriteTexObject
{
    public frameCount: number;
    public textureWidth: number;
    public bitmap: HTMLImageElement;
    public texture: WebGLTexture | null = null;

    public constructor(bitmap : HTMLImageElement, textureWidth: number, frameCount: number)
    {
        this.bitmap = bitmap;   // TODO consider passing by reference, make sure this is not a clone operation
        this.frameCount = frameCount;
        this.textureWidth = textureWidth;
    }

    public glInit( gl: WebGL2RenderingContext ): void {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.bitmap);
        //gl.generateMipmap(gl.TEXTURE_2D);
    }

    public glRenderFromCorner( gl: WebGL2RenderingContext, shaderProgramTextured: WebGLProgram,
        currentMatrix: mat3, matLocationTextured: WebGLUniformLocation,
        uvOffsetLocation: WebGLUniformLocation, uvScaleLocation: WebGLUniformLocation,
        squareIndices: number[], position: vec2, scale: number, frame: number, flip: boolean = false )
    {
        let modelMatrix = mat3.create();
        mat3.translate( modelMatrix, modelMatrix, position );           // world space translation

        mat3.scale ( modelMatrix, modelMatrix, vec2.fromValues( scale, scale ) );           // applying this appears to be causing a translation
        if (flip)
        {
            mat3.translate( modelMatrix, modelMatrix, vec2.fromValues( 1.0, 0.0 ) );
            mat3.scale( modelMatrix, modelMatrix, vec2.fromValues( -1.0, 1.0 ) );           // this also appears to be causing a translation
        }

        let mvp = mat3.create();
        mat3.multiply( mvp, currentMatrix, modelMatrix )
        gl.uniformMatrix3fv( matLocationTextured, false, mvp );

        let uvOffset: vec2 = [frame / this.frameCount + 0.01, -0.02];    // these tiny numbers are meant to get rid of artifacts on the edges
        let uvScale: vec2 = [1 / this.frameCount - 0.02, 1.0 - 0.04];
        gl.uniform2fv(uvOffsetLocation, uvOffset);
        gl.uniform2fv(uvScaleLocation, uvScale);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(shaderProgramTextured, "u_sampler"), 0);

        gl.drawElements(gl.TRIANGLES, squareIndices.length, gl.UNSIGNED_SHORT, 0);
    }
}
