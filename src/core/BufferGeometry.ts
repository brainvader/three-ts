import { Matrix3 } from '../math/Matrix3';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';

import { BufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute } from './BufferAttribute';
import { Box3 } from '../math/Box3';
import { Sphere } from '../math/Sphere';
import { MathUtil } from '../utils/MathUtil';
import { ArrayUtil } from './ArrayUtils';
import { GeometryType, DrawableType } from '../object/constatns';
import { Line } from '../object/Line';
import { Points } from '../object/Points';
import { Mesh } from '../object/Mesh';
import { Geometry } from './Geometry';
import { BufferAttributeType } from './constatns';
import { Object3D } from './Object3D';

const m1 = new Matrix4();
const obj = new Object3D();
const offset = new Vector3();
const box = new Box3();
const vector = new Vector3();

interface IDrawRange {
    start: number;
    count: number;
}

export class BufferGeometry {
    static bufferGeometryId = 1;

    private _id: number;
    private _uuid: string;
    private _name: string;
    private _type: string;
    private _index: BufferAttribute;
    private _attributes: {[name: string]: BufferAttributeType};
    private _morphAttributes: any;
    private _isBufferGeometry: boolean;

    private _groups: any[];
    private _boundingBox: Box3;
    private _boundingSphere: Sphere;
    private _drawRange: IDrawRange;
    private _userData: any;

    private _parameters?;

    private dispatchEvent: (params?) => void;

    constructor() {
        this._id = BufferGeometry.bufferGeometryId;
        BufferGeometry.bufferGeometryId += 2;
        this._uuid = MathUtil.generateUUID();
        this._name = '';
        this._type = 'BufferGeometry';
        this._index = null;
        this._attributes = Object();
        this._morphAttributes = {};
        this._isBufferGeometry = true;

        this._groups = [];
        this._boundingBox = null;
        this._boundingSphere = null;
        this._drawRange = { start: 0, count: Infinity };

        // filed for custom data
        this._userData = {};
    }

    get id(): number {
        return this._id;
    }

    get isBufferGeometry(): boolean {
        return this._isBufferGeometry;
    }

    get attributes() {
        return this._attributes;
    }

    get morphAttributes() {
        return this._morphAttributes;
    }

    get index(): BufferAttribute {
        return this._index;
    }

    get groups() {
        return this._groups;
    }

    get boundingSphere(): Sphere {
        return this._boundingSphere;
    }

    get drawRange() {
        return this._drawRange;
    }

    setIndexAttribute(value: number[] | BufferAttributeType) {
        if (Array.isArray(value)) {
            if (ArrayUtil.max(value) > 65535) {
                this._index =
                    new Uint32BufferAttribute(new Uint32Array(value), 1);
            } else {
                this._index =
                    new Uint16BufferAttribute(new Uint16Array(value), 1);
            }
        } else {
            this._index = value as BufferAttribute;
        }
    }

    addAttribute(name: string, attribute: BufferAttributeType): BufferGeometry {
        // if (!(attribute && attribute instanceof BufferAttribute) &&
        //     !(attribute && attribute instanceof InterleavedBufferAttribute)) {
        //         console.warn( 'THREE.BufferGeometry: .addAttribute() now expects ( name, attribute ).' );

        //     return this.addAttribute(name, new BufferAttribute(arguments[1], arguments[2]));
        // }

        if (name === 'index') {
            console.warn(
                'THREE.BufferGeometry.addAttribute: Use .setIndex() for index attribute.');
            this.setIndexAttribute(attribute);
            return this;
        }
        this._attributes[name] = attribute;
        return this;
    }

    getAttribute(name: string): BufferAttributeType {
        return this._attributes[name];
    }

    removeAttribute(name: string): BufferGeometry {
        delete this._attributes[name];
        return this;
    }

    addGroup(start, count, materialIndex) {
        this._groups.push({
            start: start,
            count: count,
            materialIndex: materialIndex !== undefined ? materialIndex : 0
        });
    }

    clearGroups() {
        this._groups = [];
    }

    setDrawRange(start: number, count: number) {
        this._drawRange.start = start;
        this._drawRange.count = count;
    }

