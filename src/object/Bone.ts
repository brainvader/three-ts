import { Object3D } from '../core/Object3D';
import { Object3DType } from './Object3DType';

export class Bone extends Object3D {
    constructor() {
        super();
        this._type = Object3DType.Bone;
    }
}
