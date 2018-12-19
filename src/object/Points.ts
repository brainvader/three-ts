import { Object3D } from '../core/Object3D';
import { Object3DType } from './Object3DType';
import { GeometryType, BufferGeometryType } from './constatns';
import { BufferGeometry } from '../core/BufferGeometry';
import { Matrix4 } from '../math/Matrix4';
import { Ray } from '../math/Ray';
import { Sphere } from '../math/Sphere';
import { Vector3 } from '../math/Vector3';
import { PointsMaterial } from '../materials/PointsMaterial';

export class Points extends Object3D {
    private _inverseMatrix = new Matrix4();
    private _ray = new Ray();
    private _sphere = new Sphere();

    constructor(
        private _geometry: GeometryType | BufferGeometryType =  new BufferGeometry() ,
        private _material = new PointsMaterial( { color: Math.random() * 0xffffff } )) {
        super();
        this._type = Object3DType.Points;
    }

    get geometry() {
        return this._geometry;
    }

    get material() {
        return this._material;
    }

    raycast(raycaster, intersects) {
        const object = this;
        const geometry = this._geometry;
        const matrixWorld = this.matrixWorld;
        const threshold = raycaster.params.Points.threshold;

        const sphere = this._sphere;
        const inverseMatrix = this._inverseMatrix;
        const ray = this._ray;

        // Checking boundingSphere distance to ray

        if (geometry.boundingSphere === null) {
            geometry.computeBoundingSphere();
        }

        sphere.copy(geometry.boundingSphere);
        sphere.applyMatrix4(matrixWorld);
        sphere.radius += threshold;

        if (raycaster.ray.intersectsSphere(sphere) === false) {
            return;
        }

        //

        inverseMatrix.getInverse(matrixWorld);
        ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

        const localThreshold =
            threshold / ((this.scale.x + this.scale.y + this.scale.z) / 3);
        const localThresholdSq = localThreshold * localThreshold;
        const position = new Vector3();
        const intersectPoint = new Vector3();

        function testPoint(point, index) {
            const rayPointDistanceSq = ray.distanceSqToPoint(point);

            if (rayPointDistanceSq < localThresholdSq) {
                ray.closestPointToPoint(point, intersectPoint);
                intersectPoint.applyMatrix4(matrixWorld);

                const distance = raycaster.ray.origin.distanceTo(intersectPoint);

                if (distance < raycaster.near || distance > raycaster.far) {
                    return;
                }

                intersects.push({

                    distance: distance,
                    distanceToRay: Math.sqrt(rayPointDistanceSq),
                    point: intersectPoint.clone(),
                    index: index,
                    face: null,
                    object: object

                });
            }
        }

        if (geometry instanceof BufferGeometry) {
            const index = geometry.index;
            const attributes = geometry.attributes;
            const positions = attributes.position.array;

            if (index !== null) {
                const indices = index.array;

                for (let i = 0, il = indices.length; i < il; i++) {
                    const a = indices[i];

                    position.fromArray(positions, a * 3);

                    testPoint(position, a);
                }

            } else {
                for (let i = 0, l = positions.length / 3; i < l; i++) {
                    position.fromArray(positions, i * 3);

                    testPoint(position, i);
                }
            }

        } else {
            const vertices = geometry.vertices;

            for (let i = 0, l = vertices.length; i < l; i++) {
                testPoint(vertices[i], i);
            }
        }
    }

    clone() {
        return new (this.constructor( this._geometry, this._material )).copy( this );
    }
}
