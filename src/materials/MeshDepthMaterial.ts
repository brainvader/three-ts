import { Material } from './Material';
import { MaterialType } from './MaterialType';
import { TextureEncoding } from '../texture/constants';
import { Texture } from '../texture/Texture';

export class MeshDepthMaterial extends Material {
    public depthPacking = TextureEncoding.BasicDepthPacking;
    public skinning = false;
    public morphTargets = false;

    public map: Texture = null;
    public alphaMap = null;

    public displacementMap: Texture = null;
    public displacementScale = 1;
    public displacementBias = 0;

    public wireframe = false;
    public wireframeLinewidth = 1;

    constructor(parameters?) {
        super();
        this._type = MaterialType.Depth;
        this._fog = false;
        this._lights = false;
        this.setAll( parameters );
    }

    copy(source: MeshDepthMaterial) {
        super.copy(source);

        this.depthPacking = source.depthPacking;

        this.skinning = source.skinning;
        this.morphTargets = source.morphTargets;

        this.map = source.map;

        this.alphaMap = source.alphaMap;

        this.displacementMap = source.displacementMap;
        this.displacementScale = source.displacementScale;
        this.displacementBias = source.displacementBias;

        this.wireframe = source.wireframe;
        this.wireframeLinewidth = source.wireframeLinewidth;

        return this;
    }
}
