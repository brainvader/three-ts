import { Material } from './Material';
import { MaterialType, NormalMapType } from './MaterialType';
import { Vector2 } from '../math/Vector2';
import { Texture } from '../texture/Texture';

export class MeshNormalMaterial extends Material {
    public bumpMap = null;
    public bumpScale = 1;

    public normalMap: Texture = null;
    public normalMapType =  NormalMapType.TangentSpace;
    public normalScale = new Vector2(1, 1);

    public displacementMap: Texture = null;
    public displacementScale = 1;
    public displacementBias = 0;

    public wireframe = false;
    public wireframeLinewidth = 1;

    public fog = false;
    public lights = false;

    public skinning = false;
    public morphTargets = false;
    public morphNormals = false;

    constructor(parameters?) {
        super();
        this._type = MaterialType.Normal;
        this.setAll(parameters);
    }

    copy(source: MeshNormalMaterial) {
        super.copy(source);
        this.bumpMap = source.bumpMap;
        this.bumpScale = source.bumpScale;

        this.normalMap = source.normalMap;
        this.normalMapType = source.normalMapType;
        this.normalScale.copy(source.normalScale);

        this.displacementMap = source.displacementMap;
        this.displacementScale = source.displacementScale;
        this.displacementBias = source.displacementBias;

        this.wireframe = source.wireframe;
        this.wireframeLinewidth = source.wireframeLinewidth;

        this.skinning = source.skinning;
        this.morphTargets = source.morphTargets;
        this.morphNormals = source.morphNormals;

        return this;
    }
}
