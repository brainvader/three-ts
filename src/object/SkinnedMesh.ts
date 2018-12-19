import { Mesh } from './Mesh';
import { BufferGeometry } from '../core/BufferGeometry';
import { Matrix4 } from '../math/Matrix4';
import { Vector4 } from '../math/Vector4';
import { BufferAttribute } from '../core/BufferAttribute';
import { BufferGeometryType, GeometryType } from './constatns';
import { Skeleton } from './Skeleton';
import { Object3DType } from './Object3DType';

export class SkinnedMesh extends Mesh {
    private _bindMode = 'attached';
    private _bindMatrix = new Matrix4();
    private _bindMatrixInverse = new Matrix4();

    private _skeleton: Skeleton;

    constructor(geometry: BufferGeometryType, material) {
        super(geometry as BufferGeometryType, material);
        this._type = Object3DType.SkinnedMesh;
    }

    get skeleton() {
        return this._skeleton;
    }


    bind(skeleton: Skeleton, bindMatrix: Matrix4) {
        this._skeleton = skeleton;

        if (bindMatrix === undefined) {
            this.updateMatrixWorld(true);

            this._skeleton.calculateInverses();

            bindMatrix = this.matrixWorld;
        }

        this._bindMatrix.copy(bindMatrix);
        this._bindMatrixInverse.getInverse(bindMatrix);
    }

    pose() {
        this._skeleton.pose();
    }

    normalizeSkinWeights() {
        const vector = new Vector4();
        const skinWeight = (<BufferGeometryType>this._geometry).attributes.skinWeight as BufferAttribute;

        for (let i = 0, l = skinWeight.count; i < l; i++) {
            vector.x = skinWeight.getX(i);
            vector.y = skinWeight.getY(i);
            vector.z = skinWeight.getZ(i);
            vector.w = skinWeight.getW(i);

            const scale = 1.0 / vector.manhattanLength();

            if (scale !== Infinity) {
                vector.multiplyScalar(scale);

            } else {
                vector.setAll(1, 0, 0, 0);  // do something reasonable
            }

            skinWeight.setXYZW(i, vector.x, vector.y, vector.z, vector.w);
        }
    }

    updateMatrixWorld(force: boolean) {
        super.updateMatrixWorld(force);

        if (this._bindMode === 'attached') {
            this._bindMatrixInverse.getInverse(this.matrixWorld);
        } else if (this._bindMode === 'detached') {
            this._bindMatrixInverse.getInverse(this._bindMatrix);
        } else {
            console.warn(
                'THREE.SkinnedMesh: Unrecognized bindMode: ' + this._bindMode);
        }
    }

    clone() {
        return new Mesh(this._geometry, this._material).copy(this);
    }
}
