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
        if (gl) {
            this.renderer.init( gl, loadedLevels[0], this.canvas.width, this.canvas.height, stillImages, animatedImages );
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
            if (this.renderer && this.renderer.level)
                this.renderer.level.update(this.latestKeyState, currentKeyState, intervalSecs);
            this.frameTimeCounterSecs -= intervalSecs;
        }

        this.latestKeyState = currentKeyState;
    }    
}