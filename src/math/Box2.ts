import { Vector2 } from './Vector2';

export class Box2 {
    constructor(
        private _min = new Vector2(+Infinity, +Infinity),
        private _max = new Vector2(+Infinity, +Infinity),
    ) { }

    get min(): Vector2 {
        return this._min;
    }

    get max(): Vector2 {
        return this._max;
    }

    setAll(min: Vector2, max: Vector2): Box2 {
        this._min.copy(min);
        this._max.copy(max);

        return this;
    }

    setFromPoints(points: Vector2[]): Box2 {
        this.makeEmpty();

        for (let i = 0, il = points.length; i < il; i++) {
            this.expandByPoint(points[i]);
        }
        return this;
    }

    setFromCenterAndSize(center: Vector2, size: Vector2): Box2 {
        const v1 = new Vector2();
        const halfSize = v1.copy(size).multiplyScalar(0.5);
        this._min.copy(center).sub(halfSize);
        this._max.copy(center).add(halfSize);
        return this;
    }

    clone(): Box2 {
        return new Box2().copy(this);
    }

    copy(box: Box2): Box2 {
        this._min.copy(box.min);
        this._max.copy(box.max);

        return this;
    }

    makeEmpty(): Box2 {
        this._min.x = this._min.y = +Infinity;
        this._max.x = this._max.y = -Infinity;
        return this;
    }

    isEmpty(): boolean {
        // this is a more robust check for empty than ( volume <= 0 ) because
        // volume can get positive with two negative axes
        return (this._max.x < this._min.x) || (this._max.y < this._min.y);
    }

    getCenter(target = new Vector2()): Vector2 {
        return this.isEmpty() ?
            target.setXY(0, 0) :
            target.addVectors(this._min, this._max).multiplyScalar(0.5);
    }

    getSize(target = new Vector2()): Vector2 {
        return this.isEmpty() ? target.setXY(0, 0) :
            target.subVectors(this._max, this._min);
    }

    expandByPoint(point: Vector2): Box2 {
        this._min.min(point);
        this._max.max(point);
        return this;
    }

    expandByVector(vector: Vector2): Box2 {
        this._min.sub(vector);
        this._max.add(vector);
        return this;
    }

    expandByScalar(scalar: number): Box2 {
        this._min.addScalar(-scalar);
        this._max.addScalar(scalar);
        return this;
    }

    containsPoint(point: Vector2): boolean {
        return point.x < this.min.x || point.x > this.max.x ||
            point.y < this.min.y || point.y > this.max.y ?
            false :
            true;
    }

    containsBox(box: Box2): boolean {
        return this.min.x <= box.min.x && box.max.x <= this.max.x &&
            this.min.y <= box.min.y && box.max.y <= this.max.y;
    }

    getParameter(point: Vector2, target = new Vector2()): Vector2 {
        // This can potentially have a divide by zero if the box
        // has a size dimension of 0.
        return target.setXY(
            (point.x - this.min.x) / (this.max.x - this.min.x),
            (point.y - this.min.y) / (this.max.y - this.min.y));
    }

    intersectsBox(box: Box2): boolean {
        // using 4 splitting planes to rule out intersections
        return box.max.x < this.min.x || box.min.x > this.max.x ||
            box.max.y < this.min.y || box.min.y > this.max.y ?
            false :
            true;
    }

    clampPoint(point: Vector2, target = new Vector2()): Vector2 {
        return target.copy(point).clamp(this.min, this.max);
    }

    distanceToPoint (point: Vector2): number {
        const v1 = new Vector2();
        const clampedPoint = v1.copy( point ).clamp( this.min, this.max );
        return clampedPoint.sub( point ).length();
    }

    intersect(box: Box2): Box2 {
        this._min.max(box.min);
        this._max.min(box.max);
        return this;
    }

    union(box: Box2): Box2 {
        this._min.min(box.min);
        this._max.max(box.max);
        return this;
    }

    translate(offset: Vector2): Box2 {
        this._min.add(offset);
        this._max.add(offset);
        return this;
    }

    equals(box: Box2): boolean {
        return box.min.equals(this._min) && box.max.equals(this._max);
    }
}
