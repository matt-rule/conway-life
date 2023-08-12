import * as Constants from "./constants"
import { vec2 } from "gl-matrix";
import { BoundingBox } from "./boundingBox";

export class LavaBombEntity {
    public position: vec2;
    public velocity: vec2;
    public level: number;
    public timeCreated: number;

    public constructor( position: vec2, velocity: vec2, level: number )
    {
        this.position = position;
        this.velocity = velocity;
        this.level = level;
        this.timeCreated = Date.now();
    }

    public GetBoundingBox(): BoundingBox
    {
        return new BoundingBox(
            this.position[0] - Constants.LAVA_BOMB_SIZE / 2,
            this.position[0] + Constants.LAVA_BOMB_SIZE / 2,
            this.position[1] - Constants.LAVA_BOMB_SIZE / 2,
            this.position[1] + Constants.LAVA_BOMB_SIZE / 2);
    }
}
