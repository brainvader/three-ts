import { DepthMode } from 'src/app/cglib/materials/constants';
import { WebGLCapabilities } from '../WebGLCapabilities';

export class DepthBufferState {
    private _locked = false;
    private _currentDepthMask = null;
    private _currentDepthFunc = null;
    private _currentDepthClear = null;

    constructor(private _gl: WebGLRenderingContext, private _capabilities: WebGLCapabilities) {}

    setTest(depthTest: boolean) {
        if (depthTest) {
            this._capabilities.enable(this._gl.DEPTH_TEST);
        } else {
            this._capabilities.disable(this._gl.DEPTH_TEST);
        }
    }

    setMask(depthMask: GLboolean) {
        if (this._currentDepthMask !== depthMask && !this._locked) {
            this._gl.depthMask(depthMask);
            this._currentDepthMask = depthMask;
        }
    }

    setFunc(depthFunc?: DepthMode) {
        if (this._currentDepthFunc !== depthFunc) {
            if (depthFunc) {
                // see https://stackoverflow.com/questions/27747437/typescript-enum-switch-not-working
                switch (+depthFunc) {
                    case DepthMode.Never:
                        this._gl.depthFunc(this._gl.NEVER);
                        break;
                    case DepthMode.Always:
                        this._gl.depthFunc(this._gl.ALWAYS);
                        break;

                    case DepthMode.Less:
                        this._gl.depthFunc(this._gl.LESS);
                        break;

                    case DepthMode.LessEqual:
                        this._gl.depthFunc(this._gl.LEQUAL);
                        break;

                    case DepthMode.Equal:
                        this._gl.depthFunc(this._gl.EQUAL);
                        break;

                    case DepthMode.GreaterEqual:
                        this._gl.depthFunc(this._gl.GEQUAL);
                        break;

                    case DepthMode.Greater:
                        this._gl.depthFunc(this._gl.GREATER);
                        break;

                    case DepthMode.NotEqual:
                        this._gl.depthFunc(this._gl.NOTEQUAL);
                        break;
                    default:
                        this._gl.depthFunc(this._gl.LEQUAL);
                }
            } else {
                this._gl.depthFunc(this._gl.LEQUAL);
            }
            this._currentDepthFunc = depthFunc;
        }
    }

    set locked(value: boolean) {
        this._locked = value;
    }

    setClear(depth: GLclampf) {
        if (this._currentDepthClear !== depth) {
            this._gl.clearDepth(depth);
            this._currentDepthClear = depth;
        }
    }

    reset() {
        this._locked = false;
        this._currentDepthMask = null;
        this._currentDepthFunc = null;
        this._currentDepthClear = null;
    }
}
