import { Vector3 } from './Vector3';

export class Cylindrical {
    // distance from the origin to a point in the x-z plane
    private _radius: number;
    // counterclockwise angle in the x-z plane measured in radians from the
    // positive z-axis
    private _theta: number;
    // height above the x-z plane
    private _y: number;

    constructor(radius = 1.0, theta = 0, y = 0) {
        this._radius = radius;
        this._theta = theta;
        this._y = y;
    }

    get radius(): number {
        return this._radius;
    }

    get theta(): number {
        return this._theta;
    }

    get y(): number {
        return this._y;
    }

    setAll(radius: number, theta: number, y: number): Cylindrical {
        this._radius = radius;
        this._theta = theta;
        this._y = y;

        return this;
    }

    clone() {
        return new Cylindrical(this._radius, this._theta, this._y);
    }

    copy(other: Cylindrical): Cylindrical {
        this._radius = other.radius;
        this._theta = other.theta;
        this._y = other.y;

        return this;
    }

    setFromVector3(v: Vector3): Cylindrical {
        return this.setFromCartesianCoords(v.x, v.y, v.z);
    }

    setFromCartesianCoords(x: number, y: number, z: number): Cylindrical {
        this._radius = Math.sqrt(x * x + z * z);
        this._theta = Math.atan2(x, z);
        this._y = y;

        return this;
    }
}
