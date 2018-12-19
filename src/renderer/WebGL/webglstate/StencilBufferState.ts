import { WebGLCapabilities } from '../WebGLCapabilities';

export class StencilBufferState {
    private _locked = false;

    private _currentStencilMask = null;
    private _currentStencilFunc = null;
    private _currentStencilRef = null;
    private _currentStencilFuncMask = null;
    private _currentStencilFail = null;
    private _currentStencilZFail = null;
    private _currentStencilZPass = null;
    private _currentStencilClear = null;

    constructor(private _gl: WebGLRenderingContext, private _capabilities: WebGLCapabilities) {}

    setTest(stencilTest: boolean) {
        if (stencilTest) {
            this._capabilities.enable(this._gl.STENCIL_TEST);
        } else {
            this._capabilities.disable(this._gl.STENCIL_TEST);
        }
    }

    setMask(stencilMask: GLuint) {
        if (this._currentStencilMask !== stencilMask && !this._locked) {
            this._gl.stencilMask(stencilMask);
            this._currentStencilMask = stencilMask;
        }
    }

    setFunc(stencilFunc: GLenum, stencilRef: GLint, stencilMask: GLuint) {
        if (this._currentStencilFunc !== stencilFunc ||
            this._currentStencilRef !== stencilRef ||
            this._currentStencilFuncMask !== stencilMask) {
                this._gl.stencilFunc(stencilFunc, stencilRef, stencilMask);

                this._currentStencilFunc = stencilFunc;
                this._currentStencilRef = stencilRef;
                this._currentStencilFuncMask = stencilMask;
        }
    }

    setOp(stencilFail: GLenum, stencilZFail: GLenum, stencilZPass: GLenum) {
        if (this._currentStencilFail !== stencilFail ||
            this._currentStencilZFail !== stencilZFail ||
            this._currentStencilZPass !== stencilZPass) {
                this._gl.stencilOp(stencilFail, stencilZFail, stencilZPass);

                this._currentStencilFail = stencilFail;
                this._currentStencilZFail = stencilZFail;
                this._currentStencilZPass = stencilZPass;
        }
    }

    set locked(value: boolean) {
        this._locked = value;
    }

    setClear(stencil: GLuint) {
        if (this._currentStencilClear !== stencil) {
            this._gl.clearStencil(stencil);
            this._currentStencilClear = stencil;
        }
    }

    reset() {
        this._locked = false;
        this._currentStencilMask = null;
        this._currentStencilFunc = null;
        this._currentStencilRef = null;
        this._currentStencilFuncMask = null;
        this._currentStencilFail = null;
        this._currentStencilZFail = null;
        this._currentStencilZPass = null;
        this._currentStencilClear = null;
    }
}
