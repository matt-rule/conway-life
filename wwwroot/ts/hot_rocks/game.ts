import { Renderer, ImagesDictionary } from "./renderer";

export class Game {
    // Define members (properties)
    public canvas: HTMLCanvasElement;
    public renderer: Renderer;
    public lastUpdateTime: number;
    public gameWon: boolean;
    
    // Define a constructor
    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;
        this.renderer = new Renderer();
        this.lastUpdateTime = 0;
        this.gameWon = false;
    }

    init( stillImages: ImagesDictionary, animatedImages: ImagesDictionary ) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.canvas.style.maxWidth = `${window.innerWidth}px`;
        this.canvas.style.maxHeight = `${window.innerHeight}px`;
        let gl: WebGL2RenderingContext | null = this.canvas.getContext("webgl2");
        if (gl) {
            this.renderer.init( gl, this.canvas.width, this.canvas.height, stillImages, animatedImages );
        }
        else {
            alert('Your browser does not support webgl2');
        }
    }

    update() {

    }    
}