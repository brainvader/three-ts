import { ShaderProgram } from '../shader/ShaderProgram';

interface IMemoryInfo {
    geometries: number;
    textures: number;
}

interface IRenderInfo {
    frame: number;
    calls: number;
    triangles: number;
    points: number;
    lines: number;
}

export class WebGLInfo {
    private _memory: IMemoryInfo;
    private _render: IRenderInfo;

    private _autoReset = true;
    // TODO: Rename since WebGLProgram is used
    public programs: ShaderProgram[];

    constructor(private _gl: WebGLRenderingContext) {
        this._memory = {
            geometries: 0,
            textures: 0
        } as IMemoryInfo;

        this._render = {
            frame: 0,
            calls: 0,
            triangles: 0,
            points: 0,
            lines: 0
        } as IRenderInfo;
    }

    get memory() {
        return this._memory;
    }

    get render() {
        return this._render;
    }

    get autoReset(): boolean {
        return this._autoReset;
    }

    /**
     *
     * @param count the number of indices to be rendered
     * @param mode a primitive type to render
     * @param instanceCount the number of geometry instances
     */
    public update(count: GLsizei, mode: GLenum, instanceCount = 1) {
        this._render.calls++;

        switch (mode) {
            case this._gl.TRIANGLES:
                this._render.triangles += instanceCount * (count / 3);
                break;

            case this._gl.TRIANGLE_STRIP:
            case this._gl.TRIANGLE_FAN:
                this._render.triangles += instanceCount * (count - 2);
                break;

            case this._gl.LINES:
                this._render.lines += instanceCount * (count / 2);
                break;

            case this._gl.LINE_STRIP:
                this._render.lines += instanceCount * (count - 1);
                break;

            case this._gl.LINE_LOOP:
                this._render.lines += instanceCount * count;
                break;

            case this._gl.POINTS:
                this._render.points += instanceCount * count;
                break;

            default:
                console.error('THREE.WebGLInfo: Unknown draw mode:', mode);
                break;
        }
    }

    /**
     * Reset render information
     */
    public reset() {
        this._render.frame++;
        this._render.calls = 0;
        this._render.triangles = 0;
        this._render.points = 0;
        this._render.lines = 0;
    }
}
