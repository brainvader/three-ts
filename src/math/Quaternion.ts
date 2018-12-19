import { MathUtil } from '../utils/MathUtil';
import { Matrix4 } from './Matrix4';
import { Vector3 } from './Vector3';
import { Euler } from './Euler';

export class Quaternion {
    private _x: number;
    private _y: number;
    private _z: number;
    private _w: number;

    private _isQuaternion: boolean;
    private _onChangeCallback: () => void;

    static slerp(qa: Quaternion, qb: Quaternion, qm: Quaternion, t: number): Quaternion {
        return qm.copy( qa ).slerp( qb, t );
    }

    static slerpFlat(
        dst: number[], dstOffset: number, src0: number[], srcOffset0: number,
        src1: number[], srcOffset1: number, t: number) {
        // fuzz-free, array-based Quaternion SLERP operation
        let x0 = src0[srcOffset0 + 0];
        let y0 = src0[srcOffset0 + 1];
        let z0 = src0[srcOffset0 + 2];
        let w0 = src0[srcOffset0 + 3];

        const x1 = src1[srcOffset1 + 0];
        const y1 = src1[srcOffset1 + 1];
        const z1 = src1[srcOffset1 + 2];
        const w1 = src1[srcOffset1 + 3];

        if (w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1) {
            let s = 1 - t;
            const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1;
            const dir = (cos >= 0 ? 1 : -1);
            const sqrSin = 1 - cos * cos;

            // Skip the Slerp for tiny steps to avoid numeric problems:
            if (sqrSin > Number.EPSILON) {
                const sin = Math.sqrt(sqrSin);
                const len = Math.atan2(sin, cos * dir);

                s = Math.sin(s * len) / sin;
                t = Math.sin(t * len) / sin;
            }

            const tDir = t * dir;

            x0 = x0 * s + x1 * tDir;
            y0 = y0 * s + y1 * tDir;
            z0 = z0 * s + z1 * tDir;
            w0 = w0 * s + w1 * tDir;

            // Normalize in case we just did a lerp:
            if (s === 1 - t) {
                const f = 1 / Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0);

                x0 *= f;
                y0 *= f;
                z0 *= f;
                w0 *= f;
            }
        }

