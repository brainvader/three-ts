import { Material } from './Material';
import { Color } from '../math/Color';
import { Texture } from '../texture/Texture';
import { MaterialType } from './MaterialType';

export class SpriteMaterial extends Material {
    public color = new Color( 0xffffff );
    public map: Texture;

    public rotation = 0;
    public sizeAttenuation = true;

    constructor(parameters?) {
        super();
        this._type = MaterialType.Sprite;
        this.setAll(parameters);
    }

    copy(source: SpriteMaterial) {
        this.map = source.map;
        this.rotation = source.rotation;
        this.sizeAttenuation = source.sizeAttenuation;
        return this;
    }
}
