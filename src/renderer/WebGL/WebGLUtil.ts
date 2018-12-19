import { WebGLExtensions } from './WebGLExtensions';
import { WebGLCapabilities } from './WebGLCapabilities';
import { TextureWrappingMode, TextureMinificationFilter, TextureType,
    TextureFormat, CompressedTextureFormat, PVRTCFormat, ETCFormat, ASTCFormat } from '../../texture/constants';
import { MaterialBlendingEquation, MaterialSourceFactor } from '../../materials/constants';


const absNumericalSort = (a, b) => {
    return Math.abs( b[ 1 ] ) - Math.abs( a[ 1 ] );
};

/** get a webgl rendering context */
function getWebGLContext(
    canvas: HTMLCanvasElement, contextType: string,
    attributes: WebGLContextAttributes): WebGLRenderingContext {

    let gl: WebGLRenderingContext;

    gl = canvas.getContext(contextType, attributes) as WebGLRenderingContext;

    try {
        if (this._gl === null) {
            if (canvas.getContext('webgl') !== null) {
                throw new Error(
                    'Error creating WebGL context with your selected attributes.');

            } else {
                throw new Error('Error creating WebGL context.');
            }
        }

        // see https://qiita.com/tonkotsuboy_com/items/cdffcdd7bdccac371292
        if (this._gl.getShaderPrecisionFormat === undefined) {
            this._gl.getShaderPrecisionFormat = function () {
                return { 'rangeMin': 1, 'rangeMax': 1, 'precision': 1 };
            };
        }
    } catch (error) {
        console.error('PUPPET.WebGLRenderer: ' + error.message);
    }

    return gl;
}

/**
 * Add a line number to shader source code
 * @param source shader source code
 */
function addLineNumbers(source: string) {
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
        lines[i] = (i + 1) + ': ' + lines[i];
    }

    return lines.join('\n');
}


/**
 * Create a WebGLShader object
 * @param gl webgl rendering context
 * @param shaderType shader type
 * @param source shader source code
 */
function createShader(gl: WebGLRenderingContext, shaderType: number, source: string) {
    const shader: WebGLShader = this._gl.createShader(shaderType);

    this._gl.shaderSource(shader, source);
    this._gl.compileShader(shader);

    if (gl.getShaderParameter(shader, this._gl.COMPILE_STATUS) === false) {
        console.error('THREE.WebGLShader: Shader couldn\'t compile.');
    }

    if (gl.getShaderInfoLog(shader) !== '') {
        console.warn(
            'THREE.WebGLShader: this._gl.getShaderInfoLog()',
            shaderType === this._gl.VERTEX_SHADER ? 'vertex' : 'fragment',
            this._gl.getShaderInfoLog(shader), addLineNumbers(source));
    }

    // --enable-privileged-webgl-extension
    // console.log( type, this._gl.getExtension( 'WEBGL_debug_shaders'
    // ).getTranslatedShaderSource( shader ) );

    return shader;
}

/**
 * Create a webgl texture
 * @param gl WebGL Context
 * @param bindingPoint binding point for a texture
 * @param target binding point for an active texture
 * @param count the number of textures
 */
