import { BoundingBox } from "./boundingBox";
import * as Constants from "./constants";
import { Key, KeyboardState } from "./keyboardState";
import { vec2 } from "gl-matrix";
import { LavaBombEntity } from "./lavaBombEntity";
import { Util } from "./util";

export enum CharacterFacing { Left, Right };
export enum CollisionOutcome { None, Collision, Victory }
export enum LevelResetCause { Start, Death, Victory }

export class ActiveLevel {

    public levelNumber: number = 1;

    public lavaSpeedPerLevel: number[] = [];

    public lavaBombs: LavaBombEntity[] = [];
    public angle: number = 0;

    public mcPosition: vec2 = vec2.fromValues(0, 0);
    public mcVelocity: vec2 = vec2.fromValues(0, 0);

    public mcGrounded: boolean = false;
    public mcRunning: boolean = false;

    public lavaHeight: number = 0;
    public facing: CharacterFacing = CharacterFacing.Left;
    
    public spriteAnimationPosition: number = 0;       // Normalised frame to render (rate of increase may not be 1/sec).
    public lavaAnimationLoopValue: number = 0;       // Normalised frame to render (rate of increase may not be 1/sec).

    public spitterLoopValue: number = 0;
    public flameSpitterLoopValue: number = 0;
    public flamesLoopValue: number = 0;

    public editorMode: boolean = false;

    public blockDataLevelArray: number[][][] = [];

    constructor ( blockDataLevelArray: number[][][]) {       // TODO: remove redundancy
        this.blockDataLevelArray = blockDataLevelArray;
        this.resetLevel( false, LevelResetCause.Start );
    }

    public getStartingPosition()
    {
        if (this.levelNumber in this.blockDataLevelArray)
            for ( let tileX: number = 0; tileX < Constants.LEVEL_WIDTH; ++tileX )
                for ( let tileY: number = 0; tileY <= Constants.LEVEL_HEIGHT; ++tileY )
                    if ( this.blockDataLevelArray[this.levelNumber][tileX][tileY] == Constants.TILE_ID_FLAG_WHITE )
                    {
                        return vec2.fromValues(
                            tileX * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5 - Constants.SPRITE_SUIT_SIZE / 2,
                            (tileY + 0.05) * Constants.TILE_SIZE
                        );
                    }
        return vec2.fromValues(256, 256);
    }

    // Returns true if level won
    public resetLevel( gameWon: boolean, resetCause: LevelResetCause ): boolean
    {
        if (gameWon)
            return true;

        if (resetCause == LevelResetCause.Start)
            this.levelNumber = 3;
        else if (resetCause == LevelResetCause.Victory)
        {
            ++this.levelNumber;
        }

        this.lavaSpeedPerLevel = [ 8, 20, 20, 30 ];
        this.lavaBombs = [];
        this.angle = 0.0;
        this.mcPosition = this.getStartingPosition();
        this.mcVelocity = vec2.fromValues(0, 0);
        this.mcGrounded = false;
        this.mcRunning = false;
        this.lavaHeight = 0;
        this.facing = CharacterFacing.Left;
        this.spriteAnimationPosition = 0;
        this.lavaAnimationLoopValue = 0;
        this.spitterLoopValue = 0;
        this.flameSpitterLoopValue = 0;
        this.flamesLoopValue = 0;
        this.editorMode = false;

        return this.levelNumber > 3;
    }

    public saveTilesToFile(): void
    {

    }

    public loadTilesFromFile(): void
    {

    }

    public getPlayerBoundingBox( playerX: number, playerY: number ): BoundingBox
    {
        let left: number = playerX + (Constants.SPRITE_SUIT_SIZE / 2) - Constants.CHAR_PHYSICS_WIDTH;
        let right: number = playerX + (Constants.SPRITE_SUIT_SIZE / 2) + Constants.CHAR_PHYSICS_WIDTH;
        let bottom: number = playerY;
        let top: number = playerY + Constants.SPRITE_SUIT_SIZE;

        return new BoundingBox(left, right, bottom, top);
    }

    public bbLevelIntersection( gameWon: boolean, bb: BoundingBox ): CollisionOutcome
    {
        if ( gameWon )
            return CollisionOutcome.None;

        let McLeftTile: number = Math.floor(bb.left);
        let McRightTile: number = Math.floor(bb.right);
        let McBottomTile: number = Math.floor(bb.bottom);
        let McTopTile: number = Math.floor(bb.top);

        let collision: boolean = false;

        for (let tileX: number = McLeftTile; tileX <= McRightTile; ++tileX)
            for (let tileY: number = McBottomTile; tileY <= McTopTile; ++tileY)
            {
                if (tileX < 0 || tileX >= Constants.LEVEL_WIDTH
                    || tileY < 0 || tileY >= Constants.LEVEL_HEIGHT)
                    collision = true;
                else if (this.blockDataLevelArray[this.levelNumber][tileX][tileY] == Constants.TILE_ID_ROCK)
                    collision = true;
                else if (this.blockDataLevelArray[this.levelNumber][tileX][tileY] == Constants.TILE_ID_FLAG_RED)
                    return CollisionOutcome.Victory;
            }

        if (collision)
            return CollisionOutcome.Collision;
        else
            return CollisionOutcome.None;
    }

