import { Renderer } from './renderer';
import { LifeCell } from './lifecell';
import { GameRules } from './gamerules';
import { FiniteGrid } from './finitegrid';
import { SparseMatrixGrid } from './sparsematrix';
import { Vec } from './vec';
import { Brush } from './brush';
import { View } from './view';

const borderWidth: number = 0.2;
const historyLength: number = 15;

let timestepMs: number = 125;
let cursorCellPos: Vec | null;
let defaultGridWidth = 24;
let defaultGridHeight = 24;
let sparseMatrixSize = new Vec(5000,5000);
let startDragMousePosScreen: Vec | null = null;

// brush
let brush: Brush | null = null;

let canvas: HTMLCanvasElement | null = document.getElementById("my_canvas") as HTMLCanvasElement;
let lastUpdateTime: number = 0;
let pause: boolean = true;
let showGrid: boolean = true;
let dynamicView: View = new View();     // Changes all the time when panning
let committedView: View = new View();   // Does not change until finished panning

let grid: FiniteGrid | SparseMatrixGrid = new FiniteGrid(new Vec(defaultGridWidth, defaultGridHeight), historyLength);
//let grid: FiniteGrid | SparseMatrixGrid = new SparseMatrixGrid();

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
    
    let canvasSize = new Vec(canvas.width, canvas.height);
    if (grid instanceof FiniteGrid)
    {
        committedView.positionInScreenCoords = grid.size.multiply(dynamicView.zoomLevel).subtract(canvasSize).divide(2);
        dynamicView = committedView.clone();
    }
    else
    {
        committedView.positionInScreenCoords = sparseMatrixSize.multiply(dynamicView.zoomLevel).subtract(canvasSize).divide(2);
        dynamicView = committedView.clone();
    }

    if (!gl) {
        alert('Your browser does not support WebGL');
    }
    else
    {
        let renderer = new Renderer(canvas, gl, borderWidth, showGrid);

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
            renderer = new Renderer(canvas, gl, borderWidth, showGrid);
            renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
        }

        function animate(timestamp: any): void {
            if (pause)
            {
                renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
                return;
            }
            let elapsedTime: number = timestamp - lastUpdateTime;
            if (elapsedTime >= timestepMs) {
                lastUpdateTime = timestamp;
                GameRules.update(grid);
            }
    
            renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            requestAnimationFrame(animate);
        }
        
        document.addEventListener('keydown', function(event) {
            if (event.code === 'Space') {
                event.preventDefault();
                pause = !pause;
                const pauseButton = document.getElementById('pause-button');
                if (pauseButton)
                    pauseButton.textContent = pause ? '▶️' : '⏸️';
                if (!pause)
                    requestAnimationFrame(animate);
            }

            if (event.code === 'KeyR') {
                if (grid instanceof FiniteGrid)
                    grid = new FiniteGrid(grid.size, historyLength);
                else if (grid instanceof SparseMatrixGrid)
                    grid = new SparseMatrixGrid;
            
                renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            }
        });

        document.addEventListener('wheel', function(event) {
            if (!canvas || !gl)
                return;
            if (startDragMousePosScreen)
                return;

            let oldZoomLevel = dynamicView.zoomLevel;
            let uncropped = dynamicView.zoomLevel * (event.deltaY < 0 ? 1.25 : 0.8);
            dynamicView.zoomLevel = Math.min(Math.max(uncropped, View.MIN_ZOOM), View.MAX_ZOOM);
            let scaleFactor = dynamicView.zoomLevel / oldZoomLevel;

            let rect = canvas.getBoundingClientRect();
            let mousePos = new Vec(event.clientX - rect.left, event.clientY - rect.top);

            // This originally used a grid position, and subtracted the mousePos, applied a transformation, and then re-added it.
            // To turn grid pos into view pos, things are negated while applying the mouse translations.
            let viewPosRelativeToMouse = dynamicView.positionInScreenCoords.negative().subtract(mousePos);
            let scaled = viewPosRelativeToMouse.multiply(scaleFactor);
            
            committedView.positionInScreenCoords = scaled.add(mousePos).negative();
            dynamicView = committedView.clone();

            // if mouse is positioned inside the grid, move dynamicViewPosition towards the cursor if zooming in, away from cursor if zooming out.
            renderer = new Renderer(canvas, gl, borderWidth, showGrid);
            renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
        });

        if (canvas) {
            window.addEventListener('mousemove', function(event) {
                if (!canvas)
                    return;
                
                let rect = canvas.getBoundingClientRect();
                let mousePosScreen = new Vec(event.clientX - rect.left, event.clientY - rect.top);
                cursorCellPos = dynamicView.screenToCellCoords(mousePosScreen).floor();

                if ( startDragMousePosScreen )
                    dynamicView.positionInScreenCoords = committedView.positionInScreenCoords.add( startDragMousePosScreen ).subtract( mousePosScreen );

                renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            });
        }

        if (canvas) {
            canvas.addEventListener('mousedown', function(event) {
                if (!canvas)
                    return;
                    
                let rect = canvas.getBoundingClientRect();
                let mousePos = new Vec(event.clientX - rect.left, event.clientY - rect.top);

                if (event.button === 0)         // Left mouse button
                {
                    let cellCoords = dynamicView.screenToCellCoords(mousePos).floor();
                    if (grid instanceof FiniteGrid)
                    {
                        grid.userClickCell(cellCoords, grid.size, brush);
                    }
                    else
                    {
                        // TODO
                    }
                }
                else if (event.button === 2)    // Right mouse button
                {
                    startDragMousePosScreen = mousePos.clone();
                }

                renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            });
            canvas.addEventListener('mouseup', function(event) {
                if (!canvas)
                    return;

                if (event.button === 2)         // Right mouse button
                {
                    if (startDragMousePosScreen)
                    {
                        let rect = canvas.getBoundingClientRect();
                        let mousePos = new Vec(event.clientX - rect.left, event.clientY - rect.top);

                        committedView.positionInScreenCoords = committedView.positionInScreenCoords.add(startDragMousePosScreen).subtract(mousePos);
                        dynamicView = committedView.clone();
                        startDragMousePosScreen = null;
                    }
                }
            });
        }

        if (canvas) {
            canvas.addEventListener('contextmenu', function(event) {
                event.preventDefault();
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            const resetButton = document.getElementById('reset-button');
            const pauseButton = document.getElementById('pause-button');
            const timestepLabel = document.getElementById('timestep-label') as HTMLSpanElement;
            const gridWidthLabel = document.getElementById('grid-width-label') as HTMLSpanElement;
            const gridHeightLabel = document.getElementById('grid-height-label') as HTMLSpanElement;
            const showGridLabel = document.getElementById('show-grid-label') as HTMLSpanElement;
            const detectOscillationsLabel = document.getElementById('detect-oscillations-label') as HTMLSpanElement;
            const survivalRulesLabel = document.getElementById('survival-rules-label') as HTMLSpanElement;
            const birthRulesLabel = document.getElementById('birth-rules-label') as HTMLSpanElement;
            const timestepEdit = document.getElementById('timestep-edit') as HTMLInputElement;
            const gridWidthEdit = document.getElementById('grid-width-edit') as HTMLInputElement;
            const gridHeightEdit = document.getElementById('grid-height-edit') as HTMLInputElement;
            const showGridCheckBox = document.getElementById('show-grid-checkbox') as HTMLInputElement;
            const detectOscillationsCheckBox = document.getElementById('detect-oscillations-checkbox') as HTMLInputElement;
            const survivalRulesEdit = document.getElementById('survival-rules-edit') as HTMLInputElement;
            const birthRulesEdit = document.getElementById('birth-rules-edit') as HTMLInputElement;
            const lexiconLabel = document.getElementById('lexicon-input-label') as HTMLSpanElement;
            const lexiconTextArea = document.getElementById('lexicon-input-textarea') as HTMLTextAreaElement;
            const tooltip = document.getElementById('tooltip');
        
            if (resetButton == null || pauseButton == null || timestepEdit == null || showGridCheckBox == null || tooltip == null)
                return;

            function addTooltipToElements(elements: HTMLElement[], tooltipText: string) {
                if (!tooltip)
                    return;

                elements.forEach(element => {
                    if (element)
                    {
                        element.addEventListener('mousemove', (event) => {
                            tooltip.style.display = 'block';
                            tooltip.textContent = tooltipText;
                            tooltip.style.left = (event.pageX + 10) + 'px';
                            tooltip.style.top = (event.pageY + 10) + 'px';
                        });
                
                        element.addEventListener('mouseleave', () => {
                            tooltip.style.display = 'none';
                        });
                    }
                });
            }

            addTooltipToElements([showGridLabel, showGridCheckBox], 'Show gridlines');

            showGridCheckBox.addEventListener('click', () => {
                showGrid = showGridCheckBox.checked;
                 renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            });

            addTooltipToElements([timestepLabel, timestepEdit], 'Timestep in milliseconds (1-1000)');

            timestepEdit.addEventListener('input', () => {
                const value = timestepEdit.value;
                const numericValue = parseInt(value, 10);

                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                }

                if (numericValue >= 1 && numericValue <= 1000) {
                    timestepMs = numericValue;
                    console.log(`timestepMs has been set to: ${timestepMs}`);
                } else {
                    console.log('Value must be between 1 and 1000 inclusive');
                }
            });

            addTooltipToElements([gridWidthLabel, gridWidthEdit], 'Grid width measured in cells (1-1000)');

            gridWidthEdit.addEventListener('input', () => {
                if (grid instanceof SparseMatrixGrid)
                    return;

                const value = gridWidthEdit.value;
                const numericValue = parseInt(value, 10);
                
                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                    return;
                }

                if (numericValue < 3 || numericValue > 1000) {
                    console.log('Value must be between 3 and 1000 inclusive');
                    return;
                }

                let newSize = new Vec(numericValue, grid.size.y);
                console.log(`gridWidth has been set to: ${newSize.x}`);

                grid = new FiniteGrid(newSize, historyLength);
                if (canvas && gl)
                    renderer = new Renderer(canvas, gl, borderWidth, showGrid);
                renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            });

            addTooltipToElements([gridHeightLabel, gridHeightEdit], 'Grid height measured in cells (1-1000)');

            gridHeightEdit.addEventListener('input', () => {
                if (grid instanceof SparseMatrixGrid)
                    return;

                const value = gridHeightEdit.value;
                const numericValue = parseInt(value, 10);
                
                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                }

                if (numericValue < 3 || numericValue > 1000) {
                    console.log('Value must be between 3 and 1000 inclusive');
                    return;
                }

                let newSize = new Vec(grid.size.x, numericValue);
                console.log(`gridHeight has been set to: ${newSize.y}`);

                grid = new FiniteGrid(newSize, historyLength);
                if (canvas && gl)
                    renderer = new Renderer(canvas, gl, borderWidth, showGrid);
                renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            });

            addTooltipToElements([detectOscillationsLabel, detectOscillationsCheckBox], 'Detect and highlight oscillations. Period 2 = red, 3 = blue, 5 = green, 6 = purple');

            detectOscillationsCheckBox.addEventListener('click', () => {
                GameRules.detectOscillations = detectOscillationsCheckBox.checked;
                 renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            });

            addTooltipToElements([survivalRulesLabel, survivalRulesEdit],
                'Comma-separated list of numbers. If a live cell has N neighbours and N is listed here, it stays alive, eg. Game of Life is "2,3"');

            survivalRulesEdit.addEventListener('input', () => {
                const value = survivalRulesEdit.value;
            
                GameRules.surviveConditions = [false, false, false, false, false, false, false, false, false];
            
                const numbers = value.split(',');
                for (let numStr of numbers) {
                    let num = parseInt(numStr, 10);
            
                    if (!isNaN(num) && num < 9) {
                        GameRules.surviveConditions[num] = true;
                    }
                }
            });

            addTooltipToElements([birthRulesLabel, birthRulesEdit],
                'Comma-separated list of numbers. If a dead cell has N neighbours and N is listed here, it is activated, eg. Game of Life is "3"');

            birthRulesEdit.addEventListener('input', () => {
                const value = birthRulesEdit.value;
            
                GameRules.birthConditions = [false, false, false, false, false, false, false, false, false];
            
                const numbers = value.split(',');
                for (let numStr of numbers) {
                    let num = parseInt(numStr, 10);
            
                    if (!isNaN(num) && num < 9) {
                        GameRules.birthConditions[num] = true;
                    }
                }
            });

            addTooltipToElements([resetButton], 'Reset (R key on non-mobile devices)');
        
            resetButton.addEventListener('click', () => {
                if (grid instanceof FiniteGrid)
                    grid = new FiniteGrid(grid.size, historyLength);
                else if (grid instanceof SparseMatrixGrid)
                    grid = new SparseMatrixGrid;
            
                renderer.draw(canvas, grid, dynamicView, cursorCellPos, brush, GameRules.detectOscillations);
            });
        
            addTooltipToElements([pauseButton], 'Play/pause (spacebar on non-mobile devices)');
        
            pauseButton.addEventListener('click', () => {
                pause = !pause;
                pauseButton.textContent = pause ? '▶️' : '⏸️';
                if (!pause)
                    requestAnimationFrame(animate);
            });

            addTooltipToElements([lexiconLabel, lexiconTextArea], 'Warning: Overwrites grid contents; requires grid dimensions to be sufficient for input. Copy-paste patterns from https://conwaylife.com/ref/lexicon/lex.htm');

            lexiconTextArea.addEventListener('input', (event) => {
                let inputText = lexiconTextArea.value;
                
                // Remove all '\t' characters from the input
                inputText = inputText.replace(/\t/g, '');

                if (inputText.length === 0)
                {
                    brush = null;
                    return;
                }

                // Validate input to contain only 'O' and '.'
                if (!/^[\n\.O]*$/.test(inputText)) {
                    console.log('unwanted characters detected');
                    brush = null;
                    return;
                }
            
                // Split the input into lines
                const lines = inputText.split('\n');
            
                var pattern = lines.map(line => {
                    return line.split('').map(char => char === 'O');
                });
                var size = new Vec(pattern.length, (pattern[0] || []).length);
                brush = new Brush(pattern, size);
            });
        });
        
        requestAnimationFrame(animate);
    }
}