function createTexture(
    gl: WebGLRenderingContext, bindingPoint: GLenum, target: GLenum,
    count: number): WebGLTexture {
  // 4 is required to match default unpack alignment of 4.
  const data = new Uint8Array(4);
  const texture = gl.createTexture();

  gl.bindTexture(bindingPoint, texture);
  gl.texParameteri(bindingPoint, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(bindingPoint, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  for (let i = 0; i < count; i++) {
    gl.texImage2D(
        target + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  return texture;
}


class WebGLUtils {
    constructor (
        private _gl: WebGLRenderingContext,
        private _extensions: WebGLExtensions,
        private _capabilities: WebGLCapabilities) { }

    convert(p) {
        let extension;

        if (p === TextureWrappingMode.Repeat) { return this._gl.REPEAT; }
        if (p === TextureWrappingMode.ClampToEdge) { return this._gl.CLAMP_TO_EDGE; }
        if (p === TextureWrappingMode.MirroredRepeat) { return this._gl.MIRRORED_REPEAT; }

        if (p === TextureMinificationFilter.Nearest) { return this._gl.NEAREST; }
        if (p === TextureMinificationFilter.NearestMipMapNearest) { return this._gl.NEAREST_MIPMAP_NEAREST; }
        if (p === TextureMinificationFilter.NearestMipMapLinear) { return this._gl.NEAREST_MIPMAP_LINEAR; }

        if (p === TextureMinificationFilter.Linear) { return this._gl.LINEAR; }
        if (p === TextureMinificationFilter.LinearMipMapNearest) { return this._gl.LINEAR_MIPMAP_NEAREST; }
        if (p === TextureMinificationFilter.LinearMipMapLinear) { return this._gl.LINEAR_MIPMAP_LINEAR; }

        if (p === TextureType.UnsignedByte) { return this._gl.UNSIGNED_BYTE; }
        if (p === TextureType.UnsignedShort4444) { return this._gl.UNSIGNED_SHORT_4_4_4_4; }
        if (p === TextureType.UnsignedShort5551) { return this._gl.UNSIGNED_SHORT_5_5_5_1; }
        if (p === TextureType.UnsignedShort565) { return this._gl.UNSIGNED_SHORT_5_6_5; }

        if (p === TextureType.Byte) { return this._gl.BYTE; }
        if (p === TextureType.Short) { return this._gl.SHORT; }
        if (p === TextureType.UnsignedShort) { return this._gl.UNSIGNED_SHORT; }
        if (p === TextureType.Int) { return this._gl.INT; }
        if (p === TextureType.UnsignedInt) { return this._gl.UNSIGNED_INT; }
        if (p === TextureType.Float) { return this._gl.FLOAT; }

        if (p === TextureType.HalfFloat) {
            if (this._capabilities.isWebGL2) {
                const context = this._gl as WebGL2RenderingContext;
                return context.HALF_FLOAT;
            }

            extension = this._extensions.get('OES_texture_half_float');
            if (extension !== null) {
                return extension.HALF_FLOAT_OES;
            }
        }

        if (p === TextureFormat.Alpha) { return this._gl.ALPHA; }
        if (p === TextureFormat.RGB) { return this._gl.RGB; }
        if (p === TextureFormat.RGBA) { return this._gl.RGBA; }
        if (p === TextureFormat.Luminance) { return this._gl.LUMINANCE; }
        if (p === TextureFormat.LuminanceAlpha) { return this._gl.LUMINANCE_ALPHA; }
        if (p === TextureFormat.Depth) { return this._gl.DEPTH_COMPONENT; }
        if (p === TextureFormat.DepthStencil) { return this._gl.DEPTH_STENCIL; }
        // if (p === TextureFormat.Red) {return this._gl.RED; }

        if (p === MaterialBlendingEquation.Add) { return this._gl.FUNC_ADD; }
        if (p === MaterialBlendingEquation.Subtract) { return this._gl.FUNC_SUBTRACT; }
        if (p === MaterialBlendingEquation.ReverseSubtract) { return this._gl.FUNC_REVERSE_SUBTRACT; }

        if (p === MaterialSourceFactor.Zero) { return this._gl.ZERO; }
        if (p === MaterialSourceFactor.One) { return this._gl.ONE; }
        if (p === MaterialSourceFactor.SrcColor) { return this._gl.SRC_COLOR; }
        if (p === MaterialSourceFactor.OneMinusSrcColor) { return this._gl.ONE_MINUS_SRC_COLOR; }
        if (p === MaterialSourceFactor.SrcAlpha) { return this._gl.SRC_ALPHA; }
        if (p === MaterialSourceFactor.OneMinusSrcAlpha) { return this._gl.ONE_MINUS_SRC_ALPHA; }
        if (p === MaterialSourceFactor.DstAlpha) { return this._gl.DST_ALPHA; }
        if (p === MaterialSourceFactor.OneMinusDstAlpha) { return this._gl.ONE_MINUS_DST_ALPHA; }

        if (p === MaterialSourceFactor.DstColor) { return this._gl.DST_COLOR; }
        if (p === MaterialSourceFactor.OneMinusDstColor) { return this._gl.ONE_MINUS_DST_COLOR; }
        if (p === MaterialSourceFactor.SrcAlphaSaturate) { return this._gl.SRC_ALPHA_SATURATE; }

        if (p === CompressedTextureFormat.RGB_S3TC_DXT1 || p === CompressedTextureFormat.RGBA_S3TC_DXT1 ||
            p === CompressedTextureFormat.RGBA_S3TC_DXT3 || p === CompressedTextureFormat.RGBA_S3TC_DXT5) {

            extension = this._extensions.get('WEBGL_compressed_texture_s3tc');
            if (extension !== null) {
                if (p === CompressedTextureFormat.RGB_S3TC_DXT1) { return extension.COMPRESSED_RGB_S3TC_DXT1_EXT; }
                if (p === CompressedTextureFormat.RGBA_S3TC_DXT1) { return extension.COMPRESSED_RGBA_S3TC_DXT1_EXT; }
                if (p === CompressedTextureFormat.RGBA_S3TC_DXT3) { return extension.COMPRESSED_RGBA_S3TC_DXT3_EXT; }
                if (p === CompressedTextureFormat.RGBA_S3TC_DXT5) { return extension.COMPRESSED_RGBA_S3TC_DXT5_EXT; }
            }
        }

        if ( p === PVRTCFormat.RGB_4BPPV1 ||
            p === PVRTCFormat.RGB_2BPPV1 ||
            p === PVRTCFormat.RGBA_4BPPV1 ||
            p === PVRTCFormat.RGBA_2BPPV1 ) {

            extension = this._extensions.get('WEBGL_compressed_texture_pvrtc');

            if (extension !== null) {
                if (p === PVRTCFormat.RGB_4BPPV1) { return extension.COMPRESSED_RGB_PVRTC_4BPPV1_IMG; }
                if (p === PVRTCFormat.RGB_2BPPV1) { return extension.COMPRESSED_RGB_PVRTC_2BPPV1_IMG; }
                if (p === PVRTCFormat.RGBA_4BPPV1) { return extension.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG; }
                if (p === PVRTCFormat.RGBA_2BPPV1) { return extension.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG; }
            }
        }

        if (p === ETCFormat.RGB_ETC1) {
            extension = this._extensions.get('WEBGL_compressed_texture_etc1');
            if (extension !== null) { return extension.COMPRESSED_RGB_ETC1_WEBGL; }
        }

        if (p === ASTCFormat.RGBA_4x4 || p === ASTCFormat.RGBA_5x4 || p === ASTCFormat.RGBA_5x5 ||
            p === ASTCFormat.RGBA_6x5 || p === ASTCFormat.RGBA_6x6 || p === ASTCFormat.RGBA_8x5 ||
            p === ASTCFormat.RGBA_8x6 || p === ASTCFormat.RGBA_8x8 || p === ASTCFormat.RGBA_10x5 ||
            p === ASTCFormat.RGBA_10x6 || p === ASTCFormat.RGBA_10x8 || p === ASTCFormat.RGBA_10x10 ||
            p === ASTCFormat.RGBA_12x10 || p === ASTCFormat.RGBA_12x12) {

            extension = this._extensions.get('WEBGL_compressed_texture_astc');
            if (extension !== null) {
                return p;
            }
        }

        if (p === MaterialBlendingEquation.Min || p === MaterialBlendingEquation.Max) {
            if (this._capabilities.isWebGL2) {
                const context = this._gl as WebGL2RenderingContext;
                if (p === MaterialBlendingEquation.Min) { return context.MIN; }
                if (p === MaterialBlendingEquation.Max) { return context.MAX; }

            }
            extension = this._extensions.get('EXT_blend_minmax');
            if (extension !== null) {
                if (p === MaterialBlendingEquation.Min) { return extension.MIN_EXT; }
                if (p === MaterialBlendingEquation.Max) { return extension.MAX_EXT; }

            }
        }
        if (p === TextureType.UnsignedInt248) {
            if (this._capabilities.isWebGL2) {
                const context = this._gl as WebGL2RenderingContext;
                return context.UNSIGNED_INT_24_8;
            }
            extension = this._extensions.get('WEBGL_depth_texture');
            if (extension !== null) { return extension.UNSIGNED_INT_24_8_WEBGL; }
        }

        return 0;
    }
}

export {
    absNumericalSort,
    getWebGLContext,
    createShader,
    createTexture,
    WebGLUtils
};
