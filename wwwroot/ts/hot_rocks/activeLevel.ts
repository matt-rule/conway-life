import * as Constants from "./constants";
import { Key, KeyboardState } from "./keyboardState";
import { vec2 } from "gl-matrix";

export enum CharacterFacing { Left, Right };
export enum CollisionOutcome { None, Collision, Victory }
export enum LevelResetCause { Start, Death, Victory }

export class ActiveLevel {
    public mcPosition: vec2 = vec2.fromValues(0, 0);
    public mcVelocity: vec2 = vec2.fromValues(0, 0);

    public mcRunning: boolean = false;

    public lavaHeight: number = 0;
    public facing: CharacterFacing = CharacterFacing.Left;
    public blockData: number[][];

    constructor (levelBlockData: number[][]) {
        this.resetLevel(levelBlockData, LevelResetCause.Start);
        this.blockData = levelBlockData;
    }

    public getStartingPosition(levelBlockData: number[][])
    {
        for ( let tileX: number = 0; tileX < Constants.LEVEL_WIDTH; ++tileX )
            for ( let tileY: number = 0; tileY <= Constants.LEVEL_HEIGHT; ++tileY )
                if ( levelBlockData[tileX][tileY] == Constants.TILE_ID_FLAG_WHITE )
                {
                    return vec2.fromValues(
                        tileX * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5 - Constants.SPRITE_SUIT_SIZE / 2,
                        (tileY + 0.05) * Constants.TILE_SIZE
                    );
                }
        return vec2.fromValues(256, 256);
    }

    public resetLevel(levelBlockData: number[][], resetCause: LevelResetCause)
    {
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

        this.mcPosition = this.getStartingPosition(levelBlockData);
    }

    public processPlayerMovement(prevKeyState: KeyboardState, keyState: KeyboardState, elapsedTime: number)
    {
        let newPosition: vec2 = this.mcPosition;

        let moveLeft: boolean = keyState.isKeyDown(Key.Left) || keyState.isKeyDown(Key.A);
        let moveRight: boolean = keyState.isKeyDown(Key.Right) || keyState.isKeyDown(Key.D);

        if (moveLeft && !moveRight)
        {
            this.mcRunning = true;
            newPosition[0] -= Constants.CHARACTER_MOVE_SPEED * elapsedTime;
            this.facing = CharacterFacing.Left;
        }
        else if (moveRight && !moveLeft)
        {
            this.mcRunning = true;
            newPosition[0] += Constants.CHARACTER_MOVE_SPEED * elapsedTime;
            this.facing = CharacterFacing.Right;
        }
        else
        {
            this.mcRunning = false;
        }
        // if ((keyState.isKeyDown(Key.Space) || keyState.isKeyDown(Key.W)) && !(prevKeyState.isKeyDown(Key.Space) || keyState.isKeyDown(Key.W)))
        // {
        //     if (McGrounded)
        //     {
        //         McGrounded = false;
        //         McVelocity.Y += Constants.JUMP_SPEED;
        //     }
        // }

        // CollisionOutcome outcome = IsIntersectionWithLevel(newPosition.X, newPosition.Y);
        // switch (outcome)
        // {
        //     case CollisionOutcome.None:
        //         McPosition = newPosition;
        //         break;
        //     case CollisionOutcome.Victory:
        //         ResetLevel(LevelResetCause.Victory);
        //         return;
        //     default:
        //         break;
        // }
        
        newPosition = this.mcPosition;

        // collisions - process Y
        // this.mcVelocity[1] -= Constants.GRAVITY * elapsedTime;
        // newPosition[1] += this.mcVelocity[1] * elapsedTime;
    }

    public update(prevKeyState: KeyboardState, keyState: KeyboardState, elapsedTime: number)
    {
        this.processPlayerMovement(prevKeyState, keyState, elapsedTime);
    }
}
