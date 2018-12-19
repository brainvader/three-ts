import { WebGLCapabilities } from '../WebGLCapabilities';
import { Vector4 } from 'src/app/cglib/math/Vector4';

export type ScissorBox = Vector4;

export class ScissorState {
    private _currentScissor = new Vector4();

    constructor(private _gl: WebGLRenderingContext, private _capabilities: WebGLCapabilities) {}

    setScissorBox(scissor: ScissorBox) {
        if (this._currentScissor.equals(scissor) === false) {
            this._gl.scissor(scissor.x, scissor.y, scissor.z, scissor.w);
            this._currentScissor.copy(scissor);
        }
    }

    setScissorTest(scissorTest: boolean) {
        if (scissorTest) {
            this._capabilities.enable(this._gl.SCISSOR_TEST);
        } else {
            this._capabilities.disable(this._gl.SCISSOR_TEST);
        }
    }
}
