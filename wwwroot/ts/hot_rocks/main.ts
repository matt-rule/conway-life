import * as Constants from "./constants"
import { Game } from "./game";
import { ImagesDictionary } from "./renderer";
import { Key, KeyboardState } from "./keyboardState";
import { vec2 } from "gl-matrix";

const SQUARE_SPEED: number = 60;

let stillImageUrls = [
    "assets/hot_rocks/lava-bomb.png",
    "assets/hot_rocks/tile.png",
    "assets/hot_rocks/bg1.png",
    "assets/hot_rocks/sprite-standing.png",
    "assets/hot_rocks/spitter.png",
    "assets/hot_rocks/lava-bullet-2.png",
    "assets/hot_rocks/flag-red.png",
    "assets/hot_rocks/flag-white.png",
    "assets/hot_rocks/spitter-flame.png"
];

let animatedImageUrls = [
    "assets/hot_rocks/sprite-suit.png",
    "assets/hot_rocks/sprite-font.png",
    "assets/hot_rocks/sprite-lava-lake.png",
    "assets/hot_rocks/sprite-lava-surface.png",
    "assets/hot_rocks/sprite-flames-big.png"
];

function promiseFunction(url : string) {
    return new Promise<{[key: string]: HTMLImageElement}>((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve({[url]: img});
        img.onerror = reject;
        img.src = url;
    });
}

let loadStillImagePromises = stillImageUrls.map(promiseFunction);
let loadAnimatedImagePromises = animatedImageUrls.map(promiseFunction);

// function loadTilesFromFile(gameWon: boolean): void {
//     if (gameWon) return;

//     let tiles = new Array<Array<number>>(Constants.LEVEL_WIDTH).fill(new Array<number>(Constants.LEVEL_HEIGHT).fill(0));

//     fetch(`wwwroot/assets/hot_rocks/levels/level_${this.LevelNumber}`)
//         .then(response => response.arrayBuffer())
//         .then(arrayBuffer => {
//             let dataView = new DataView(arrayBuffer);

//             // You will need to know the exact format of your binary file.
//             // This example assumes 4-byte integers (int32).
//             for (let x = 0; x < Constants.LEVEL_WIDTH; x++) {
//                 for (let y = 0; y < Constants.LEVEL_HEIGHT; y++) {
//                     // Adjust this based on your binary format.
//                     tiles[x][y] = dataView.getInt32((x * Constants.LEVEL_HEIGHT + y) * 4);
//                 }
//             }

//             // Assign the tiles to the class member or handle them as needed.
//             this.Tiles = tiles;
//         })
//         .catch(error => {
//             // Handle the error
//             this.Tiles = new Array<Array<number>>(Constants.LEVEL_WIDTH).fill(new Array<number>(Constants.LEVEL_HEIGHT).fill(0));
//         });
// }

const levelNumbers = [1, 2, 3, 4];
async function loadTilesFromFile(gameWon: boolean, levelNumber: number): Promise<number[][]> {
    if (gameWon)
        return [];

    let tiles: number[][] = [];

    try {
        const response = await fetch(`assets/hot_rocks/levels/level_${levelNumber}.json`, { method: 'GET' });
        tiles = await response.json();

        if (tiles.length !== Constants.LEVEL_WIDTH || tiles[0]?.length !== Constants.LEVEL_HEIGHT) {
            throw new Error("Incorrect dimensions in the level data");
        }

    } catch (error) {
        console.error(error);
        tiles = new Array(Constants.LEVEL_WIDTH).fill(null).map(() => new Array(Constants.LEVEL_HEIGHT).fill(0));
    }

    return tiles;
}

let currentKeyState: KeyboardState = new KeyboardState();

document.addEventListener('keydown', (event: KeyboardEvent) => {
    switch (event.key)
    {
        case 'a':
        case 'A':
            currentKeyState.keyStates[Key.A] = true;
            break;
        case 'd':
        case 'D':
            currentKeyState.keyStates[Key.D] = true;
            break;
        case 'w':
        case 'W':
            currentKeyState.keyStates[Key.W] = true;
            break;
        case ' ':
            currentKeyState.keyStates[Key.Space] = true;
            break;
        case 'ArrowLeft':
            currentKeyState.keyStates[Key.Left] = true;
            break;
        case 'ArrowRight':
            currentKeyState.keyStates[Key.Right] = true;
            break;
        case 'F1':  // TODO: Test F keys
            currentKeyState.keyStates[Key.F1] = true;
            break;
        case 'F2':
            currentKeyState.keyStates[Key.F2] = true;
            break;
        case 'F12':
            currentKeyState.keyStates[Key.F12] = true;
            break;
    }
});

document.addEventListener('keyup', (event: KeyboardEvent) => {
    switch (event.key)
    {
        case 'a':
        case 'A':
            currentKeyState.keyStates[Key.A] = false;
            break;
        case 'd':
        case 'D':
            currentKeyState.keyStates[Key.D] = false;
            break;
        case 'w':
        case 'W':
            currentKeyState.keyStates[Key.W] = false;
            break;
        case ' ':
            currentKeyState.keyStates[Key.Space] = false;
            break;
        case 'ArrowLeft':
            currentKeyState.keyStates[Key.Left] = false;
            break;
        case 'ArrowRight':
            currentKeyState.keyStates[Key.Right] = false;
            break;
        case 'F1':  // TODO: Test F keys
            currentKeyState.keyStates[Key.F1] = false;
            break;
        case 'F2':
            currentKeyState.keyStates[Key.F2] = false;
            break;
        case 'F12':
            currentKeyState.keyStates[Key.F12] = false;
            break;
    }
});

let canvas: HTMLCanvasElement | null = document.getElementById("canvas") as HTMLCanvasElement;
if (canvas) {
    let game : Game = new Game(canvas);

    Promise.all(loadStillImagePromises).then(stillImageObjects => {
        let stillImages: ImagesDictionary = Object.assign({}, ...stillImageObjects);
    
        Promise.all(loadAnimatedImagePromises).then(animatedImageObjects => {
            let animatedImages: ImagesDictionary = Object.assign({}, ...animatedImageObjects);

            Promise.all(levelNumbers.map(levelNumber => loadTilesFromFile(false, levelNumber))).then(loadedLevels => {
                if (!canvas)
                    return;
        
                game = new Game( canvas );
                game.init(stillImages, animatedImages, loadedLevels);
                requestAnimationFrame(animate);
            })
            .catch(err => {
                console.error('Error occurred loading levels:', err);
            });
        }).catch(err => {
            console.error("Error occurred loading animated images: ", err);
        });
    
    }).catch(err => {
        console.error("Error occurred loading still images: ", err);
    });

    function animate(time: number) {
        if (game.lastUpdateTime == 0) {
            game.lastUpdateTime = time;
            requestAnimationFrame(animate);
            return;    
        }

        let deltaTimeMs = time - game.lastUpdateTime; // time since last frame
        game.lastUpdateTime = time;
        let deltaTimeSecs = deltaTimeMs / 1000;
    
        game.onUpdateFrame( currentKeyState, deltaTimeSecs );
        
        game.renderer.draw( game.gameWon, game.loadedLevels[ 0 ] );
    
        requestAnimationFrame(animate);
    }
}