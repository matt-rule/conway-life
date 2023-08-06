import * as Constants from "./constants";
import { vec2 } from "gl-matrix";

export enum CharacterFacing { Left, Right };
export enum CollisionOutcome { None, Collision, Victory }
export enum LevelResetCause { Start, Death, Victory }

export class ActiveLevel {
    public mcPosition: vec2 = vec2.fromValues(0, 0);

    constructor () {
        this.resetLevel(LevelResetCause.Start);
    }

    public resetLevel(resetCause: LevelResetCause)
    {
        this.mcPosition = vec2.fromValues(200, 100);
        

        // if (resetCause == LevelResetCause.Start)
        //     this.levelNumber = 1;
        // else if (resetCause == LevelResetCause.Victory)
        // {
        //     ++this.levelNumber;
        //     if (LevelNumber == 5)
        //     {
        //         GameWon = true;
        //         return;
        //     }
        // }
    }
}
