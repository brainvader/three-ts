import { Matrix4 } from './Matrix4';
import { Quaternion } from './Quaternion';
import { BufferAttribute } from '../core/BufferAttribute';

export class Vector4 {
    private _x: number;
    private _y: number;
    private _z: number;
    private _w: number;

    private _isVector4: boolean;

    constructor(x = 0, y = 0, z = 0, w = 1) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;
        this._isVector4 = true;
    }

    get x(): number {
        return this._x;
    }

    set x(value: number) {
        this._x = value;
    }

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        this._y = value;
    }

    get z(): number {
        return this._z;
    }

    set z(value: number) {
        this._z = value;
    }

    get w(): number {
        return this._w;
    }

    set w(value: number) {
        this._w = value;
    }

    get isVector4(): boolean {
        return this._isVector4;
    }

    setAll(x: number, y: number, z: number, w: number) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;

        return this;
    }

    setComponent(index: number, value: number): Vector4 {
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
        case 3:
          this._w = value;
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
            case 3:
                return this._w;
            default:
                throw new Error('index is out of range: ' + index);
        }
    }

    clone(): Vector4 {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    copy(v: Vector4): Vector4 {
        this._x = v.x;
        this._y = v.y;
        this._z = v.z;
        this._w = (v.w !== undefined) ? v.w : 1;

        return this;
    }

    add(v: Vector4, w?: Vector4): Vector4 {
        if (w !== undefined) {
          console.warn(
              'THREE.Vector4: .add() now only accepts one argument. Use .addVectors( a, b ) instead.');
          return this.addVectors(v, w);
        }

        this._x += v.x;
        this._y += v.y;
        this._z += v.z;
        this._w += v.w;

        return this;
    }

    addScalar(s: number): Vector4 {
        this._x += s;
        this._y += s;
        this._z += s;
        this._w += s;

        return this;
    }

    addVectors(a: Vector4, b: Vector4): Vector4 {
        this._x = a.x + b.x;
        this._y = a.y + b.y;
        this._z = a.z + b.z;
        this._w = a.w + b.w;

        return this;
    }

    addScaledVector(v: Vector4, s: number): Vector4 {
        this._x += v.x * s;
        this._y += v.y * s;
        this._z += v.z * s;
        this._w += v.w * s;

        return this;
    }

    sub(v: Vector4, w?: Vector4): Vector4 {
        if (w !== undefined) {
            console.warn(
                'THREE.Vector4: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.');
            return this.subVectors(v, w);
        }

        this._x -= v.x;
        this._y -= v.y;
        this._z -= v.z;
        this._w -= v.w;

        return this;
    }

    subScalar(s: number): Vector4 {
        this._x -= s;
        this._y -= s;
        this._z -= s;
        this._w -= s;

        return this;
    }

    subVectors(a: Vector4, b: Vector4): Vector4 {
        this._x = a.x - b.x;
        this._y = a.y - b.y;
        this._z = a.z - b.z;
        this._w = a.w - b.w;

        return this;
    }

    multiplyScalar(scalar: number): Vector4 {
        this._x *= scalar;
        this._y *= scalar;
        this._z *= scalar;
        this._w *= scalar;

        return this;
    }

    applyMatrix4(m: Matrix4): Vector4 {
        const x = this._x;
        const y = this._y;
        const z = this._z;
        const w = this._w;
        const e = m.elements;

        this._x = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
        this._y = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
        this._z = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
        this._w = e[3] * x + e[7] * y + e[11] * z + e[15] * w;

        return this;
    }

    divideScalar(scalar: number): Vector4 {
        return this.multiplyScalar(1 / scalar);
    }

    setAxisAngleFromQuaternion(q: Quaternion): Vector4 {
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm

        // q is assumed to be normalized
        this._w = 2 * Math.acos(q.w);

        const s = Math.sqrt(1 - q.w * q.w);

        if (s < 0.0001) {
            this._x = 1;
            this._y = 0;
            this._z = 0;

        } else {
            this._x = q.x / s;
            this._y = q.y / s;
            this._z = q.z / s;
        }

        return this;
    }

    setAxisAngleFromRotationMatrix(m: Matrix4): Vector4 {
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        let angle, x, y, z;  // variables for result
        const epsilon = 0.01;  // margin to allow for rounding errors
        const epsilon2 = 0.1;  // margin to distinguish between 0 and 180 degrees

        const te = m.elements;

        const m11 = te[0], m12 = te[4], m13 = te[8];
        const m21 = te[1], m22 = te[5], m23 = te[9];
        const m31 = te[2], m32 = te[6], m33 = te[10];

        if ((Math.abs(m12 - m21) < epsilon) && (Math.abs(m13 - m31) < epsilon) &&
            (Math.abs(m23 - m32) < epsilon)) {
            // singularity found
            // first check for identity matrix which must have +1 for all terms
            // in leading diagonal and zero in other terms

            if ((Math.abs(m12 + m21) < epsilon2) &&
                (Math.abs(m13 + m31) < epsilon2) &&
                (Math.abs(m23 + m32) < epsilon2) &&
                (Math.abs(m11 + m22 + m33 - 3) < epsilon2)) {
                // this singularity is identity matrix so angle = 0

                this.setAll(1, 0, 0, 0);

                return this;  // zero angle, arbitrary axis
            }

            // otherwise this singularity is angle = 180

            angle = Math.PI;

            const xx = (m11 + 1) / 2;
            const yy = (m22 + 1) / 2;
            const zz = (m33 + 1) / 2;
            const xy = (m12 + m21) / 4;
            const xz = (m13 + m31) / 4;
            const yz = (m23 + m32) / 4;

            if ((xx > yy) && (xx > zz)) {
                // m11 is the largest diagonal term

                if (xx < epsilon) {
                    x = 0;
                    y = 0.707106781;
                    z = 0.707106781;

                } else {
                    x = Math.sqrt(xx);
                    y = xy / x;
                    z = xz / x;
                }

            } else if (yy > zz) {
                // m22 is the largest diagonal term

                if (yy < epsilon) {
                    x = 0.707106781;
                    y = 0;
                    z = 0.707106781;

                } else {
                    y = Math.sqrt(yy);
                    x = xy / y;
                    z = yz / y;
                }

            } else {
                // m33 is the largest diagonal term so base result on this

                if (zz < epsilon) {
                    x = 0.707106781;
                    y = 0.707106781;
                    z = 0;

                } else {
                    z = Math.sqrt(zz);
                    x = xz / z;
                    y = yz / z;
                }
            }

            this.setAll(x, y, z, angle);

            return this;  // return 180 deg rotation
        }

        // as we have reached here there are no singularities so we can handle
        // normally

        let s = Math.sqrt(
            (m32 - m23) * (m32 - m23) + (m13 - m31) * (m13 - m31) +
            (m21 - m12) * (m21 - m12));  // used to normalize

        if (Math.abs(s) < 0.001) {
            s = 1;
        }

        // prevent divide by zero, should not happen if matrix is orthogonal and
        // should be caught by singularity test above, but I've left it in just in
        // case

        this._x = (m32 - m23) / s;
        this._y = (m13 - m31) / s;
        this._z = (m21 - m12) / s;
        this._w = Math.acos((m11 + m22 + m33 - 1) / 2);

        return this;
    }

    min(v: Vector4): Vector4 {
      this._x = Math.min(this._x, v.x);
      this._y = Math.min(this._y, v.y);
      this._z = Math.min(this._z, v.z);
      this._w = Math.min(this._w, v.w);

      return this;
    }

    max(v: Vector4): Vector4 {
        this._x = Math.max(this._x, v.x);
        this._y = Math.max(this._y, v.y);
        this._z = Math.max(this._z, v.z);
        this._w = Math.max(this._w, v.w);

        return this;
    }

    clamp(min: Vector4, max: Vector4): Vector4 {
        // assumes min < max, componentwise

        this._x = Math.max(min.x, Math.min(max.x, this._x));
        this._y = Math.max(min.y, Math.min(max.y, this._y));
        this._z = Math.max(min.z, Math.min(max.z, this._z));
        this._w = Math.max(min.w, Math.min(max.w, this._w));

        return this;
    }

    clampScalar(minVal: number, maxVal: number): Vector4 {
        let min, max;
        if (min === undefined) {
            min = new Vector4();
            max = new Vector4();
        }

        min.set(minVal, minVal, minVal, minVal);
        max.set(maxVal, maxVal, maxVal, maxVal);

        return this.clamp(min, max);
    }

    clampLength(min: number, max: number): Vector4 {
        const length = this.length();

        return this.divideScalar(length || 1)
            .multiplyScalar(Math.max(min, Math.min(max, length)));
    }

    floor(): Vector4 {
        this._x = Math.floor(this._x);
        this._y = Math.floor(this._y);
        this._z = Math.floor(this._z);
        this._w = Math.floor(this._w);

        return this;
    }

    ceil(): Vector4 {
        this._x = Math.ceil(this._x);
        this._y = Math.ceil(this._y);
        this._z = Math.ceil(this._z);
        this._w = Math.ceil(this._w);

        return this;
    }

    round(): Vector4 {
        this._x = Math.round(this._x);
        this._y = Math.round(this._y);
        this._z = Math.round(this._z);
        this._w = Math.round(this._w);

        return this;
    }

    roundToZero(): Vector4 {
        this._x = (this._x < 0) ? Math.ceil(this._x) : Math.floor(this._x);
        this._y = (this._y < 0) ? Math.ceil(this._y) : Math.floor(this._y);
        this._z = (this._z < 0) ? Math.ceil(this._z) : Math.floor(this._z);
        this._w = (this._w < 0) ? Math.ceil(this._w) : Math.floor(this._w);

        return this;
    }

    negate(): Vector4 {
        this._x = -this._x;
        this._y = -this._y;
        this._z = -this._z;
        this._w = -this._w;

        return this;
    }

    dot(v: Vector4): number {
        return this._x * v.x + this._y * v.y + this._z * v.z + this._w * v.w;
    }

    lengthSq(): number {
        return this._x * this._x + this._y * this._y + this._z * this._z +
            this._w * this._w;
    }

    length(): number {
        return Math.sqrt(
            this._x * this._x + this._y * this._y + this._z * this._z +
            this._w * this._w);
    }

    manhattanLength(): number {
        return Math.abs(this._x) + Math.abs(this._y) + Math.abs(this._z) +
            Math.abs(this._w);
    }

    normalize() {
        return this.divideScalar(this.length() || 1);
    }

    setLength(length: number): Vector4 {
        return this.normalize().multiplyScalar(length);
    }

    lerp(v: Vector4, alpha: number): Vector4 {
        this._x += (v.x - this._x) * alpha;
        this._y += (v.y - this._y) * alpha;
        this._z += (v.z - this._z) * alpha;
        this._w += (v.w - this._w) * alpha;

        return this;
    }

    lerpVectors(v1: Vector4, v2: Vector4, alpha: number): Vector4 {
        return this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
    }

    equals(v: Vector4) {
        return (
            (v.x === this._x) && (v.y === this._y) && (v.z === this._z) &&
            (v.w === this._w));
    }

    fromArray(array: number[], offset = 0): Vector4 {
        this._x = array[offset];
        this._y = array[offset + 1];
        this._z = array[offset + 2];
        this._w = array[offset + 3];

        return this;
    }

    toArray(array = [], offset = 0): number[] {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        array[offset + 3] = this.w;

        return array;
    }

    fromBufferAttribute(attribute: BufferAttribute, index: number): Vector4 {
        this._x = attribute.getX(index);
        this._y = attribute.getY(index);
        this._z = attribute.getZ(index);
        this._w = attribute.getW(index);

        return this;
    }
}
