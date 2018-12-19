interface IMathUilt {
    DEG2RAD: number;
    RAD2DEG: number;
    clamp(value: number, min: number, max: number): number;
    euclideanModulo(n: number, m: number): number;
    lerp(x: number, y: number, t: number): number;
    generateUUID(): string;
    isPowerOfTwo(value: number): boolean;
    floorPowerOfTwo(value: number): number;
    ceilPowerOfTwo(value: number): number;
    floorPowerOfTwo(value: number): number;
}

export const MathUtil = {} as IMathUilt;

MathUtil.DEG2RAD = Math.PI / 180;
MathUtil.RAD2DEG = 180 / Math.PI;

// TODO: Compare this to the original version
const lut = (function () {
    const arr = [];
    for (let i = 0; i < 256; i++) {
        arr[i] = (i < 16 ? '0' : '') + (i).toString(16);
    }
    return arr;
})();

MathUtil.generateUUID = (): string => {
    const d0 = Math.random() * 0xffffffff | 0;
    const d1 = Math.random() * 0xffffffff | 0;
    const d2 = Math.random() * 0xffffffff | 0;
    const d3 = Math.random() * 0xffffffff | 0;
    const uuid = lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] +
        lut[d0 >> 24 & 0xff] + '-' + lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' +
        lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
        lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] +
        lut[d2 >> 24 & 0xff] + lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] +
        lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];

    // .toUpperCase() here flattens concatenated strings to save heap memory
    // space.
    return uuid.toUpperCase();
};

MathUtil.clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

MathUtil.euclideanModulo = (n: number, m: number): number => {
    return ((n % m) + m) % m;
};

MathUtil.lerp = (x: number, y: number, t: number): number => {
    return (1 - t) * x + t * y;
};

MathUtil.isPowerOfTwo = (value) => {
    return (value & (value - 1)) === 0 && value !== 0;
};

MathUtil.floorPowerOfTwo = (value) => {
    return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );
};

MathUtil.ceilPowerOfTwo = (value) => {
    return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );
};

MathUtil.floorPowerOfTwo = (value) => {
    return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );
};
