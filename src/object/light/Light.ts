import { Color } from '../../math/Color';
import { Object3D } from '../../core/Object3D';
import { Object3DType } from '../Object3DType';
import { LightType } from './constatns';
import { Vector3 } from '../../math/Vector3';

export abstract class Light extends Object3D {
    protected _color: Color;
    protected _lightType: LightType;

    constructor(color: number | string, protected _intensity = 1) {
        super();
        this._type = Object3DType.Light;
        this._lightType = LightType.Basic;
        this._color = new Color(color);
        this._receiveShadow = undefined;
    }

    get id() {
        return this._id;
    }

    get color(): Color {
        return this._color;
    }

    get intensity(): number {
        return this._intensity;
    }

    get position(): Vector3 {
        return this._position;
    }

    get lightType() {
        return this._lightType;
    }

    copy(source: Light): Light {
        super.copy(source);
        this._color.copy(source.color);
        this._intensity = source.intensity;
        return this;
    }

    // toJSON(meta: string): Object {
    //     const data = Object3D.prototype.toJSON.call(this, meta);

    //     data.object.color = this.color.getHex();
    //     data.object.intensity = this.intensity;

    //     if (this.groundColor !== undefined) {
    //         data.object.groundColor = this.groundColor.getHex();
    //     }

    //     if (this.distance !== undefined) {
    //         data.object.distance = this.distance;
    //     }
    //     if (this.angle !== undefined) {
    //         data.object.angle = this.angle;
    //     }
    //     if (this.decay !== undefined) {
    //         data.object.decay = this.decay;
    //     }
    //     if (this.penumbra !== undefined) {
    //         data.object.penumbra = this.penumbra;
    //     }

    //     if (this.shadow !== undefined) {
    //         data.object.shadow = this.shadow.toJSON();
    //     }

    //     return data;
    // }
}
