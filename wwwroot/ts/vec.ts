export class Vec
{
    constructor(public x: number, public y: number) {}

    add(v: Vec): Vec {
        return new Vec(this.x + v.x, this.y + v.y);
    }
    subtract(v: Vec): Vec {
        return new Vec(this.x - v.x, this.y - v.y);
    }
}
