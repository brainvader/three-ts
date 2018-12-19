import { ShaderMaterial } from './ShaderMaterial';
import { Color } from '../math/Color';
import { MaterialType } from './MaterialType';

export class ShadowMaterial extends ShaderMaterial {
    public color  = new Color( 0x000000 );

    constructor(parameters?) {
        super();
        this.setAll(parameters);
        this._transparent = true;
        this._type = MaterialType.Shadow;
    }

    copy(source: ShadowMaterial) {
        super.copy(source);
        this.color.copy(source.color);
        return this;
    }
}
