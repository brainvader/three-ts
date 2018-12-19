import { InterleavedBuffer } from './InterleavedBuffer';

export class InterleavedBufferAttribute {
    private _data: InterleavedBuffer;

    private _isInterleavedBufferAttribute = true;
    constructor(
        interleavedBuffer: InterleavedBuffer, private _itemSize: number,
        private _offset: number, private _normalized: boolean) {
        this._data = interleavedBuffer;
    }

    get count() {
        return this._data.count;
    }

    get array() {
        return this._data.array;
    }

    get itemSize() {
        return this._itemSize;
    }

    get normalized() {
        return this._normalized;
    }

    get isInterleavedBufferAttribute() {
        return this._isInterleavedBufferAttribute;
    }

    setX(index: number, x: number) {
        this._data.array[index * this._data.stride + this._offset] = x;
        return this;
    }

    setY(index: number, y: number) {
        this._data.array[index * this._data.stride + this._offset + 1] = y;
        return this;
    }

    setZ(index: number, z: number) {
        this._data.array[index * this._data.stride + this._offset + 2] = z;
        return this;
    }

    setW(index: number, w: number) {
        this._data.array[index * this._data.stride + this._offset + 3] = w;
        return this;
    }

    getX(index: number) {
        return this._data.array[index * this._data.stride + this._offset];
    }

    getY(index: number) {
        return this._data.array[index * this._data.stride + this._offset + 1];
    }

    getZ(index: number) {
        return this._data.array[index * this._data.stride + this._offset + 2];
    }

    getW(index: number) {
        return this._data.array[index * this._data.stride + this._offset + 3];
    }

    setXY(index: number, x: number, y: number) {
        index = index * this._data.stride + this._offset;
        this._data.array[index + 0] = x;
        this._data.array[index + 1] = y;
        return this;
    }

    setXYZ(index: number, x: number, y: number, z: number) {
        index = index * this._data.stride + this._offset;

        this._data.array[index + 0] = x;
        this._data.array[index + 1] = y;
        this._data.array[index + 2] = z;

        return this;
    }

    setXYZW(index: number, x: number, y: number, z: number, w: number) {
        index = index * this._data.stride + this._offset;

        this._data.array[index + 0] = x;
        this._data.array[index + 1] = y;
        this._data.array[index + 2] = z;
        this._data.array[index + 3] = w;

        return this;
    }
}
