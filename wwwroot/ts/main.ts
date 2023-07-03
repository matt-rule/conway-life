import { Renderer } from './renderer';
import { LifeCell } from './lifecell';
import { GameRules } from './gamerules';
import { FiniteGrid } from './finitegrid';
import { SparseMatrixGrid } from './sparsematrix';
import { Vec } from './vec';
import { Brush } from './brush';
import { View } from './view';

const borderWidth: number = 3;
const historyLength: number = 15;

let timestepMs: number = 125;
let cursorCellPos: Vec | null;
let defaultGridWidth = 24;
let defaultGridHeight = 24;
let sparseMatrixSize = new Vec(5000,5000);

// brush
let brush: Brush | null = null;

let canvas: HTMLCanvasElement | null = document.getElementById("my_canvas") as HTMLCanvasElement;
let lastUpdateTime: number = 0;
let pause: boolean = true;
let showGrid: boolean = true;
let view: View = new View();

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
        view.setCommitGridPosition(canvasSize.subtract(grid.size.multiply(view.cellWidth)).divide(2));
        view.setDynamicGridPosition(view.getCommitGridPosition());
    }
    else
    {
        view.setCommitGridPosition(canvasSize.subtract(sparseMatrixSize.multiply(view.cellWidth)).divide(2));
        view.setDynamicGridPosition(view.getCommitGridPosition());
    }

    if (!gl) {
        alert('Your browser does not support WebGL');
    }
    else
    {
        let renderer = new Renderer(canvas, gl, view.cellWidth, borderWidth, showGrid, 1.0);

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
            renderer = new Renderer(canvas, gl, view.cellWidth, borderWidth, showGrid, renderer.zoomLevel);
            renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
        }

        function animate(timestamp: any): void {
            if (pause)
            {
                renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
                return;
            }
            let elapsedTime: number = timestamp - lastUpdateTime;
            if (elapsedTime >= timestepMs) {
                lastUpdateTime = timestamp;
                GameRules.update(grid);
            }
    
            renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
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
            
                renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
            }
        });

        document.addEventListener('wheel', function(event) {
            if (!canvas || !gl)
                return;
            if (view.startDragScreenPosition)
                return;

            let oldZoomLevel = renderer.zoomLevel;
            let uncropped = renderer.zoomLevel * (event.deltaY < 0 ? 1.25 : 0.8);
            renderer.zoomLevel = Math.min(Math.max(uncropped, view.minZoom), view.maxZoom);
            let scaleFactor = renderer.zoomLevel / oldZoomLevel;

            let rect = canvas.getBoundingClientRect();
            let mousePos = new Vec(event.clientX - rect.left, event.clientY - rect.top);

            let viewPosRelativeToMouse = view.getDynamicGridPosition().subtract(mousePos);
            let scaled = viewPosRelativeToMouse.multiply(scaleFactor);
            view.setCommitGridPosition(mousePos.add(scaled));
            view.setDynamicGridPosition(view.getCommitGridPosition());

            // if mouse is positioned inside the grid, move dynamicGridPosition away from the cursor if zooming in, towards if zooming out.

            view.cellWidth = view.unzoomedCellWidth * renderer.zoomLevel;
            renderer = new Renderer(canvas, gl, view.cellWidth, borderWidth, showGrid, renderer.zoomLevel);
            renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
        });

        if (canvas) {
            window.addEventListener('mousemove', function(event) {
                if (!canvas)
                    return;
                
                let rect = canvas.getBoundingClientRect();
                let mousePos = new Vec(event.clientX - rect.left, event.clientY - rect.top);
                cursorCellPos = view.screenToCellCoords(mousePos);

                if ( view.startDragScreenPosition )
                    view.setDynamicGridPosition(view.getCommitGridPosition().add(mousePos.subtract( view.startDragScreenPosition )));

                renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
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
                    let cellCoords = view.screenToCellCoords(mousePos);
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
                    view.startDragScreenPosition = mousePos.clone();
                }

                renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
            });
            canvas.addEventListener('mouseup', function(event) {
                if (!canvas)
                    return;

                if (event.button === 2)         // Right mouse button
                {
                    if (view.startDragScreenPosition)
                    {
                        let rect = canvas.getBoundingClientRect();
                        let mousePos = new Vec(event.clientX - rect.left, event.clientY - rect.top);

                        view.setCommitGridPosition(mousePos.subtract( view.startDragScreenPosition ).add( view.getCommitGridPosition() ));
                        view.setDynamicGridPosition(view.getCommitGridPosition());
                        view.startDragScreenPosition = null;
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
                 renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
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
                    renderer = new Renderer(canvas, gl, view.cellWidth, borderWidth, showGrid, renderer.zoomLevel);
                renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
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
                    renderer = new Renderer(canvas, gl, view.cellWidth, borderWidth, showGrid, renderer.zoomLevel);
                renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
            });

            addTooltipToElements([detectOscillationsLabel, detectOscillationsCheckBox], 'Detect and highlight oscillations. Period 2 = red, 3 = blue, 5 = green, 6 = purple');

            detectOscillationsCheckBox.addEventListener('click', () => {
                GameRules.detectOscillations = detectOscillationsCheckBox.checked;
                 renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
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
            
                renderer.draw(grid, cursorCellPos, brush, GameRules.detectOscillations, view.getDynamicGridPosition());
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
