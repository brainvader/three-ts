import { Material } from './Material';
import { MaterialType, NormalMapType } from './MaterialType';
import { CombineOperation } from './constants';
import { Vector2 } from '../math/Vector2';
import { Texture } from '../texture/Texture';
import { Color } from '../math/Color';

export class MeshPhongMaterial extends Material {
    public color = new Color(0xffffff); // diffuse
    public specular = new Color(0x111111);
    public shininess = 30;

    public map: Texture = null;

    public lightMap: Texture = null;
    public lightMapIntensity = 1.0;

    public aoMap: Texture = null;
    public aoMapIntensity = 1.0;

    public emissive = new Color(0x000000);
    public emissiveIntensity = 1.0;
    public emissiveMap: Texture = null;

    public bumpMap: Texture = null;
    public bumpScale = 1;

    public normalMap: Texture = null;
    public normalMapType = NormalMapType.TangentSpace;
    public normalScale = new Vector2(1, 1);

    public displacementMap: Texture = null;
    public displacementScale = 1;
    public displacementBias = 0;

    public specularMap: Texture = null;

    public alphaMap: Texture = null;

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
    public morphNormals = false;

    constructor(parameters?) {
        super();
        this._type = MaterialType.Phong;
    }

    copy(source: MeshPhongMaterial) {
        super.copy(source);

        this.color.copy(source.color);
        this.specular.copy(source.specular);
        this.shininess = source.shininess;

        this.map = source.map;

        this.lightMap = source.lightMap;
        this.lightMapIntensity = source.lightMapIntensity;

        this.aoMap = source.aoMap;
        this.aoMapIntensity = source.aoMapIntensity;

        this.emissive.copy(source.emissive);
        this.emissiveMap = source.emissiveMap;
        this.emissiveIntensity = source.emissiveIntensity;

        this.bumpMap = source.bumpMap;
        this.bumpScale = source.bumpScale;

        this.normalMap = source.normalMap;
        this.normalMapType = source.normalMapType;
        this.normalScale.copy(source.normalScale);

        this.displacementMap = source.displacementMap;
        this.displacementScale = source.displacementScale;
        this.displacementBias = source.displacementBias;

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
