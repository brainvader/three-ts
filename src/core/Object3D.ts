import { MathUtil } from '../utils/MathUtil';
import { Vector3 } from '../math/Vector3';
import { Euler } from '../math/Euler';
import { Quaternion } from '../math/Quaternion';
import { Matrix4 } from '../math/Matrix4';
import { Layers } from './Layers';
import { Object3DType } from '../object/Object3DType';
import { Camera } from '../object/camera/Camera';

let object3DId = 0;

export class Object3D {
    static DefaultUp = new Vector3(0, 1, 0);
    static DefaultMatrixAutoUpdate = true;

    protected _id: number;
    private _uuid: string;

    private _name: string;
    protected _type: Object3DType | string;
    // private _isObject3D: boolean;

    private _parent: Object3D;
    private _children: Object3D[];
    private _layers: Layers;

    private _up: Vector3;

    protected _position: Vector3;
    private _rotation: Euler;
    private _quaternion: Quaternion;
    private _scale: Vector3;

    protected _modelViewMatrix: Matrix4;
    protected _normalMatrix: Matrix4;

    private _matrix: Matrix4;
    protected _matrixWorld: Matrix4;

    protected _matrixAutoUpdate: boolean;
    protected _matrixWorldNeedsUpdate: boolean;

    private _visible: boolean;

    protected _castShadow: boolean;
    protected _receiveShadow: boolean;

    private _frustumCulled: boolean;
    private _renderOrder: number;

    private _onBeforeRender: () => void;
    private _onAfterRender: () => void;
    private _raycast: () => void;

    private _userData: any;

    constructor() {
        this._id = object3DId++;
        this._uuid = MathUtil.generateUUID();
        // this._isObject3D = true;

        this._name = '';
        this._type = Object3DType.Object3D;

        this._parent = null;
        this._children = [];

        this._up = Object3D.DefaultUp.clone();

        this._position = new Vector3();
        this._rotation = new Euler();
        this._quaternion = new Quaternion();
        this._scale = new Vector3(1, 1, 1);

        this._rotation.onChange(() => {
            this._quaternion.setFromEuler(this._rotation, false);
        });

        this._quaternion.onChange(() => {
            this._rotation.setFromQuaternion(this._quaternion, undefined, false);
        });

        this._matrix = new Matrix4();
        this._matrixWorld = new Matrix4();

        this._matrixAutoUpdate = Object3D.DefaultMatrixAutoUpdate;
        this._matrixWorldNeedsUpdate = false;

        this._layers = new Layers();
        this._visible = true;

        this._castShadow = false;
        this._receiveShadow = false;

        this._frustumCulled = true;
        this._renderOrder = 0;

        this._userData = {};
    }

    get name(): string {
        return this._name;
    }

    get up(): Vector3 {
        return this._up;
    }

    get position(): Vector3 {
        return this._position;
    }

    get quaternion(): Quaternion {
        return this._quaternion;
    }

    get scale(): Vector3 {
        return this._scale;
    }

    get matrix(): Matrix4 {
        return this._matrix;
    }

    get matrixWorld(): Matrix4 {
        return this._matrixWorld;
    }

    get matrixAutoUpdate(): boolean {
        return this._matrixAutoUpdate;
    }

    get matrixWorldNeedsUpdate(): boolean {
        return this._matrixWorldNeedsUpdate;
    }

    get layers(): Layers {
        return this._layers;
    }

    get visible(): boolean {
        return this._visible;
    }

    get castShadow() {
        return this._castShadow;
    }

    get receiveShadow(): boolean {
        return this._receiveShadow;
    }

    get frustumCulled(): boolean {
        return this._frustumCulled;
    }

    get renderOrder(): number {
        return this._renderOrder;
    }

    get userData(): any {
        return this._userData;
    }

    get children(): Object3D[] {
        return this._children;
    }

    get normalMatrix() {
        return this._normalMatrix;
    }

    // get isObject3D(): boolean {
    //     return this._type === Object3DType.Object3D;
    // }

    get parent(): Object3D {
        return this._parent;
    }

    set parent(value: Object3D) {
        this._parent = value;
    }

    applyMatrix(matrix: Matrix4) {
        this._matrix.multiplyMatrices(matrix, this._matrix);
        this._matrix.decompose(this._position, this._quaternion, this._scale);
    }

    applyQuaternion(q: Quaternion): Object3D {
        this._quaternion.premultiply(q);
        return this;
    }

