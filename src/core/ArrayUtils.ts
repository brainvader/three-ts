type ArrayType = any[] | TypedArray;

interface IArrayUtil {
    min(array: ArrayType): number;
    max(array: ArrayType): number;
    equal(a: ArrayType, b: ArrayType): boolean;
    copy(a: ArrayType, b: ArrayType);
}

export const ArrayUtil: IArrayUtil = Object();

ArrayUtil.min = (array: ArrayType): number => {
    if (array.length === 0) {
        return Infinity;
    }

    let min = array[0];
    for (let i = 1, l = array.length; i < l; ++i) {
        if (array[i] < min) {
            min = array[i];
        }
    }
    return min;
};

ArrayUtil.max = (array: ArrayType): number => {
    if (array.length === 0) {
        return -Infinity;
    }
    let max = array[0];
    for (let i = 1, l = array.length; i < l; ++i) {
        if (array[i] > max) {
            max = array[i];
        }
    }
    return max;
};

ArrayUtil.equal = (a: ArrayType, b: ArrayType) => {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0, l = a.length; i < l; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};

ArrayUtil.copy = (a: ArrayType, b: ArrayType) => {
    for (let i = 0, l = b.length; i < l; i++) {
        a[i] = b[i];
    }
};
