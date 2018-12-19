import { Vector3 } from './Vector3';
import { MathUtil } from '../utils/MathUtil';
import { Matrix4 } from './Matrix4';

export class Line3 {
    constructor(
        private _start =  new Vector3(),
        private _end = new Vector3()
    ) {}

    get start(): Vector3 {
        return this._start;
    }

    get end(): Vector3 {
        return this._end;
    }

    setAll(start: Vector3, end: Vector3): Line3 {
        this._start.copy(start);
        this._end.copy(end);
        return this;
    }

    clone(): Line3 {
        return new Line3().copy(this);
    }

    copy(line: Line3): Line3 {
        this._start.copy(line.start);
        this._end.copy(line.end);
        return this;
    }

    getCenter(target  = new Vector3()): Vector3 {
        return target.addVectors(this._start, this._end).multiplyScalar(0.5);
    }

    delta(target = new Vector3()): Vector3 {
        return target.subVectors(this._end, this._start);
    }

    distanceSq(): number {
        return this._start.distanceToSquared(this._end);
    }

    distance() {
        return this._start.distanceTo(this._end);
    }

    at(t: number, target = new Vector3()): Vector3 {
        return this.delta(target).multiplyScalar(t).add(this._start);
    }

    closestPointToPointParameter(point: Vector3, clampToLine: boolean): number {
        const startP = new Vector3();
        const startEnd = new Vector3();
        startP.subVectors(point, this._start);
        startEnd.subVectors(this._end, this._start);

        const startEnd2 = startEnd.dot(startEnd);
        const startEnd_startP = startEnd.dot(startP);

        let t = startEnd_startP / startEnd2;

        if (clampToLine) {
            t = MathUtil.clamp(t, 0, 1);
        }
        return t;
    }

    closestPointToPoint(point: Vector3, clampToLine: boolean, target = new Vector3()): Vector3 {
        const t = this.closestPointToPointParameter(point, clampToLine);
        return this.delta(target).multiplyScalar(t).add(this._start);
    }

    applyMatrix4(matrix: Matrix4): Line3 {
        this._start.applyMatrix4(matrix);
        this._end.applyMatrix4(matrix);
        return this;
    }

    equals(line: Line3): boolean {
        return line.start.equals(this._start) && line.end.equals(this._end);
    }
}
