import { LifeCell } from './lifecell';

const historyLength: number = 15;

export class GameRules {
    public static surviveConditions: boolean[] = [false,false,true,true,false,false,false,false,false];
    public static birthConditions: boolean[] = [false,false,false,true,false,false,false,false,false];
    public static detectOscillations : boolean = true;
    public static currentFrame: number = 0;
    public static gridWidth: number = 40;
    public static gridHeight: number = 30;
    public static history: boolean[][][] = this.createHistory();

    public static createHistory(): boolean[][][] {
        const result: boolean[][][] = new Array(this.gridWidth);
        for (let x = 0; x < this.gridWidth; x++) {
            result[x] = new Array(this.gridHeight);
            for (let y = 0; y < this.gridHeight; y++) {
                result[x][y] = new Array(historyLength).fill(false);
            }
        }
        return result;
    }

    private static wrap(x : number, y : number) {
        return (x + y) % y;
    }

    public static countRepeatingPattern(arr : boolean[], patternLen : number) : number {
        if (patternLen <= 0 || patternLen > arr.length) {
            return 0;
        }
        
        const pattern = arr.slice(0, patternLen);

        if (pattern.every(value => value === false))
            return 0;
        
        let count = 0;
        let patternIndex = 0;
        
        // Loop through the array to see how many times pattern repeats consecutively
        for (let i = patternLen; i < arr.length; i++) {
            if (arr[i] === pattern[patternIndex]) {
                patternIndex = (patternIndex + 1) % patternLen;
                if (patternIndex === patternLen-1) {
                    count++;
                }
            } else {
                break;
            }
        }

        return count;
    }

    public static update(frames: LifeCell[][][]) {
        let thisFrame: LifeCell[][] = frames[this.currentFrame];
        let nextFrame: LifeCell[][] = frames[(this.currentFrame+1) % 2];

        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                let liveNeighbors = 0;

                // Calculate the number of live neighbors
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx !== 0 || dy !== 0) {
                            let nx = this.wrap(x + dx, this.gridWidth);
                            let ny = this.wrap(y + dy, this.gridHeight);

                            if (thisFrame[nx][ny].active) {
                                liveNeighbors++;
                            }
                        }
                    }
                }

                let active: boolean = false;
                if (thisFrame[x][y].active && !this.surviveConditions[liveNeighbors]) {
                    active = false;
                } else if (!thisFrame[x][y].active && this.birthConditions[liveNeighbors]) {
                    active = true;
                } else {
                    active = thisFrame[x][y].active;
                }
                nextFrame[x][y].active = active;

                if (this.detectOscillations)
                {
                    //Treat history as a queue, remove from end and add to beginning
                    let thisCellHistory = this.history[x][y];
                    thisCellHistory.pop();
                    thisCellHistory.unshift(active);
    
                    let r_repeats = this.countRepeatingPattern(thisCellHistory, 2);
                    let g_repeats = this.countRepeatingPattern(thisCellHistory, 5);
                    let b_repeats = this.countRepeatingPattern(thisCellHistory, 3);
    
                    let r = (1.0 / 6) * r_repeats;    // floor(15/2) - 1
                    let g = (1.0 / 2) * g_repeats;    // 15/5 - 1
                    let b = (1.0 / 4) * b_repeats;    // 15/3 - 1
    
                    if (r_repeats<3 && b_repeats<2)
                    {
                        let repeats_6 = this.countRepeatingPattern(thisCellHistory, 6);
                        let val_6 = (1.0 / 2) * repeats_6;
                        r = val_6;
                        b = val_6;
                    }
    
                    nextFrame[x][y].color = [r,g,b];
                }
            }
        }

        this.currentFrame = (this.currentFrame+1) % 2;
    }
}
