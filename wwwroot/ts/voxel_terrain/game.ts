import * as Constants from "./constants"
import { KeyboardState } from "../keyboardState";

export class Game
{
    public lastUpdateTime: number;
    public latestKeyState: KeyboardState;
    public frameTimeCounterSecs: number;
    public rotationAngle: number;

    constructor()
    {
        this.lastUpdateTime = 0;
        this.latestKeyState = new KeyboardState();
        this.frameTimeCounterSecs = 0;
        this.rotationAngle = 0;
    }

    onUpdateFrame( currentKeyState: KeyboardState, deltaTimeSecs: number ) {
        let intervalSecs: number = 1.0 / Constants.UPDATE_FPS;

        this.frameTimeCounterSecs += deltaTimeSecs;

        while (this.frameTimeCounterSecs > intervalSecs)
        {
            this.rotationAngle += intervalSecs;
            this.frameTimeCounterSecs -= intervalSecs;
        }

        this.latestKeyState = currentKeyState.clone();
    }   
}
