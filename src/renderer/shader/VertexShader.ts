import { CombineOperation } from '../../materials/constants';
import { TextureMappingMode } from '../../texture/constants';
import { ShadowMapType } from '../constants';

import { filterEmptyLine, generateDefines, parseIncludes,
    replaceClippingPlaneNums, replaceLightNums, unrollLoops } from './ShaderUtils';
import { WebGLRenderer } from '../WebGLRenderer';

export class VertexShader {
    // TODO: Rename
    private _shader;
    private _body: string;
    private _prefix: string;
    private _glsl: string;

    constructor(
        renderer: WebGLRenderer, extensions, material, shader, parameters,
        capabilities) {
        this._shader = shader.vertexShader;
        const name = this._shader.name;
        const customDefines = generateDefines(material.defines);
        const gammaFactorDefine =
            (renderer.gammaFactor > 0) ? renderer.gammaFactor : 1.0;

        let shadowMapTypeDefine: string;
        if (parameters.shadowMapType === ShadowMapType.PCF) {
            shadowMapTypeDefine = 'SHADOWMAP_TYPE_PCF';
        } else if (parameters.shadowMapType === ShadowMapType.PCFSoft) {
            shadowMapTypeDefine = 'SHADOWMAP_TYPE_PCF_SOFT';
        }

        // TODO: Static properties?
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
            this._prefix = this._customDefines(customDefines);
        } else {
            this._prefix =
                [
                    'precision ' + parameters.precision + ' float;',
                    'precision ' + parameters.precision + ' int;',
                    '#define SHADER_NAME ' + name,
                    customDefines,
                    this._textureDefine(parameters.supportsVertexTextures),
                    this._gammaFactorDefine(gammaFactorDefine),
                    this._maxBones(parameters.maxBones),
                    (parameters.useFog && parameters.fog) ? '#define USE_FOG' : '',
                    (parameters.useFog && parameters.fogExp) ? '#define FOG_EXP2' : '',
                    parameters.map ? '#define USE_MAP' : '',
                    parameters.envMap ? '#define USE_ENVMAP' : '',
                    parameters.envMap ? '#define ' + envMapModeDefine : '',
                    parameters.lightMap ? '#define USE_LIGHTMAP' : '',
                    parameters.aoMap ? '#define USE_AOMAP' : '',
                    parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',
                    parameters.bumpMap ? '#define USE_BUMPMAP' : '',
                    parameters.normalMap ? '#define USE_NORMALMAP' : '',
                    (parameters.normalMap && parameters.objectSpaceNormalMap) ?
                        '#define OBJECTSPACE_NORMALMAP' :
                        '',
                    parameters.displacementMap && parameters.supportsVertexTextures ?
                        '#define USE_DISPLACEMENTMAP' :
                        '',
                    parameters.specularMap ? '#define USE_SPECULARMAP' : '',
                    parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
                    parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',
                    parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
                    parameters.vertexColors ? '#define USE_COLOR' : '',

                    parameters.flatShading ? '#define FLAT_SHADED' : '',

                    parameters.skinning ? '#define USE_SKINNING' : '',
                    parameters.useVertexTexture ? '#define BONE_TEXTURE' : '',

                    parameters.morphTargets ? '#define USE_MORPHTARGETS' : '',
                    parameters.morphNormals && parameters.flatShading === false ?
                        '#define USE_MORPHNORMALS' :
                        '',
                    parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
                    parameters.flipSided ? '#define FLIP_SIDED' : '',

                    parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
                    parameters.shadowMapEnabled ? '#define ' + shadowMapTypeDefine : '',

                    parameters.sizeAttenuation ? '#define USE_SIZEATTENUATION' : '',
                    parameters.logarithmicDepthBuffer ? '#define USE_LOGDEPTHBUF' : '',
                    parameters.logarithmicDepthBuffer &&
                        (capabilities.isWebGL2 ||
                            extensions.get('EXT_frag_depth')) ?
                        '#define USE_LOGDEPTHBUF_EXT' :
                        '',

                    ...this._defaultDefines(),

                    '\n'
                ].filter(filterEmptyLine)
                    .join('\n');
        }

        // this._body = shader;
        this._body = parseIncludes(this._shader);
        this._body = replaceLightNums(this._shader, parameters);
        this._body = replaceClippingPlaneNums(this._shader, parameters);
        this._body = unrollLoops(this._shader);

        if (capabilities.isWebGL2 && !material.isRawShaderMaterial) {
            let isGLSL3ShaderMaterial = false;
            const versionRegex = /^\s*#version\s+300\s+es\s*\n/;
            if (material.isShaderMaterial &&
                this._body.match(versionRegex) !== null) {
                isGLSL3ShaderMaterial = true;
                this._body = this._body.replace(versionRegex, '');
            }

            // GLSL 3.0 conversion
            this._prefix =
                [
                    '#version 300 es\n', '#define attribute in', '#define varying out',
                    '#define texture2D texture'
                ].join('\n') +
                '\n' + this._prefix;
        }

        this._glsl = this._prefix + this._body;
    }

    get prefix() {
        return this._prefix;
    }

    get glsl() {
        return this._glsl;
    }

    private _customDefines(defines): string {
        let prefix = [defines].filter(filterEmptyLine).join('\n');

        if (prefix.length > 0) {
            prefix += '\n';
        }
        return prefix;
    }

    private _textureDefine(isSupported: boolean): string {
        return isSupported ? '#define VERTEX_TEXTURES' : '';
    }

    private _gammaFactorDefine(define: number): string {
        return '#define GAMMA_FACTOR ' + define;
    }

    private _maxBones(maxBones): string {
        return '#define MAX_BONES ' + maxBones;
    }

    private _defaultDefines(): string[] {
        return [
            'uniform mat4 modelMatrix;',
            'uniform mat4 modelViewMatrix;',
            'uniform mat4 projectionMatrix;',
            'uniform mat4 viewMatrix;',
            'uniform mat3 normalMatrix;',
            'uniform vec3 cameraPosition;',

            'attribute vec3 position;',
            'attribute vec3 normal;',
            'attribute vec2 uv;',

            '#ifdef USE_COLOR',

            '	attribute vec3 color;',

            '#endif',

            '#ifdef USE_MORPHTARGETS',

            '	attribute vec3 morphTarget0;',
            '	attribute vec3 morphTarget1;',
            '	attribute vec3 morphTarget2;',
            '	attribute vec3 morphTarget3;',

            '	#ifdef USE_MORPHNORMALS',

            '		attribute vec3 morphNormal0;',
            '		attribute vec3 morphNormal1;',
            '		attribute vec3 morphNormal2;',
            '		attribute vec3 morphNormal3;',

            '	#else',

            '		attribute vec3 morphTarget4;',
            '		attribute vec3 morphTarget5;',
            '		attribute vec3 morphTarget6;',
            '		attribute vec3 morphTarget7;',

            '	#endif',

            '#endif',

            '#ifdef USE_SKINNING',

            '	attribute vec4 skinIndex;',
            '	attribute vec4 skinWeight;',

            '#endif',

        ];
    }
}
