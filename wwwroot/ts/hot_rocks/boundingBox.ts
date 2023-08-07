export class BoundingBox
{
    public left: number = 0;
    public right: number = 0;
    public bottom: number = 0;
    public top: number = 0;

    constructor( left: number, right: number, bottom: number, top: number )
    {
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
    }

    public static testIntersection( bb1: BoundingBox, bb2: BoundingBox ): boolean
    {
        return !(bb2.left > bb1.right
            || bb2.right < bb1.left
            || bb2.top < bb1.bottom
            || bb2.bottom > bb1.top);
    }
}
