import { WebGLExtensions } from './WebGLExtensions';

const lowp = 'lowp';
const mediump = 'mediump';
const highp = 'highp';

export class WebGLCapabilities {
    private _maxAnisotropy: number;
    private _enabledCapabilities: {[key: number]: boolean};

    constructor(
        private _gl: WebGLRenderingContext,
        private _extensions: WebGLExtensions,
        private _parameters: WebGLContextAttributes
    ) {}

    enable(id: GLenum) {
        if (this._enabledCapabilities[id] !== true) {
            this._gl.enable(id);
            this._enabledCapabilities[id] = true;
        }
    }

    disable(id: GLenum) {
        if (this._enabledCapabilities[id] !== false) {
            this._gl.disable(id);
            this._enabledCapabilities[id] = false;
        }
    }

    get enabledCapabilities() {
        return this._enabledCapabilities;
    }

    resetEnables() {
        this._enabledCapabilities = {};
    }

    // see https://stackoverflow.com/questions/23769780/how-to-get-opengl-version-using-javascript
    get webglVersion(): string {
        return this._gl.getParameter(this._gl.VERSION);
    }

    get glslVersion(): string {
        return this._gl.getParameter(this._gl.SHADING_LANGUAGE_VERSION);
    }

    get maxAnisotropy() {
        return this._maxAnisotropy;
    }

    get isWebGL2(): boolean {
        return typeof WebGL2RenderingContext !== 'undefined' && this._gl instanceof WebGL2RenderingContext;
    }

    get logarithmicDepthBuffer(): boolean {
        return this._parameters.logarithmicDepthBuffer === true;
    }

    get precision(): string {
      const precision = this._parameters.precision !== undefined ? this._parameters.precision : 'highp';
      const maxPrecision = this.getMaxPrecision( precision );
      if (maxPrecision !== precision) {
        console.warn(
            'THREE.WebGLRenderer:', precision, 'not supported, using',
            maxPrecision, 'instead.');
        return maxPrecision;
      }
      return precision;
    }

    get maxTextures(): GLuint {
        return this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS);
    }

    get maxVertexTextures(): GLuint {
        return this._gl.getParameter(this._gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    }

    get maxTextureSize(): GLuint {
        return this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
    }

    get maxCubemapSize(): GLuint {
        return this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE);
    }

    get maxAttributes(): GLuint {
        return this._gl.getParameter(this._gl.MAX_VERTEX_ATTRIBS);
    }

    get maxVertexUniforms(): GLuint {
        return this._gl.getParameter(this._gl.MAX_VERTEX_UNIFORM_VECTORS);
    }

    get maxVaryings(): GLuint {
        return this._gl.getParameter(this._gl.MAX_VARYING_VECTORS);
    }

    get maxFragmentUniforms(): GLuint {
        return this._gl.getParameter(this._gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    }

    get vertexTextures(): boolean {
        return this.maxVertexTextures > 0;
    }

    get floatFragmentTextures(): boolean {
        return this.isWebGL2 || !! this._extensions.get( 'OES_texture_float' );
    }

    get floatVertexTextures(): boolean {
        return this.vertexTextures && this.floatFragmentTextures;
    }

    public getMaxAnisotropy(): number {
        if (this._maxAnisotropy !== undefined) {
            return this._maxAnisotropy;
        }

        const extension = this._extensions.get('EXT_texture_filter_anisotropic');
        if (extension !== null) {
            this._maxAnisotropy = this._gl.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        } else {
            this._maxAnisotropy = 0;
        }
        return this._maxAnisotropy;
    }

    private _getVertexShaderPrecision(precisionType: GLenum): WebGLShaderPrecisionFormat {
        return this._gl.getShaderPrecisionFormat(this._gl.VERTEX_SHADER, this._gl.HIGH_FLOAT);
    }

    private _getFragmentShaderPrecision(precisionType: GLenum): WebGLShaderPrecisionFormat {
        return this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
    }

    /**
     * Get max precision for a shader program
     * @param precision precision string
     */
    public getMaxPrecision(precision: string): string {
        if (precision === highp) {
            if (this._getVertexShaderPrecision(this._gl.HIGH_FLOAT).precision > 0 &&
                this._getFragmentShaderPrecision(this._gl.HIGH_FLOAT).precision > 0) {
                return highp;
            }
            precision = mediump;
        }

        if (precision === mediump) {
          if (this._getVertexShaderPrecision(this._gl.MEDIUM_FLOAT).precision > 0 &&
              this._getFragmentShaderPrecision(this._gl.MEDIUM_FLOAT).precision > 0) {
            return mediump;
          }
        }

        return lowp;
    }
}
