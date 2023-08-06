export const INITIAL_SCREEN_WIDTH: number = 1280;
export const INITIAL_SCREEN_HEIGHT: number = 720;

export const LEVEL_WIDTH: number = 48;
export const LEVEL_HEIGHT: number = 96;

export const FPS: number = 90;  // Update FPS only - not drawing

/// <summary>
/// Including border tiles.
/// </summary>
export const LEVEL_EXT_WIDTH: number = LEVEL_WIDTH + 2;

export const CHARACTER_MOVE_SPEED: number = 240;

export const BG_TILE_SIZE: number = 128;
export const TILE_SIZE: number = 32;

export const CHAR_PHYSICS_WIDTH: number = 24;

export const LAVA_BOMB_SIZE: number = 10;
export const LAVA_BULLET_SIZE: number = 6;
export const GRAVITY: number = 1200.0;
export const JUMP_SPEED: number = 700.0;

export const SPITTER_LOOP_SPEED: number = 0.5;
export const FLAME_SPITTER_LOOP_SPEED: number = 0.15;
export const FLAMES_LOOP_SPEED: number = 8.0;

export const LAVA_BOMB_TIMER_MS: number = 500;
export const LAVA_BULLET_TIMER_MS: number = 1200;

// Sprite export constants.
export const SPRITE_SUIT_SIZE: number = 96;
export const SPRITE_SUIT_FPS: number = 12;
export const SPRITE_SUIT_FRAMES: number = 8;

export const SPRITE_FONT_FRAMES: number = 95;
export const TEXT_KERNING: number = 14;
export const TEXT_DEFAULT_HEIGHT: number = 32;

export const SPRITE_FLAMES_SIZE: number = 64;
export const SPRITE_FLAMES_FRAMES: number = 2;

export const LAVA_LAKE_SPRITE_SIZE: number = 32;
export const LAVA_LAKE_SPRITE_FPS: number = 1.66;
export const LAVA_LAKE_SPRITE_FRAMES: number = 2;

export const LAVA_SURFACE_SPRITE_SIZE: number = 32;
export const LAVA_SURFACE_SPRITE_FPS: number = 1.66;
export const LAVA_SURFACE_SPRITE_FRAMES: number = 2;

export const TILE_ID_EMPTY: number = 0;
export const TILE_ID_ROCK: number = 1;
export const TILE_ID_SPITTER: number = 2;
export const TILE_ID_FLAG_RED: number = 3;
export const TILE_ID_FLAG_WHITE: number = 4;
export const TILE_ID_FLAME_SPITTER: number = 5;

// Texture export constants.
export const TEX_ID_LAVA_BOMB: number = 0;
export const TEX_ID_ROCK: number = 1;
export const TEX_ID_BG: number = 2;
export const TEX_ID_SPRITE_SUIT: number = 3;
export const TEX_ID_SPRITE_FONT: number = 4;
export const TEX_ID_SPRITE_LAVA_LAKE: number = 5;
export const TEX_ID_SPRITE_LAVA_SURFACE: number = 6;
export const TEX_ID_STANDING: number = 7;
export const TEX_ID_SPITTER: number = 8;
export const TEX_ID_BULLET: number = 9;
export const TEX_ID_FLAG_RED: number = 10;
export const TEX_ID_FLAG_WHITE: number = 11;
export const TEX_ID_FLAME_SPITTER: number = 12;
export const TEX_ID_SPRITE_FLAMES_BIG: number = 13;
