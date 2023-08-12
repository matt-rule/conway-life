import { vec2 } from "gl-matrix";

export class Util {
    public static radiansToDegrees(rads: number): number
    {
        return rads * (180 / Math.PI);
    }

    public static vectorFromAngle(radians: number): vec2
    {
        return vec2.fromValues
        (
            Math.sin(radians),
            Math.cos(radians)
        );
    }

    public static vectorFromAngleAndMag(radians: number, mag: number): vec2
    {
        let result = vec2.fromValues
        (
            Math.sin(radians),  // TODO: simplify this function by just putting * mag here
            Math.cos(radians)
        );
        vec2.scale(result, result, mag);
        return result;
    }
};