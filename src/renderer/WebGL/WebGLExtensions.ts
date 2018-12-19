export class WebGLExtensions {
    private _extensions: any;

    constructor(private _gl: WebGLRenderingContext) {
        this._extensions = {};
    }

    /**
     * Get a WebGL extension
     * @param name extension name
     */
    get(name: string) {
        if (this._extensions[name] !== null) {
            return this._extensions[name];
        }

        let extension: any;

        switch (name) {
            case 'WEBGL_depth_texture':
              extension = this._gl.getExtension('WEBGL_depth_texture') ||
                  this._gl.getExtension('MOZ_WEBGL_depth_texture') ||
                  this._gl.getExtension('WEBKIT_WEBGL_depth_texture');
              break;

            case 'EXT_texture_filter_anisotropic':
              extension =
                  this._gl.getExtension('EXT_texture_filter_anisotropic') ||
                  this._gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                  this._gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
              break;

            case 'WEBGL_compressed_texture_s3tc':
              extension =
                  this._gl.getExtension('WEBGL_compressed_texture_s3tc') ||
                  this._gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
                  this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
              break;

            case 'WEBGL_compressed_texture_pvrtc':
              extension =
                  this._gl.getExtension('WEBGL_compressed_texture_pvrtc') ||
                  this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
              break;

            default:
                extension = this._gl.getExtension(name);
        }

        if (extension === null) {
            console.warn(
                'THREE.WebGLRenderer: ' + name + ' extension not supported.');
        }

        this._extensions[name] = extension;

        return extension;
    }
}
