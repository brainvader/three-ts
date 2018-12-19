export class VertexBuffer {
    constructor(
        private _webglBuffer: WebGLBuffer, private _type: number,
        private _bytesPerElement: number, private _version: number) { }

    get webglBuffer(): WebGLBuffer {
        return this._webglBuffer;
    }

    get type(): GLenum {
        return this._type;
    }

    get bytesPerElement(): number {
        return this._bytesPerElement;
    }

    get version(): number {
        return this._version;
    }

    set version(value: number) {
        this._version = value;
    }
}
