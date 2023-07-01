import { LifeCell } from './lifecell';
import { Vec } from './vec';
import { Brush } from './brush';

export class FiniteGrid {
    public size: Vec = new Vec(0, 0);
    public frames: LifeCell[][][] = [];
    public history: boolean[][][] = [];
    public currentFrame: number = 0;
    
    constructor(size: Vec, historyLength: number) {
        this.size = size;
        this.frames.push(FiniteGrid.createGrid(size.x, size.y));
        this.frames.push(FiniteGrid.createGrid(size.x, size.y));
        this.history = FiniteGrid.createHistory(size.x, size.y, historyLength);
    }

    public userClickCell(x: number, y: number, gridSize: Vec, brush: Brush | null)
    {
        let thisFrame: LifeCell[][] = this.frames[this.currentFrame];

        if (x >= 0 && x < this.size.x && y >= 0 && y < this.size.y) {
            if (!brush)
            {
                thisFrame[x][y].active = !thisFrame[x][y].active;
            }
            else
            {
                // Calculate offsets to center the brush around the cursor
                const offsetX = Math.floor(brush.size.x / 2);
                const offsetY = Math.floor(brush.size.y / 2);
        
                // Iterate through each cell in the brush
                for (let brushX = 0; brushX < brush.size.x; brushX++) {
                    for (let brushY = 0; brushY < brush.size.y; brushY++) {
                        // Calculate the corresponding grid position
                        const gridX = x - offsetX + brushX;
                        const gridY = y - offsetY + brushY;
        
                        // Check if the position is within the grid boundaries
                        if (gridX >= 0 && gridX < this.size.x && gridY >= 0 && gridY < this.size.y) {
                            // Place the brush cell on the grid
                            thisFrame[gridX][gridY].active = brush.pattern[brushX][brushY];
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
