import { BufferAttribute } from '../core/BufferAttribute';

import { Vector3 } from './Vector3';
import { Matrix4 } from './Matrix4';
import { Sphere } from './Sphere';
import { Plane } from './Plane';
import { Object3D } from '../core/Object3D';
import { Triangle } from './Triangle';

export class Box3 {
    constructor(
        private _min = new Vector3(+Infinity, +Infinity, +Infinity),
        private _max = new Vector3(+Infinity, +Infinity, +Infinity),
        private _isBox3 = true) { }

    get min(): Vector3 {
        return this._min;
    }

    get max(): Vector3 {
        return this._max;
    }

    get isBox3(): boolean {
        return this._isBox3;
    }

    setAll(min: Vector3, max: Vector3): Box3 {
        this._min.copy(min);
        this._max.copy(max);
        return this;
    }

    setFromArray(array: number[]): Box3 {
        let minX = +Infinity;
        let minY = +Infinity;
        let minZ = +Infinity;

        let maxX = -Infinity;
        let maxY = -Infinity;
        let maxZ = -Infinity;

        for (let i = 0, l = array.length; i < l; i += 3) {
            const x = array[i];
            const y = array[i + 1];
            const z = array[i + 2];

            if (x < minX) {
                minX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (z < minZ) {
                minZ = z;
            }

            if (x > maxX) {
                maxX = x;
            }
            if (y > maxY) {
                maxY = y;
            }
            if (z > maxZ) {
                maxZ = z;
            }
        }
        this._min.setXYZ(minX, minY, minZ);
        this._max.setXYZ(maxX, maxY, maxZ);
        return this;
    }

    setFromBufferAttribute(attribute: BufferAttribute): Box3 {
        let minX = +Infinity;
        let minY = +Infinity;
        let minZ = +Infinity;

        let maxX = -Infinity;
        let maxY = -Infinity;
        let maxZ = -Infinity;

        for (let i = 0, l = attribute.count; i < l; i++) {
            const x = attribute.getX(i);
            const y = attribute.getY(i);
            const z = attribute.getZ(i);

            if (x < minX) {
                minX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (z < minZ) {
                minZ = z;
            }

            if (x > maxX) {
                maxX = x;
            }
            if (y > maxY) {
                maxY = y;
            }
            if (z > maxZ) {
                maxZ = z;
            }
        }

        this._min.setXYZ(minX, minY, minZ);
        this._max.setXYZ(maxX, maxY, maxZ);

        return this;
    }

    setFromPoints(points: Vector3[]): Box3 {
        this.makeEmpty();
        for (let i = 0, il = points.length; i < il; i++) {
            this.expandByPoint(points[i]);
        }
        return this;
    }

    setFromCenterAndSize(center: Vector3, size: Vector3): Box3 {
        const v1 = new Vector3();
        const halfSize = v1.copy(size).multiplyScalar(0.5);

        this._min.copy(center).sub(halfSize);
        this._max.copy(center).add(halfSize);

        return this;
    }

    setFromObject(object: Object3D): Box3 {
        this.makeEmpty();
        return this.expandByObject(object);
    }

    clone(): Box3 {
        return new Box3().copy(this);
    }

    copy(box: Box3): Box3 {
        this._min.copy(box.min);
        this._max.copy(box.max);

        return this;
    }

    makeEmpty(): Box3 {
        this._min.x = this._min.y = this._min.z = +Infinity;
        this._max.x = this._max.y = this._max.z = -Infinity;
        return this;
    }

    isEmpty(): boolean {
        // this is a more robust check for empty than ( volume <= 0 ) because
        // volume can get positive with two negative axes
        return (this.max.x < this.min.x) || (this.max.y < this.min.y) ||
            (this.max.z < this.min.z);
    }

    getCenter(target = new Vector3()): Vector3 {
        return this.isEmpty() ?
            target.setXYZ(0, 0, 0) :
            target.addVectors(this.min, this.max).multiplyScalar(0.5);
    }

    getSize(target = new Vector3()): Vector3 {
        return this.isEmpty() ? target.setXYZ(0, 0, 0) :
            target.subVectors(this.max, this.min);
    }

    expandByPoint(point: Vector3): Box3 {
        this._min.min(point);
        this._max.max(point);
        return this;
    }

    expandByVector(vector: Vector3): Box3 {
        this._min.sub(vector);
        this._max.add(vector);
        return this;
    }

    expandByScalar(scalar: number): Box3 {
        this._min.addScalar(-scalar);
        this._max.addScalar(scalar);
        return this;
    }

    // TODO: Check rewrite part
    expandByObject(object: Object3D): Box3 {
        // Computes the world-axis-aligned bounding box of an object (including
        // its children), accounting for both the object's, and children's, world
        // transforms
        let scope, i, l;
        const v1 = new Vector3();
        scope = this;

        object.updateMatrixWorld(true);

        // TODO: Need refactor?
        object.traverse((node) => {
            const geometry = node.geometry;

            if (geometry !== undefined) {
                if (geometry.isGeometry) {
                    const vertices = geometry.vertices;

                    for (i = 0, l = vertices.length; i < l; i++) {
                        v1.copy(vertices[i]);
                        v1.applyMatrix4(node.matrixWorld);

                        scope.expandByPoint(v1);
                    }

                } else if (geometry.isBufferGeometry) {
                    const attribute = geometry.attributes.position;

                    if (attribute !== undefined) {
                        for (i = 0, l = attribute.count; i < l; i++) {
                            v1.fromBufferAttribute(attribute, i)
                                .applyMatrix4(node.matrixWorld);

                            scope.expandByPoint(v1);
                        }
                    }
                }
            }
        });

        return this;
    }

    containsPoint(point: Vector3): boolean {
        return point.x < this.min.x || point.x > this.max.x ||
            point.y < this.min.y || point.y > this.max.y ||
            point.z < this.min.z || point.z > this.max.z ?
            false :
            true;
    }

    containsBox(box: Box3): boolean {
        return this.min.x <= box.min.x && box.max.x <= this.max.x &&
            this.min.y <= box.min.y && box.max.y <= this.max.y &&
            this.min.z <= box.min.z && box.max.z <= this.max.z;
    }

    getParameter(point: Vector3, target = new Vector3()): Vector3 {
        // This can potentially have a divide by zero if the box
        // has a size dimension of 0.
        return target.setXYZ(
            (point.x - this.min.x) / (this.max.x - this.min.x),
            (point.y - this.min.y) / (this.max.y - this.min.y),
            (point.z - this.min.z) / (this.max.z - this.min.z));
    }

    intersectsBox(box: Box3): boolean {
        // using 6 splitting planes to rule out intersections.
        return box.max.x < this.min.x || box.min.x > this.max.x ||
            box.max.y < this.min.y || box.min.y > this.max.y ||
            box.max.z < this.min.z || box.min.z > this.max.z ?
            false :
            true;
    }

    intersectsSphere(sphere: Sphere): boolean {
        const closestPoint = new Vector3();
        // Find the point on the AABB closest to the sphere center.
        this.clampPoint(sphere.center, closestPoint);

        // If that point is inside the sphere, the AABB and sphere intersect.
        return closestPoint.distanceToSquared(sphere.center) <=
            (sphere.radius * sphere.radius);
    }

    intersectsPlane(plane: Plane): boolean {
        // We compute the minimum and maximum dot product values. If those values
        // are on the same side (back or front) of the plane, then there is no
        // intersection.s
        let min, max;

        if (plane.normal.x > 0) {
            min = plane.normal.x * this._min.x;
            max = plane.normal.x * this._max.x;

        } else {
            min = plane.normal.x * this._max.x;
            max = plane.normal.x * this._min.x;
        }

        if (plane.normal.y > 0) {
            min += plane.normal.y * this._min.y;
            max += plane.normal.y * this._max.y;

        } else {
            min += plane.normal.y * this._max.y;
            max += plane.normal.y * this._min.y;
        }

        if (plane.normal.z > 0) {
            min += plane.normal.z * this._min.z;
            max += plane.normal.z * this._max.z;

        } else {
            min += plane.normal.z * this._max.z;
            max += plane.normal.z * this._min.z;
        }

        return (min <= -plane.constant && max >= -plane.constant);
    }

    // TODO: Check rewrite part
    intersectsTriangle(triangle: Triangle): boolean {
        // triangle centered vertices
        const v0 = new Vector3();
        const v1 = new Vector3();
        const v2 = new Vector3();

        // triangle edge vectors
        const f0 = new Vector3();
        const f1 = new Vector3();
        const f2 = new Vector3();

        const center = new Vector3();
        const extents = new Vector3();

        const triangleNormal = new Vector3();

        if (this.isEmpty()) {
            return false;
        }

        // compute box center and extents
        this.getCenter(center);
        extents.subVectors(this.max, center);

        // translate triangle to aabb origin
        v0.subVectors(triangle.a, center);
        v1.subVectors(triangle.b, center);
        v2.subVectors(triangle.c, center);

        // compute edge vectors for triangle
        f0.subVectors(v1, v0);
        f1.subVectors(v2, v1);
        f2.subVectors(v0, v2);

        // test against axes that are given by cross product combinations of the
        // edges of the triangle and the edges of the aabb make an axis testing
        // of each of the 3 sides of the aabb against each of the 3 sides of the
        // triangle = 9 axis of separation axis_ij = u_i x f_j (u0, u1, u2 =
        // face normals of aabb = x,y,z axes vectors since aabb is axis aligned)
        let axes = [
            0, -f0.z, f0.y, 0, -f1.z, f1.y, 0, -f2.z, f2.y,
            f0.z, 0, -f0.x, f1.z, 0, -f1.x, f2.z, 0, -f2.x,
            -f0.y, f0.x, 0, -f1.y, f1.x, 0, -f2.y, f2.x, 0
        ];
        if (!this._satForAxes(axes, v0, v1, v2, extents)) {
            return false;
        }

        // test 3 face normals from the aabb
        axes = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        if (!this._satForAxes(axes, v0, v1, v2, extents)) {
            return false;
        }

        // finally testing the face normal of the triangle
        // use already existing triangle edge vectors here
        triangleNormal.crossVectors(f0, f1);
        axes = [triangleNormal.x, triangleNormal.y, triangleNormal.z];
        return this._satForAxes(axes, v0, v1, v2, extents);
    }

    private _satForAxes(
        axes: number[], v0: Vector3, v1: Vector3, v2: Vector3,
        extents: Vector3): boolean {
        let i, j;
        const testAxis = new Vector3();

        for (i = 0, j = axes.length - 3; i <= j; i += 3) {
            testAxis.fromArray(axes, i);
            // project the aabb onto the seperating axis
            const r = extents.x * Math.abs(testAxis.x) +
                extents.y * Math.abs(testAxis.y) + extents.z * Math.abs(testAxis.z);
            // project all 3 vertices of the triangle onto the seperating axis
            const p0 = v0.dot(testAxis);
            const p1 = v1.dot(testAxis);
            const p2 = v2.dot(testAxis);
            // actual test, basically see if either of the most extreme of the
            // triangle points intersects r
            if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
                // points of the projected triangle are outside the projected
                // half-length of the aabb the axis is seperating and we can exit
                return false;
            }
        }
        return true;
    }

    clampPoint(point: Vector3, target = new Vector3()): Vector3 {
        return target.copy(point).clamp(this._min, this._max);
    }

    distanceToPoint(point: Vector3): number {
        const v1 = new Vector3();
        const clampedPoint = v1.copy(point).clamp(this._min, this._max);
        return clampedPoint.sub(point).length();
    }

    getBoundingSphere(target = new Sphere()): Sphere {
        const v1 = new Vector3();
        this.getCenter(target.center);
        target.radius = this.getSize(v1).length() * 0.5;
        return target;
    }

    intersect(box: Box3): Box3 {
        this._min.max(box.min);
        this._max.min(box.max);
        // ensure that if there is no overlap, the result is fully empty, not
        // slightly empty with non-inf/+inf values that will cause subsequence
        // intersects to erroneously return valid values.
        if (this.isEmpty()) {
            this.makeEmpty();
        }
        return this;
    }

    union(box: Box3): Box3 {
        this._min.min(box.min);
        this._max.max(box.max);
        return this;
    }

    applyMatrix4(matrix: Matrix4): Box3 {
      const points = [
        new Vector3(), new Vector3(), new Vector3(), new Vector3(),
        new Vector3(), new Vector3(), new Vector3(), new Vector3()
      ];

      // transform of empty box is an empty box.
      if (this.isEmpty()) {
        return this;
      }

      // NOTE: I am using a binary pattern to specify all 2^3 combinations below
      points[0]
          .setXYZ(this.min.x, this.min.y, this.min.z)
          .applyMatrix4(matrix);  // 000
      points[1]
          .setXYZ(this.min.x, this.min.y, this.max.z)
          .applyMatrix4(matrix);  // 001
      points[2]
          .setXYZ(this.min.x, this.max.y, this.min.z)
          .applyMatrix4(matrix);  // 010
      points[3]
          .setXYZ(this.min.x, this.max.y, this.max.z)
          .applyMatrix4(matrix);  // 011
      points[4]
          .setXYZ(this.max.x, this.min.y, this.min.z)
          .applyMatrix4(matrix);  // 100
      points[5]
          .setXYZ(this.max.x, this.min.y, this.max.z)
          .applyMatrix4(matrix);  // 101
      points[6]
          .setXYZ(this.max.x, this.max.y, this.min.z)
          .applyMatrix4(matrix);  // 110
      points[7]
          .setXYZ(this.max.x, this.max.y, this.max.z)
          .applyMatrix4(matrix);  // 111

      this.setFromPoints(points);

      return this;
    }

    translate(offset: Vector3): Box3 {
        this._min.add(offset);
        this._max.add(offset);
        return this;
    }

    equals(box: Box3): boolean {
        return box.min.equals(this.min) && box.max.equals(this.max);
    }
}
