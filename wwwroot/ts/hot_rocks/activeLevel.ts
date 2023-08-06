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
