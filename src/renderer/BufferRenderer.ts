import { WebGLExtensions } from './WebGL/WebGLExtensions';
import { WebGLInfo } from './WebGL/WebGLInfo';

export class BufferRenderer {
    private _mode: GLenum;

    constructor(
        private _gl: WebGLRenderingContext, private _extensions: WebGLExtensions,
        private _info: WebGLInfo, private _capabilities) { }

    get mode(): GLenum {
        return this._mode;
    }
    set mode(value: GLenum) {
        this._mode = value;
    }

    /**
     * Render primitives
     * @param start starting index of an array
     * @param count the number of indices to be rendered
     */
    public render(start: GLint, count: GLsizei) {
        this._gl.drawArrays(this._mode, start, count);
        this._info.update(count, this._mode);
    }

    public renderInstances(geometry, start: GLint, count: GLsizei) {
        let extension;

        if (this._capabilities.isWebGL2) {
            extension = this._gl;

        } else {
            extension = this._extensions.get('ANGLE_instanced_arrays');

            if (extension === null) {
                console.error(
                    `THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry
                    but hardware does not support extension ANGLE_instanced_arrays.`);
                return;
            }
        }

        extension[this._capabilities.isWebGL2 ? 'drawArraysInstanced' : 'drawArraysInstancedANGLE'](
            this._mode, start, count, geometry.maxInstancedCount);

        this._info.update(count, this._mode, geometry.maxInstancedCount);
    }
}
