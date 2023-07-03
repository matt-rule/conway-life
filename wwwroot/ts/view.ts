import { Vec } from "./vec";

export class View
{
    public minZoom: number = 0.1;
    public maxZoom: number = 10;
    public unzoomedCellWidth: number = 20;
    public cellWidth: number = 20;
    
    private dynamicGridPosition: Vec = new Vec(0, 0);       // Changes all the time when panning the view
    private commitGridPosition: Vec = new Vec(0, 0);        // Does not change until finished panning the view
    public startDragScreenPosition: Vec | null = null;

    public screenToCellCoords(screenXY: Vec): Vec
    {
        // perform transformation from screen to cell coordinates, considering panning and zoomed grid cell width
        return screenXY.subtract(this.dynamicGridPosition).divide(this.cellWidth).floor();
    }
    public cellToScreenCoords(cellXY: Vec): Vec
    {
        // perform transformation from cell to screen coordinates, considering panning and zoomed grid cell width
        return cellXY.multiply(this.cellWidth).add(this.dynamicGridPosition);
    }
    public getDynamicGridPosition(): Vec
    {
        return this.dynamicGridPosition.clone();
    }
    public setDynamicGridPosition(val: Vec): void
    {
        this.dynamicGridPosition = val.clone();
    }
    public getCommitGridPosition(): Vec
    {
        return this.dynamicGridPosition.clone();
    }
    public setCommitGridPosition(val: Vec): void
    {
        this.dynamicGridPosition = val.clone();
    }
}
