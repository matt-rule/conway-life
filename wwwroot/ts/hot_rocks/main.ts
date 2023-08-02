import { Renderer } from "./renderer"; 

export class Game {
    // Define members (properties)
    public canvas: HTMLCanvasElement;
    public renderer: Renderer;
    
    // Define a constructor
    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;
        this.renderer = new Renderer();
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
    game.renderer.draw();
}
