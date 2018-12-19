import { Material } from './Material';
import { MaterialType } from './MaterialType';
import { Color } from '../math/Color';
import { Texture } from '../texture/Texture';

export class PointsMaterial extends Material {
    public color = new Color(0xffffff);
    public map: Texture = null;
    public size = 1;
    public sizeAttenuation = true;
    public morphTargets = false;

    constructor(...args) {
        super();
        this._type = MaterialType.Points;
        this._lights = false;
        this.setAll(args);
    }

    copy(source: PointsMaterial) {
        super.copy(source);

        this.color.copy(source.color);

        this.map = source.map;

        this.size = source.size;
        this.sizeAttenuation = source.sizeAttenuation;

        this.morphTargets = source.morphTargets;

        return this;
    }
}
