export class Vec
{
    constructor(public x: number, public y: number) {}

    clone(): Vec {
        return new Vec(this.x, this.y);
    }
    add(v: Vec): Vec {
        return new Vec(this.x + v.x, this.y + v.y);
    }
    subtract(v: Vec): Vec {
        return new Vec(this.x - v.x, this.y - v.y);
    }
    multiply(scalar: number): Vec {
        return new Vec(this.x * scalar, this.y * scalar);
    }
    divide(scalar: number): Vec {
        return new Vec(this.x / scalar, this.y / scalar);
    }
    floor(): Vec {
        return new Vec(Math.floor(this.x), Math.floor(this.y));
    }
}
