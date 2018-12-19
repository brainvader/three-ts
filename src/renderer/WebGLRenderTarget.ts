import { Vector4 } from '../math/Vector4';
import { Texture } from '../texture/Texture';
import { TextureMinificationFilter } from '../texture/constants';

export class WebGLRenderTarget {
    private _scissor: Vector4;
    private _scissorTest = false;
    private _viewport: Vector4;
    private _texture: Texture;

    private _depthBuffer: boolean;
    private _stencilBuffer: boolean;
    private _depthTexture: boolean;

    constructor(private _width: number, private _height: number, options: any = {}) {
        this._scissor = new Vector4(0, 0, this._width, this._height);
        this._viewport = new Vector4(0, 0, this._width, this._height);

        this._texture = new Texture(
            undefined, undefined, options.wrapS, options.wrapT,
            options.magFilter, options.minFilter, options.format, options.type,
            options.anisotropy, options.encoding);

        this._texture.generateMipmaps = options.generateMipmaps !== undefined ? options.generateMipmaps : false;
        this._texture.minFilter = options.minFilter !== undefined ? options.minFilter : TextureMinificationFilter.Linear;

        this._depthBuffer = options.depthBuffer !== undefined ? options.depthBuffer : true;
        this._stencilBuffer = options.stencilBuffer !== undefined ? options.stencilBuffer : true;
        this._depthTexture = options.depthTexture !== undefined ? options.depthTexture : null;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get viewport() {
        return this._viewport;
    }

    get scissor() {
        return this._scissor;
    }

    get scissorTest() {
        return this._scissorTest;
    }

    get texture() {
        return this._texture;
    }

    get depthBuffer() {
        return this._depthBuffer;
    }

    get stencilBuffer() {
        return this._stencilBuffer;
    }

    get depthTexture() {
        return this._depthTexture;
    }

    setSize(width: number, height: number) {
        if (this._width !== width || this._height !== height) {
            this._width = width;
            this._height = height;

            this.dispose();
        }

        this._viewport.setAll(0, 0, width, height);
        this._scissor.setAll(0, 0, width, height);
    }

    clone() {
        return new (this.constructor().copy( this ));
    }

    copy(source: WebGLRenderTarget) {
        this._width = source.width;
        this._height = source.height;

        this.viewport.copy(source.viewport);

        this._texture = source.texture.clone();

        this._depthBuffer = source.depthBuffer;
        this._stencilBuffer = source.stencilBuffer;
        this._depthTexture = source.depthTexture;

        return this;
    }

    // TODO: Need Implementation
    dispose() {}
}
