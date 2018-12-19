import { WebGLCapabilities } from '../WebGLCapabilities';
import { WebGLExtensions } from '../WebGLExtensions';

export class VertexAttributeState {
    private _maxVertexAttributes: number;
    private _newAttributes: Uint8Array;
    private _enabledAttributes: Uint8Array;
    private _attributeDivisors: Uint8Array;

    constructor(private _gl: WebGLRenderingContext, private _extensions: WebGLExtensions, private _capabilities: WebGLCapabilities) {
        this._maxVertexAttributes =
            this._gl.getParameter(this._gl.MAX_VERTEX_ATTRIBS);
        this._newAttributes = new Uint8Array(this._maxVertexAttributes);
        this._enabledAttributes = new Uint8Array(this._maxVertexAttributes);
        this._attributeDivisors = new Uint8Array(this._maxVertexAttributes);
    }

    init() {
        for (let i = 0, l = this._newAttributes.length; i < l; i++) {
            this._newAttributes[i] = 0;
        }
    }

    enable(attribute: GLuint) {
        this.enableAndDivisor(attribute, 0);
    }

    enableAndDivisor(attribute: GLuint, meshPerAttribute: number) {
        this._newAttributes[attribute] = 1;

        if (this._enabledAttributes[attribute] === 0) {
            this._gl.enableVertexAttribArray(attribute);
            this._enabledAttributes[attribute] = 1;
        }

        if (this._attributeDivisors[attribute] !== meshPerAttribute) {
            const extension = this._capabilities.isWebGL2 ?
                this._gl :
                this._extensions.get('ANGLE_instanced_arrays');

            extension[this._capabilities.isWebGL2 ? 'vertexAttribDivisor' : 'vertexAttribDivisorANGLE'](
                attribute, meshPerAttribute);
            this._attributeDivisors[attribute] = meshPerAttribute;
        }
    }

    disable() {
        for (let i = 0, l = this._enabledAttributes.length; i !== l; ++i) {
            if (this._enabledAttributes[i] !== this._newAttributes[i]) {
                this._gl.disableVertexAttribArray(i);
                this._enabledAttributes[i] = 0;
            }
        }
    }

    reset() {
        for (let i = 0; i < this._enabledAttributes.length; i++) {
            if (this._enabledAttributes[i] === 1) {
                this._gl.disableVertexAttribArray(i);
                this._enabledAttributes[i] = 0;
            }
        }
    }
}
