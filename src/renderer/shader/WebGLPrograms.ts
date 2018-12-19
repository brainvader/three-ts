import { ShaderProgram } from './ShaderProgram';
import { TextureEncoding, TextureMappingMode } from '../../texture/constants';
import { MaterialSide } from '../../materials/constants';
import { WebGLRenderer, IShaderSource } from '../WebGLRenderer';
import { WebGLExtensions } from '../WebGL/WebGLExtensions';
import { WebGLCapabilities } from '../WebGL/WebGLCapabilities';
import { Object3D } from '../../core/Object3D';
import { Material } from '../../materials/Material';
import { SkinnedMesh } from '../../object/SkinnedMesh';

// TODO: Rewirte with enum?
const shaderIDs = {
    MeshDepthMaterial: 'depth',
    MeshDistanceMaterial: 'distanceRGBA',
    MeshNormalMaterial: 'normal',
    MeshBasicMaterial: 'basic',
    MeshLambertMaterial: 'lambert',
    MeshPhongMaterial: 'phong',
    MeshToonMaterial: 'phong',
    MeshStandardMaterial: 'physical',
    MeshPhysicalMaterial: 'physical',
    MeshMatcapMaterial: 'matcap',
    LineBasicMaterial: 'basic',
    LineDashedMaterial: 'dashed',
    PointsMaterial: 'points',
    ShadowMaterial: 'shadow',
    SpriteMaterial: 'sprite'
};

const parameterNames = [
    'precision', 'supportsVertexTextures', 'map', 'mapEncoding', 'matcap', 'matcapEncoding', 'envMap', 'envMapMode', 'envMapEncoding',
    'lightMap', 'aoMap', 'emissiveMap', 'emissiveMapEncoding', 'bumpMap', 'normalMap', 'objectSpaceNormalMap', 'displacementMap', 'specularMap',
    'roughnessMap', 'metalnessMap', 'gradientMap',
    'alphaMap', 'combine', 'vertexColors', 'fog', 'useFog', 'fogExp',
    'flatShading', 'sizeAttenuation', 'logarithmicDepthBuffer', 'skinning',
    'maxBones', 'useVertexTexture', 'morphTargets', 'morphNormals',
    'maxMorphTargets', 'maxMorphNormals', 'premultipliedAlpha',
    'numDirLights', 'numPointLights', 'numSpotLights', 'numHemiLights', 'numRectAreaLights',
    'shadowMapEnabled', 'shadowMapType', 'toneMapping', 'physicallyCorrectLights',
    'alphaTest', 'doubleSided', 'flipSided', 'numClippingPlanes', 'numClipIntersection', 'depthPacking', 'dithering'
];

export class WebGLPrograms {
    public programs: ShaderProgram[];

    constructor(
        private _renderer: WebGLRenderer, private _extensions: WebGLExtensions,
        private _capabilities: WebGLCapabilities) {}

    private allocateBones(object) {
        const skeleton = object.skeleton;
        const bones = skeleton.bones;

        if (this._capabilities.floatVertexTextures) {
            return 1024;
        } else {
            // default for when object is not specified
            // ( for example when prebuilding shader to be used with multiple
            // objects )
            //
            //  - leave some extra space for other uniforms
            //  - limit here is ANGLE's 254 max uniform vectors
            //    (up to 54 should be safe)

            const nVertexUniforms = this._capabilities.maxVertexUniforms;
            const nVertexMatrices = Math.floor((nVertexUniforms - 20) / 4);

            const maxBones = Math.min(nVertexMatrices, bones.length);

            if (maxBones < bones.length) {
                console.warn(
                    'THREE.WebGLRenderer: Skeleton has ' + bones.length +
                    ' bones. This GPU supports ' + maxBones + '.');
                return 0;
            }

            return maxBones;
        }
    }

    private getTextureEncodingFromMap(map, gammaOverrideLinear: boolean) {
        let encoding;
        if (!map) {
            encoding = TextureEncoding.Linear;
        } else if (map.isTexture) {
            encoding = map.encoding;
        } else if (map.isWebGLRenderTarget) {
            console.warn(
                `THREE.WebGLPrograms.getTextureEncodingFromMap: don\'t use render targets as textures.
                Use their .texture property instead.`);
            encoding = map.texture.encoding;
        }

        // add backwards compatibility for WebGLRenderer.gammaInput/gammaOutput
        // parameter, should probably be removed at some point.
        if (encoding === TextureEncoding.Linear && gammaOverrideLinear) {
            encoding = TextureEncoding.Gamma;
        }

        return encoding;
    }

    getParameters(
        material, lights, shadows, fog, nClipPlanes, nClipIntersection,
        object: Object3D) {
        const shaderID = shaderIDs[material.type];

        // heuristics to create shader parameters according to lights in the scene
        // (not to blow over maxLights budget)

        const maxBones = object instanceof SkinnedMesh ? this.allocateBones(object) : 0;
        let precision = this._capabilities.precision;

        if (material.precision !== null) {
            precision = this._capabilities.getMaxPrecision(material.precision);

            if (precision !== material.precision) {
                console.warn(
                    'THREE.WebGLProgram.getParameters:', material.precision,
                    'not supported, using', precision, 'instead.');
            }
        }

