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

    public userClickCell(x: number, y: number, gridWidth: number, gridHeight: number, brush: boolean[][] | null,
        brushWidth: number, brushHeight: number)
    {
        let thisFrame: LifeCell[][] = this.frames[this.currentFrame];

        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
            if (!brush)
            {
                thisFrame[x][y].active = !thisFrame[x][y].active;
            }
            else
            {
                // Calculate offsets to center the brush around the cursor
                const offsetX = Math.floor(brushWidth / 2);
                const offsetY = Math.floor(brushHeight / 2);
        
                // Iterate through each cell in the brush
                for (let brushX = 0; brushX < brushWidth; brushX++) {
                    for (let brushY = 0; brushY < brushHeight; brushY++) {
                        // Calculate the corresponding grid position
                        const gridX = x - offsetX + brushX;
                        const gridY = y - offsetY + brushY;
        
                        // Check if the position is within the grid boundaries
                        if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
                            // Place the brush cell on the grid
                            thisFrame[gridX][gridY].active = brush[brushX][brushY];
                        }
                    }
                }
            }
        }
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