    setRotationFromAxisAngle(axis: Vector3, angle: number) {
        // assumes axis is normalized
        this._quaternion.setFromAxisAngle(axis, angle);
    }

    setRotationFromEuler(euler: Euler) {
        this._quaternion.setFromEuler(euler, true);
    }

    setRotationFromMatrix(m: Matrix4) {
        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
        this._quaternion.setFromRotationMatrix(m);
    }

    setRotationFromQuaternion(q: Quaternion) {
        // assumes q is normalized
        this._quaternion.copy(q);
    }

    rotateOnAxis(axis: Vector3, angle: number): Object3D {
        // rotate object on axis in object space
        // axis is assumed to be normalized
        const q1 = new Quaternion();
        q1.setFromAxisAngle(axis, angle);
        this._quaternion.multiply(q1);
        return this;
    }

    rotateOnWorldAxis(axis: Vector3, angle: number): Object3D {
        // rotate object on axis in world space
        // axis is assumed to be normalized
        // method assumes no rotated parent
        const q1 = new Quaternion();
        q1.setFromAxisAngle(axis, angle);
        this._quaternion.premultiply(q1);
        return this;
    }

    rotateX(angle: number) {
        const v1 = new Vector3(1, 0, 0);
        return this.rotateOnAxis(v1, angle);
    }

    rotateY(angle: number) {
        const v1 = new Vector3(0, 1, 0);
        return this.rotateOnAxis(v1, angle);
    }

    rotateZ(angle: number) {
        const v1 = new Vector3(0, 0, 1);
        return this.rotateOnAxis(v1, angle);
    }

    translateOnAxis(axis: Vector3, distance: number): Object3D {
      // translate object by distance along axis in object space
      // axis is assumed to be normalized
      const v1 = new Vector3();
      v1.copy(axis).applyQuaternion(this._quaternion);
      this._position.add(v1.multiplyScalar(distance));
      return this;
    }

    translateX(distance: number): Object3D {
        const v1 = new Vector3(1, 0, 0);
        return this.translateOnAxis(v1, distance);
    }

    translateY(distance: number): Object3D {
        const v1 = new Vector3(0, 1, 0);
        return this.translateOnAxis(v1, distance);
    }

    translateZ(distance: number): Object3D {
        const v1 = new Vector3(0, 0, 1);
        return this.translateOnAxis(v1, distance);
    }

    localToWorld(vector: Vector3): Vector3 {
        return vector.applyMatrix4(this._matrixWorld);
    }

    worldToLocal(vector: Vector3): Vector3 {
        const m1 = new Matrix4();
        return vector.applyMatrix4(m1.getInverse(this._matrixWorld));
    }

    lookAt(x: number, y: number, z: number);
    lookAt(p: Vector3);
    lookAt(x, y?, z?) {
        // This method does not support objects having non-uniformly-scaled
        // parent(s)
        const q1 = new Quaternion();
        const m1 = new Matrix4();
        const target = new Vector3();
        const position = new Vector3();

        if (x.isVector3) {
            target.copy(x);
        } else {
            target.setXYZ(x, y, z);
        }

        const parent = this._parent;

        this.updateWorldMatrix(true, false);

        position.setFromMatrixPosition(this._matrixWorld);

        if (this instanceof Camera) {
            m1.lookAt(position, target, this._up);
        } else {
            m1.lookAt(target, position, this._up);
        }

        this._quaternion.setFromRotationMatrix(m1);

        if (parent) {
            m1.extractRotation(parent._matrixWorld);
            q1.setFromRotationMatrix(m1);
            this._quaternion.premultiply(q1.inverse());
        }
    }

    add(object: Object3D) {
        // if (arguments.length > 1) {
        //     for (let i = 0; i < arguments.length; i++) {
        //         this.add(arguments[i]);
        //     }

        //     return this;
        // }

        if (object === this) {
            console.error(
                'THREE.Object3D.add: object can\'t be added as a child of itself.',
                object);
            return;
        }

        if ((object && this._type === Object3DType.Object3D)) {
            if (object.parent !== null) {
                object.parent.remove(object);
            }

            object.parent = this;
            // object.dispatchEvent({ type: 'added' });

            this._children.push(object);

        }

        // return this;
    }

