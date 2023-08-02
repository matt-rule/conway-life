import { Renderer } from "./renderer";
import { vec2 } from "gl-matrix";

const SQUARE_SPEED: number = 60;

export class Game {
    // Define members (properties)
    public canvas: HTMLCanvasElement;
    public renderer: Renderer;
    public lastUpdateTime: number;
    public squarePosition: vec2;
    
    // Define a constructor
    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;
        this.renderer = new Renderer();
        this.lastUpdateTime = 0;
        this.squarePosition = vec2.fromValues(200, 100);
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.canvas.style.maxWidth = `${window.innerWidth}px`;
        this.canvas.style.maxHeight = `${window.innerHeight}px`;
        let gl: WebGL2RenderingContext | null = this.canvas.getContext("webgl2");
        if (gl) {
            this.renderer.init(gl, this.canvas.width, this.canvas.height);
        }
        else {
            alert('Your browser does not support webgl2');
        }
    }

    update() {

    }    
}

let canvas: HTMLCanvasElement | null = document.getElementById("canvas") as HTMLCanvasElement;
if (canvas) {
    let game : Game = new Game(canvas);
    game.init();

    function animate(time: number) {
        if (game.lastUpdateTime == 0) {
            game.lastUpdateTime = time;
            requestAnimationFrame(animate);
            return;    
        }

        let deltaTime = time - game.lastUpdateTime; // time since last frame in milliseconds
        game.lastUpdateTime = time;
    
        // convert deltaTime to seconds
        deltaTime /= 1000;
    
        // update position based on speed and time
        game.squarePosition[0] += SQUARE_SPEED * deltaTime;

        game.renderer.draw(game.squarePosition);
    
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}
