import { Vec } from "./vec";
import * as glMatrix from 'gl-matrix';

export class View
{
    public static readonly MIN_ZOOM: number = 2;
    public static readonly MAX_ZOOM: number = 200;
    public static readonly DEFAULT_ZOOM: number = 20;

    public _zoomLevel: number = View.DEFAULT_ZOOM;
    public _dynamicViewPositionScreenCoords: Vec = new Vec(0, 0);       // Changes all the time when panning the view
    public _commitViewPositionScreenCoords: Vec = new Vec(0, 0);        // Does not change until finished panning the view
    public startDragScreenPosition: Vec | null = null;
    public viewMatrix: glMatrix.mat4 = glMatrix.mat4.create();

    public set zoomLevel(value: number) {
        this._zoomLevel = value;
        this.updateViewMatrix();
    }

    public get zoomLevel(): number {
        return this._zoomLevel;
    }

    public set dynamicViewPositionScreenCoords(value: Vec) {
        this._dynamicViewPositionScreenCoords = value;
        this.updateViewMatrix();
    }

    public get dynamicViewPositionScreenCoords(): Vec {
        return this._dynamicViewPositionScreenCoords;
    }

    public set commitViewPositionScreenCoords(value: Vec) {
        this._commitViewPositionScreenCoords = value;
        this.updateViewMatrix();
    }

    public get commitViewPositionScreenCoords(): Vec {
        return this._commitViewPositionScreenCoords;
    }

    private updateViewMatrix() {
        glMatrix.mat4.identity(this.viewMatrix);
        glMatrix.mat4.translate(this.viewMatrix, this.viewMatrix, [-this._dynamicViewPositionScreenCoords.x, -this._dynamicViewPositionScreenCoords.y, 0]);
        glMatrix.mat4.scale(this.viewMatrix, this.viewMatrix, [this._zoomLevel, this._zoomLevel, 1]);
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
