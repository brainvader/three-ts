import { BufferGeometry } from '../core/BufferGeometry';
import { Vector3 } from '../math/Vector3';
import { Float32BufferAttribute } from '../core/BufferAttribute';
import { Line } from './Line';
import { Object3DType } from './Object3DType';
import { LineBasicMaterial } from '../materials/LineBasicMaterial';

export class LineSegments extends Line {
    // private _type: string;
    // private _isLineSegments: boolean;

    constructor(_geometry: BufferGeometry, _material: LineBasicMaterial) {
        super(_geometry, _material);
        this._type = Object3DType.LineSegments;
        // this._isLineSegments = true;
        this._step = 1;
    }

    computeLineDistances(): LineSegments {
        const start = new Vector3();
        const end = new Vector3();

        const geometry = this._geometry;

        if (geometry.index === null) {
            const positionAttribute = geometry.attributes.position;
            const lineDistances = [];

            for (let i = 0, l = positionAttribute.count; i < l; i += 2) {
                start.fromBufferAttribute(positionAttribute, i);
                end.fromBufferAttribute(positionAttribute, i + 1);

                lineDistances[i] = (i === 0) ? 0 : lineDistances[i - 1];
                lineDistances[i + 1] = lineDistances[i] + start.distanceTo(end);
            }

            geometry.addAttribute(
                'lineDistance',
                new Float32BufferAttribute(new Float32Array(lineDistances), 1));
        } else {
            console.warn(
                'THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.');
        }

        return this;
    }
}
