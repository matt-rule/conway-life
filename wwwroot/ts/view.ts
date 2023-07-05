import { Vec } from "./vec";

export class View
{
    public static readonly MIN_ZOOM: number = 2;
    public static readonly MAX_ZOOM: number = 200;
    public static readonly DEFAULT_ZOOM: number = 20;

    public zoomLevel: number = View.DEFAULT_ZOOM;
    public dynamicViewPositionScreenCoords: Vec = new Vec(0, 0);       // Changes all the time when panning the view
    public commitViewPositionScreenCoords: Vec = new Vec(0, 0);        // Does not change until finished panning the view
    public startDragScreenPosition: Vec | null = null;

    public screenToCellCoords(screenXY: Vec): Vec
    {
        // perform transformation from screen to cell coordinates, considering panning and zoomed grid cell width
        return screenXY.add(this.dynamicViewPositionScreenCoords).divide(this.zoomLevel);
    }
    public cellToScreenCoords(cellXY: Vec): Vec
    {
        // perform transformation from cell to screen coordinates, considering panning and zoomed grid cell width
        return cellXY.multiply(this.zoomLevel).subtract(this.dynamicViewPositionScreenCoords);
    }
}
