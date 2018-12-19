import { BufferAttribute } from '../core/BufferAttribute';
import { Matrix3 } from './Matrix3';

export class Vector2 {
    private _x: number;
    private _y: number;
    private _isVector2: boolean;

    constructor(x = 0, y = 0) {
        this._x = x;
        this._y = y;
        this._isVector2 = true;
    }

    set x(value: number) {
        this._x = value;
    }

    set y(value: number) {
        this._y = value;
    }

    get width() {
        return this._x;
    }

    set width(value) {
        this._x = value;
    }

    get height() {
        return this._y;
    }

    set height(value) {
        this._y = value;
    }

    get isVector2(): boolean {
        return this._isVector2;
    }

    setXY(x: number, y: number): Vector2 {
        this._x = x;
        this._y = y;
        return this;
    }

    setScalar(scalar: number): Vector2 {
        this._x = scalar;
        this._y = scalar;

        return this;
    }

    setComponent(index: number, value: number): Vector2 {
        switch (index) {
            case 0: this._x = value; break;
            case 1: this._y = value; break;
            default: throw new Error('index is out of range: ' + index);
        }

        return this;
    }

    getComponent(index: number): number {
        switch (index) {
            case 0:
                return this._x;
            case 1:
                return this._y;
            default:
                throw new Error('index is out of range: ' + index);
        }
    }

    clone(): Vector2 {
        return new Vector2(this._x, this._y);
    }

    copy(v: Vector2): Vector2 {
        this._x = v.x;
        this._y = v.y;

        return this;
    }

    add(v: Vector2, w?: Vector2): Vector2 {
        if (w !== undefined) {
            console.warn(
                'THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead.');
            return this.addVectors(v, w);
        }

        this._x += v.x;
        this._y += v.y;

        return this;
    }

    addScalar(s: number): Vector2 {
        this._x += s;
        this._y += s;

        return this;
    }

    addVectors(a: Vector2, b: Vector2): Vector2 {
        this._x = a.x + b.x;
        this._y = a.y + b.y;

        return this;
    }

    addScaledVector(v: Vector2, s: number): Vector2 {
        this._x += v.x * s;
        this._y += v.y * s;

        return this;
    }

    scale(s: number): Vector2 {
        this._x *= s;
        this._y *= s;
        return this;
    }

    sub(v: Vector2, w?: Vector2): Vector2 {
        if (w !== undefined) {
            console.warn('THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.');
            return this.subVectors(v, w);
        }

        this._x -= v.x;
        this._y -= v.y;

        return this;
    }

    subScalar(s: number): Vector2 {
        this._x -= s;
        this._y -= s;

        return this;
    }

    subVectors(a: Vector2, b: Vector2): Vector2 {
        this._x = a.x - b.x;
        this._y = a.y - b.y;

        return this;
    }

    multiply(v: Vector2): Vector2 {
        this._x *= v.x;
        this._y *= v.y;

        return this;
    }

    multiplyScalar(scalar: number): Vector2 {
        this._x *= scalar;
        this._y *= scalar;

        return this;
    }

    divide(v: Vector2): Vector2 {
        this._x /= v.x;
        this._y /= v.y;
        return this;
    }

    divideScalar(s: number): Vector2 {
        return this.scale(1 / s);
    }

    applyMatrix3(m: Matrix3): Vector2 {
        const x = this._x;
        const y = this._y;
        const e = m.elements;
        this._x = e[0] * x + e[3] * y + e[6];
        this._y = e[1] * x + e[4] * y + e[7];
        return this;
    }

    min(v: Vector2): Vector2 {
        this._x = Math.min(this._x, v.x);
        this._y = Math.min(this._y, v.y);
        return this;
    }

    max(v: Vector2): Vector2 {
        this._x = Math.max(this._x, v.x);
        this._y = Math.max(this._y, v.y);
        return this;
    }

    clamp(min: Vector2, max: Vector2): Vector2 {
        this._x = Math.max(min.x, Math.min(max.x, this._x));
        this._y = Math.max(min.y, Math.min(max.y, this._y));
        return this;
    }

    clampScalar(maxVal: number, minVal: number): Vector2 {
        const min = new Vector2();
        const max = new Vector2();
        min.setXY(minVal, minVal);
        max.setXY(maxVal, maxVal);
        return this.clamp(min, max);
    }

    clampLength(min: number, max: number) {
        const length = this.length();
        const clamped = Math.max(min, Math.min(max, length));
        return this.divideScalar(length || 1).scale(clamped);
    }

    floor() {
        this._x = Math.floor(this._x);
        this._y = Math.floor(this._y);
    }

    ceil() {
        this._x = Math.ceil(this._x);
        this._y = Math.ceil(this._y);
    }

    round() {
        this._x = Math.round(this._x);
        this._y = Math.round(this._y);
    }

    roundToZero() {
        this._x = (this._x < 0) ? Math.ceil(this._x) : Math.floor(this._x);
        this._y = (this._y < 0) ? Math.ceil(this._y) : Math.floor(this._y);

        return this;
    }

    negate() {
        this._x = -this._x;
        this._y = -this._y;
    }

    dot(v: Vector2) {
        return this._x * v.x + this._y * v.y;
    }

    cross(v: Vector2) {
        return this._x * v.y - this._y * v.x;
    }

    lengthSq(): number {
        return this._x * this._x + this._y * this._y;
    }

    length(): number {
        return Math.sqrt(this.lengthSq());
    }

    manhattanLength(): number {
        return Math.abs(this._x) + Math.abs(this._y);
    }

    normalize(): Vector2 {
        return this.divideScalar(this.length() || 1);
    }

    angle(): number {
        let angle = Math.atan2(this._y, this._x);

        if (angle < 0) {
            angle += 2 * Math.PI;
        }
        return angle;
    }

    distanceTo(v: Vector2): number {
        return Math.sqrt(this.distanceToSquared(v));
    }

    distanceToSquared(v: Vector2): number {
        const dx = this._x - v.x;
        const dy = this._y - v.y;
        return dx * dx + dy * dy;
    }

    manhattanDistanceTo(v: Vector2): number {
        return Math.abs(this._x - v.x) + Math.abs(this._y - v.y);
    }

    setLength(length: number): Vector2 {
        return this.normalize().scale(length);
    }

    lerp(v: Vector2, alpha: number): Vector2 {
        this._x += (v.x - this._x) * alpha;
        this._y += (v.y - this._y) * alpha;
        return this;
    }

    lerpVectors(v1: Vector2, v2: Vector2, alpha: number) {
        return this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
    }

    equals(v: Vector2): boolean {
        return ((v.x === this._x) && (v.y === this._y));
    }

    fromArray(array: number[], offset = 0): Vector2 {
        this._x = array[offset];
        this._y = array[offset + 1];

        return this;
    }

    toArray(array = [], offset = 0): number[] {
        array[offset] = this._x;
        array[offset + 1] = this._y;
        return array;
    }

    fromBufferAttribute(attribute: BufferAttribute, index: number): Vector2 {
        this._x = attribute.getX(index);
        this._y = attribute.getY(index);
        return this;
    }

    rotateAround(center: Vector2, angle: number): Vector2 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const dx = this._x - center.x;
        const dy = this._y - center.y;

        this._x = dx * c - dy * s + center.x;
        this._y = dx * s + dy * c + center.y;

        return this;
    }
}