    remove(object: Object3D) {
        // if (arguments.length > 1) {
        //     for (let i = 0; i < arguments.length; i++) {
        //         this.remove(arguments[i]);
        //     }

        //     return this;
        // }

        const index = this._children.indexOf(object);

        if (index !== -1) {
            object.parent = null;
            // object.dispatchEvent({ type: 'removed' });
            this._children.splice(index, 1);
        }

        // return this;
    }

    getObjectById(id: number): Object3D {
        return this.getObjectByProperty('id', id);
    }

    getObjectByName(name: string): Object3D {
        return this.getObjectByProperty('name', name);
    }

    getObjectByProperty(name: string, value: number | string): Object3D {
        if (this[name] === value) {
            return this;
        }

        // travasal down　the scene graph
        for (let i = 0, l = this._children.length; i < l; i++) {
            const child = this._children[i];
            const object = child.getObjectByProperty(name, value);

            // no more child
            if (object !== undefined) {
                return object;
            }
        }

        return undefined;
    }

    getWorldPosition(target = new Vector3()): Vector3 {
        this.updateMatrixWorld(true);
        return target.setFromMatrixPosition(this._matrixWorld);
    }

    getWorldQuaternion(target = new Quaternion()): Quaternion {
        const position = new Vector3();
        const scale = new Vector3();
        this.updateMatrixWorld(true);
        this._matrixWorld.decompose(position, target, scale);
        return target;
    }

    getWorldScale(target = new Vector3()): Vector3 {
        const position = new Vector3();
        const quaternion = new Quaternion();
        this.updateMatrixWorld(true);
        this._matrixWorld.decompose(position, quaternion, target);
        return target;
    }

    getWorldDirection(target = new Vector3()): Vector3 {
        this.updateMatrixWorld(true);
        const e = this._matrixWorld.elements;
        return target.setXYZ(e[8], e[9], e[10]).normalize();
    }

    traverse(callback) {
        callback(this);
        const children = this._children;
        for (let i = 0, l = children.length; i < l; i++) {
            children[i].traverse(callback);
        }
    }

    traverseVisible(callback) {
        if (this._visible === false) {
            return;
        }
        callback(this);
        const children = this._children;

        for (let i = 0, l = children.length; i < l; i++) {
            children[i].traverseVisible(callback);
        }
    }

    traverseAncestors(callback) {
        const parent = this.parent;
        if (parent !== null) {
            callback(parent);
            parent.traverseAncestors(callback);
        }
    }

    updateMatrix() {
        this._matrix.compose(this._position, this._quaternion, this._scale);
        this._matrixWorldNeedsUpdate = true;
    }

    updateMatrixWorld(force: boolean) {
        if (this._matrixAutoUpdate) {
            this.updateMatrix();
        }

        if (this._matrixWorldNeedsUpdate || force) {
            if (this.parent === null) {
                this._matrixWorld.copy(this._matrix);

            } else {
                this._matrixWorld.multiplyMatrices(
                    this.parent._matrixWorld, this._matrix);
            }

            this._matrixWorldNeedsUpdate = false;

            force = true;
        }

        // update children

        const children = this._children;

        for (let i = 0, l = children.length; i < l; i++) {
            children[i].updateMatrixWorld(force);
        }
    }

    updateWorldMatrix(updateParents: boolean, updateChildren: boolean) {
        const parent = this.parent;

        if (updateParents === true && parent !== null) {
            parent.updateWorldMatrix(true, false);
        }

        if (this.matrixAutoUpdate) {
            this.updateMatrix();
        }

        if (this.parent === null) {
            this.matrixWorld.copy(this.matrix);

        } else {
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }

        // update children

        if (updateChildren === true) {
            const children = this.children;

            for (let i = 0, l = children.length; i < l; i++) {
                children[i].updateWorldMatrix(false, true);
            }
        }
    }

    clone(recursive?: boolean): Object3D {
        return new Object3D().copy(this, recursive);
    }

    copy(source: Object3D, recursive = true): Object3D {
        this._name = source.name;

        this._up.copy(source.up);

        this._position.copy(source.position);
        this._quaternion.copy(source.quaternion);
        this._scale.copy(source.scale);

        this._matrix.copy(source.matrix);
        this._matrixWorld.copy(source.matrixWorld);

        this._matrixAutoUpdate = source.matrixAutoUpdate;
        this._matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

        this._layers.mask = source.layers.mask;
        this._visible = source.visible;

        this._castShadow = source.castShadow;
        this._receiveShadow = source.receiveShadow;

        this._frustumCulled = source.frustumCulled;
        this._renderOrder = source.renderOrder;

        this._userData = JSON.parse(JSON.stringify(source.userData));

        if (recursive === true) {
            for (let i = 0; i < source.children.length; i++) {
                const child = source.children[i];
                this.add(child.clone());
            }
        }

        return this;
    }

