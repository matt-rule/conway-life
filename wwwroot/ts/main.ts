import { Renderer } from './renderer';
import { LifeCell } from './lifecell';
import { GameRules } from './gamerules';
import { GameState } from './gamestate';
import { FiniteGrid } from './finitegrid';
import { SparseMatrixGrid } from './sparsematrix';

const borderWidth: number = 3;
const historyLength: number = 15;

let minZoom: number = 0.1;
let maxZoom: number = 10;
let unzoomedCellWidth: number = 20;
let cellWidth: number = 20;
let timestepMs: number = 125;

// cursor
let cursorCellX: number = -1;
let cursorCellY: number = -1;

// brush
let brush: boolean[][] | null = null;
let brushWidth: number = 0;
let brushHeight: number = 0;

let canvas: HTMLCanvasElement | null = document.getElementById("my_canvas") as HTMLCanvasElement;
let lastUpdateTime: number = 0;
let pause: boolean = true;
let showGrid: boolean = true;

let grid: FiniteGrid | SparseMatrixGrid = new FiniteGrid(GameState.gridWidth, GameState.gridHeight, historyLength);
//let grid: FiniteGrid | SparseMatrixGrid = new SparseMatrixGrid;

if (!canvas) {
    alert('Canvas element not found');
}
else
{
    canvas.width = cellWidth*GameState.gridWidth;
    canvas.height = cellWidth*GameState.gridHeight;
    canvas.style.width = `${cellWidth*GameState.gridWidth}px`;
    canvas.style.height = `${cellWidth*GameState.gridHeight}px`;
    canvas.style.maxWidth = `${cellWidth*GameState.gridWidth}px`;
    canvas.style.maxHeight = `${cellWidth*GameState.gridHeight}px`;
    let gl : WebGL2RenderingContext | null = canvas.getContext("webgl2");

    if (!gl) {
        alert('Your browser does not support WebGL');
    }
    else
    {
        let renderer = new Renderer(canvas, gl, cellWidth, borderWidth, showGrid, 1.0);

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
            renderer = new Renderer(canvas, gl, cellWidth, borderWidth, showGrid, renderer.zoomLevel);
            renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
        }

        function animate(timestamp : any): void {
            if (pause)
            {
                 renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
                return;
            }
            let elapsedTime : number = timestamp - lastUpdateTime;
            if (elapsedTime >= timestepMs) {
                lastUpdateTime = timestamp;
                GameRules.update(grid);
            }
    
             renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
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
                    grid = new FiniteGrid(GameState.gridWidth, GameState.gridHeight, historyLength);
                else if (grid instanceof SparseMatrixGrid)
                    grid = new SparseMatrixGrid;
            
                renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
            }
        });

        document.addEventListener('wheel', function(event) {
            let uncropped = renderer.zoomLevel + (event.deltaY < 0 ? 0.1 : -0.1);
            renderer.zoomLevel = Math.min(Math.max(uncropped, minZoom), maxZoom);

            cellWidth = unzoomedCellWidth * renderer.zoomLevel;
            resizeCanvas(cellWidth*GameState.gridWidth, cellWidth*GameState.gridHeight);
        });

        if (canvas) {
            window.addEventListener('mousemove', function(event) {
                if (!canvas)
                    return;
                
                let rect = canvas.getBoundingClientRect();
                let mouseX = event.clientX - rect.left;
                let mouseY = event.clientY - rect.top;

                cursorCellX = Math.floor(mouseX / cellWidth);
                cursorCellY = Math.floor(mouseY / cellWidth);

                renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
            });
        }

        if (canvas) {
            canvas.addEventListener('mousedown', function(event) {
                if (!canvas)
                    return;
                    
                let rect = canvas.getBoundingClientRect();
                let mouseX = event.clientX - rect.left;
                let mouseY = event.clientY - rect.top;

                let cellX = Math.floor(mouseX / cellWidth);
                let cellY = Math.floor(mouseY / cellWidth);

                if (event.button === 0)           // Left mouse button
                    grid.userClickCell(cellX, cellY, GameState.gridWidth, GameState.gridHeight, brush, brushWidth, brushHeight);

                renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
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

            function addTooltipToElements(elements : HTMLElement[], tooltipText : string) {
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
                 renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
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
                const value = gridWidthEdit.value;
                const numericValue = parseInt(value, 10);
                
                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                }

                if (numericValue >= 3 && numericValue <= 1000) {
                    GameState.gridWidth = numericValue;
                    console.log(`gridWidth has been set to: ${GameState.gridWidth}`);
                } else {
                    console.log('Value must be between 3 and 1000 inclusive');
                }

                grid = new FiniteGrid(GameState.gridWidth, GameState.gridHeight, historyLength);
                resizeCanvas(cellWidth*GameState.gridWidth, cellWidth*GameState.gridHeight);
            });

            addTooltipToElements([gridHeightLabel, gridHeightEdit], 'Grid height measured in cells (1-1000)');

            gridHeightEdit.addEventListener('input', () => {
                const value = gridHeightEdit.value;
                const numericValue = parseInt(value, 10);
                
                if (isNaN(numericValue)) {
                    console.log('Please enter a numeric value');
                }

                if (numericValue >= 3 && numericValue <= 1000) {
                    GameState.gridHeight = numericValue;
                    console.log(`gridHeight has been set to: ${GameState.gridHeight}`);
                } else {
                    console.log('Value must be between 3 and 1000 inclusive');
                }

                grid = new FiniteGrid(GameState.gridWidth, GameState.gridHeight, historyLength);
                resizeCanvas(cellWidth*GameState.gridWidth, cellWidth*GameState.gridHeight);
            });

            addTooltipToElements([detectOscillationsLabel, detectOscillationsCheckBox], 'Detect and highlight oscillations. Period 2 = red, 3 = blue, 5 = green, 6 = purple');

            detectOscillationsCheckBox.addEventListener('click', () => {
                GameRules.detectOscillations = detectOscillationsCheckBox.checked;
                 renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
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
                    grid = new FiniteGrid(GameState.gridWidth, GameState.gridHeight, historyLength);
                else if (grid instanceof SparseMatrixGrid)
                    grid = new SparseMatrixGrid;
            
                renderer.draw(grid, cursorCellX, cursorCellY, brush, brushWidth, brushHeight, GameRules.detectOscillations);
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
            
                brush = lines.map(line => {
                    return line.split('').map(char => char === 'O');
                });
                brushWidth = brush.length;
                brushHeight = (brush[0] || []).length;

            });
        });
        
        requestAnimationFrame(animate);
    }
}
