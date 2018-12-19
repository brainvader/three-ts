import { Material } from './Material';
import { MaterialType } from './MaterialType';
import { cloneUniforms } from '../renderer/shader/UniformUtil';

export class ShaderMaterial extends Material {
    public defines = {};
    public uniforms = {};

    public vertexShader =
        'void main() {\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}';
    public fragmentShader =
        'void main() {\n\tgl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}';

    public linewidth = 1;

    public wireframe = false;
    public wireframeLinewidth = 1;

    public clipping = false;  // set to use user-defined clipping planes

    public skinning = false;      // set to use skinning attribute streams
    public morphTargets = false;  // set to use morph targets
    public morphNormals = false;  // set to use morph normals

    public extensions = {
        derivatives: false, // set to use derivatives
        fragDepth: false, // set to use fragment depth values
        drawBuffers: false, // set to use draw buffers
        shaderTextureLOD: false // set to use shader texture LOD
    };

    public defaultAttributeValues = {
        'color': [1, 1, 1],
        'uv': [0, 0],
        'uv2': [0, 0]
    };

    public index0AttributeName = undefined;
    public uniformsNeedUpdate = false;

    constructor(parameters?) {
        super();
        this._type = MaterialType.Shader;
        if (parameters !== undefined) {
            if (parameters.attributes !== undefined) {
                console.error(
                    'THREE.ShaderMaterial: attributes should now be defined in THREE.BufferGeometry instead.');
            }
            this.setAll(parameters);
        }
    }



    copy(source: ShaderMaterial) {
        super.copy(source);

        this.fragmentShader = source.fragmentShader;
        this.vertexShader = source.vertexShader;

        this.uniforms = cloneUniforms(source.uniforms);

        this.defines = Object.assign({}, source.defines);

        this.wireframe = source.wireframe;
        this.wireframeLinewidth = source.wireframeLinewidth;

        this._lights = source.lights;
        this.clipping = source.clipping;

        this.skinning = source.skinning;

        this.morphTargets = source.morphTargets;
        this.morphNormals = source.morphNormals;

        this.extensions = source.extensions;
        return this;
    }
}
