import { Object3D } from '../../core/Object3D';
import { Object3DType } from '../Object3DType';

import { Matrix4 } from '../../math/Matrix4';
import { Vector3 } from '../../math/Vector3';
import { CameraType } from './constants';

export  class Camera extends Object3D {
    private _matrixWorldInverse: Matrix4;
    private _projectionMatrix: Matrix4;
    private _projectionMatrixInverse: Matrix4;
    private _cameraType: CameraType;

    constructor() {
        super();
        this._type = Object3DType.Camera;
        this._cameraType = CameraType.Basic;
        this._matrixWorldInverse = new Matrix4();
        this._projectionMatrix = new Matrix4();
        this._projectionMatrixInverse = new Matrix4();
    }

    get id(): number {
        return this._id;
    }

    get matrixWorldInverse() {
        return this._matrixWorldInverse;
    }

    get projectionMatrix() {
        return this._projectionMatrix;
    }

    get projectionMatrixInverse() {
        return this._projectionMatrixInverse;
    }

    copy(source: Camera, recursive?): Camera {
        super.copy(source, recursive);
        this._matrixWorldInverse.copy(source.matrixWorldInverse);
        this._projectionMatrix.copy(source.projectionMatrix);
        this._projectionMatrixInverse.copy(source.projectionMatrixInverse);
        return this;
    }

    getWorldDirection(target = new Vector3()): Vector3 {
        this.updateMatrixWorld(true);
        const e = this.matrixWorld.elements;
        return target.setXYZ(-e[8], -e[9], -e[10]).normalize();
    }

    updateMatrixWorld(force?: boolean) {
        super.updateMatrixWorld(force);
        this.matrixWorldInverse.getInverse(this.matrixWorld);
    }

    clone(): Camera {
        return new Camera().copy(this);
    }
}
