import { WebGLRenderTarget } from './WebGLRenderTarget';

export class WebGLRenderTargetCube  extends WebGLRenderTarget {
    private _activeCubeFace = 0; // PX 0, NX 1, PY 2, NY 3, PZ 4, NZ 5
    private _activeMipMapLevel = 0;

    constructor(width: number, height: number, options: any = {}) {
        super(width, height, options);
    }

    get activeCubeFace() {
        return this._activeCubeFace;
    }

    get activeMipMapLevel() {
        return this._activeMipMapLevel;
    }
}
