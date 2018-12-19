import { Bone } from './Bone';
import { Matrix4 } from '../math/Matrix4';
import { DataTexture } from '../texture/DataTexture';

export class Skeleton {
    private _bones: Bone[];
    private _boneInverses: Matrix4[];
    private _boneMatrices: Float32Array;
    private _boneTexture: DataTexture;

    constructor(bones: Bone[] = [], boneInverses: Matrix4[]) {
        this._bones = bones.slice(0);
        this._boneMatrices = new Float32Array(this._bones.length * 16);

        // use the supplied bone inverses or calculate the inverses

        if (boneInverses === undefined) {
            this.calculateInverses();

        } else {
            if (this._bones.length === boneInverses.length) {
                this._boneInverses = boneInverses.slice(0);

            } else {
                console.warn('THREE.Skeleton boneInverses is the wrong length.');

                this._boneInverses = [];

                for (let i = 0, il = this._bones.length; i < il; i++) {
                    this._boneInverses.push(new Matrix4());
                }
            }
        }
    }

    calculateInverses() {
        this._boneInverses = [];

        for (let i = 0, il = this._bones.length; i < il; i++) {
            const inverse = new Matrix4();

            if (this._bones[i]) {
                inverse.getInverse(this._bones[i].matrixWorld);
            }

            this._boneInverses.push(inverse);
        }
    }

    pose() {
        let bone: Bone;
        let i: number;
        let il: number;

        // recover the bind-time world matrices
        for (i = 0, il = this._bones.length; i < il; i++) {
            bone = this._bones[i];

            if (bone) {
                bone.matrixWorld.getInverse(this._boneInverses[i]);
            }
        }

        // compute the local matrices, positions, rotations and scales
        for (i = 0, il = this._bones.length; i < il; i++) {
            bone = this._bones[i];

            if (bone) {
                if (bone.parent && bone.parent instanceof Bone) {
                    bone.matrix.getInverse(bone.parent.matrixWorld);
                    bone.matrix.multiply(bone.matrixWorld);

                } else {
                    bone.matrix.copy(bone.matrixWorld);
                }

                bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
            }
        }
    }

    update() {
        const offsetMatrix = new Matrix4();
        const identityMatrix = new Matrix4();

        const bones = this._bones;
        const boneInverses = this._boneInverses;
        const boneMatrices = this._boneMatrices;
        const boneTexture = this._boneTexture;

        // flatten bone matrices to array

        for (let i = 0, il = bones.length; i < il; i++) {
            // compute the offset between the current and the original transform
            const matrix = bones[i] ? bones[i].matrixWorld : identityMatrix;
            offsetMatrix.multiplyMatrices(matrix, boneInverses[i]);
            offsetMatrix.toArray(Array.from(boneMatrices), i * 16);
        }

        if (boneTexture !== undefined) {
            boneTexture.needsUpdate = true;
        }
    }

    clone() {
        return new Skeleton(this._bones, this._boneInverses);
    }

    getBoneByName(name: string): Bone {
        for (let i = 0, il = this._bones.length; i < il; i++) {
            const bone = this._bones[i];

            if (bone.name === name) {
                return bone;
            }
        }

        return undefined;
    }
}
