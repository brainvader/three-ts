import { Light } from './Light';
import { LightType } from './constatns';
import { DirectionalLightShadow } from './shadow/DirectionalLightShadow';
import { Object3D } from '../../core/Object3D';

export class DirectionalLight extends Light {
    private _target = new Object3D();
    private _shadow = new DirectionalLightShadow();

    constructor(color, intensity) {
        super(color, intensity);
        this._lightType = LightType.Directional;

        this._position.copy( Object3D.DefaultUp );
        this.updateMatrix();
        this._shadow = new DirectionalLightShadow();
    }

    get target() {
        return this._target;
    }

    get shadow() {
        return this._shadow;
    }

    copy(source: DirectionalLight): DirectionalLight {
        super.copy(source);
        this._target = source.target.clone();
        this._shadow = source.shadow.clone();
        return this;
    }
}