    applyMatrix(matrix: Matrix4): BufferGeometry {
        const position = this._attributes.position as BufferAttribute;

        if (position !== undefined) {
            matrix.applyToBufferAttribute(position);
            position.needsUpdate = true;
        }

        const normal = this._attributes.normal as BufferAttribute;

        if (normal !== undefined) {
            const normalMatrix = new Matrix3().getNormalMatrix(matrix);

            normalMatrix.applyToBufferAttribute(normal);
            normal.needsUpdate = true;
        }

        if (this._boundingBox !== null) {
            this.computeBoundingBox();
        }

        if (this._boundingSphere !== null) {
            this.computeBoundingSphere();
        }

        return this;
    }

    /** rotate geometry around world x-axis*/
    rotateX(angle: number): BufferGeometry {
        m1.makeRotationX(angle);
        this.applyMatrix(m1);
        return this;
    }

    /** rotate geometry around world y-axis */
    rotateY(angle: number): BufferGeometry {
        m1.makeRotationX(angle);
        this.applyMatrix(m1);
        return this;
    }

    /** rotate geometry around world z-axis */
    rotateZ(angle: number): BufferGeometry {
        m1.makeRotationX(angle);
        this.applyMatrix(m1);
        return this;
    }

    /** translate geometry */
    translate(x: number, y: number, z: number) {
        m1.makeTranslation(x, y, z);
        this.applyMatrix(m1);
        return this;
    }

    /** scale geometry */
    scale(x: number, y: number, z: number) {
        m1.makeScale(x, y, z);
        this.applyMatrix(m1);
        return this;
    }

    lookAt(vector: Vector3): BufferGeometry {
        obj.lookAt(vector);
        obj.updateMatrix();
        this.applyMatrix(obj.matrix);
        return this;
    }

    center(): BufferGeometry {
        this.computeBoundingBox();
        this._boundingBox.getCenter(offset).negate();
        this.translate(offset.x, offset.y, offset.z);
        return this;
    }

    setFromObject(object: DrawableType): BufferGeometry {
        const geometry = object.geometry as GeometryType;

        if (object instanceof Points || object instanceof Line) {

            const positions = new Float32BufferAttribute(
                new Float32Array(geometry.vertices.length * 3), 3);
            const colors = new Float32BufferAttribute(
                new Float32Array(geometry.colors.length * 3), 3);

            this.addAttribute(
                'position', positions.copyVector3sArray(geometry.vertices));
            this.addAttribute('color', colors.copyColorsArray(geometry.colors));

            if (geometry.lineDistances &&
                geometry.lineDistances.length === geometry.vertices.length) {
                const lineDistances =
                    new Float32BufferAttribute(
                        new Float32Array(geometry.lineDistances.length), 1);

                this.addAttribute(
                    'lineDistance', lineDistances.copyArray(geometry.lineDistances));
            }

            if (geometry.boundingSphere !== null) {
                this._boundingSphere = geometry.boundingSphere.clone();
            }

            if (geometry.boundingBox !== null) {
                this._boundingBox = geometry.boundingBox.clone();
            }

        } else if (object instanceof Mesh) {
            if (geometry && geometry instanceof Geometry) {
                this.fromGeometry(geometry);
            }
        }

        return this;
    }

    setFromPoints(points: Vector3[]): BufferGeometry {
        const position = [];
        for (let i = 0, l = points.length; i < l; i++) {
            const point = points[i];
            position.push(point.x, point.y, point.z || 0);
        }
        this.addAttribute(
            'position', new Float32BufferAttribute(new Float32Array(position), 3));
        return this;
    }

    // updateFromObject(object: Object3D): BufferGeometry {
    //     let geometry = object.geometry;

    //     if (object.isMesh) {
    //         let direct = geometry.__directGeometry;

    //         if (geometry.elementsNeedUpdate === true) {
    //             direct = undefined;
    //             geometry.elementsNeedUpdate = false;
    //         }

    //         if (direct === undefined) {
    //             return this.fromGeometry(geometry);
    //         }

