import { Color } from '../math/Color';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';

// see below
// https://stackoverflow.com/questions/43988311/typescript-generics-type-definition-for-typedarray

// TODO: Define all interface for typed arrays
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
interface GenericTypedArray<T> extends ArrayLike<number> {
    [index: number]: number;
    BYTES_PER_ELEMENT: number;
    constructor: GenericTypedArrayConstructor<T>;
    length: number;
    set(array: ArrayLike<number>, offset?: number): void;
    slice(start?: number, end?: number): T;
}

interface GenericTypedArrayConstructor<T> {
    new (buffer?: any): T;
}

export interface IBufferUpdateRange {
    offset: number;
    count: number;
}

class BufferAttribute {
    private _name: string;
    protected _array: TypedArray;
    private _count: number;
    private _itemSize: number;
    private _updateRange: IBufferUpdateRange;
    private _version: number;

    private _normalized: boolean;
    private _dynamic: boolean;
    private _needsUpdate: boolean;
    private _isBufferAttribute: boolean;

    private _onUploadCallback: () => void;

    constructor(array: TypedArray, itemSize: number, normalized?: boolean) {
        this._name = '';

        this._array = array;
        this._itemSize = itemSize;
        this._count = array.length / itemSize;
        this._normalized = normalized === true;

        this._dynamic = false;
        this._updateRange = { offset: 0, count: - 1 };

        this._version = 0;
    }

    get version(): number {
        return this._version;
    }

    get updateRange(): IBufferUpdateRange {
        return this._updateRange;
    }

    get name(): string {
        return this._name;
    }

    get count(): number {
        return this._count;
    }

    get itemSize(): number {
        return this._itemSize;
    }

    get array(): TypedArray {
        return this._array;
    }

    get normalized(): boolean {
        return this._normalized;
    }

    get dynamic(): boolean {
        return this._dynamic;
    }

    set dynamic(value: boolean) {
        this._dynamic = value;
    }

    get isBufferAttribute(): boolean {
        return this._isBufferAttribute;
    }

    set needsUpdate(value: boolean) {
        if (value) {
            this._version++;
        }
    }

    set(value, offset = 0) {
        this.array.set(value, offset);
        return this;
    }

    getX(index: number) {
      return this.array[index * this.itemSize];
    }

    setX(index: number, x: number) {
        this.array[index * this.itemSize] = x;
        return this;
    }

    getY(index: number): number {
        return this.array[index * this.itemSize + 1];
    }

    setY(index: number, y: number) {
        this.array[index * this.itemSize + 1] = y;
        return this;
    }

    getZ(index: number) {
        return this.array[index * this.itemSize + 2];
    }

    setZ(index: number, z: number) {
        this.array[index * this.itemSize + 2] = z;
        return this;
    }

    getW(index: number) {
        return this.array[index * this.itemSize + 3];
    }

    setW(index: number, w: number) {
        this.array[index * this.itemSize + 3] = w;
        return this;
    }

    setXY(index: number, x: number, y: number) {
        index *= this.itemSize;
        this.array[index + 0] = x;
        this.array[index + 1] = y;
        return this;
    }

    setXYZ(index: number, x: number, y: number, z: number) {
        index *= this.itemSize;
        this.array[index + 0] = x;
        this.array[index + 1] = y;
        this.array[index + 2] = z;
        return this;
    }

    setXYZW(index: number, x: number, y: number, z: number, w: number) {
        index *= this._itemSize;

        this._array[index + 0] = x;
        this._array[index + 1] = y;
        this._array[index + 2] = z;
        this._array[index + 3] = w;

        return this;
    }

    onUpload(callback): BufferAttribute {
      this._onUploadCallback = callback;
      return this;
    }

    setArray(array: TypedArray): BufferAttribute {
      this._count = array.length;
      this._array = array;
      return this;
    }

    setDynamic(value: boolean): BufferAttribute {
        this._dynamic = value;
        return this;
    }

    copy(source: BufferAttribute): BufferAttribute {
        this._name = source.name;
        this._array = source.array.slice();
        this._itemSize = source.itemSize;
        this._count = source.count;
        this._normalized = source.normalized;
        this._dynamic = source.dynamic;

        return this;
    }

