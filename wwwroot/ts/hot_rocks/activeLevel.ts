import * as Constants from "./constants";
import { vec2 } from "gl-matrix";

export class ActiveLevel {
    public gameWon: boolean;
    public mcPosition: vec2;

    constructor ( gameWon: boolean, mcPosition: vec2 ) {
        this.gameWon = gameWon;
        this.mcPosition = mcPosition;
    }
}
