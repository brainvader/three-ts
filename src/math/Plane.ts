import { Vector3 } from './Vector3';
import { Sphere } from './Sphere';
import { Box3 } from './Box3';
import { Matrix4 } from './Matrix4';
import { Matrix3 } from './Matrix3';
import { Line3 } from './Line3';

export class Plane {
    constructor(private _normal = new Vector3(1, 0, 0), private _constant = 0) { }

    get normal(): Vector3 {
        return this._normal;
    }

    get constant(): number {
        return this._constant;
    }

    setAll(normal: Vector3, constant: number): Plane {
        this._normal.copy(normal);
        this._constant = constant;
        return this;
    }

    setComponents(x: number, y: number, z: number, w: number): Plane {
        this._normal.setXYZ(x, y, z);
        this._constant = w;

        return this;
    }

    setFromNormalAndCoplanarPoint(normal: Vector3, point: Vector3): Plane {
        this._normal.copy(normal);
        this._constant = -point.dot(this._normal);
        return this;
    }

    setFromCoplanarPoints(a: Vector3, b: Vector3, c: Vector3): Plane {
        const v1 = new Vector3();
        const v2 = new Vector3();
        const normal = v1.subVectors(c, b).cross(v2.subVectors(a, b)).normalize();

        // Q: should an error be thrown if normal is zero (e.g. degenerate
        // plane)?
        this.setFromNormalAndCoplanarPoint(normal, a);
        return this;
    }

    clone(): Plane {
        return new Plane().copy(this);
    }

    copy(plane: Plane): Plane {
        this._normal.copy(plane._normal);
        this._constant = plane._constant;
        return this;
    }

    normalize(): Plane {
        // Note: will lead to a divide by zero if the plane is invalid.
        const inverseNormalLength = 1.0 / this._normal.length();
        this._normal.multiplyScalar(inverseNormalLength);
        this._constant *= inverseNormalLength;
        return this;
    }

    negate(): Plane {
        this._constant *= -1;
        this._normal.negate();
        return this;
    }

    distanceToPoint(point: Vector3): number {
        return this._normal.dot(point) + this._constant;
    }

    distanceToSphere(sphere: Sphere): number {
        return this.distanceToPoint(sphere.center) - sphere.radius;
    }

    projectPoint(point: Vector3, target = new Vector3()) {
        return target.copy(this._normal)
            .multiplyScalar(-this.distanceToPoint(point))
            .add(point);
    }

    intersectLine(line: Line3, target = new Vector3()): Vector3 {
        const v1 = new Vector3();
        const direction = line.delta(v1);
        const denominator = this._normal.dot(direction);
        if (denominator === 0) {
            // line is coplanar, return origin
            if (this.distanceToPoint(line.start) === 0) {
                return target.copy(line.start);
            }
            // Unsure if this is the correct method to handle this case.
            return undefined;
        }

        const t = -(line.start.dot(this._normal) + this._constant) / denominator;

        if (t < 0 || t > 1) {
            return undefined;
        }

        return target.copy(direction).multiplyScalar(t).add(line.start);
    }

    intersectsLine(line: Line3): boolean {
        // Note: this tests if a line intersects the plane, not whether it (or its
        // end-points) are coplanar with it.
        const startSign = this.distanceToPoint(line.start);
        const endSign = this.distanceToPoint(line.end);
        return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
    }

    intersectsBox(box: Box3): boolean {
        return box.intersectsPlane(this);
    }

    intersectsSphere(sphere: Sphere): boolean {
        return sphere.intersectsPlane(this);
    }

    coplanarPoint(target = new Vector3()): Vector3 {
        return target.copy(this._normal).multiplyScalar(-this._constant);
    }

    applyMatrix4(matrix: Matrix4, optionalNormalMatrix: Matrix3): Plane {
        const v1 = new Vector3();
        const m1 = new Matrix3();
        const normalMatrix = optionalNormalMatrix || m1.getNormalMatrix(matrix);
        const referencePoint = this.coplanarPoint(v1).applyMatrix4(matrix);
        const normal = this._normal.applyMatrix3(normalMatrix).normalize();
        this._constant = -referencePoint.dot(normal);
        return this;
    }

    translate(offset: Vector3): Plane {
        this._constant -= offset.dot(this._normal);
        return this;
    }

    equals(plane: Plane): boolean {
        return plane.normal.equals(this._normal) &&
            (plane.constant === this._constant);
    }
}
