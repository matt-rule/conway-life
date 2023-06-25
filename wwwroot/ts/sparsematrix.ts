
export type SparseMatrix = Map<number, Set<number>>;

export type Vec = {
    x: number;
    y: number;
}

export class SparseMatrixGrid
{
    public data: SparseMatrix;
    public viewPos: Vec;

    constructor() {
        this.data = new Map();
        this.viewPos = { x: 0, y: 0 };
    }

    public userClickCell(x: number, y: number, gridWidth: number, gridHeight: number, brush: boolean[][] | null,
        brushWidth: number, brushHeight: number)
    {

    }
}
