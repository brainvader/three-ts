import { CombineOperation } from '../../materials/constants';
import { TextureMappingMode } from '../../texture/constants';
import { ShadowMapType, ToneMapping } from '../constants';

import { filterEmptyLine, generateDefines, generateExtensions, getTexelDecodingFunction, getTexelEncodingFunction,
    getToneMappingFunction, replaceClippingPlaneNums, replaceLightNums, parseIncludes, unrollLoops } from './ShaderUtils';
import { WebGLRenderer } from '../WebGLRenderer';
import { WebGLExtensions } from '../WebGL/WebGLExtensions';

export class FragmentShader {
    // TODO: Rename
    private _shader;
    private _prefix: string;
    private _body: string;
    private _glsl: string;

    private _customDefines: string;
    private _customExtensions: string;

    private _shadowMapTypeDefine: string;

    constructor(
        renderer: WebGLRenderer, extensions: WebGLExtensions, material, shader, parameters, capabilities) {
        this._shader = shader.fragmentShader;
        const name = this._shader.name;
        this._customDefines = generateDefines(material.defines);
        this._customExtensions = capabilities.isWebGL2 ?
            '' :
            generateExtensions(material.extensions, parameters, extensions);

        const gammaFactorDefine = ( renderer.gammaFactor > 0 ) ? renderer.gammaFactor : 1.0;

        if (parameters.shadowMapType === ShadowMapType.PCF) {
            this._shadowMapTypeDefine = 'SHADOWMAP_TYPE_PCF';
        } else if (parameters.shadowMapType === ShadowMapType.PCFSoft) {
            this._shadowMapTypeDefine = 'SHADOWMAP_TYPE_PCF_SOFT';
        }

        let envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
        let envMapModeDefine = 'ENVMAP_MODE_REFLECTION';
        let envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';

        if (parameters.envMap) {
            switch (material.envMap.mapping) {
                case TextureMappingMode.CubeReflection:
                case TextureMappingMode.CubeRefraction:
                    envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
                    break;

                case TextureMappingMode.CubeUVReflection:
                case TextureMappingMode.CubeUVRefraction:
                    envMapTypeDefine = 'ENVMAP_TYPE_CUBE_UV';
                    break;

                case TextureMappingMode.EquirectangularReflection:
                case TextureMappingMode.EquirectangularRefraction:
                    envMapTypeDefine = 'ENVMAP_TYPE_EQUIREC';
                    break;

                case TextureMappingMode.SphericalReflection:
                    envMapTypeDefine = 'ENVMAP_TYPE_SPHERE';
                    break;
            }

            switch (material.envMap.mapping) {
                case TextureMappingMode.CubeRefraction:
                case TextureMappingMode.EquirectangularRefraction:
                    envMapModeDefine = 'ENVMAP_MODE_REFRACTION';
                    break;
            }

            switch (material.combine) {
                case CombineOperation.Multiply:
                    envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';
                    break;

                case CombineOperation.Mix:
                    envMapBlendingDefine = 'ENVMAP_BLENDING_MIX';
                    break;

                case CombineOperation.Add:
                    envMapBlendingDefine = 'ENVMAP_BLENDING_ADD';
                    break;
            }
        }

        if (material.isRawShaderMaterial) {
            this._setCustomDefines();
        } else {
            this._prefix = [
                this._customExtensions,

                'precision ' + parameters.precision + ' float;',
                'precision ' + parameters.precision + ' int;',

                '#define SHADER_NAME ' + name,

                this._customDefines,

                parameters.alphaTest ? '#define ALPHATEST ' + parameters.alphaTest +
                    (parameters.alphaTest % 1 ? '' : '.0') :
                    '',  // add '.0' if integer

                '#define GAMMA_FACTOR ' + gammaFactorDefine,

                (parameters.useFog && parameters.fog) ? '#define USE_FOG' : '',
                (parameters.useFog && parameters.fogExp) ? '#define FOG_EXP2' : '',

                parameters.map ? '#define USE_MAP' : '',
                parameters.matcap ? '#define USE_MATCAP' : '',
                parameters.envMap ? '#define USE_ENVMAP' : '',
                parameters.envMap ? '#define ' + envMapTypeDefine : '',
                parameters.envMap ? '#define ' + envMapModeDefine : '',
                parameters.envMap ? '#define ' + envMapBlendingDefine : '',
                parameters.lightMap ? '#define USE_LIGHTMAP' : '',
                parameters.aoMap ? '#define USE_AOMAP' : '',
                parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',
                parameters.bumpMap ? '#define USE_BUMPMAP' : '',
                parameters.normalMap ? '#define USE_NORMALMAP' : '',
                (parameters.normalMap && parameters.objectSpaceNormalMap) ?
                    '#define OBJECTSPACE_NORMALMAP' :
                    '',
                parameters.specularMap ? '#define USE_SPECULARMAP' : '',
                parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
                parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',
                parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
                parameters.vertexColors ? '#define USE_COLOR' : '',

                parameters.gradientMap ? '#define USE_GRADIENTMAP' : '',

                parameters.flatShading ? '#define FLAT_SHADED' : '',

                parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
                parameters.flipSided ? '#define FLIP_SIDED' : '',

                parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
                parameters.shadowMapEnabled ? '#define ' + this._shadowMapTypeDefine : '',

                parameters.premultipliedAlpha ? '#define PREMULTIPLIED_ALPHA' : '',

                parameters.physicallyCorrectLights ?
                    '#define PHYSICALLY_CORRECT_LIGHTS' :
                    '',

                parameters.logarithmicDepthBuffer ? '#define USE_LOGDEPTHBUF' : '',
                parameters.logarithmicDepthBuffer &&
                    (capabilities.isWebGL2 || extensions.get('EXT_frag_depth')) ?
                    '#define USE_LOGDEPTHBUF_EXT' :
                    '',

                parameters.envMap &&
                    (capabilities.isWebGL2 ||
                        extensions.get('EXT_shader_texture_lod')) ?
                    '#define TEXTURE_LOD_EXT' :
                    '',

                'uniform mat4 viewMatrix;',
                'uniform vec3 cameraPosition;',

                (parameters.toneMapping !== ToneMapping.No) ? '#define TONE_MAPPING' :
                    '',
                (parameters.toneMapping !== ToneMapping.No) ?
                    ShaderChunk['tonemapping_pars_fragment'] :
                    '',  // this code is required here because it is used by the
                // toneMapping() function defined below
                (parameters.toneMapping !== ToneMapping.No) ?
                    getToneMappingFunction('toneMapping', parameters.toneMapping) :
                    '',

                parameters.dithering ? '#define DITHERING' : '',

                (parameters.outputEncoding || parameters.mapEncoding ||
                    parameters.matcapEncoding || parameters.envMapEncoding ||
                    parameters.emissiveMapEncoding) ?
                    ShaderChunk['encodings_pars_fragment'] :
                    '',  // this code is required here because it is used by the various
                // encoding/decoding function defined below
                parameters.mapEncoding ?
                    getTexelDecodingFunction(
                        'mapTexelToLinear', parameters.mapEncoding) :
                    '',
                parameters.matcapEncoding ?
                    getTexelDecodingFunction(
                        'matcapTexelToLinear', parameters.matcapEncoding) :
                    '',
                parameters.envMapEncoding ?
                    getTexelDecodingFunction(
                        'envMapTexelToLinear', parameters.envMapEncoding) :
                    '',
                parameters.emissiveMapEncoding ?
                    getTexelDecodingFunction(
                        'emissiveMapTexelToLinear', parameters.emissiveMapEncoding) :
                    '',
                parameters.outputEncoding ?
                    getTexelEncodingFunction(
                        'linearToOutputTexel', parameters.outputEncoding) :
                    '',

                parameters.depthPacking ?
                    '#define DEPTH_PACKING ' + material.depthPacking :
                    '',

                '\n'
            ].filter( filterEmptyLine ).join( '\n' );
        }

        this._body = parseIncludes(this._shader);
        this._body = replaceLightNums(this._shader, parameters);
        this._body = replaceClippingPlaneNums(this._shader, parameters);
        this._body = unrollLoops(this._shader);

        if ( capabilities.isWebGL2 && ! material.isRawShaderMaterial ) { } {
            let isGLSL3ShaderMaterial = false;
            const versionRegex = /^\s*#version\s+300\s+es\s*\n/;
            if ( material.isShaderMaterial &&
                this._body.match( versionRegex ) !== null ) {

                isGLSL3ShaderMaterial = true;
                this._body = this._body.replace( versionRegex, '' );

            }

            // GLSL 3.0 conversion
            this._prefix = [
                '#version 300 es\n',
                '#define varying in',
                isGLSL3ShaderMaterial ? '' : 'out highp vec4 pc_fragColor;',
                isGLSL3ShaderMaterial ? '' : '#define gl_FragColor pc_fragColor',
                '#define gl_FragDepthEXT gl_FragDepth',
                '#define texture2D texture',
                '#define textureCube texture',
                '#define texture2DProj textureProj',
                '#define texture2DLodEXT textureLod',
                '#define texture2DProjLodEXT textureProjLod',
                '#define textureCubeLodEXT textureLod',
                '#define texture2DGradEXT textureGrad',
                '#define texture2DProjGradEXT textureProjGrad',
                '#define textureCubeGradEXT textureGrad'
            ].join( '\n' ) + '\n' + this._prefix;
        }
        this._glsl = this._prefix + this._body;
    }

    get prefix() {
        return this._prefix;
    }

    get glsl() {
        return this._glsl;
    }

    private _setCustomDefines() {
        this._prefix = [this._customExtensions, this._customDefines]
            .filter(filterEmptyLine)
            .join('\n');

        if (this._prefix.length > 0) {
            this._prefix += '\n';
        }
    }
}
