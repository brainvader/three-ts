import { Camera } from '../../camera/Camera';
import { Vector2 } from '../../../math/Vector2';
import { Matrix4 } from '../../../math/Matrix4';

export class LightShadow {
    private _bias = 0;
    private _radius = 1;

    private _mapSize = new Vector2(512, 512);

    private _map = null;
    private _matrix = new Matrix4();

    constructor(private _camera: Camera) { }

    get camera() {
        return this._camera;
    }

    get bias() {
        return this._bias;
    }

    get radius() {
        return this._radius;
    }

    get mapSize() {
        return this._mapSize;
    }

    get matrix() {
        return this._matrix;
    }

    copy(source: LightShadow): LightShadow {
        this._camera = source.camera.clone();
        this._bias = source.bias;
        this._radius = source.radius;
        this._mapSize.copy(source.mapSize);
        return this;
    }

    clone () {
        return new LightShadow(this._camera).copy(this);
    }

    // toJSON() {
    //     const object = {};

    //     if (this.bias !== 0) {
    //         object.bias = this.bias;
    //     }
    //     if (this.radius !== 1) {
    //         object.radius = this.radius;
    //     }
    //     if (this.mapSize.x !== 512 || this.mapSize.y !== 512) {
    //         object.mapSize = this.mapSize.toArray();
    //     }

    //     object.camera = this.camera.toJSON(false).object;
    //     delete object.camera.matrix;

    //     return object;
    // }
}
