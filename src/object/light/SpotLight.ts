import { Light } from './Light';
import { LightType } from './constatns';
import { Object3D } from '../../core/Object3D';
import { SpotLightShadow } from './shadow/SpotLightShadow';

export class SpotLight extends Light {
    private _target = new Object3D();
    private _shadow = new SpotLightShadow();

    constructor(
        color, intensity, private _distance = 0, private _angle = Math.PI / 3,
        private _penumbra = 0, private _decay = 1) {
        super(color, intensity);
        this._lightType = LightType.Spot;
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

    get angle() {
        return this._angle;
    }

    get penumbra() {
        return this._penumbra;
    }

    get decay() {
        return this._decay;
    }

    get target() {
        return this._target;
    }

    get shadow() {
        return this._shadow;
    }

    copy(source: SpotLight): SpotLight {
        super.copy(source);

        this._distance = source.distance;
        this._angle = source.angle;
        this._penumbra = source.penumbra;
        this._decay = source.decay;
        this._target = source.target.clone();
        this._shadow = source.shadow.clone() as SpotLightShadow;

        return this;
    }
}
