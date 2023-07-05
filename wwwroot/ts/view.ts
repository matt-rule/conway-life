import { Vec } from "./vec";

export class View
{
    public minZoom: number = 0.1;
    public maxZoom: number = 10;
    public unzoomedCellWidth: number = 20;
    public cellWidth: number = 20;
    
    public dynamicViewPositionScreenCoords: Vec = new Vec(0, 0);       // Changes all the time when panning the view
    public commitViewPositionScreenCoords: Vec = new Vec(0, 0);        // Does not change until finished panning the view
    public startDragScreenPosition: Vec | null = null;
    
    public zoomLevel: number = 1.0;   // 1.0 is unzoomed, larger values are more zoomed-in.

    public screenToCellCoords(screenXY: Vec): Vec
    {
        // perform transformation from screen to cell coordinates, considering panning and zoomed grid cell width
        return screenXY.add(this.dynamicViewPositionScreenCoords).divide(this.cellWidth);
    }
    public cellToScreenCoords(cellXY: Vec): Vec
    {
        // perform transformation from cell to screen coordinates, considering panning and zoomed grid cell width
        return cellXY.multiply(this.cellWidth).subtract(this.dynamicViewPositionScreenCoords);
    }
}
