import { Object3D } from '../core/Object3D';
import { Object3DType } from './Object3DType';
import { BufferGeometry } from '../core/BufferGeometry';
import { Vector3 } from '../math/Vector3';
import { Vector2 } from '../math/Vector2';
import { Matrix4 } from '../math/Matrix4';
import { Triangle } from '../math/Triangle';
import { SpriteMaterial } from '../materials/SpriteMaterial';
import { InterleavedBuffer } from '../core/InterleavedBuffer';
import { InterleavedBufferAttribute } from '../core/InterleavedBufferAttribute';

const intersectPoint = new Vector3();
const worldScale = new Vector3();
const mvPosition = new Vector3();

const alignedPosition = new Vector2();
const rotatedPosition = new Vector2();
const viewWorldMatrix = new Matrix4();

const vA = new Vector3();
const vB = new Vector3();
const vC = new Vector3();

const uvA = new Vector2();
const uvB = new Vector2();
const uvC = new Vector2();

function transformVertex(vertexPosition, mvPosition, center, scale, sin, cos) {
    // compute position in camera space
    alignedPosition.subVectors(vertexPosition, center)
        .addScalar(0.5)
        .multiply(scale);

    // to check if rotation is not zero
    if (sin !== undefined) {
        rotatedPosition.x = (cos * alignedPosition.x) - (sin * alignedPosition.y);
        rotatedPosition.y = (sin * alignedPosition.x) + (cos * alignedPosition.y);

    } else {
        rotatedPosition.copy(alignedPosition);
    }


    vertexPosition.copy(mvPosition);
    vertexPosition.x += rotatedPosition.x;
    vertexPosition.y += rotatedPosition.y;

    // transform to world space
    vertexPosition.applyMatrix4(viewWorldMatrix);
}

export class Sprite extends Object3D {
    static geometry: BufferGeometry;
    private _geometry: BufferGeometry;
    private _center = new Vector2( 0.5, 0.5 );

    constructor(private _material: SpriteMaterial = new SpriteMaterial()) {
        super();
        this._type = Object3DType.Sprite;
        if (Sprite.geometry === undefined) {
            Sprite.geometry = new BufferGeometry();

            const float32Array = new Float32Array([
                -0.5, -0.5, 0, 0, 0, 0.5, -0.5, 0, 1, 0,
                0.5, 0.5, 0, 1, 1, -0.5, 0.5, 0, 0, 1
            ]);

            const interleavedBuffer = new InterleavedBuffer(float32Array, 5);

            Sprite.geometry.setIndexAttribute([0, 1, 2, 0, 2, 3]);
            Sprite.geometry.addAttribute(
                'position',
                new InterleavedBufferAttribute(interleavedBuffer, 3, 0, false));
            Sprite.geometry.addAttribute(
                'uv',
                new InterleavedBufferAttribute(interleavedBuffer, 2, 3, false));
        }

        this._geometry = Sprite.geometry;
    }

    get geometry() {
        return this._geometry;
    }

    raycast(raycaster: Raycaster, intersects: any[]) {
        worldScale.setFromMatrixScale(this._matrixWorld);
        viewWorldMatrix.getInverse(this._modelViewMatrix)
            .premultiply(this.matrixWorld);
        mvPosition.setFromMatrixPosition(this._modelViewMatrix);

        const rotation = this._material.rotation;
        let sin, cos;
        if (rotation !== 0) {
            cos = Math.cos(rotation);
            sin = Math.sin(rotation);
        }

        const center = this._center;

        transformVertex(
            vA.setXYZ(-0.5, -0.5, 0), mvPosition, center, worldScale, sin, cos);
        transformVertex(
            vB.setXYZ(0.5, -0.5, 0), mvPosition, center, worldScale, sin, cos);
        transformVertex(
            vC.setXYZ(0.5, 0.5, 0), mvPosition, center, worldScale, sin, cos);

        uvA.setXY(0, 0);
        uvB.setXY(1, 0);
        uvC.setXY(1, 1);

        // check first triangle
        let intersect =
            raycaster.ray.intersectTriangle(vA, vB, vC, false, intersectPoint);

        if (intersect === null) {
            // check second triangle
            transformVertex(
                vB.setXYZ(-0.5, 0.5, 0), mvPosition, center, worldScale, sin, cos);
            uvB.setXY(0, 1);

            intersect =
                raycaster.ray.intersectTriangle(vA, vC, vB, false, intersectPoint);
            if (intersect === null) {
                return;
            }
        }

        const distance = raycaster.ray.origin.distanceTo(intersectPoint);

        if (distance < raycaster.near || distance > raycaster.far) {
            return;
        }

        intersects.push({
            distance: distance,
            point: intersectPoint.clone(),
            uv: Triangle.getUV(
                intersectPoint, vA, vB, vC, uvA, uvB, uvC, new Vector2()),
            face: null,
            object: this

        });
    }
}
