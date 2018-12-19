export class InterleavedBuffer {
    private _count: number;

    private _dynamic = false;
    private _updateRange = { offset: 0, count: - 1 };

    private _version = 0;
    private _needsUpdate: boolean;

    private _onUploadCallback: () => void;
    constructor(private _array: TypedArray, private _stride: number) {
        this._count = this._array !== undefined ? this._array.length / this._stride : 0;
    }

    get array() {
        return this._array;
    }

    setArray(array: TypedArray) {
        if (Array.isArray(array)) {
            throw new TypeError(
                'THREE.BufferAttribute: array should be a Typed Array.');
        }

        this._count = array !== undefined ? array.length / this.stride : 0;
        this._array = array;

        return this;
    }

    get stride() {
        return this._stride;
    }

    get count() {
        return this._count;
    }

    get dynamic() {
        return this._dynamic;
    }

    setDynamic(value: boolean) {
        this._dynamic = value;
        return this;
    }

    get version() {
        return this._version;
    }

    get updateRange() {
        return this._updateRange;
    }

    set needsUpdate(value) {
        if ( value === true ) { this._version ++; }
    }

    copy(source: InterleavedBuffer) {
        this._array = new (source.array.constructor(source.array));
        this._count = source.count;
        this._stride = source.stride;
        this._dynamic = source.dynamic;
        return this;
    }

    copyAt(index1: number, attribute: InterleavedBuffer, index2: number) {
        index1 *= this._stride;
        index2 *= attribute.stride;

        for (let i = 0, l = this.stride; i < l; i++) {
            this._array[index1 + i] = attribute.array[index2 + i];
        }
        return this;
    }

    set(value: TypedArray, offset: number) {
        if (offset === undefined) { offset = 0; }
        this._array.set(value, offset);
        return this;
    }

    clone() {
        return new (this.constructor()).copy( this );
    }

    onUpload(callback: () => void) {
        this._onUploadCallback = callback;
        return this;
    }
}