    //         direct.verticesNeedUpdate = geometry.verticesNeedUpdate;
    //         direct.normalsNeedUpdate = geometry.normalsNeedUpdate;
    //         direct.colorsNeedUpdate = geometry.colorsNeedUpdate;
    //         direct.uvsNeedUpdate = geometry.uvsNeedUpdate;
    //         direct.groupsNeedUpdate = geometry.groupsNeedUpdate;

    //         geometry.verticesNeedUpdate = false;
    //         geometry.normalsNeedUpdate = false;
    //         geometry.colorsNeedUpdate = false;
    //         geometry.uvsNeedUpdate = false;
    //         geometry.groupsNeedUpdate = false;

    //         geometry = direct;
    //     }

    //     let attribute;

    //     if (geometry.verticesNeedUpdate === true) {
    //         attribute = this._attributes['position'];

    //         if (attribute !== undefined) {
    //             attribute.copyVector3sArray(geometry.vertices);
    //             attribute.needsUpdate = true;
    //         }

    //         geometry.verticesNeedUpdate = false;
    //     }

    //     if (geometry.normalsNeedUpdate === true) {
    //         attribute = this._attributes['normal'];

    //         if (attribute !== undefined) {
    //             attribute.copyVector3sArray(geometry.normals);
    //             attribute.needsUpdate = true;
    //         }

    //         geometry.normalsNeedUpdate = false;
    //     }

    //     if (geometry.colorsNeedUpdate === true) {
    //         attribute = this._attributes['color'];

    //         if (attribute !== undefined) {
    //             attribute.copyColorsArray(geometry.colors);
    //             attribute.needsUpdate = true;
    //         }

    //         geometry.colorsNeedUpdate = false;
    //     }

    //     if (geometry.uvsNeedUpdate) {
    //         attribute = this._attributes['uv'];

    //         if (attribute !== undefined) {
    //             attribute.copyVector2sArray(geometry.uvs);
    //             attribute.needsUpdate = true;
    //         }

    //         geometry.uvsNeedUpdate = false;
    //     }

    //     if (geometry.lineDistancesNeedUpdate) {
    //         attribute = this._attributes['lineDistance'];

    //         if (attribute !== undefined) {
    //             attribute.copyArray(geometry.lineDistances);
    //             attribute.needsUpdate = true;
    //         }

    //         geometry.lineDistancesNeedUpdate = false;
    //     }

    //     if (geometry.groupsNeedUpdate) {
    //         geometry.computeGroups(object.geometry);
    //         this._groups = geometry.groups;

    //         geometry.groupsNeedUpdate = false;
    //     }

    //     return this;
    // }

    // TODO: Add type
    fromGeometry(geometry: GeometryType): BufferGeometry {
        geometry.__directGeometry = new DirectGeometry().fromGeometry(geometry);
        return this.fromDirectGeometry(geometry.__directGeometry);
    }

    // TODO: Add type
    // fromDirectGeometry(geometry): BufferGeometry {
    //     const positions = new Float32Array(geometry.vertices.length * 3);
    //     this.addAttribute(
    //         'position',
    //         new BufferAttribute(positions, 3).copyVector3sArray(geometry.vertices));

    //     if (geometry.normals.length > 0) {
    //         const normals = new Float32Array(geometry.normals.length * 3);
    //         this.addAttribute(
    //             'normal',
    //             new BufferAttribute(normals, 3).copyVector3sArray(geometry.normals));
    //     }

    //     if (geometry.colors.length > 0) {
    //         const colors = new Float32Array(geometry.colors.length * 3);
    //         this.addAttribute(
    //             'color',
    //             new BufferAttribute(colors, 3).copyColorsArray(geometry.colors));
    //     }

    //     if (geometry.uvs.length > 0) {
    //         const uvs = new Float32Array(geometry.uvs.length * 2);
    //         this.addAttribute(
    //             'uv', new BufferAttribute(uvs, 2).copyVector2sArray(geometry.uvs));
    //     }

    //     if (geometry.uvs2.length > 0) {
    //         const uvs2 = new Float32Array(geometry.uvs2.length * 2);
    //         this.addAttribute(
    //             'uv2', new BufferAttribute(uvs2, 2).copyVector2sArray(geometry.uvs2));
    //     }

