import { Vector4 } from 'src/app/cglib/math/Vector4';

export class ViewPortState {
    private _currentViewport = new Vector4();
    constructor(private _gl: WebGLRenderingContext) {}

    set viewport(viewport: Vector4) {
        if (this._currentViewport.equals(viewport) === false) {
            this._gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
            this._currentViewport.copy(viewport);
        }
    }
}
