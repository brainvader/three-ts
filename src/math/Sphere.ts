import { Vector3 } from './Vector3';
import { Box3 } from './Box3';
import { Matrix4 } from './Matrix4';
import { Plane } from './Plane';

export class Sphere {
    constructor(
        private _center = new Vector3(),
        private _radius = 0
    ) {}

    get center(): Vector3 {
        return this._center;
    }

    set center(value: Vector3) {
        this._center = value;
    }

    get radius(): number {
        return this._radius;
    }

    set radius(value: number) {
        this._radius = value;
    }

    setAll(center: Vector3, radius: number): Sphere {
        this._center.copy(center);
        this._radius = radius;
        return this;
    }

    setFromPoints(points: Vector3[], optionalCenter?: Vector3): Sphere {
        const box = new Box3();
        const center = this._center;

        if (optionalCenter !== undefined) {
            center.copy(optionalCenter);
        } else {
            box.setFromPoints(points).getCenter(center);
        }

        let maxRadiusSq = 0;
        for (let i = 0, il = points.length; i < il; i++) {
            maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(points[i]));
        }

        this._radius = Math.sqrt(maxRadiusSq);
        return this;
    }

    clone(): Sphere {
        return new Sphere().copy(this);
    }

    copy(sphere: Sphere): Sphere {
        this._center.copy(sphere.center);
        this._radius = sphere.radius;
        return this;
    }

    empty(): boolean {
        return (this.radius <= 0);
    }

    containsPoint(point: Vector3): boolean {
        return (
            point.distanceToSquared(this.center) <= (this.radius * this.radius));
    }

    distanceToPoint(point: Vector3): number {
        return (point.distanceTo(this.center) - this.radius);
    }

    intersectsSphere(sphere: Sphere): boolean {
        const radiusSum = this.radius + sphere.radius;
        return sphere.center.distanceToSquared(this.center) <=
            (radiusSum * radiusSum);
    }

    intersectsBox(box: Box3): boolean {
        return box.intersectsSphere(this);
    }

    intersectsPlane(plane: Plane): boolean {
        return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
    }

    clampPoint(point: Vector3, target = new Vector3()): Vector3 {
        const deltaLengthSq = this.center.distanceToSquared(point);
        target.copy(point);
        if (deltaLengthSq > (this.radius * this.radius)) {
            target.sub(this.center).normalize();
            target.multiplyScalar(this.radius).add(this.center);
        }
        return target;
    }

    getBoundingBox(target = new Box3()): Box3 {
        target.setAll(this.center, this.center);
        target.expandByScalar(this.radius);
        return target;
    }

    applyMatrix4(matrix: Matrix4): Sphere {
        this._center.applyMatrix4(matrix);
        this._radius = this._radius * matrix.getMaxScaleOnAxis();
        return this;
    }

    translate(offset: Vector3): Sphere {
        this.center.add(offset);
        return this;
    }

    equals(sphere: Sphere): boolean {
        return sphere.center.equals(this.center) &&
            (sphere.radius === this.radius);
    }
}
