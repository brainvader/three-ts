import { CullFaceMode } from '../../constants';
import { WebGLCapabilities } from '../WebGLCapabilities';

export class FraceState {
    private _currentWinding = null;
    private _currentCullingMode = null;

    constructor(private _gl: WebGLRenderingContext, private _capabilities: WebGLCapabilities) { }

    setWinding(winding: boolean) {
        if (this._currentWinding !== winding) {
            if (winding) {
                this._gl.frontFace(this._gl.CW);
            } else {
                this._gl.frontFace(this._gl.CCW);
            }
            this._currentWinding = winding;
        }
    }

    setCulling(cullMode: CullFaceMode) {
        if (cullMode !== CullFaceMode.None) {
            this._capabilities.enable(this._gl.CULL_FACE);

            if (cullMode !== this._currentCullingMode) {
                if (cullMode === CullFaceMode.Back) {
                    this._gl.cullFace(this._gl.BACK);
                } else if (cullMode === CullFaceMode.Front) {
                    this._gl.cullFace(this._gl.FRONT);
                } else {
                    this._gl.cullFace(this._gl.FRONT_AND_BACK);
                }
            }
        } else {
            this._capabilities.disable(this._gl.CULL_FACE);
        }
        this._currentCullingMode = cullMode;
    }

    reset() {
        this._currentCullingMode = null;
        this._currentWinding = null;
    }
}
