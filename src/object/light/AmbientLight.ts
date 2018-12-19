import { Light } from './Light';
import { LightType } from './constatns';

export class AmbientLight extends Light {
    private _castShadwo = undefined;

    constructor( color, intensity) {
        super(color, intensity);
        this._lightType = LightType.Ambient;
    }

    get castShadow() {
        return this._castShadwo;
    }
}
