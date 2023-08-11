import { ActiveLevel } from "./activeLevel";
import * as Constants from "./constants";
import { Renderer, ImagesDictionary } from "./renderer";
import { Key, KeyboardState } from "./keyboardState";

export class Game {
    // Define members (properties)
    public canvas: HTMLCanvasElement;
    public renderer: Renderer;
    public lastUpdateTime: number;
    public gameWon: boolean;
    public latestKeyState: KeyboardState;
    public frameTimeCounterSecs: number;
    public loadedLevels: number[][][];
    public level: ActiveLevel | null;
    
    // Define a constructor
    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;
        this.renderer = new Renderer();
        this.lastUpdateTime = 0;
        this.gameWon = false;
        this.latestKeyState = new KeyboardState();
        this.frameTimeCounterSecs = 0;
        this.loadedLevels = [];
        this.level = null;
    }

    init( stillImages: ImagesDictionary, animatedImages: ImagesDictionary, loadedLevels: number[][][] ) {
        this.loadedLevels = loadedLevels;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.canvas.style.maxWidth = `${window.innerWidth}px`;
        this.canvas.style.maxHeight = `${window.innerHeight}px`;
        let gl: WebGL2RenderingContext | null = this.canvas.getContext("webgl2");

        this.level = new ActiveLevel(this.loadedLevels);
        if (gl) {
            this.renderer.init( gl, this.canvas.width, this.canvas.height, stillImages, animatedImages );
        }
        else {
            alert('Your browser does not support webgl2');
        }
    }

    onUpdateFrame( currentKeyState: KeyboardState, deltaTimeSecs: number ) {
        let intervalSecs: number = 1.0 / Constants.FPS;

        this.frameTimeCounterSecs += deltaTimeSecs;

        while (this.frameTimeCounterSecs > intervalSecs)
        {
            if (this.renderer && this.level)
            {
                let levelWon = this.level.update( this.gameWon, this.latestKeyState, currentKeyState, intervalSecs);
                if (levelWon && this.level.levelNumber == 5)
                {
                    this.gameWon = true;
                }
            }
            this.frameTimeCounterSecs -= intervalSecs;
        }

        this.latestKeyState = currentKeyState.clone();
    }    
}