    public getPlayerBoundingBoxTiles( playerX: number, playerY: number )
    {
        let bb = this.getPlayerBoundingBox(playerX, playerY);
        return new BoundingBox(
            bb.left / Constants.TILE_SIZE,
            bb.right / Constants.TILE_SIZE,
            bb.bottom / Constants.TILE_SIZE,
            bb.top / Constants.TILE_SIZE
        );
    }

    public isIntersectionWithLevel( gameWon: boolean, playerX: number, playerY: number): CollisionOutcome
    {
        if ( gameWon )
            return CollisionOutcome.None;

        let boundingBox: BoundingBox = this.getPlayerBoundingBoxTiles(playerX, playerY);
        return this.bbLevelIntersection( gameWon, boundingBox );
    }

    public isLavaCollision( gameWon: boolean, playerY: number ): boolean
    {
        if (gameWon)
            return false;

        return playerY < this.lavaHeight;
    }

    // Returns true if level won
    public processPlayerMovement( gameWon: boolean, prevKeyState: KeyboardState, keyState: KeyboardState, elapsedTime: number ): boolean
    {
        if ( gameWon )
            return true;

        if ( this.editorMode )
        {
            if (keyState.isKeyDown(Key.F1) && !prevKeyState.isKeyDown(Key.F1))
                this.saveTilesToFile();
            if (keyState.isKeyDown(Key.F2) && !prevKeyState.isKeyDown(Key.F2))
                this.loadTilesFromFile();
        }
        if (keyState.isKeyDown(Key.F12) && !prevKeyState.isKeyDown(Key.F12))
            this.editorMode = !this.editorMode;

        let newPosition: vec2 = vec2.clone( this.mcPosition );

        let moveLeft: boolean = keyState.isKeyDown(Key.Left) || keyState.isKeyDown(Key.A);
        let moveRight: boolean = keyState.isKeyDown(Key.Right) || keyState.isKeyDown(Key.D);

        if (moveLeft && !moveRight)
        {
            this.mcRunning = true;
            newPosition[0] -= Constants.CHARACTER_MOVE_SPEED * elapsedTime;
            this.facing = CharacterFacing.Left;
        }
        else if (moveRight && !moveLeft)
        {
            this.mcRunning = true;
            newPosition[0] += Constants.CHARACTER_MOVE_SPEED * elapsedTime;
            this.facing = CharacterFacing.Right;
        }
        else
        {
            this.mcRunning = false;
        }

        if ((keyState.isKeyDown(Key.Space) || keyState.isKeyDown(Key.W)) && !(prevKeyState.isKeyDown(Key.Space) || prevKeyState.isKeyDown(Key.W)))
        {
            if ( this.mcGrounded )
            {
                this.mcGrounded = false;
                this.mcVelocity[1] += Constants.JUMP_SPEED;
            }
        }

        let outcome: CollisionOutcome = this.isIntersectionWithLevel(gameWon, newPosition[0], newPosition[1]);
        switch (outcome)
        {
            case CollisionOutcome.None:
                this.mcPosition = newPosition;
                break;
            case CollisionOutcome.Victory:
                let won: boolean = this.resetLevel( gameWon, LevelResetCause.Victory);
                if (won) return true;
                break;
            default:
                break;
        }
        
        newPosition = vec2.clone( this.mcPosition );

        // collisions - process Y only
        // TODO - check whether X is required too
        this.mcVelocity[1] -= Constants.GRAVITY * elapsedTime;
        newPosition[1] += this.mcVelocity[1] * elapsedTime;

        outcome = this.isIntersectionWithLevel(gameWon, newPosition[0], newPosition[1]);
        switch (outcome)
        {
            case CollisionOutcome.None:
                this.mcPosition = newPosition;
                this.mcGrounded = false;
                break;
            case CollisionOutcome.Victory:
                let won: boolean = this.resetLevel( gameWon, LevelResetCause.Victory);
                if (won) return true;
                break;
            default:
                vec2.zero( this.mcVelocity );
                this.mcGrounded = true;             // TODO: try setting the character position to some intermediate value
                break;
        }

        if ( this.isLavaCollision( gameWon, this.mcPosition[1] ) )
        {
            this.resetLevel( gameWon, LevelResetCause.Death );
            return false;
        }

        return false;
    }