    copyAt(index1: number, attribute: BufferAttribute, index2: number):
        BufferAttribute {
      // block index
      index1 *= this.itemSize;
      index2 *= attribute.itemSize;

      // TODO: Use subarray
      for (let i = 0, l = this.itemSize; i < l; i++) {
          this.array[index1 + i] = attribute.array[index2 + i];
      }

      return this;
    }

    copyArray(array: TypedArray | any[]): BufferAttribute {
        this.array.set(array);
        return this;
    }

    copyColorsArray(colors: Color[]): BufferAttribute {
        const array = this.array;
        let offset = 0;

        for (let i = 0, l = colors.length; i < l; i++) {
            let color = colors[i];

            if (color === undefined) {
                console.warn('THREE.BufferAttribute.copyColorsArray(): color is undefined', i);
                color = new Color();
            }

            array[offset++] = color.r;
            array[offset++] = color.g;
            array[offset++] = color.b;
        }

        return this;
    }

    copyVector2sArray(vectors: Vector2[]): BufferAttribute {
        const array = this.array;
        let offset = 0;

        for (let i = 0, l = vectors.length; i < l; i++) {
            let vector = vectors[i];

            if (vector === undefined) {
                console.warn(
                    'THREE.BufferAttribute.copyVector2sArray(): vector is undefined',
                    i);
                vector = new Vector2();
            }

            array[offset++] = vector.x;
            array[offset++] = vector.y;
        }

        return this;
    }

    copyVector3sArray(vectors: Vector3[]): BufferAttribute {
        const array = this.array;
        let offset = 0;

        for (let i = 0, l = vectors.length; i < l; i++) {
            let vector = vectors[i];

            if (vector === undefined) {
                console.warn(
                    'THREE.BufferAttribute.copyVector3sArray(): vector is undefined',
                    i);
                vector = new Vector3();
            }

            array[offset++] = vector.x;
            array[offset++] = vector.y;
            array[offset++] = vector.z;
        }

        return this;
    }

    copyVector4sArray(vectors): BufferAttribute {
        const array = this.array;
        let offset = 0;

        for (let i = 0, l = vectors.length; i < l; i++) {
            let vector = vectors[i];

            if (vector === undefined) {
                console.warn(
                    'THREE.BufferAttribute.copyVector4sArray(): vector is undefined',
                    i);
                vector = new Vector4();
            }

            array[offset++] = vector.x;
            array[offset++] = vector.y;
            array[offset++] = vector.z;
            array[offset++] = vector.w;
        }

        return this;
    }

    clone(): BufferAttribute {
        return new BufferAttribute(this.array, this.itemSize).copy(this);
    }
}

class Int8BufferAttribute extends BufferAttribute {
    constructor(array: Int8Array, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Int8Array {
        return this._array as Int8Array;
    }
}

class Uint8BufferAttribute extends BufferAttribute {
    constructor(array: Uint8Array, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Uint8Array {
        return this._array as Uint8Array;
    }
}

class Uint8ClampedBufferAttribute extends BufferAttribute {
    constructor(array: Uint8ClampedArray, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Uint8ClampedArray {
        return this._array as Uint8ClampedArray;
    }
}

class Int16BufferAttribute extends BufferAttribute {
    constructor(array: Int16Array, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Int16Array {
        return this._array as Int16Array;
    }
}

class Uint16BufferAttribute extends BufferAttribute {
    constructor(array: Uint16Array, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Uint16Array {
        return this._array as Uint16Array;
    }
}

class Int32BufferAttribute extends BufferAttribute {
    constructor(array: Int32Array, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Int32Array {
        return this._array as Int32Array;
    }
}

class Uint32BufferAttribute extends BufferAttribute {
    constructor(array: Uint32Array, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Uint32Array {
        return this._array as Uint32Array;
    }
}

class Float32BufferAttribute extends BufferAttribute {
    constructor(array: Float32Array, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Float32Array {
        return this._array as Float32Array;
    }
}

class Float64BufferAttribute extends BufferAttribute {
    constructor(array: Float64Array, itemSize: number, normalized?: boolean) {
        super(array, itemSize, normalized);
    }

    get array(): Float64Array {
        return this._array as Float64Array;
    }
}

export {
    Float64BufferAttribute,
    Float32BufferAttribute,
    Uint32BufferAttribute,
    Int32BufferAttribute,
    Uint16BufferAttribute,
    Int16BufferAttribute,
    Uint8ClampedBufferAttribute,
    Uint8BufferAttribute,
    Int8BufferAttribute,
    BufferAttribute
};
