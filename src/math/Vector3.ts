import { MathUtil } from '../utils/MathUtil';
import { Matrix3 } from './Matrix3';
import { Matrix4 } from './Matrix4';
import { Spherical } from './Spherical';
import { Cylindrical } from './Cylindrical';
import { Quaternion } from './Quaternion';
import { BufferAttribute } from '../core/BufferAttribute';
import { Euler } from './Euler';

export class Vector3 {

    constructor(x = 0, y = 0, z = 0) {
        this._x = x;
        this._y = y;
        this._z = z;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    get z(): number {
        return this._z;
    }

    set x(x: number) {
        this._x = x;
    }

    set y(y: number) {
        this._y = y;
    }

    set z(z: number) {
        this._z = z;
    }

    get isVector3(): boolean {
        return this._isVector3;
    }

    private _x: number;
    private _y: number;
    private _z: number;

    private _isVector3: boolean;

    setXYZ(x: number, y: number, z: number): Vector3 {
        this._x = x;
        this._y = y;
        this._z = z;
        return this;
    }

    setScalar(scalar: number) {
        this._x = scalar;
        this._y = scalar;
        this._z = scalar;

        return this;
    }

    setComponent(index: number, value: number): Vector3 {
        switch (index) {
            case 0:
                this._x = value;
                break;
            case 1:
                this._y = value;
                break;
            case 2:
                this._z = value;
                break;
            default:
                throw new Error('index is out of range: ' + index);
        }

        return this;
    }

    getComponent(index: number): number {
        switch (index) {
            case 0:
                return this._x;
            case 1:
                return this._y;
            case 2:
                return this._z;
            default:
                throw new Error('index is out of range: ' + index);
        }
    }

    clone(): Vector3 {
        return new Vector3(this._x, this._y, this._z);
    }

    copy(v: Vector3): Vector3 {
        this._x = v.x;
        this._y = v.y;
        this._z = v.z;

        return this;
    }

    add(v: Vector3, w?: Vector3): Vector3 {
        if (w !== undefined) {
            console.warn('THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead.');
            return this.addVectors(v, w);
        }

        this._x += v.x;
        this._y += v.y;
        this._z += v.z;

        return this;
    }

    addScalar(s: number): Vector3 {
        this._x += s;
        this._y += s;
        this._z += s;

        return this;
    }

    addVectors(a: Vector3, b: Vector3): Vector3 {
        this._x = a.x + b.x;
        this._y = a.y + b.y;
        this._z = a.z + b.z;

        return this;
    }

    addScaledVector(v: Vector3, s: number): Vector3 {
        this._x += v.x * s;
        this._y += v.y * s;
        this._z += v.z * s;

        return this;
    }

    sub(v: Vector3, w?: Vector3): Vector3 {
        if (w !== undefined) {
            console.warn(
                'THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.');
            return this.subVectors(v, w);
        }

        this._x -= v.x;
        this._y -= v.y;
        this._z -= v.z;

        return this;
    }

    subScalar(s: number): Vector3 {
        this._x -= s;
        this._y -= s;
        this._z -= s;

        return this;
    }

    subVectors(a: Vector3, b: Vector3): Vector3 {
        this._x = a.x - b.x;
        this._y = a.y - b.y;
        this._z = a.z - b.z;

        return this;
    }

    multiply(v: Vector3, w: Vector3): Vector3 {
        if (w !== undefined) {
            console.warn('THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.');
            return this.multiplyVectors(v, w);
        }

        this._x *= v.x;
        this._y *= v.y;
        this._z *= v.z;

        return this;
    }

    multiplyScalar(scalar: number): Vector3 {
        this._x *= scalar;
        this._y *= scalar;
        this._z *= scalar;

        return this;
    }

    multiplyVectors(a: Vector3, b: Vector3): Vector3 {
        this._x = a.x * b.x;
        this._y = a.y * b.y;
        this._z = a.z * b.z;

        return this;
    }

    applyEuler(euler: Euler): Vector3 {
        const quaternion = new Quaternion();
        return this.applyQuaternion(quaternion.setFromEuler(euler));
    }

    applyAxisAngle(axis: Vector3, angle: number): Vector3 {
        const quaternion = new Quaternion();
        return this.applyQuaternion(quaternion.setFromAxisAngle(axis, angle));
    }

    applyMatrix3(m: Matrix3): Vector3 {
        const x = this._x;
        const y = this._y;
        const z = this._z;
        const e = m.elements;

        this._x = e[0] * x + e[3] * y + e[6] * z;
        this._y = e[1] * x + e[4] * y + e[7] * z;
        this._z = e[2] * x + e[5] * y + e[8] * z;

        return this;
    }

    applyMatrix4(m: Matrix4): Vector3 {
        const x = this._x;
        const y = this._y;
        const z = this._z;
        const e = m.elements;

        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

        this._x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        this._y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        this._z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

        return this;
    }

    applyQuaternion(q: Quaternion): Vector3 {
        const x = this._x;
        const y = this._y;
        const z = this._z;
        const qx = q.x;
        const qy = q.y;
        const qz = q.z;
        const qw = q.w;

        // calculate quat * vector
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;

        // calculate result * inverse quat
        this._x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this._y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this._z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        return this;
    }

    project(camera) {
        return this.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
    }

    unproject (camera): Vector3 {
        const matrix = new Matrix4();
        return this.applyMatrix4( matrix.getInverse( camera.projectionMatrix ) ).applyMatrix4( camera.matrixWorld );
    }

    transformDirection(m: Matrix4): Vector3 {
        // vector interpreted as a direction
        const x = this._x;
        const y = this._y;
        const z = this._z;
        const e = m.elements;

        this._x = e[0] * x + e[4] * y + e[8] * z;
        this._y = e[1] * x + e[5] * y + e[9] * z;
        this._z = e[2] * x + e[6] * y + e[10] * z;

        return this.normalize();
    }

    divide(v: Vector3): Vector3 {
        this._x /= v.x;
        this._y /= v.y;
        this._z /= v.z;

        return this;
    }

    // TODO: prevent zero division
    divideScalar(scalar: number): Vector3 {
        return this.multiplyScalar(1 / scalar);
    }

    min(v: Vector3): Vector3 {
        this._x = Math.min(this._x, v.x);
        this._y = Math.min(this._y, v.y);
        this._z = Math.min(this._z, v.z);

        return this;
    }

    max(v: Vector3): Vector3 {
        this._x = Math.max(this._x, v.x);
        this._y = Math.max(this._y, v.y);
        this._z = Math.max(this._z, v.z);

        return this;
    }

    // TODO: rename parameters like upperBound and lowerBound
    clamp(min: Vector3, max: Vector3): Vector3 {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        this.z = Math.max(min.z, Math.min(max.z, this.z));

        return this;
    }

    clampScalar(minVal: number, maxVal: number): Vector3 {
        const min = new Vector3();
        const max = new Vector3();

        min.setXYZ(minVal, minVal, minVal);
        max.setXYZ(maxVal, maxVal, maxVal);

        return this.clamp(min, max);
    }

    clampLength(min: number, max: number): Vector3 {
        const length = this.length();
        return this.divideScalar(length || 1)
            .multiplyScalar(MathUtil.clamp(length, min, max));
    }

    floor(): Vector3 {
        this._x = Math.floor(this._x);
        this._y = Math.floor(this._y);
        this._z = Math.floor(this._z);

        return this;
    }

    ceil(): Vector3 {
        this._x = Math.ceil(this._x);
        this._y = Math.ceil(this._y);
        this._z = Math.ceil(this._z);

        return this;
    }

    round(): Vector3 {
        this._x = Math.round(this._x);
        this._y = Math.round(this._y);
        this._z = Math.round(this._z);

        return this;
    }

    roundToZero(): Vector3 {
        this._x = (this._x < 0) ? Math.ceil(this._x) : Math.floor(this._x);
        this._y = (this._y < 0) ? Math.ceil(this._y) : Math.floor(this._y);
        this._z = (this._z < 0) ? Math.ceil(this._z) : Math.floor(this._z);

        return this;
    }

    negate(): Vector3 {
        this._x = -this._x;
        this._y = -this._y;
        this._z = -this._z;

        return this;
    }

    dot(v: Vector3): number {
        return this._x * v.x + this._y * v.y + this._z * v.z;
    }

    lengthSq(): number {
        return this._x * this._x + this._y * this._y + this._z * this._z;
    }

    length(): number {
        return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
    }

    manhattanLength(): number {
        return Math.abs(this._x) + Math.abs(this._y) + Math.abs(this._z);
    }

    normalize(): Vector3 {
        return this.divideScalar(this.length() || 1);
    }

    setLength(length: number): Vector3 {
        return this.normalize().multiplyScalar(length);
    }

    lerp(v: Vector3, alpha: number): Vector3 {
        this._x += (v.x - this._x) * alpha;
        this._y += (v.y - this._y) * alpha;
        this._z += (v.z - this._z) * alpha;

        return this;
    }

    lerpVectors(v1: Vector3, v2: Vector3, alpha: number): Vector3 {
        return this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
    }

    cross(v: Vector3): Vector3 {
        // var ax = v.x
        // const ay = v.y, az = a.z;
        // var bx = b.x, by = b.y, bz = b.z;

        this._x = this._y * v.z - this._z * v.y;
        this._y = this._z * v.x - this._x * v.z;
        this._z = this._x * v.y - this._y * v.x;

        return this;
    }

    crossVectors(a: Vector3, b: Vector3): Vector3 {
        const ax = a.x, ay = a.y, az = a.z;
        const bx = b.x, by = b.y, bz = b.z;

        this._x = ay * bz - az * by;
        this._y = az * bx - ax * bz;
        this._z = ax * by - ay * bx;

        return this;
    }

    projectOnVector(vector: Vector3): Vector3 {
        const scalar = vector.dot(this) / vector.lengthSq();
        return this.copy(vector).multiplyScalar( scalar );
    }

    projectOnPlane(planeNormal: Vector3): Vector3 {
        const v1 = new Vector3();
        v1.copy(this).projectOnVector(planeNormal);
        return this.sub(v1);
    }

    reflect(normal: Vector3): Vector3 {
        // reflect incident vector off plane orthogonal to normal
        // normal is assumed to have unit length
        const v1 = new Vector3();
        return this.sub(v1.copy(normal).multiplyScalar(2 * this.dot(normal)));
    }

    angleTo(v: Vector3): number {
        const theta = this.dot(v) / (Math.sqrt(this.lengthSq() * v.lengthSq()));
        // clamp, to handle numerical problems
        return Math.acos(MathUtil.clamp(theta, -1, 1));
    }

    distanceTo(v: Vector3): number {
        return Math.sqrt(this.distanceToSquared(v));
    }

    distanceToSquared(v: Vector3): number {
        const dx = this._x - v.x;
        const dy = this._y - v.y;
        const dz = this._z - v.z;

        return dx * dx + dy * dy + dz * dz;
    }

    manhattanDistanceTo(v: Vector3): number {
        return Math.abs(this._x - v.x) + Math.abs(this._y - v.y) + Math.abs(this._z - v.z);
    }

    setFromSpherical(s: Spherical): Vector3 {
        return this.setFromSphericalCoords(s.radius, s.phi, s.theta);
    }

    setFromSphericalCoords(radius: number, phi: number, theta: number): Vector3 {
        const sinPhiRadius = Math.sin(phi) * radius;
        this._x = sinPhiRadius * Math.sin(theta);
        this._y = Math.cos(phi) * radius;
        this._z = sinPhiRadius * Math.cos(theta);
        return this;
    }

    setFromCylindrical(c: Cylindrical): Vector3 {
        return this.setFromCylindricalCoords(c.radius, c.theta, c.y);
    }

    setFromCylindricalCoords(radius: number, theta: number, y: number): Vector3 {
        this._x = radius * Math.sin(theta);
        this._y = y;
        this._z = radius * Math.cos(theta);

        return this;
    }

    setFromMatrixPosition(m: Matrix4): Vector3 {
        const e = m.elements;
        this._x = e[12];
        this._y = e[13];
        this._z = e[14];
        return this;
    }

    setFromMatrixScale(m: Matrix4): Vector3 {
        const sx = this.setFromMatrixColumn(m, 0).length();
        const sy = this.setFromMatrixColumn(m, 1).length();
        const sz = this.setFromMatrixColumn(m, 2).length();
        this._x = sx;
        this._y = sy;
        this._z = sz;
        return this;
    }

    setFromMatrixColumn(m: Matrix4, index: number): Vector3 {
        return this.fromArray(m.elements, index * 4);
    }

    equals(v: Vector3): boolean {
        return ((v.x === this._x) && (v.y === this._y) && (v.z === this._z));
    }

    fromArray(array: number[] | TypedArray, offset = 0): Vector3 {
        this._x = array[offset];
        this._y = array[offset + 1];
        this._z = array[offset + 2];

        return this;
    }

    toArray(array = [], offset = 0): number[] {
        array[offset] = this._x;
        array[offset + 1] = this._y;
        array[offset + 2] = this._z;
        return array;
    }

    fromBufferAttribute(attribute: BufferAttribute, index: number): Vector3 {
        this.x = attribute.getX(index);
        this.y = attribute.getY(index);
        this.z = attribute.getZ(index);
        return this;
    }
}