        const currentRenderTarget = this._renderer.renderTarget;

        const parameters = {

            shaderID: shaderID,

            precision: precision,
            supportsVertexTextures: this._capabilities.vertexTextures,
            outputEncoding: this.getTextureEncodingFromMap(
                (!currentRenderTarget) ? null : currentRenderTarget.texture,
                this._renderer.gammaOutput),
            map: !!material.map,
            mapEncoding:
                this.getTextureEncodingFromMap(material.map, this._renderer.gammaInput),
            matcap: !!material.matcap,
            matcapEncoding:
                this.getTextureEncodingFromMap(material.matcap, this._renderer.gammaInput),
            envMap: !!material.envMap,
            envMapMode: material.envMap && material.envMap.mapping,
            envMapEncoding:
                this.getTextureEncodingFromMap(material.envMap, this._renderer.gammaInput),
            envMapCubeUV: (!!material.envMap) &&
                ((material.envMap.mapping ===  TextureMappingMode.CubeUVReflection) ||
                    (material.envMap.mapping === TextureMappingMode.CubeUVRefraction)),
            lightMap: !!material.lightMap,
            aoMap: !!material.aoMap,
            emissiveMap: !!material.emissiveMap,
            emissiveMapEncoding: this.getTextureEncodingFromMap(
                material.emissiveMap, this._renderer.gammaInput),
            bumpMap: !!material.bumpMap,
            normalMap: !!material.normalMap,
            objectSpaceNormalMap: material.normalMapType === ObjectSpaceNormalMap,
            displacementMap: !!material.displacementMap,
            roughnessMap: !!material.roughnessMap,
            metalnessMap: !!material.metalnessMap,
            specularMap: !!material.specularMap,
            alphaMap: !!material.alphaMap,

            gradientMap: !!material.gradientMap,

            combine: material.combine,

            vertexColors: material.vertexColors,

            fog: !!fog,
            useFog: material.fog,
            fogExp: (fog && fog.isFogExp2),

            flatShading: material.flatShading,

            sizeAttenuation: material.sizeAttenuation,
            logarithmicDepthBuffer: this._capabilities.logarithmicDepthBuffer,

            skinning: material.skinning && maxBones > 0,
            maxBones: maxBones,
            useVertexTexture: this._capabilities.floatVertexTextures,

            morphTargets: material.morphTargets,
            morphNormals: material.morphNormals,
            maxMorphTargets: this._renderer.maxMorphTargets,
            maxMorphNormals: this._renderer.maxMorphNormals,

            numDirLights: lights.directional.length,
            numPointLights: lights.point.length,
            numSpotLights: lights.spot.length,
            numRectAreaLights: lights.rectArea.length,
            numHemiLights: lights.hemi.length,

            numClippingPlanes: nClipPlanes,
            numClipIntersection: nClipIntersection,

            dithering: material.dithering,

            shadowMapEnabled: this._renderer.shadowMap.enabled && object.receiveShadow &&
                shadows.length > 0,
            shadowMapType: this._renderer.shadowMap.type,

            toneMapping: this._renderer.toneMapping,
            physicallyCorrectLights: this._renderer.physicallyCorrectLights,

            premultipliedAlpha: material.premultipliedAlpha,

            alphaTest: material.alphaTest,
            doubleSided: material.side === MaterialSide.Double,
            flipSided: material.side === MaterialSide.Back,

            depthPacking: (material.depthPacking !== undefined) ?
                material.depthPacking :
                false

        };

        return parameters;
    }

    getProgramCode(material, parameters) {
        const array = [];

        if (parameters.shaderID) {
            array.push(parameters.shaderID);

        } else if (material.isShaderMaterial) {
            array.push(material.fragmentShader);
            array.push(material.vertexShader);
        }

        if (material.defines !== undefined) {
            for (const name of Object.keys(material.defines)) {
                array.push(name);
                array.push(material.defines[name]);
            }
        }

        for (let i = 0; i < parameterNames.length; i++) {
            array.push(parameters[parameterNames[i]]);
        }

        array.push(material.onBeforeCompile.toString());

        array.push(this._renderer.gammaOutput);

        array.push(this._renderer.gammaFactor);

        return array.join();
    }

    acquireProgram(material: Material, shader: IShaderSource, parameters, code) {
        let program: ShaderProgram;

        // Check if code has been already compiled
        for (let p = 0, pl = this.programs.length; p < pl; p++) {
            const programInfo = this.programs[p];

            if (programInfo.code === code) {
                program = programInfo;
                ++program.usedTimes;

                break;
            }
        }

        if (program === undefined) {
            program = new ShaderProgram(
                this._renderer, this._extensions, code, material, shader, parameters,
                this._capabilities);
            this.programs.push(program);
        }

        return program;
    }

    releaseProgram(program: ShaderProgram) {
        if (--program.usedTimes === 0) {
            // Remove from unordered set
            const i = this.programs.indexOf(program);
            this.programs[i] = this.programs[this.programs.length - 1];
            this.programs.pop();

            // Free WebGL resources
            program.destroy();
        }
    }
}
