import { Light } from './Light';
import { LightType } from './constatns';

export class RectAreaLight extends Light {
    constructor(color, intensity: number, private _width = 10, private _height = 10) {
        super(color, intensity);
        this._lightType = LightType.RectArea;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    copy(source: RectAreaLight): RectAreaLight {
        super.copy(source);
        this._width = source.width;
        this._height = source.height;
        return this;
    }
}
