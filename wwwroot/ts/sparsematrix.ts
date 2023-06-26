import { Vec } from "./vec";

export type SparseMatrix = Map<number, Set<number>>;

export class SparseMatrixGrid
{
    public data: SparseMatrix;
    public viewPos: Vec;

    constructor() {
        this.data = new Map();
        this.viewPos = new Vec(0, 0);
    }

    public userClickCell(x: number, y: number, gridWidth: number, gridHeight: number, brush: boolean[][] | null,
        brushWidth: number, brushHeight: number)
    {

    }
}