    //     // groups

    //     this._groups = geometry.groups;

    //     // morphs
    //     for (const name in geometry.morphTargets) {
    //         const array = [];
    //         const morphTargets = geometry.morphTargets[name];

    //         for (let i = 0, l = morphTargets.length; i < l; i++) {
    //             const morphTarget = morphTargets[i];

    //             const attribute =
    //                 new Float32BufferAttribute(morphTarget.data.length * 3, 3);
    //             attribute.name = morphTarget.name;

    //             array.push(attribute.copyVector3sArray(morphTarget.data));
    //         }

    //         this._morphAttributes[name] = array;
    //     }

    //     // skinning
    //     if (geometry.skinIndices.length > 0) {
    //         const skinIndices =
    //             new Float32BufferAttribute(geometry.skinIndices.length * 4, 4);
    //         this.addAttribute(
    //             'skinIndex', skinIndices.copyVector4sArray(geometry.skinIndices));
    //     }

    //     if (geometry.skinWeights.length > 0) {
    //         const skinWeights =
    //             new Float32BufferAttribute(geometry.skinWeights.length * 4, 4);
    //         this.addAttribute(
    //             'skinWeight', skinWeights.copyVector4sArray(geometry.skinWeights));
    //     }

    //     //

    //     if (geometry.boundingSphere !== null) {
    //         this._boundingSphere = geometry.boundingSphere.clone();
    //     }

    //     if (geometry.boundingBox !== null) {
    //         this._boundingBox = geometry.boundingBox.clone();
    //     }

    //     return this;
    // }

    computeBoundingBox() {
        if (this._boundingBox === null) {
            this._boundingBox = new Box3();
        }

        const position = this._attributes.position as BufferAttribute;

        if (position !== undefined) {
            this._boundingBox.setFromBufferAttribute(position);

        } else {
            this._boundingBox.makeEmpty();
        }

        if (isNaN(this._boundingBox.min.x) || isNaN(this._boundingBox.min.y) ||
            isNaN(this._boundingBox.min.z)) {
            console.error(
                'THREE.BufferGeometry.computeBoundingBox: Computed min/max have NaN values. ' +
                'The "position" attribute is likely to have NaN values.',
                this);
        }
    }

    computeBoundingSphere() {
        if (this._boundingSphere === null) {
            this._boundingSphere = new Sphere();
        }

        const position = this._attributes.position as BufferAttribute;

        if (position) {
            const center = this._boundingSphere.center;

            box.setFromBufferAttribute(position);
            box.getCenter(center);

            // hoping to find a boundingSphere with a radius smaller than the
            // boundingSphere of the boundingBox: sqrt(3) smaller in the best case

            let maxRadiusSq = 0;

            for (let i = 0, il = position.count; i < il; i++) {
                vector.x = position.getX(i);
                vector.y = position.getY(i);
                vector.z = position.getZ(i);
                maxRadiusSq =
                    Math.max(maxRadiusSq, center.distanceToSquared(vector));
            }

            this._boundingSphere.radius = Math.sqrt(maxRadiusSq);

            if (isNaN(this._boundingSphere.radius)) {
                console.error(
                    'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN.' +
                    'The "position" attribute is likely to have NaN values.',
                    this);
            }
        }
    }

    /** backwards compatibility */
    computeFaceNormals() { }

