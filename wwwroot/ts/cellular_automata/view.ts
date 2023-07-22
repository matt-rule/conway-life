import { Vec } from "./vec";
import { vec2, mat3 } from "gl-matrix";

export class View
{
    public static readonly MIN_ZOOM: number = 2;
    public static readonly MAX_ZOOM: number = 200;
    public static readonly DEFAULT_ZOOM: number = 20;

    public viewMatrix: mat3;

    constructor()
    {
        this.viewMatrix = mat3.create();
        mat3.identity(this.viewMatrix);
        mat3.scale(this.viewMatrix, this.viewMatrix, [View.DEFAULT_ZOOM, View.DEFAULT_ZOOM]);
    }

    public clone(): View {
        let clonedView = new View();
        clonedView.viewMatrix = mat3.clone(this.viewMatrix);
        return clonedView;
    }

    public set zoomLevel(value: number) {
        let viewPosition = new Vec(this.viewMatrix[6], this.viewMatrix[7]);
        mat3.identity(this.viewMatrix);
        mat3.translate(this.viewMatrix, this.viewMatrix, [viewPosition.x, viewPosition.y]);
        mat3.scale(this.viewMatrix, this.viewMatrix, [value, value]);
    }

    public get zoomLevel(): number {
        return this.viewMatrix[0];
    }

    public set positionInScreenCoords(value: Vec) {
        let zoomLevel = this.viewMatrix[0];
        mat3.identity(this.viewMatrix);
        mat3.translate(this.viewMatrix, this.viewMatrix, [-value.x, -value.y]);
        mat3.scale(this.viewMatrix, this.viewMatrix, [zoomLevel, zoomLevel]);
    }

    public get positionInScreenCoords(): Vec {
        return new Vec(-this.viewMatrix[6], -this.viewMatrix[7]);
    }

    public screenToCellCoords(screenXY: Vec): Vec
    {
        // perform transformation from screen to cell coordinates, considering panning and zoomed grid cell width
        
        let inputVec = vec2.fromValues(screenXY.x, screenXY.y);

        // Multiply the input vector by the viewMatrix
        let outputVec = vec2.create();
        let inverted = mat3.create();
        mat3.invert(inverted, this.viewMatrix);
        vec2.transformMat3(outputVec, inputVec, inverted);

        // Return the result as a Vec object
        return new Vec(outputVec[0], outputVec[1]);
    }
    public cellToScreenCoords(cellXY: Vec): Vec
    {
        // perform transformation from cell to screen coordinates, considering panning and zoomed grid cell width

        let inputVec = vec2.fromValues(cellXY.x, cellXY.y);

        // Multiply the input vector by the viewMatrix
        let outputVec = vec2.create();
        vec2.transformMat3(outputVec, inputVec, this.viewMatrix);

        // Return the result as a Vec object
        return new Vec(outputVec[0], outputVec[1]);
    }
}
