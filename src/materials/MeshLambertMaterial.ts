import { Color } from '../math/Color';
import { Texture } from '../texture/Texture';

import { CombineOperation } from './constants';
import { Material } from './Material';
import { MaterialType } from './MaterialType';

export class MeshLambertMaterial extends Material {
    public color = new Color(0xffffff);  // diffuse

    public map: Texture = null;

    public lightMap = null;
    public lightMapIntensity = 1.0;

    public aoMap: Texture = null;
    public aoMapIntensity = 1.0;

    public emissive = new Color(0x000000);
    public emissiveIntensity = 1.0;
    public emissiveMap: Texture = null;

    public specularMap: Texture = null;

    public alphaMap: Texture = null;

    public envMap: TextureCube = null;
    public combine = CombineOperation.Multiply;
    public reflectivity = 1;
    public refractionRatio = 0.98;

    public wireframe = false;
    public wireframeLinewidth = 1;
    public wireframeLinecap = 'round';
    public wireframeLinejoin = 'round';

    public skinning = false;
    public morphTargets = false;
    public morphNormals = false;

    constructor(parameters?) {
        super();
        this._type = MaterialType.Lambert;

        this.setAll(parameters);
    }

    copy(source: MeshLambertMaterial) {
        super.copy(source);
        this.map = source.map;

        this.lightMap = source.lightMap;
        this.lightMapIntensity = source.lightMapIntensity;

        this.aoMap = source.aoMap;
        this.aoMapIntensity = source.aoMapIntensity;

        this.emissive.copy(source.emissive);
        this.emissiveMap = source.emissiveMap;
        this.emissiveIntensity = source.emissiveIntensity;

        this.specularMap = source.specularMap;

        this.alphaMap = source.alphaMap;

        this.envMap = source.envMap;
        this.combine = source.combine;
        this.reflectivity = source.reflectivity;
        this.refractionRatio = source.refractionRatio;

        this.wireframe = source.wireframe;
        this.wireframeLinewidth = source.wireframeLinewidth;
        this.wireframeLinecap = source.wireframeLinecap;
        this.wireframeLinejoin = source.wireframeLinejoin;

        this.skinning = source.skinning;
        this.morphTargets = source.morphTargets;
        this.morphNormals = source.morphNormals;

        return this;
    }
}