    // Return true if level won
    public update( gameWon: boolean, prevKeyState: KeyboardState, keyState: KeyboardState, elapsedTime: number): boolean
    {
        this.spriteAnimationPosition += elapsedTime * Constants.SPRITE_SUIT_FPS / Constants.SPRITE_SUIT_FRAMES;
        if (this.spriteAnimationPosition > 1.0)
            this.spriteAnimationPosition -= 1.0;

        if ( gameWon )
            return true;

        if (!this.editorMode)
            this.lavaHeight += elapsedTime * this.lavaSpeedPerLevel[this.levelNumber];

        this.angle += elapsedTime * Math.PI;

        this.spitterLoopValue += elapsedTime * Constants.SPITTER_LOOP_SPEED;
        if (this.spitterLoopValue > 1.0)
        {
            this.spitterLoopValue -= 1.0;

            for (let tileX: number = 0; tileX < Constants.LEVEL_WIDTH; ++tileX)
                for (let tileY: number = 0; tileY < Constants.LEVEL_HEIGHT; ++tileY)
                    if (this.blockDataLevelArray[this.levelNumber][tileX][tileY] == Constants.TILE_ID_SPITTER)
                    {
                        this.lavaBombs.push(new LavaBombEntity(
                            vec2.fromValues(tileX * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5, (tileY + 1) * Constants.TILE_SIZE),
                            vec2.fromValues(0, 750),
                            2));
                    }
        }

        this.flameSpitterLoopValue += elapsedTime * Constants.FLAME_SPITTER_LOOP_SPEED;
        if (this.flameSpitterLoopValue > 1.0)
        {
            this.flameSpitterLoopValue -= 1.0;
        }
        this.flamesLoopValue += elapsedTime * Constants.FLAMES_LOOP_SPEED;
        if (this.flamesLoopValue > 1.0)
        {
            this.flamesLoopValue -= 1.0;
        }

        this.lavaAnimationLoopValue += elapsedTime * Constants.LAVA_LAKE_SPRITE_FPS / Constants.LAVA_LAKE_SPRITE_FRAMES;
        if (this.lavaAnimationLoopValue > 1.0)
            this.lavaAnimationLoopValue -= 1.0;

        let playerBoundingBox = this.getPlayerBoundingBox(this.mcPosition[0], this.mcPosition[1]);
        this.lavaBombs.forEach(b =>
        {
            if (b.level == 2)
                b.velocity[1] -= Constants.GRAVITY * elapsedTime;
            let scaledVelocity = vec2.create();
            vec2.scale(scaledVelocity, b.velocity, elapsedTime);
            vec2.add(b.position, b.position, scaledVelocity);
            var bombBB = b.GetBoundingBox();

            if (BoundingBox.testIntersection(playerBoundingBox, bombBB))
            {
                this.resetLevel(gameWon, LevelResetCause.Death);
                return false;
            }
        });

        if (this.flameSpitterLoopValue > 0.33)
        {
            for (let tileX: number = 0; tileX < Constants.LEVEL_WIDTH; ++tileX)
                for (let tileY: number = 0; tileY < Constants.LEVEL_HEIGHT; ++tileY)
                    if (this.blockDataLevelArray[this.levelNumber][tileX][tileY] == Constants.TILE_ID_FLAME_SPITTER)
                    {
                        var flameSpitterBoundingBox = new BoundingBox(
                            tileX * Constants.TILE_SIZE,
                            (tileX + 1) * Constants.TILE_SIZE,
                            tileY * Constants.TILE_SIZE,
                            (tileY + 3) * Constants.TILE_SIZE);

                        if (BoundingBox.testIntersection(playerBoundingBox, flameSpitterBoundingBox))
                        {
                            this.resetLevel(gameWon, LevelResetCause.Death);
                            return false;
                        }
                    }
        }

        let levelWon: boolean = this.processPlayerMovement( gameWon, prevKeyState, keyState, elapsedTime);

        let toSpawnFrom: LavaBombEntity[] = this.lavaBombs.filter(
            x => x.level > 1 && x.timeCreated + Constants.LAVA_BOMB_TIMER_MS <= Date.now());
        this.lavaBombs = this.lavaBombs.filter(
            x => x.timeCreated + (x.level == 2 ? Constants.LAVA_BOMB_TIMER_MS : Constants.LAVA_BULLET_TIMER_MS) > Date.now());
        let angledVecs = [...Array(10).keys()].map(x => Math.PI * 2 / 10 * (x + 1)).map(x => Util.vectorFromAngleAndMag(x, 150.0));

        toSpawnFrom.forEach(entity => {
            let newEntities: LavaBombEntity[] = angledVecs.map(angledVec => {
                let scaledVec = vec2.create();
                vec2.scale(scaledVec, angledVec, entity.level);
                // console.log('this.mcVelocity:', this.mcVelocity);
                // console.log('angledVec:', angledVec);
                // console.log('entity.level:', entity.level);
                // console.log('scaledVec:', scaledVec);
                let newVelocity = vec2.create();
                // console.log('entity.velocity:', entity.velocity);
                vec2.add(newVelocity, entity.velocity, scaledVec);
                // console.log('newVelocity:', newVelocity);
                return new LavaBombEntity(vec2.clone(entity.position), newVelocity, entity.level - 1);
            });

            this.lavaBombs = this.lavaBombs.concat( newEntities );
            // console.log('this.lavaBombs:', this.lavaBombs);
        });

        return levelWon;
    }
}
