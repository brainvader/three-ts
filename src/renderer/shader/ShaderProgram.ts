import { Material } from '../../materials/Material';
import { fetchAttributeLocations } from './ShaderUtils';
import { VertexShader } from './VertexShader';
import { FragmentShader } from './FragmentShader';
import { createShader } from '../WebGL/WebGLUtil';
import { WebGLUniforms } from '../WebGL/WebGLUniforms';
import { WebGLRenderer } from '../WebGLRenderer';

export class ShaderProgram {
    static programIdCount = 0;

    private _gl: WebGLRenderingContext;
    private _renderer: WebGLRenderer;

    private _id: number ;
    private _code;
    private _name;
    public usedTimes = 1;

    private _program: WebGLProgram;
    private _vertexShader: VertexShader;
    private _fragmentShader: FragmentShader;

    private _diagnostics: any;
    private _cachedAttributes: any;
    private _cachedUniforms: any;

    constructor( renderer: WebGLRenderer, extensions, code, material: Material, shader, parameters, capabilities )  {
        this._gl = renderer.getContext();
        this._renderer = renderer;

        this._id = ShaderProgram.programIdCount++;
        this._code = code;
        this._name = shader.name;

        this._vertexShader = new VertexShader(
            renderer, extensions, material, shader.vertexShader, parameters,
            capabilities);
        this._fragmentShader = new FragmentShader(
            renderer, extensions, material, shader.vertexShader, parameters,
            capabilities);

        // const program = this._gl.createProgram();
        this.createProgram();
        const glVertexShader = createShader( this._gl, this._gl.VERTEX_SHADER, this._vertexShader.glsl );
        const glFragmentShader = createShader( this._gl, this._gl.FRAGMENT_SHADER, this._fragmentShader.glsl );

        this.attachShader(glVertexShader);
        this.attachShader(glFragmentShader);

        if (material.index0AttributeName !== undefined) {
            this.bindAttribLocation(0, material.index0AttributeName);
        } else if (parameters.morphTargets === true) {
            // programs with morphTargets displace position out of attribute 0
            this.bindAttribLocation(0, 'position');
        }

        this.linkProgram();

        const programLog = this._gl.getProgramInfoLog(this._program).trim();
        const vertexLog = this._gl.getShaderInfoLog(glVertexShader).trim();
        const fragmentLog = this._gl.getShaderInfoLog(glFragmentShader).trim();

        let runnable = true;
        let haveDiagnostics = true;

        if (this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS) === false) {
            runnable = false;
            console.error(
                'THREE.WebGLProgram: shader error: ', this._gl.getError(),
                'gl.VALIDATE_STATUS',
                this._gl.getProgramParameter(this._program, this._gl.VALIDATE_STATUS),
                'gl.getProgramInfoLog', programLog, vertexLog, fragmentLog);
        } else if (programLog !== '') {
            console.warn(
                'THREE.WebGLProgram: gl.getProgramInfoLog()', programLog);
        } else if (vertexLog === '' || fragmentLog === '') {
            haveDiagnostics = false;
        }

        if (haveDiagnostics) {
            this._diagnostics = {
                runnable: runnable,
                material: material,

                programLog: programLog,

                vertexShader: {
                    log: vertexLog,
                    prefix: this._vertexShader.prefix
                },

                fragmentShader: {
                    log: fragmentLog,
                    prefix: this._fragmentShader.prefix
                }
            };
        }

        this.deleteShader(glVertexShader);
        this.deleteShader(glFragmentShader);
    }

    get id() {
        return this._id;
    }

    get program() {
        return this._program;
    }

    bindAttribLocation(index: number, name: string) {
        this._gl.bindAttribLocation(this._program, index, name);
    }

    createProgram() {
        this._program = this._gl.createProgram();
    }

    linkProgram() {
        this._gl.linkProgram(this._program);
    }

    attachShader(shader: WebGLShader) {
        this._gl.attachShader(this._program, shader);
    }

    deleteShader(shader: WebGLShader) {
        this._gl.deleteShader(shader);
    }

    get uniforms() {
      if (this._cachedUniforms === undefined) {
        this._cachedUniforms = new WebGLUniforms(this._gl, this._program, this._renderer);
      }
      return this._cachedUniforms;
    }

    get attributes() {
        if (this._cachedAttributes === undefined) {
            this._cachedAttributes =
                fetchAttributeLocations(this._gl, this._program);
        }
        return this._cachedAttributes;
    }

    get code() {
        return this._code;
    }

    destroy() {
        this._gl.deleteProgram( this._program );
        this._program = undefined;
    }
}
