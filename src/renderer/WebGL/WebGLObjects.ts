import { WebGLInfo } from './WebGLInfo';
import { WebGLGeometries } from './WebGLGeometries';
import { BufferGeometry } from '../../core/BufferGeometry';
import { Object3D } from '../../core/Object3D';
import { DrawableType, BufferGeometryType } from '../../object/constatns';

interface IUpdateListState {
    [id: number]: number;
}

export class WebGLObjects {
    private _updateList: IUpdateListState = {};

    constructor(
        private _geometries: WebGLGeometries, private _info: WebGLInfo) { }

    update(object: DrawableType): BufferGeometryType {
        const frame = this._info.render.frame;

        const geometry = object.geometry;
        const buffergeometry = this._geometries.get(object, geometry) as BufferGeometry;

        // Update once per frame
        if (this._updateList[buffergeometry.id] !== frame) {
            // if (geometry.isGeometry) {
            //     buffergeometry.updateFromObject(object);
            // }

            this._geometries.update(buffergeometry);
            this._updateList[buffergeometry.id] = frame;
        }

        return buffergeometry;
    }

    dispose() {
        this._updateList = {};
    }
}
