import { MathUtil } from '../utils/MathUtil';
import { Matrix4 } from './Matrix4';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

export class Euler {
    // TODO: Use enum class
    static RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];
    static DefaultOrder  = 'XYZ';

    private _x: number;
    private _y: number;
    private _z: number;
    private _order: string;

    private _isEuler: boolean;

    private _onChangeCallback: () => void;

    constructor(x = 0, y = 0, z = 0, order = Euler.DefaultOrder) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._order = order;

        this._isEuler = true;
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

    get order(): string {
        return this._order;
    }

    set order(value: string) {
        this._order = value;
        this._onChangeCallback();
    }

    get isEuler(): boolean {
        return this._isEuler;
    }

    setAll(x: number, y: number, z: number, order: string): Euler {
        this._x = x;
        this._y = y;
        this._z = z;
        this._order = order || this._order;

        this._onChangeCallback();

        return this;
    }

    clone(): Euler {
        return new Euler(this._x, this._y, this._z, this._order);
    }

    copy(euler: Euler): Euler {
        this._x = euler.x;
        this._y = euler.y;
        this._z = euler.z;
        this._order = euler._order;

        this._onChangeCallback();

        return this;
    }

    setFromRotationMatrix(m: Matrix4, order: string, update = false): Euler {
        const clamp = MathUtil.clamp;

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        const te = m.elements;
        const m11 = te[0], m12 = te[4], m13 = te[8];
        const m21 = te[1], m22 = te[5], m23 = te[9];
        const m31 = te[2], m32 = te[6], m33 = te[10];

        order = order || this._order;

        if (order === 'XYZ') {
            this._y = Math.asin(clamp(m13, -1, 1));

            if (Math.abs(m13) < 0.99999) {
                this._x = Math.atan2(-m23, m33);
                this._z = Math.atan2(-m12, m11);

            } else {
                this._x = Math.atan2(m32, m22);
                this._z = 0;
            }

        } else if (order === 'YXZ') {
            this._x = Math.asin(-clamp(m23, -1, 1));

            if (Math.abs(m23) < 0.99999) {
                this._y = Math.atan2(m13, m33);
                this._z = Math.atan2(m21, m22);

            } else {
                this._y = Math.atan2(-m31, m11);
                this._z = 0;
            }

        } else if (order === 'ZXY') {
            this._x = Math.asin(clamp(m32, -1, 1));

            if (Math.abs(m32) < 0.99999) {
                this._y = Math.atan2(-m31, m33);
                this._z = Math.atan2(-m12, m22);

            } else {
                this._y = 0;
                this._z = Math.atan2(m21, m11);
            }

        } else if (order === 'ZYX') {
            this._y = Math.asin(-clamp(m31, -1, 1));

            if (Math.abs(m31) < 0.99999) {
                this._x = Math.atan2(m32, m33);
                this._z = Math.atan2(m21, m11);

            } else {
                this._x = 0;
                this._z = Math.atan2(-m12, m22);
            }

        } else if (order === 'YZX') {
            this._z = Math.asin(clamp(m21, -1, 1));

            if (Math.abs(m21) < 0.99999) {
                this._x = Math.atan2(-m23, m22);
                this._y = Math.atan2(-m31, m11);

            } else {
                this._x = 0;
                this._y = Math.atan2(m13, m33);
            }

        } else if (order === 'XZY') {
            this._z = Math.asin(-clamp(m12, -1, 1));

            if (Math.abs(m12) < 0.99999) {
                this._x = Math.atan2(m32, m22);
                this._y = Math.atan2(m13, m11);

            } else {
                this._x = Math.atan2(-m23, m33);
                this._y = 0;
            }

        } else {
            console.warn(
                'THREE.Euler: .setFromRotationMatrix() given unsupported order: ' +
                order);
        }

        this._order = order;

        if (update !== false) {
            this._onChangeCallback();
        }

        return this;
    }

    setFromQuaternion(q: Quaternion, order: string, update = false): Euler {
        const matrix = new Matrix4();
        matrix.makeRotationFromQuaternion(q);
        return this.setFromRotationMatrix(matrix, order, update);
    }

    setFromVector3(v: Vector3, order: string): Euler {
        return this.setAll(v.x, v.y, v.z, order || this._order);
    }

    reorder(newOrder: string): Euler {
        // WARNING: this discards revolution information -bhouston
        const q = new Quaternion();
        q.setFromEuler(this);
        return this.setFromQuaternion(q, newOrder);
    }

    equals(euler: Euler): boolean {
        return (euler._x === this._x) && (euler._y === this._y) &&
            (euler._z === this._z) && (euler._order === this._order);
    }

    fromArray(array: any[]): Euler {
        this._x = array[0];
        this._y = array[1];
        this._z = array[2];
        if (array[3] !== undefined) {
            this._order = array[3];
        }

        this._onChangeCallback();

        return this;
    }

    toArray(array = [], offset = 0): any[] {
        array[offset] = this._x;
        array[offset + 1] = this._y;
        array[offset + 2] = this._z;
        array[offset + 3] = this._order;

        return array;
    }

    toVector3(optionalResult: Vector3): Vector3 {
        if (optionalResult) {
            return optionalResult.setXYZ(this._x, this._y, this._z);
        } else {
            return new Vector3(this._x, this._y, this._z);
        }
    }

    onChange(callback: () => void): Euler {
        this._onChangeCallback = callback;
        return this;
    }
}
