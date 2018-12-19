import { Object3D } from '../core/Object3D';
import { BufferGeometry } from '../core/BufferGeometry';
import { DrawMode, GeometryType, BufferGeometryType } from './constatns';
import { MeshBasicMaterial } from '../materials/MeshBasicMaterial';
import { Object3DType } from './Object3DType';

export class Mesh extends Object3D {
    public drawMode =  DrawMode.Triangles;
    private _morphTargetInfluences = [];
    private _morphTargetDictionary = {};

    protected _geometry: BufferGeometryType | GeometryType;

    constructor(
        geometry: BufferGeometryType | GeometryType,
        protected _material = new MeshBasicMaterial( { color: Math.random() * 0xffffff } )) {
            super();
            this._geometry  = geometry || new BufferGeometry();
            this._type = Object3DType.Mesh;
    }

    get geometry() {
        return this._geometry;
    }

    get material() {
        return this._material;
    }

    get morphTargetInfluences() {
        return this._morphTargetInfluences;
    }

    get morphTargetDictionary() {
        return this._morphTargetDictionary;
    }

    copy(source: Mesh): Mesh {
        super.copy(source);

        this.drawMode = source.drawMode;

        if (source.morphTargetInfluences !== undefined) {
            this._morphTargetInfluences = source.morphTargetInfluences.slice();
        }

        if (source.morphTargetDictionary !== undefined) {
            this._morphTargetDictionary = Object.assign({}, source.morphTargetDictionary);
        }

        return this;
    }

    updateMorphTargets() {
        const geometry = this._geometry;
        let m: number;
        let ml: number;
        let name: string;

        if (geometry instanceof BufferGeometry) {
            const morphAttributes = geometry.morphAttributes;
            const keys = Object.keys(morphAttributes);

            if (keys.length > 0) {
                const morphAttribute = morphAttributes[keys[0]];

                if (morphAttribute !== undefined) {
                    this._morphTargetInfluences = [];
                    this._morphTargetDictionary = {};

                    for (m = 0, ml = morphAttribute.length; m < ml; m++) {
                        name = morphAttribute[m].name || String(m);

                        this.morphTargetInfluences.push(0);
                        this.morphTargetDictionary[name] = m;
                    }
                }
            }

        } else {
            const morphTargets = geometry.morphTargets;

            if (morphTargets !== undefined && morphTargets.length > 0) {
                this._reset();

                for (m = 0, ml = morphTargets.length; m < ml; m++) {
                    name = morphTargets[m].name || String(m);

                    this.morphTargetInfluences.push(0);
                    this.morphTargetDictionary[name] = m;
                }
            }
        }
    }

    clone() {
        return new Mesh(this._geometry, this._material).copy(this);
    }

    // TODO: Implement
    raycast() {}


    private _reset() {
        this._morphTargetInfluences = [];
        this._morphTargetDictionary = {};
    }
}
