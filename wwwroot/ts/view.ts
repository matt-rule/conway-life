import { Vec } from "./vec";
import * as glMatrix from 'gl-matrix';

export class View
{
    public static readonly MIN_ZOOM: number = 2;
    public static readonly MAX_ZOOM: number = 200;
    public static readonly DEFAULT_ZOOM: number = 20;

    public viewMatrix: glMatrix.mat4;

    constructor()
    {
        this.viewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.identity(this.viewMatrix);
        glMatrix.mat4.scale(this.viewMatrix, this.viewMatrix, [View.DEFAULT_ZOOM, View.DEFAULT_ZOOM, 1]);
    }

    public set zoomLevel(value: number) {
        let viewPosition = new Vec(this.viewMatrix[12], this.viewMatrix[13]);
        glMatrix.mat4.identity(this.viewMatrix);
        glMatrix.mat4.translate(this.viewMatrix, this.viewMatrix, [viewPosition.x, viewPosition.y, 0]);
        glMatrix.mat4.scale(this.viewMatrix, this.viewMatrix, [value, value, 1]);
    }

    public get zoomLevel(): number {
        return this.viewMatrix[0];
    }

    public set positionInScreenCoords(value: Vec) {
        let zoomLevel = this.viewMatrix[0];
        glMatrix.mat4.identity(this.viewMatrix);
        glMatrix.mat4.translate(this.viewMatrix, this.viewMatrix, [-value.x, -value.y, 0]);
        glMatrix.mat4.scale(this.viewMatrix, this.viewMatrix, [zoomLevel, zoomLevel, 1]);
    }

    public get positionInScreenCoords(): Vec {
        return new Vec(-this.viewMatrix[12], -this.viewMatrix[13]);
    }

    public screenToCellCoords(screenXY: Vec): Vec
    {
        // perform transformation from screen to cell coordinates, considering panning and zoomed grid cell width
        
        // Create a homogeneous coordinate with [x, y, 1]
        let inputVec = glMatrix.vec3.fromValues(screenXY.x, screenXY.y, 1);

        // Multiply the input vector by the viewMatrix
        let outputVec = glMatrix.vec3.create();
        let inverted = glMatrix.mat4.create();
        glMatrix.mat4.invert(inverted, this.viewMatrix);
        glMatrix.vec3.transformMat4(outputVec, inputVec, inverted);

        // Return the result as a Vec object
        return new Vec(outputVec[0], outputVec[1]);
    }
    public cellToScreenCoords(cellXY: Vec): Vec
    {
        // perform transformation from cell to screen coordinates, considering panning and zoomed grid cell width

        // Create a homogeneous coordinate with [x, y, 1]
        let inputVec = glMatrix.vec3.fromValues(cellXY.x, cellXY.y, 1);

        // Multiply the input vector by the viewMatrix
        let outputVec = glMatrix.vec3.create();
        glMatrix.vec3.transformMat4(outputVec, inputVec, this.viewMatrix);

        // Return the result as a Vec object
        return new Vec(outputVec[0], outputVec[1]);
    }
}
