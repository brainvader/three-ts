import { Line } from './Line';
import { BufferGeometryType, GeometryType } from './constatns';
import { Material } from '../materials/Material';
import { Object3DType } from './Object3DType';

export class LineLoop extends Line {
    constructor(geometry: BufferGeometryType | GeometryType, material: Material) {
        super(geometry, material);
        this._type = Object3DType.LineLoop;
    }
}