    computeVertexNormals() {
        const index = this.index;
        const attributes = this._attributes;
        const position = attributes.position;
        const normal = attributes.normal as BufferAttribute;

        if (position) {
            const positions = position.array;
            if (normal === undefined) {
                this.addAttribute(
                    'normal',
                    new BufferAttribute(new Float32Array(positions.length), 3));

            } else {
                // reset existing normals to zero
                const array = normal.array;
                for (let i = 0, il = array.length; i < il; i++) {
                    array[i] = 0;
                }
            }

            const normals = normal.array;
            let vA: number;
            let vB: number;
            let vC: number;
            const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
            const cb = new Vector3(), ab = new Vector3();

            // indexed elements

            if (index) {
                const indices = index.array;

                for (let i = 0, il = index.count; i < il; i += 3) {
                    vA = indices[i + 0] * 3;
                    vB = indices[i + 1] * 3;
                    vC = indices[i + 2] * 3;

                    pA.fromArray(positions, vA);
                    pB.fromArray(positions, vB);
                    pC.fromArray(positions, vC);

                    cb.subVectors(pC, pB);
                    ab.subVectors(pA, pB);
                    cb.cross(ab);

                    normals[vA] += cb.x;
                    normals[vA + 1] += cb.y;
                    normals[vA + 2] += cb.z;

                    normals[vB] += cb.x;
                    normals[vB + 1] += cb.y;
                    normals[vB + 2] += cb.z;

                    normals[vC] += cb.x;
                    normals[vC + 1] += cb.y;
                    normals[vC + 2] += cb.z;
                }

            } else {
                // non-indexed elements (unconnected triangle soup)

                for (let i = 0, il = positions.length; i < il; i += 9) {
                    pA.fromArray(positions, i);
                    pB.fromArray(positions, i + 3);
                    pC.fromArray(positions, i + 6);

                    cb.subVectors(pC, pB);
                    ab.subVectors(pA, pB);
                    cb.cross(ab);

                    normals[i] = cb.x;
                    normals[i + 1] = cb.y;
                    normals[i + 2] = cb.z;

                    normals[i + 3] = cb.x;
                    normals[i + 4] = cb.y;
                    normals[i + 5] = cb.z;

                    normals[i + 6] = cb.x;
                    normals[i + 7] = cb.y;
                    normals[i + 8] = cb.z;
                }
            }

            this.normalizeNormals();
            normal.needsUpdate = true;
        }
    }

    merge(geometry: BufferGeometry, offset: number): BufferGeometry {
        if (!(geometry && geometry.isBufferGeometry)) {
            console.error(
                'THREE.BufferGeometry.merge(): geometry not an instance of THREE.BufferGeometry.',
                geometry);
            return;
        }

        if (offset === undefined) {
            offset = 0;

            console.warn(
                'THREE.BufferGeometry.merge(): Overwriting original geometry, starting at offset=0. ' +
                'Use BufferGeometryUtils.mergeBufferGeometries() for lossless merge.');
        }

        const attributes = this._attributes;

        for (const key in attributes) {
            if (geometry.attributes[key] === undefined) {
                continue;
            }

            const attribute1 = attributes[key];
            const attributeArray1 = attribute1.array;

            const attribute2 = geometry.attributes[key];
            const attributeArray2 = attribute2.array;

            const attributeSize = attribute2.itemSize;

            for (let i = 0, j = attributeSize * offset; i < attributeArray2.length; i++ , j++) {
                attributeArray1[j] = attributeArray2[i];
            }
        }

        return this;
    }

    normalizeNormals() {
        const normals = this.attributes.normal;

        for (let i = 0, il = normals.count; i < il; i++) {
            vector.x = normals.getX(i);
            vector.y = normals.getY(i);
            vector.z = normals.getZ(i);
            vector.normalize();
            normals.setXYZ(i, vector.x, vector.y, vector.z);
        }
    }

    toNonIndexed() {
        if (this.index === null) {
            console.warn(
                'THREE.BufferGeometry.toNonIndexed(): Geometry is already non-indexed.');
            return this;
        }

        const geometry2 = new BufferGeometry();

        const indices = this.index.array;
        const attributes = this.attributes;

        for (const name of Object.keys(attributes)) {
            const attribute = attributes[name];

            const array = attribute.array;
            const itemSize = attribute.itemSize;

            const array2 = new (array.constructor(indices.length * itemSize));

            let index = 0, index2 = 0;

            for (let i = 0, l = indices.length; i < l; i++) {
                index = indices[i] * itemSize;

                for (let j = 0; j < itemSize; j++) {
                    array2[index2++] = array[index++];
                }
            }

            geometry2.addAttribute(name, new BufferAttribute(array2, itemSize));
        }

        const groups = this._groups;

        for (let i = 0, l = groups.length; i < l; i++) {
            const group = groups[i];
            geometry2.addGroup(group.start, group.count, group.materialIndex);
        }

        return geometry2;
    }

