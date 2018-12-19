import { MathUtil } from '../utils/MathUtil';
import { Vector3 } from './Vector3';

export class Spherical {
    private _radius: number;
    // polar angle
    private _phi: number;
    // azimuthal angle
    private _theta: number;

    constructor(radius = 1.0, phi = 0.0, theta = 0) {
        this._radius = radius;
        this._phi = phi;
        this._theta = theta;
    }

    get radius(): number {
        return this._radius;
    }

    get phi(): number {
        return this._phi;
    }

    get theta(): number {
        return this._theta;
    }

    setAll(radius: number, phi: number, theta: number): Spherical {
        this._radius = radius;
        this._phi = phi;
        this._theta = theta;
        return this;
    }

    clone() {
        return new Spherical(this._radius, this._phi, this._theta);
    }

    copy(other: Spherical): Spherical {
        this._radius = other.radius;
        this._phi = other.phi;
        this._theta = other.theta;

        return this;
    }

    // restrict phi to be betwee EPS and PI-EPS
    makeSafe() {
        const EPS = 0.000001;
        this._phi = MathUtil.clamp(this._phi, EPS, Math.PI - EPS);
        return this;
    }

    setFromVector3(v: Vector3): Spherical {
        return this.setFromCartesianCoords(v.x, v.y, v.z);
    }

    setFromCartesianCoords(x: number, y: number, z: number): Spherical {
        this._radius = Math.sqrt(x * x + y * y + z * z);

        if (this._radius === 0) {
            this._theta = 0;
            this._phi = 0;

        } else {
            this._theta = Math.atan2(x, z);
            this._phi = Math.acos(MathUtil.clamp(y / this._radius, -1, 1));
        }

        return this;
    }
}
