import { Vector3 } from '../math/Vector3';
import { Color } from '../math/Color';

export class Face3 {
    private _vertexNormals: Vector3[] = [];
    private _vertexColors: Color[] = [];

    private _normal: Vector3;
    private _color: Color;

    constructor(
        private _a: number, private _b: number, private _c: number,
        normal?: Vector3 | Vector3[],
        color?: Color | Color[],
        private _materialIndex = 0) {
            this._normal = ( normal && normal instanceof Vector3 ) ? normal : new Vector3();
            this._vertexNormals = Array.isArray( normal ) ? normal : [];
            this._color = ( color && color instanceof Color ) ? color : new Color();
            this._vertexColors = Array.isArray( color ) ? color : [];
    }

    get a() {
        return this._a;
    }

    get b() {
        return this._b;
    }

    get c() {
        return this._c;
    }

    get color() {
        return this._color;
    }

    get normal() {
        return this._normal;
    }

    get materialIndex() {
        return this._materialIndex;
    }

    set materialIndex(index) {
        this._materialIndex = index;
    }

    get vertexNormals() {
        return this._vertexNormals;
    }

    get vertexColors() {
        return this._vertexColors;
    }

    clone() {
        return new (this.constructor()).copy( this );
    }

    copy(source: Face3) {
        this._a = source.a;
        this._b = source.b;
        this._c = source.c;

        this._normal.copy(source.normal);
        this._color.copy(source.color);

        this._materialIndex = source.materialIndex;

        for (let i = 0, il = source.vertexNormals.length; i < il; i++) {
            this._vertexNormals[i] = source.vertexNormals[i].clone();
        }

        for (let i = 0, il = source.vertexColors.length; i < il; i++) {
            this._vertexColors[i] = source.vertexColors[i].clone();
        }

        return this;
    }
}
