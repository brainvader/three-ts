import { Light } from './Light';
import { LightType } from './constatns';
import { LightShadow } from './shadow/LightShadow';
import { PerspectiveCamera } from '../camera/PerspectiveCamera';

export class PointLight extends Light {
    private _shadow = new LightShadow(new PerspectiveCamera(90, 1, 0.5, 500));

    /**
     *
     * @param color color
     * @param intensity light intensity
     * @param distance
     * @param decay light decay coefficient (for physically correct lights, should be 2)
     */
    constructor(color, intensity, private _distance = 0, private _decay = 1) {
        super(color, intensity);
        this._color = color;
        this._intensity = intensity;
        this._lightType = LightType.Point;
    }

    get power() {
        return this._intensity　* 4 * Math.PI;
    }

    set power(value) {
        this._intensity = value / ( 4 * Math.PI );
    }

    get distance() {
        return this._distance;
    }

    get decay() {
        return this._decay;
    }

    get shadow() {
        return this._shadow;
    }

    copy(source: PointLight): PointLight {
        super.copy(source);
        this._distance = source.distance;
        this._decay = source.decay;
        this._shadow = source.shadow.clone();
        return this;
    }
}
