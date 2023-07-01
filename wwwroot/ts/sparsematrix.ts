import { Vec } from "./vec";
import { Brush } from "./brush";

export type SparseMatrix = Map<number, Set<number>>;

export class SparseMatrixGrid
{
    public data: SparseMatrix;
    public viewPos: Vec;

    constructor() {
        this.data = new Map();
        this.viewPos = new Vec(0, 0);
    }

    public userClickCell(x: number, y: number, gridSize: Vec, brush: Brush)
    {
        // perform transformation from screen to cell coordinates, considering panning, zoom, and grid cell width
    }
}
