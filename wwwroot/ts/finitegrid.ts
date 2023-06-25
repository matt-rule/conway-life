import { LifeCell } from './lifecell';

export class FiniteGrid {
    public frames: LifeCell[][][] = [];
    public history: boolean[][][] = [];
    public currentFrame: number = 0;
    
    constructor(gridWidth: number, gridHeight: number, historyLength: number) {
        this.frames.push(FiniteGrid.createGrid(gridWidth, gridHeight));
        this.frames.push(FiniteGrid.createGrid(gridWidth, gridHeight));
        this.history = FiniteGrid.createHistory(gridWidth, gridHeight, historyLength);
    }
    
    public static createGrid(gridWidth: number, gridHeight: number): LifeCell[][] {
        const result: LifeCell[][] = new Array(gridWidth);
        for (let x = 0; x < gridWidth; x++) {
            result[x] = new Array<LifeCell>(gridHeight);
    
            for (let y = 0; y < gridHeight; y++) {
                result[x][y] = {
                    active: false,
                    color: [0,0,0]
                };
            }
        }
        return result;
    }

    public static createHistory(gridWidth: number, gridHeight: number, historyLength: number): boolean[][][] {
        const result: boolean[][][] = new Array(gridWidth);
        for (let x = 0; x < gridWidth; x++) {
            result[x] = new Array(gridHeight);
            for (let y = 0; y < gridHeight; y++) {
                result[x][y] = new Array(historyLength).fill(false);
            }
        }
        return result;
    }
}
