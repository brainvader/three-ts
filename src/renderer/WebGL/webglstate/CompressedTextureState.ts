import { WebGLExtensions } from '../WebGLExtensions';

export class CompressedTextureState {
    private _compressedTextureFormats = null;

    constructor(private _gl: WebGLRenderingContext, private _extensions: WebGLExtensions) {}

    getCompressedTextureFormats() {
        if (this._compressedTextureFormats === null) {
            this._compressedTextureFormats = [];

            if (this._extensions.get('WEBGL_compressed_texture_pvrtc') ||
                this._extensions.get('WEBGL_compressed_texture_s3tc') ||
                this._extensions.get('WEBGL_compressed_texture_etc1') ||
                this._extensions.get('WEBGL_compressed_texture_astc')) {
                const formats: Uint32Array = this._gl.getParameter(this._gl.COMPRESSED_TEXTURE_FORMATS);

                for (let i = 0; i < formats.length; i++) {
                    this._compressedTextureFormats.push(formats[i]);
                }
            }
        }

        return this._compressedTextureFormats;
    }

    reset() {
        this._compressedTextureFormats = null;
    }
}