        dst[dstOffset] = x0;
        dst[dstOffset + 1] = y0;
        dst[dstOffset + 2] = z0;
        dst[dstOffset + 3] = w0;
    }

    constructor(x = 0, y = 0, z = 0, w = 1) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;
        this._isQuaternion = true;
    }

    get x(): number {
        return this._x;
    }

    set x(value: number) {
        this._x = value;
        this._onChangeCallback();
    }

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        this._y = value;
        this._onChangeCallback();
    }

    get z(): number {
        return this._z;
    }

    set z(value: number) {
        this._z = value;
        this._onChangeCallback();
    }

    get w(): number {
        return this._w;
    }

    set w(value: number) {
        this._w = value;
        this._onChangeCallback();
    }

    setAll(x: number, y: number, z: number, w: number): Quaternion {
        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;
        this._onChangeCallback();
        return this;
    }

    get isQuaternion(): boolean {
        return this._isQuaternion;
    }

    clone(): Quaternion {
        return new Quaternion(this._x, this._y, this._z, this._w);
    }

    copy(quaternion: Quaternion): Quaternion {
        this._x = quaternion.x;
        this._y = quaternion.y;
        this._z = quaternion.z;
        this._w = quaternion.w;

        this._onChangeCallback();

        return this;
    }

    setFromEuler(euler: Euler, update = true): Quaternion {
        if (!(euler && euler.isEuler)) {
            throw new Error('THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.');
        }

        const x = euler.x;
        const y = euler.y;
        const z = euler.z;
        const order = euler.order;

        // http://www.mathworks.com/matlabcentral/fileexchange/
        // 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
        // 	content/SpinCalc.m

        const cos = Math.cos;
        const sin = Math.sin;

        const c1 = cos(x / 2);
        const c2 = cos(y / 2);
        const c3 = cos(z / 2);

        const s1 = sin(x / 2);
        const s2 = sin(y / 2);
        const s3 = sin(z / 2);

        if (order === 'XYZ') {
            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'YXZ') {
            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;

        } else if (order === 'ZXY') {
            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'ZYX') {
            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;

        } else if (order === 'YZX') {
            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'XZY') {
            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;
        }

        if (update !== false) {
            this._onChangeCallback();
        }

        return this;
    }

    setFromAxisAngle(axis: Vector3, angle: number): Quaternion {
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

        // assumes axis is normalized

        const halfAngle = angle / 2, s = Math.sin(halfAngle);

        this._x = axis.x * s;
        this._y = axis.y * s;
        this._z = axis.z * s;
        this._w = Math.cos(halfAngle);

        this._onChangeCallback();

        return this;
    }

    setFromRotationMatrix(m: Matrix4): Quaternion {
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        const te = m.elements;
        const m11 = te[0], m12 = te[4], m13 = te[8], m21 = te[1], m22 = te[5];
        const m23 = te[9], m31 = te[2], m32 = te[6], m33 = te[10];

        const trace = m11 + m22 + m33;
        let s;

        if (trace > 0) {
            s = 0.5 / Math.sqrt(trace + 1.0);

            this._w = 0.25 / s;
            this._x = (m32 - m23) * s;
            this._y = (m13 - m31) * s;
            this._z = (m21 - m12) * s;

        } else if (m11 > m22 && m11 > m33) {
            s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

            this._w = (m32 - m23) / s;
            this._x = 0.25 * s;
            this._y = (m12 + m21) / s;
            this._z = (m13 + m31) / s;

        } else if (m22 > m33) {
            s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

            this._w = (m13 - m31) / s;
            this._x = (m12 + m21) / s;
            this._y = 0.25 * s;
            this._z = (m23 + m32) / s;

        } else {
            s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

            this._w = (m21 - m12) / s;
            this._x = (m13 + m31) / s;
            this._y = (m23 + m32) / s;
            this._z = 0.25 * s;
        }

        this._onChangeCallback();

        return this;
    }

    setFromUnitVectors(vFrom: Vector3, vTo: Vector3): Quaternion {
        // assumes direction vectors vFrom and vTo are normalized

        let v1 = new Vector3();
        let r;

        const EPS = 0.000001;

        if (v1 === undefined) {
            v1 = new Vector3();
        }

        r = vFrom.dot(vTo) + 1;

        if (r < EPS) {
            r = 0;

            if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
                v1.setXYZ(-vFrom.y, vFrom.x, 0);

            } else {
                v1.setXYZ(0, -vFrom.z, vFrom.y);
            }

        } else {
            v1.crossVectors(vFrom, vTo);
        }

        this._x = v1.x;
        this._y = v1.y;
        this._z = v1.z;
        this._w = r;

        return this.normalize();
    }

    angleTo(q: Quaternion): number {
        return 2 * Math.acos(Math.abs(MathUtil.clamp(this.dot(q), -1, 1)));
    }

    rotateTowards(q: Quaternion, step: number): Quaternion {
        const angle = this.angleTo(q);
        if (angle === 0) {
            return this;
        }
        const t = Math.min(1, step / angle);
        this.slerp(q, t);
        return this;
    }

    inverse(): Quaternion {
        // quaternion is assumed to have unit length
        return this.conjugate();
    }

    conjugate(): Quaternion {
        this._x *= -1;
        this._y *= -1;
        this._z *= -1;

        this._onChangeCallback();

        return this;
    }

    dot(q: Quaternion): number {
        return this._x * q.x + this._y * q.y + this._z * q.z + this._w * q.w;
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

    normalize(): Quaternion {
        let l = this.length();

        if (l === 0) {
            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._w = 1;

        } else {
            l = 1 / l;

            this._x = this._x * l;
            this._y = this._y * l;
            this._z = this._z * l;
            this._w = this._w * l;
        }

        this._onChangeCallback();

        return this;
    }

    multiply(q: Quaternion): Quaternion {
        return this.multiplyQuaternions(this, q);
    }

    premultiply(q: Quaternion): Quaternion {
        return this.multiplyQuaternions(q, this);
    }

    multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion {
        // from
        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

        const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
        const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

        this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        this._onChangeCallback();

        return this;
    }

    slerp(qb: Quaternion, t: number): Quaternion {
        if (t === 0) {
            return this;
        }
        if (t === 1) {
            return this.copy(qb);
        }

        const x = this._x;
        const y = this._y;
        const z = this._z;
        const w = this._w;

        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

        let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

        if (cosHalfTheta < 0) {
            this._w = -qb._w;
            this._x = -qb._x;
            this._y = -qb._y;
            this._z = -qb._z;

            cosHalfTheta = -cosHalfTheta;

        } else {
            this.copy(qb);
        }

        if (cosHalfTheta >= 1.0) {
            this._w = w;
            this._x = x;
            this._y = y;
            this._z = z;

            return this;
        }

        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

        if (sqrSinHalfTheta <= Number.EPSILON) {
            const s = 1 - t;
            this._w = s * w + t * this._w;
            this._x = s * x + t * this._x;
            this._y = s * y + t * this._y;
            this._z = s * z + t * this._z;

            return this.normalize();
        }

        const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
        const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        this._w = (w * ratioA + this._w * ratioB);
        this._x = (x * ratioA + this._x * ratioB);
        this._y = (y * ratioA + this._y * ratioB);
        this._z = (z * ratioA + this._z * ratioB);

        this._onChangeCallback();

        return this;
    }

    equals(quaternion: Quaternion): boolean {
        return (quaternion._x === this._x) && (quaternion._y === this._y) &&
            (quaternion._z === this._z) && (quaternion._w === this._w);
    }

    toArray(array = [], offset = 0): number[] {
        array[offset] = this._x;
        array[offset + 1] = this._y;
        array[offset + 2] = this._z;
        array[offset + 3] = this._w;

        return array;
    }

    onChange(callback: () => void) {
        this._onChangeCallback = callback;
        return this;
    }
}