    toJSON(): Object {
        const data: any = {
            metadata: {
                version: 4.5,
                type: 'BufferGeometry',
                generator: 'BufferGeometry.toJSON'
            }
        };

        // standard BufferGeometry serialization
        data.uuid = this._uuid;
        data.type = this._type;
        if (this._name !== '') {
            data.name = this._name;
        }
        if (Object.keys(this._userData).length > 0) {
            data.userData = this._userData;
        }

        if (this._parameters !== undefined) {
            const parameters = this._parameters;

            for (const key in parameters) {
                if (parameters[key] !== undefined) {
                    data[key] = parameters[key];
                }
            }

            return data;
        }

        data.data = { attributes: {} };

        const index = this.index;

        if (index !== null) {
            const array = Array.prototype.slice.call(index.array);

            data.data.index = { type: index.array.constructor.name, array: array };
        }

        const attributes = this.attributes;

        for (const key of Object.keys(attributes) ) {
            const attribute = attributes[key];

            const array = Array.prototype.slice.call(attribute.array);

            data.data.attributes[key] = {
                itemSize: attribute.itemSize,
                type: attribute.array.constructor.name,
                array: array,
                normalized: attribute.normalized
            };
        }

        const groups = this._groups;

        if (groups.length > 0) {
            data.data.groups = JSON.parse(JSON.stringify(groups));
        }

        const boundingSphere = this._boundingSphere;

        if (boundingSphere !== null) {
            data.data.boundingSphere = {
                center: boundingSphere.center.toArray(),
                radius: boundingSphere.radius
            };
        }

        return data;
    }

    // TODO: implement
    clone(): BufferGeometry {
        /*
         // Handle primitives
         var parameters = this.parameters;
         if ( parameters !== undefined ) {
         var values = [];
         for ( var key in parameters ) {
         values.push( parameters[ key ] );
         }
         var geometry = Object.create( this.constructor.prototype );
         this.constructor.apply( geometry, values );
         return geometry;
         }
         return new this.constructor().copy( this );
         */

        return new BufferGeometry().copy(this);
    }

    copy(source: BufferGeometry): BufferGeometry {
        let name: string;
        let i: number;
        let l: number;

        // reset
        this._index = null;
        this._attributes = Object();
        this._morphAttributes = {};
        this._groups = [];
        this._boundingBox = null;
        this._boundingSphere = null;

        // name
        this._name = source._name;

        // index
        const index = source.index;
        if (index !== null) {
            this.setIndexAttribute(index.clone());
        }

        // attributes
        const attributes = source.attributes;

        for (name of Object.keys(attributes)) {
            const attribute = attributes[name] as BufferAttribute;
            this.addAttribute(name, attribute.clone());
        }

        // morph attributes
        const morphAttributes = source._morphAttributes;

        for (name of Object.keys(morphAttributes)) {
            const array = [];
            const morphAttribute = morphAttributes[name];  // morphAttribute: array of
            // Float32BufferAttributes

            for (i = 0, l = morphAttribute.length; i < l; i++) {
                array.push(morphAttribute[i].clone());
            }

            this._morphAttributes[name] = array;
        }

        // groups
        const groups = source._groups;
        for (i = 0, l = groups.length; i < l; i++) {
            const group = groups[i];
            this.addGroup(group.start, group.count, group.materialIndex);
        }

        // bounding box
        const boundingBox = source._boundingBox;

        if (boundingBox !== null) {
            this._boundingBox = boundingBox.clone();
        }

        // bounding sphere
        const boundingSphere = source._boundingSphere;
        if (boundingSphere !== null) {
            this._boundingSphere = boundingSphere.clone();
        }

        // draw range
        this._drawRange.start = source._drawRange.start;
        this._drawRange.count = source._drawRange.count;

        // user data
        this._userData = source._userData;

        return this;
    }

    dispose() {
        this.dispatchEvent({ type: 'dispose' });
    }
}
