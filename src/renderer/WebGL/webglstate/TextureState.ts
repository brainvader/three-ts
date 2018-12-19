import { createTexture } from '../WebGLUtil';
import { MaterialBlendingMode, MaterialBlendingEquation } from 'src/app/cglib/materials/constants';
import { WebGLExtensions } from '../WebGLExtensions';
import { WebGLCapabilities } from '../WebGLCapabilities';

export class TextureState {
    private _maxTextures: GLint;
    private _emptyTextures: { [key: number]: WebGLTexture } = {};

    private _currentTextureSlot = null;
    private _currentBoundTextures = {};

    private _currentBlendingEnabled = null;
    private _currentBlending = null;
    private _currentBlendEquation = null;
    private _currentBlendSrc = null;
    private _currentBlendDst = null;
    private _currentBlendEquationAlpha = null;
    private _currentBlendSrcAlpha = null;
    private _currentBlendDstAlpha = null;
    private _currentPremultipledAlpha = false;

    constructor(private _gl: WebGLRenderingContext, private _capabilities: WebGLCapabilities) {
        this._maxTextures =
            this._gl.getParameter(this._gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

        this._currentTextureSlot = null;
        this._currentBoundTextures = {};

        this._emptyTextures[this._gl.TEXTURE_2D] =
            createTexture(this._gl, this._gl.TEXTURE_2D, this._gl.TEXTURE_2D, 1);

        this._emptyTextures[this._gl.TEXTURE_CUBE_MAP] = createTexture(
            this._gl, this._gl.TEXTURE_CUBE_MAP,
            this._gl.TEXTURE_CUBE_MAP_POSITIVE_X, 6);
        this.setBlending(MaterialBlendingMode.No);
    }

    setBlending(
        blending: MaterialBlendingMode, blendEquation ? , blendSrc ? , blendDst ? ,
        blendEquationAlpha ?  , blendSrcAlpha ?  , blendDstAlpha ?  ,
        premultipliedAlpha ?  ) {
        if (blending === MaterialBlendingMode.No) {
            if (this._currentBlendingEnabled) {
                this._capabilities.disable(this._gl.BLEND);
                this._currentBlendingEnabled = false;
            }
            return;
        }

        if (!this._currentBlendingEnabled) {
            this._capabilities.enable(this._gl.BLEND);
            this._currentBlendingEnabled = true;
        }

        if (blending !== MaterialBlendingMode.Custom) {
            if (blending !== this._currentBlending ||
                premultipliedAlpha !== this._currentPremultipledAlpha) {
                if (this._currentBlendEquation !== MaterialBlendingEquation.Add ||
                    this._currentBlendEquationAlpha !== MaterialBlendingEquation.Add) {
                    this._gl.blendEquation(this._gl.FUNC_ADD);

                    this._currentBlendEquation = MaterialBlendingEquation.Add;
                    this._currentBlendEquationAlpha = MaterialBlendingEquation.Add;
                }

                if (premultipliedAlpha) {
                    switch (+blending) {
                        case MaterialBlendingMode.Normal:
                            this._gl.blendFuncSeparate(
                                this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE,
                                this._gl.ONE_MINUS_SRC_ALPHA);
                            break;

                        case MaterialBlendingMode.Additive:
                            this._gl.blendFunc(this._gl.ONE, this._gl.ONE);
                            break;

                        case MaterialBlendingMode.Subtractive:
                            this._gl.blendFuncSeparate(
                                this._gl.ZERO, this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR,
                                this._gl.ONE_MINUS_SRC_ALPHA);
                            break;

                        case MaterialBlendingMode.Multiply:
                            this._gl.blendFuncSeparate(
                                this._gl.ZERO, this._gl.SRC_COLOR, this._gl.ZERO,
                                this._gl.SRC_ALPHA);
                            break;

                        default:
                            console.error('THREE.WebGLState: Invalid blending: ', blending);
                            break;
                    }

                } else {
                    switch (blending) {
                        case MaterialBlendingMode.Normal:
                            this._gl.blendFuncSeparate(
                                this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA,
                                this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
                            break;

                        case MaterialBlendingMode.Additive:
                            this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE);
                            break;

                        case MaterialBlendingMode.Subtractive:
                            this._gl.blendFunc(this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR);
                            break;

                        case MaterialBlendingMode.Multiply:
                            this._gl.blendFunc(this._gl.ZERO, this._gl.SRC_COLOR);
                            break;

                        default:
                            console.error('THREE.WebGLState: Invalid blending: ', blending);
                            break;
                    }
                }

                this._currentBlendSrc = null;
                this._currentBlendDst = null;
                this._currentBlendSrcAlpha = null;
                this._currentBlendDstAlpha = null;

                this._currentBlending = blending;
                this._currentPremultipledAlpha = premultipliedAlpha;
            }

            return;
        }
    }

    active(webglSlot?: number) {
        if (webglSlot === undefined) { webglSlot = this._gl.TEXTURE0 + this._maxTextures - 1; }

        if (this._currentTextureSlot !== webglSlot) {
            this._gl.activeTexture(webglSlot);
            this._currentTextureSlot = webglSlot;
        }
    }

    bind(bindingPoint: GLenum, webglTexture: WebGLTexture) {
        if (this._currentTextureSlot === null) {
            this.active();
        }

        let boundTexture = this._currentBoundTextures[this._currentTextureSlot];

        if (boundTexture === undefined) {
            boundTexture = { type: undefined, texture: undefined };
            this._currentBoundTextures[this._currentTextureSlot] = boundTexture;
        }

        if (boundTexture.type !== bindingPoint ||
            boundTexture.texture !== webglTexture) {
            this._gl.bindTexture(bindingPoint, webglTexture || this._emptyTextures[bindingPoint]);

            boundTexture.type = bindingPoint;
            boundTexture.texture = webglTexture;
        }
    }

    reset() {
        this._currentTextureSlot = null;
        this._currentBoundTextures = {};
        this._currentBlending = null;
    }
}
