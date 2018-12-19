import { Vector4 } from 'src/app/cglib/math/Vector4';

export class ColorBufferState {
    private _locked = false;
    private _currentColorMask: boolean = null;
    private _color = new Vector4();
    private _currentColorClear = new Vector4(0, 0, 0, 0);

    constructor(private _gl: WebGLRenderingContext) {}

    setMask(colorMask: boolean) {
        if (this._currentColorMask !== colorMask && !this._locked) {
            this._gl.colorMask(colorMask, colorMask, colorMask, colorMask);
            this._currentColorMask = colorMask;
        }
    }

    set locked(value: boolean) {
        this._locked = value;
    }

    setClear(r: number, g: number, b: number, a: number, premultipliedAlpha?: boolean) {
        if (premultipliedAlpha === true) {
            r *= a;
            g *= a;
            b *= a;
        }

        this._color.setAll(r, g, b, a);

        if (this._currentColorClear.equals(this._color) === false) {
            this._gl.clearColor(r, g, b, a);
            this._currentColorClear.copy(this._color);
        }
    }

    reset() {
        this._locked = false;
        this._currentColorMask = null;
        // set to invalid state
        this._currentColorClear.setAll(-1, 0, 0, 0);
    }
}
