import { Float32BufferAttribute } from '../core/BufferAttribute';
import { BufferGeometry } from '../core/BufferGeometry';
import { Object3D } from '../core/Object3D';
import { Matrix4 } from '../math/Matrix4';
import { Ray } from '../math/Ray';
import { Sphere } from '../math/Sphere';
import { Vector3 } from '../math/Vector3';
import { Object3DType } from './Object3DType';
import { LineBasicMaterial } from '../materials/LineBasicMaterial';
import { BufferGeometryType, GeometryType } from './constatns';
import { Material } from '../materials/Material';

export class Line extends Object3D {
    // protected _type: string;
    // private _isLine = true;
    protected _step: number;

    constructor(
        protected _geometry: BufferGeometryType | GeometryType,
        protected _material: Material = new LineBasicMaterial({ color: Math.random() * 0xffffff })) {
        super();
        this._type = Object3DType.Line;
        this._step = 2;
    }

    get geometry() {
        return this._geometry;
    }

    get material() {
        return this._material;
    }

    // get isLine(): boolean {
    //     return this._isLine;
    // }

    computeLineDistances(): Line {
        const start = new Vector3();
        const end = new Vector3();
        const geometry = this._geometry as BufferGeometry;

        if (geometry.index === null) {
            const positionAttribute = geometry.attributes.position;
            const lineDistances = [0];

            for (let i = 1, l = positionAttribute.count; i < l; i++) {
                start.fromBufferAttribute(positionAttribute, i - 1);
                end.fromBufferAttribute(positionAttribute, i);

                lineDistances[i] = lineDistances[i - 1];
                lineDistances[i] += start.distanceTo(end);
            }

            geometry.addAttribute(
                'lineDistance',
                new Float32BufferAttribute(new Float32Array(lineDistances), 1));

        } else {
            console.warn(
                'THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.');
        }

        return this;
    }

    // TODO: set a property type
    raycast(raycaster: any, intersects: any[]) {
        const inverseMatrix = new Matrix4();
        const ray = new Ray();
        const sphere = new Sphere();

        const precision = raycaster.linePrecision;

        const geometry = this._geometry as BufferGeometry;
        const matrixWorld = this.matrixWorld;

        // Checking boundingSphere distance to ray

        if (geometry.boundingSphere === null) {
            geometry.computeBoundingSphere();
        }

        sphere.copy(geometry.boundingSphere);
        sphere.applyMatrix4(matrixWorld);
        sphere.radius += precision;

        if (raycaster.ray.intersectsSphere(sphere) === false) {
            return;
        }

        inverseMatrix.getInverse(matrixWorld);
        ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

        const localPrecision =
            precision / ((this.scale.x + this.scale.y + this.scale.z) / 3);
        const localPrecisionSq = localPrecision * localPrecision;

        const vStart = new Vector3();
        const vEnd = new Vector3();
        const interSegment = new Vector3();
        const interRay = new Vector3();
        // const step = (this && this.isLineSegments) ? 2 : 1;

        const index = geometry.index;
        const attributes = geometry.attributes;
        const positionAttribute = attributes.position;
        const positions = positionAttribute.array;

        if (index !== null) {
            const indices = index.array;

            for (let i = 0, l = indices.length - 1; i < l; i += this._step) {
                const a = indices[i];
                const b = indices[i + 1];

                vStart.fromArray(positions, a * 3);
                vEnd.fromArray(positions, b * 3);

                const distSq =
                    ray.distanceSqToSegment(vStart, vEnd, interRay, interSegment);

                if (distSq > localPrecisionSq) {
                    continue;
                }

                // Move back to world space for distance
                // calculation
                interRay.applyMatrix4(this.matrixWorld);

                const distance = raycaster.ray.origin.distanceTo(interRay);

                if (distance < raycaster.near || distance > raycaster.far) {
                    continue;
                }

                intersects.push({

                    distance: distance,
                    // What do we want? intersection point on the ray or on the
                    // segment?? point: raycaster.ray.at( distance ),
                    point: interSegment.clone().applyMatrix4(this.matrixWorld),
                    index: i,
                    face: null,
                    faceIndex: null,
                    object: this

                });
            }

        } else {
            for (let i = 0, l = positions.length / 3 - 1; i < l; i += this._step) {
                vStart.fromArray(positions, 3 * i);
                vEnd.fromArray(positions, 3 * i + 3);

                const distSq =
                    ray.distanceSqToSegment(vStart, vEnd, interRay, interSegment);

                if (distSq > localPrecisionSq) {
                    continue;
                }

                interRay.applyMatrix4(
                    this.matrixWorld);  // Move back to world space for distance
                // calculation

                const distance = raycaster.ray.origin.distanceTo(interRay);

                if (distance < raycaster.near || distance > raycaster.far) {
                    continue;
                }

                intersects.push({
                    distance: distance,
                    // What do we want? intersection point on the ray or on the
                    // segment?? point: raycaster.ray.at( distance ),
                    point: interSegment.clone().applyMatrix4(this.matrixWorld),
                    index: i,
                    face: null,
                    faceIndex: null,
                    object: this

                });
            }
        }
    }
}
