import { Material } from './Material';
import { Color } from '../math/Color';
import { CombineOperation } from './constants';
import { Texture } from '../texture/Texture';

export class MeshBasicMaterial extends Material {
    public color = new Color( 0xffffff );
    public map: Texture = null;

    public lightMap: Texture = null;
    public lightMapIntensity = 1.0;

    public aoMap: Texture = null;
    public aoMapIntensity = 1.0;

    public specularMap: Texture = null;
    public alphaMap = null;

    public envMap: Texture = null;
    public combine = CombineOperation.Multiply;
    public reflectivity = 1;
    public refractionRatio = 0.98;

    public wireframe = false;
    public wireframeLinewidth = 1;
    public wireframeLinecap = 'round';
    public wireframeLinejoin = 'round';

    public skinning = false;
    public morphTargets = false;

    constructor(parameters) {
        super();
        this.setAll( parameters );
    }

    copy(source): MeshBasicMaterial {
        super.copy(source);

        this.color.copy(source.color);

        this.map = source.map;

        this.lightMap = source.lightMap;
        this.lightMapIntensity = source.lightMapIntensity;

        this.aoMap = source.aoMap;
        this.aoMapIntensity = source.aoMapIntensity;

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

        return this;
    }
}
