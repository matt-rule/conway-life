import { MouseWheelMovement, Renderer } from './renderer';

const borderWidth: number = 0.2;

let timestepMs: number = 125;

let canvas: HTMLCanvasElement | null = document.getElementById("my_canvas") as HTMLCanvasElement;
let lastUpdateTime: number = 0;
let pause: boolean = true;

function infoMenuMouseDown() {
    let menuContainer = document.getElementById("hideable-info-menu-content-container");
    if (!menuContainer)
        return;

    menuContainer.classList.toggle('hidden');
}

let infoMenuButton = document.getElementById("info-menu-div");
if (infoMenuButton) {
    infoMenuButton.addEventListener('mousedown', infoMenuMouseDown);
}

if (!canvas) {
    alert('Canvas element not found');
}
else
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    canvas.style.maxWidth = `${window.innerWidth}px`;
    canvas.style.maxHeight = `${window.innerHeight}px`;
    let gl: WebGL2RenderingContext | null = canvas.getContext("webgl2");

    if (!gl) {
        alert('Your browser does not support WebGL');
    }
    else
    {
        let renderer = new Renderer(canvas, gl, borderWidth, true);

        canvas.addEventListener('mousedown', function(event) {
            if (!canvas)
                return;

            if (event.button === 0 || event.button === 1)         // Left or middle mouse button
            {
                renderer.processMouseDown(event.clientX, event.clientY);
                renderer.draw(canvas);
            }
        });

        canvas.addEventListener('mouseup', function(event) {
            if (!canvas)
                return;

            if (event.button === 0 || event.button === 1)         // Left or middle mouse button
            {
                renderer.processMouseUp(event.clientX, event.clientY);
                renderer.draw(canvas);
            }
        });

        canvas.addEventListener('mousemove', function(event) {
            if (!canvas)
                return;

            renderer.processMouseMove(event.clientX, event.clientY);
            renderer.draw(canvas);
        });

        document.addEventListener('wheel', function(event) {
            let direction : MouseWheelMovement = event.deltaY < 0 ? MouseWheelMovement.Up : MouseWheelMovement.Down;
            renderer.processZoom(event.clientX, event.clientY, direction);
            renderer.draw(canvas);
        });

        function resizeCanvas(width: number, height: number): void {
            if (!canvas)
                return;
    
            renderer.cleanup();
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.style.maxWidth = `${width}px`;
            canvas.style.maxHeight = `${height}px`;
            gl = canvas.getContext("webgl2");
            if (!gl) {
                return;
            }
            renderer = new Renderer(canvas, gl, borderWidth, renderer.showGrid);
            renderer.draw(canvas);
        }

        function animate(timestamp: any): void {
            if (pause)
            {
                renderer.draw(canvas);
                return;
            }
            let elapsedTime: number = timestamp - lastUpdateTime;
            if (elapsedTime >= timestepMs) {
                lastUpdateTime = timestamp;
            }
    
            renderer.draw(canvas);
            requestAnimationFrame(animate);
        }
        
        if (canvas) {
            canvas.addEventListener('contextmenu', function(event) {
                event.preventDefault();
            });
        }
        
        requestAnimationFrame(animate);
    }
}