    // toJSON(meta) {
    //     // meta is a string when called from JSON.stringify
    //     let isRootObject = (meta === undefined || typeof meta === 'string');

    //     let output = {};

    //     // meta is a hash used to collect geometries, materials.
    //     // not providing it implies that this is the root object
    //     // being serialized.
    //     if (isRootObject) {
    //         // initialize meta obj
    //         meta = {
    //             geometries: {},
    //             materials: {},
    //             textures: {},
    //             images: {},
    //             shapes: {}
    //         };

    //         output.metadata = {
    //             version: 4.5,
    //             type: 'Object',
    //             generator: 'Object3D.toJSON'
    //         };
    //     }

    //     // standard Object3D serialization

    //     let object = {};

    //     object.uuid = this.uuid;
    //     object.type = this.type;

    //     if (this.name !== '') {
    //         object.name = this.name;
    //     }
    //     if (this.castShadow === true) { object.castShadow = true; }
    //     if (this.receiveShadow === true) {
    //         object.receiveShadow = true;
    //     }
    //     if (this.visible === false) {
    //         object.visible = false;
    //     }
    //     if (this.frustumCulled === false) {
    //         object.frustumCulled = false;
    //     }
    //     if (this.renderOrder !== 0) {
    //         object.renderOrder = this.renderOrder;
    //     }
    //     if (JSON.stringify(this.userData) !== '{}') {
    //         object.userData = this.userData;
    //     }

    //     object.layers = this.layers.mask;
    //     object.matrix = this.matrix.toArray();

    //     if (this.matrixAutoUpdate === false) {
    //         object.matrixAutoUpdate = false;
    //     }

    //     //

    //     function serialize(library, element) {
    //         if (library[element.uuid] === undefined) {
    //             library[element.uuid] = element.toJSON(meta);
    //         }

    //         return element.uuid;
    //     }

    //     if (this.isMesh || this.isLine || this.isPoints) {
    //         object.geometry = serialize(meta.geometries, this.geometry);

    //         let parameters = this.geometry.parameters;

    //         if (parameters !== undefined && parameters.shapes !== undefined) {
    //             const shapes = parameters.shapes;

    //             if (Array.isArray(shapes)) {
    //                 for (let i = 0, l = shapes.length; i < l; i++) {
    //                     const shape = shapes[i];

    //                     serialize(meta.shapes, shape);
    //                 }

    //             } else {
    //                 serialize(meta.shapes, shapes);
    //             }
    //         }
    //     }

    //     if (this.material !== undefined) {
    //         if (Array.isArray(this.material)) {
    //             const uuids = [];

    //             for (let i = 0, l = this.material.length; i < l; i++) {
    //                 uuids.push(serialize(meta.materials, this.material[i]));
    //             }

    //             object.material = uuids;

    //         } else {
    //             object.material = serialize(meta.materials, this.material);
    //         }
    //     }

    //     //

    //     if (this.children.length > 0) {
    //         object.children = [];

    //         for (let i = 0; i < this.children.length; i++) {
    //             object.children.push(this.children[i].toJSON(meta).object);
    //         }
    //     }

    //     if (isRootObject) {
    //         const geometries = extractFromCache(meta.geometries);
    //         const materials = extractFromCache(meta.materials);
    //         const textures = extractFromCache(meta.textures);
    //         const images = extractFromCache(meta.images);
    //         const shapes = extractFromCache(meta.shapes);

    //         if (geometries.length > 0) {
    //             output.geometries = geometries;
    //         }
    //         if (materials.length > 0) {
    //             output.materials = materials;
    //         }
    //         if (textures.length > 0) {
    //             output.textures = textures;
    //         }
    //         if (images.length > 0) {
    //             output.images = images;
    //         }
    //         if (shapes.length > 0) {
    //             output.shapes = shapes;
    //         }
    //     }

    //     output.object = object;

    //     return output;

    //     // extract data from the cache hash
    //     // remove metadata on each item
    //     // and return as array
    //     function extractFromCache(cache) {
    //         const values = [];
    //         for (const key in cache) {
    //             const data = cache[key];
    //             delete data.metadata;
    //             values.push(data);
    //         }
    //         return values;
    //     }
    // }
}
