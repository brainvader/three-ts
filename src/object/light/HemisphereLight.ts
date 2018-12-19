import { Light } from './Light';
import { LightType } from './constatns';

import { Color } from '../../math/Color';
import { Object3D } from '../../core/Object3D';

export class HemisphereLight extends Light {
    private _groundColor: Color;

    constructor(skyColor, intensity, groundColor = null, ) {
        super(skyColor, intensity);
        this._lightType = LightType.Hemisphere;
        this._position.copy(Object3D.DefaultUp);
        this.updateMatrix();
        this._groundColor = new Color(groundColor);
    }

    get groundColor(): Color {
        return this._groundColor;
    }

    copy(source: HemisphereLight): HemisphereLight {
        super.copy(source);
        this._groundColor.copy(source.groundColor);
        return this;
    }
}
