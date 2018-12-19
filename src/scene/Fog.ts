import { Color } from '../math/Color';

export class Fog {
    private _name = '';
    private _color: Color;

    constructor(color: number | string | Color, private _near = 1, private _far = 1000) {
        this._color = new Color( color );
    }

    clone() {
        return new Fog( this._color, this._near, this._far );
    }

    toJSON() {
        return  {
            type: 'Fog',
            color: this._color.getHex(),
            near: this._near,
            far: this._far
        };
    }
}
