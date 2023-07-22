import { Vec } from "./vec";

export class Brush {
    public pattern: boolean[][];
    public size: Vec;
    
    constructor(pattern: boolean[][], size: Vec) {
        this.pattern = pattern;
        this.size = size;
    }
}