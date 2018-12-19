import { TextureEncoding } from '../../texture/constants';
import { ToneMapping } from '../constants';

function getEncodingComponents(encoding: TextureEncoding) {
    switch (encoding) {
        case  TextureEncoding.Linear:
            return ['Linear', '( value )'];
        case TextureEncoding.sRGB:
            return ['sRGB', '( value )'];
        case TextureEncoding.RGBE:
            return ['RGBE', '( value )'];
        case TextureEncoding.RGBM7:
            return ['RGBM', '( value, 7.0 )'];
        case TextureEncoding.RGBM16:
            return ['RGBM', '( value, 16.0 )'];
        case TextureEncoding.RGBD:
            return ['RGBD', '( value, 256.0 )'];
        case TextureEncoding.Gamma:
            return ['Gamma', '( value, float( GAMMA_FACTOR ) )'];
        default:
            throw new Error('unsupported encoding: ' + encoding);
    }
}

function getTexelDecodingFunction(functionName: string, encoding: TextureEncoding): string {
    const components = getEncodingComponents(encoding);
    // return 'vec4 ' + functionName + '( vec4 value ) { return ' + components[0] + 'ToLinear' + components[1] + '; }';
    return `vec4 ${functionName}(vec4 vlaue) {
        return ${components[0]}ToLinear${components[1]};
    }`;
}

function getTexelEncodingFunction(functionName: string, encoding: TextureEncoding): string {
    const components = getEncodingComponents(encoding);
    // return 'vec4 ' + functionName + '( vec4 value ) { return LinearTo' + components[0] + components[1] + '; }';
    return `vec4 ${functionName}( vec4 value ) {
        return LinearTo${components[0]}${components[1]};
    }`;
}

function getToneMappingFunction(functionName: string, toneMapping: ToneMapping): string {
    let toneMappingName;

    switch (toneMapping) {
        case ToneMapping.Linear:
            toneMappingName = 'Linear';
            break;

        case ToneMapping.Reinhard:
            toneMappingName = 'Reinhard';
            break;

        case ToneMapping.Uncharted2:
            toneMappingName = 'Uncharted2';
            break;

        case ToneMapping.Cineon:
            toneMappingName = 'OptimizedCineon';
            break;

        case ToneMapping.ACESFilmic:
            toneMappingName = 'ACESFilmic';
            break;

        default:
            throw new Error('unsupported toneMapping: ' + toneMapping);
    }

    // return 'vec3 ' + functionName + '( vec3 color ) { return ' + toneMappingName + 'ToneMapping( color ); }';
    return `vec3 ${functionName}(vec3 color) {
        return ${toneMappingName}ToneMapping(color);
    }`;
}

function generateExtensions(extensions, parameters, rendererExtensions): string {
    extensions = extensions || {};

    const chunks = [
        (extensions.derivatives || parameters.envMapCubeUV || parameters.bumpMap ||
            (parameters.normalMap && !parameters.objectSpaceNormalMap) ||
            parameters.flatShading) ?
            '#extension GL_OES_standard_derivatives : enable' :
            '',
        (extensions.fragDepth || parameters.logarithmicDepthBuffer) &&
            rendererExtensions.get('EXT_frag_depth') ?
            '#extension GL_EXT_frag_depth : enable' :
            '',
        (extensions.drawBuffers) && rendererExtensions.get('WEBGL_draw_buffers') ?
            '#extension GL_EXT_draw_buffers : require' :
            '',
        (extensions.shaderTextureLOD || parameters.envMap) &&
            rendererExtensions.get('EXT_shader_texture_lod') ?
            '#extension GL_EXT_shader_texture_lod : enable' :
            ''
    ];

    return chunks.filter(filterEmptyLine).join('\n');
}

function generateDefines(defines): string {
    const chunks = [];

    for (const name of Object.keys(defines)) {
        const value = defines[name];

        if (value === false) {
            continue;
        }

        chunks.push('#define ' + name + ' ' + value);
    }

    return chunks.join('\n');
}

function fetchAttributeLocations(gl: WebGLRenderingContext, program: WebGLProgram): any {
    const attributes = {};

    const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

    for (let i = 0; i < n; i++) {
        const info = gl.getActiveAttrib(program, i);
        const name = info.name;
        // console.log( 'THREE.WebGLProgram: ACTIVE VERTEX ATTRIBUTE:', name, i );
        attributes[name] = gl.getAttribLocation(program, name);
    }

    return attributes;
}

function filterEmptyLine(str: string): boolean {
    return str !== '';
}

function replaceLightNums(str: string, parameters): string {
    return str.replace(/NUM_DIR_LIGHTS/g, parameters.numDirLights)
        .replace(/NUM_SPOT_LIGHTS/g, parameters.numSpotLights)
        .replace(/NUM_RECT_AREA_LIGHTS/g, parameters.numRectAreaLights)
        .replace(/NUM_POINT_LIGHTS/g, parameters.numPointLights)
        .replace(/NUM_HEMI_LIGHTS/g, parameters.numHemiLights);
}

function replaceClippingPlaneNums(source, parameters) {
    return source.replace(/NUM_CLIPPING_PLANES/g, parameters.numClippingPlanes)
        .replace(/UNION_CLIPPING_PLANES/g, (parameters.numClippingPlanes - parameters.numClipIntersection));
}

function parseIncludes(string) {
    const pattern = /^[ \t]*#include +<([\w\d./]+)>/gm;

    function replace(match, include) {
        const replace = ShaderChunk[include];

        if (replace === undefined) {
            throw new Error('Can not resolve #include <' + include + '>');
        }

        return parseIncludes(replace);
    }

    return string.replace(pattern, replace);
}

const replace = (match, start, end, snippet) => {
    let unroll = '';
    for (let i = +start; i < +end; i++) {
        unroll += snippet.replace(/\[ i \]/g, '[ ' + i + ' ]');
    }
    return unroll;
};

function unrollLoops(str: string) {
    const pattern = /#pragma unroll_loop[\s]+?for \( int i \= (\d+)\; i < (\d+)\; i \+\+ \) \{([\s\S]+?)(?=\})\}/g;
    return str.replace(pattern, replace);
}

export {
    getEncodingComponents,
    getTexelDecodingFunction,
    getTexelEncodingFunction,
    getToneMappingFunction,
    generateExtensions,
    generateDefines,
    fetchAttributeLocations,
    replaceLightNums,
    filterEmptyLine,
    replaceClippingPlaneNums,
    parseIncludes,
    unrollLoops
};
