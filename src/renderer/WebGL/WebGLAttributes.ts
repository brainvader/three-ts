import { BufferAttribute } from '../../core/BufferAttribute';
import { IBufferUpdateRange } from '../../core/BufferAttribute';
import { VertexBuffer } from './VertexBuffer';

// TODO: Use prefix Three instead of WebGL

/**
 * Wrapper for a WebGLBuffer object
 * to manage vertex attributes
 * */
export class WebGLAttributes {
    // internal buffer object
    private _buffers: WeakMap<BufferAttribute, VertexBuffer>;

    constructor(private _gl: WebGLRenderingContext) { }

    /**
     * Get bufer
     * @param attribute buffer attribute
     */
    public get(attribute: BufferAttribute) {
        // if (attribute.isInterleavedBufferAttribute) {
        //     attribute = attribute.data;
        // }

        return this._buffers.get(attribute);
    }

    public remove(attribute: BufferAttribute) {
        // if (attribute.isInterleavedBufferAttribute) { attribute = attribute.data; }
        const data = this._buffers.get(attribute);

        if (data) {
            this._gl.deleteBuffer(data.webglBuffer);
            this._buffers.delete(attribute);
        }
    }

    /**
     *  Create or update a WebGL buffer object
     * @param attribute buffer attribute
     * @param bindingPoint binding point (target)
     */
    public update(attribute: BufferAttribute, bindingPoint: GLenum) {
        // if (attribute.isInterleavedBufferAttribute) { attribute = attribute.data; }
        const data = this._buffers.get(attribute);
        if (data === undefined) {
            this._buffers.set(attribute, this._createBuffer(attribute, bindingPoint));
        } else if (data.version < attribute.version) {
            this._updateBuffer(data.webglBuffer, attribute, bindingPoint);
            data.version = attribute.version;
        }
    }

    private _createBuffer(attribute: BufferAttribute, bindingPoint: GLenum): VertexBuffer {
        const bufferSource = attribute.array;
        const usage = attribute.dynamic ? this._gl.DYNAMIC_DRAW : this._gl.STATIC_DRAW;
        const buffer = this._gl.createBuffer();

        this._gl.bindBuffer(bindingPoint, buffer);
        this._gl.bufferData(bindingPoint, bufferSource, usage);

        // TODO: Check
        // attribute.onUploadCallback();

        let type = this._gl.FLOAT;

        if (bufferSource instanceof Float32Array) {
            type = this._gl.FLOAT;
        } else if (bufferSource instanceof Float64Array) {
            console.warn('THREE.WebGLAttributes: Unsupported data buffer format: Float64Array.');
        } else if (bufferSource instanceof Uint16Array) {
            type = this._gl.UNSIGNED_SHORT;
        } else if (bufferSource instanceof Int16Array) {
            type = this._gl.SHORT;
        } else if (bufferSource instanceof Uint32Array) {
            type = this._gl.UNSIGNED_INT;
        } else if (bufferSource instanceof Int32Array) {
            type = this._gl.INT;
        } else if (bufferSource instanceof Int8Array) {
            type = this._gl.BYTE;
        } else if (bufferSource instanceof Uint8Array) {
            type = this._gl.UNSIGNED_BYTE;
        }

        return new VertexBuffer(
            buffer, type, bufferSource.BYTES_PER_ELEMENT, attribute.version);
    }

    private _updateBuffer(buffer: WebGLBuffer, attribute: BufferAttribute, bufferType: GLenum) {
        const array = attribute.array;
        const updateRange: IBufferUpdateRange = attribute.updateRange;

        this._gl.bindBuffer(bufferType, buffer);

        if (attribute.dynamic === false) {
            this._gl.bufferData(bufferType, array, this._gl.STATIC_DRAW);

        } else if (updateRange.count === -1) {
            // Not using update ranges
            this._gl.bufferSubData(bufferType, 0, array);

        } else if (updateRange.count === 0) {
          console.error(
              `THREE.WebGLObjects.updateBuffer: dynamic THREE.BufferAttribute marked as needsUpdate
               but updateRange.count is 0, ensure you are using set methods or updating manually.`);
        } else {
            this._gl.bufferSubData(
                bufferType, updateRange.offset * array.BYTES_PER_ELEMENT,
                array.subarray(updateRange.offset, updateRange.offset + updateRange.count));

            updateRange.count = -1;  // reset range
        }
    }
}
