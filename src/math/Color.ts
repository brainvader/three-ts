import { ColorKeywords } from './Colors';
import { MathUtil } from '../utils/MathUtil';

interface IHSLColor {
    h: number;
    s: number;
    l: number;
}

export class Color {
    private _r: number;
    private _g: number;
    private _b: number;

    private _isColor: boolean;

    static hue2rgb(p: number, q: number, t: number): number {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * 6 * (2 / 3 - t);
        }
        return p;
    }

    static SRGBToLinear(c: number): number {
        return (c < 0.04045) ? c * 0.0773993808 :
            Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
    }

    static LinearToSRGB(c: number): number {
        return (c < 0.0031308) ? c * 12.92 :
            1.055 * (Math.pow(c, 0.41666)) - 0.055;
    }

    // constructor(...args);
    constructor(r: string | number | Color = 1, g = 1, b = 1) {
        if (!g && !b) {
            this.set(r);
        }

        this.setRGB(r as number, g, b);
        this._isColor = true;
    }

    set(value: Color | number | string) {
        if (value && value instanceof Color) {
            this.copy(value);
        } else if (typeof value === 'number') {
            this.setHex(value);
        } else if (typeof value === 'string') {
            this.setStyle(value);
        }
        return this;
    }

    get r(): number {
        return this._r;
    }

    get g(): number {
        return this._g;
    }

    get b(): number {
        return this._b;
    }

    get hex(): number {
        return (this.r * 255) << 16 ^ (this.g * 255) << 8 ^ (this.b * 255) << 0;
    }

    get isColor(): boolean {
        return this._isColor;
    }

    setScalar(scalar: number): Color {
        this._r = scalar;
        this._g = scalar;
        this._b = scalar;

        return this;
    }

    setHex(hex: number): Color {
        hex = Math.floor(hex);
        this._r = (hex >> 16 & 255) / 255;
        this._g = (hex >> 8 & 255) / 255;
        this._b = (hex & 255) / 255;
        return this;
    }

    setRGB(r: number, g: number, b: number): Color {
        this._r = r;
        this._g = g;
        this._b = b;

        return this;
    }

    setHSL(h: number, s: number, l: number): Color {
        // h,s,l ranges are in 0.0 - 1.0
        h = MathUtil.euclideanModulo(h, 1);
        s = MathUtil.clamp(s, 0, 1);
        l = MathUtil.clamp(l, 0, 1);

        if (s === 0) {
            this._r = this._g = this._b = l;

        } else {
            const p = l <= 0.5 ? l * (1 + s) : l + s - (l * s);
            const q = (2 * l) - p;

            this._r = Color.hue2rgb(q, p, h + 1 / 3);
            this._g = Color.hue2rgb(q, p, h);
            this._b = Color.hue2rgb(q, p, h - 1 / 3);
        }
        return this;
    }

    setStyle(style: string) {
        const handleAlpha = (string) => {
            if (string === undefined) {
                return;
            }

            if (parseFloat(string) < 1) {
                console.warn(
                    'THREE.Color: Alpha component of ' + style + ' will be ignored.');
            }
        };


        let m;

        if (m = /^((?:rgb|hsl)a?)\(\s*([^\)]*)\)/.exec(style)) {
            // rgb / hsl

            let color;
            const name = m[1];
            const components = m[2];

            switch (name) {
                case 'rgb':
                case 'rgba':

                    if (color =
                        /^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/
                            .exec(components)) {
                        // rgb(255,0,0) rgba(255,0,0,0.5)
                        this._r = Math.min(255, parseInt(color[1], 10)) / 255;
                        this._g = Math.min(255, parseInt(color[2], 10)) / 255;
                        this._b = Math.min(255, parseInt(color[3], 10)) / 255;

                        handleAlpha(color[5]);

                        return this;
                    }

                    if (color =
                        /^(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/
                            .exec(components)) {
                        // rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)
                        this._r = Math.min(100, parseInt(color[1], 10)) / 100;
                        this._g = Math.min(100, parseInt(color[2], 10)) / 100;
                        this._b = Math.min(100, parseInt(color[3], 10)) / 100;

                        handleAlpha(color[5]);

                        return this;
                    }

                    break;

                case 'hsl':
                case 'hsla':

                    if (color =
                        /^([0-9]*\.?[0-9]+)\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/
                            .exec(components)) {
                        // hsl(120,50%,50%) hsla(120,50%,50%,0.5)
                        const h = parseFloat(color[1]) / 360;
                        const s = parseInt(color[2], 10) / 100;
                        const l = parseInt(color[3], 10) / 100;

                        handleAlpha(color[5]);

                        return this.setHSL(h, s, l);
                    }

                    break;
            }

        } else if (m = /^\#([A-Fa-f0-9]+)$/.exec(style)) {
            // hex color

            const hex = m[1];
            const size = hex.length;

            if (size === 3) {
                // #ff0
                this._r = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255;
                this._g = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255;
                this._b = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255;

                return this;

            } else if (size === 6) {
                // #ff0000
                this._r = parseInt(hex.charAt(0) + hex.charAt(1), 16) / 255;
                this._g = parseInt(hex.charAt(2) + hex.charAt(3), 16) / 255;
                this._b = parseInt(hex.charAt(4) + hex.charAt(5), 16) / 255;

                return this;
            }
        }

        if (style && style.length > 0) {
            // color keywords
            const hex = ColorKeywords[style];

            if (hex !== undefined) {
                // red
                this.setHex(hex);

            } else {
                // unknown color
                console.warn('THREE.Color: Unknown color ' + style);
            }
        }

        return this;
    }

    clone() {
        return new Color(this._r, this._g, this._b);
    }

    copy(color: Color): Color {
        this._r = color.r;
        this._g = color.g;
        this._b = color.b;

        return this;
    }

    copyGammaToLinear(color: Color, gammaFactor = 2.0): Color {
        this._r = Math.pow(color.r, gammaFactor);
        this._g = Math.pow(color.g, gammaFactor);
        this._b = Math.pow(color.b, gammaFactor);
        return this;
    }

    copyLinearToGamma(color: Color, gammaFactor = 2.0): Color {
        const safeInverse = (gammaFactor > 0) ? (1.0 / gammaFactor) : 1.0;
        this._r = Math.pow(color.r, safeInverse);
        this._g = Math.pow(color.g, safeInverse);
        this._b = Math.pow(color.b, safeInverse);
        return this;
    }

    convertGammaToLinear(gammaFactor: number): Color {
        this.copyGammaToLinear(this, gammaFactor);
        return this;
    }

    convertLinearToGamma(gammaFactor: number): Color {
        this.copyLinearToGamma(this, gammaFactor);
        return this;
    }

    copySRGBToLinear(color: Color): Color {
        this._r = Color.SRGBToLinear(color.r);
        this._g = Color.SRGBToLinear(color.g);
        this._b = Color.SRGBToLinear(color.b);
        return this;
    }

    copyLinearToSRGB(color: Color): Color {
        this._r = Color.LinearToSRGB(color.r);
        this._g = Color.LinearToSRGB(color.g);
        this._b = Color.LinearToSRGB(color.b);
        return this;
    }

    convertSRGBToLinear() {
        this.copySRGBToLinear(this);
        return this;
    }

    convertLinearToSRGB() {
        this.copyLinearToSRGB(this);
        return this;
    }

    getHex(): number {
        return (this.r * 255) << 16 ^ (this.g * 255) << 8 ^ (this.b * 255) << 0;
    }

    getHexString(): string {
        return ('000000' + this.hex.toString(16)).slice(- 6);
    }

    getHSL(target: IHSLColor = { h: 0, s: 0, l: 0 }): IHSLColor {
        // h,s,l ranges are in 0.0 - 1.0
        const r = this._r;
        const g = this._g;
        const b = this._b;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        let hue;
        let saturation;
        const lightness = (min + max) / 2.0;

        if (min === max) {
            hue = 0;
            saturation = 0;
        } else {
            const delta = max - min;
            saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min);

            switch (max) {
                case r:
                    hue = (g - b) / delta + (g < b ? 6 : 0);
                    break;
                case g:
                    hue = (b - r) / delta + 2;
                    break;
                case b:
                    hue = (r - g) / delta + 4;
                    break;
            }
            hue /= 6;
        }
        target.h = hue;
        target.s = saturation;
        target.l = lightness;
        return target;
    }

    getStyle(): string {
      return 'rgb(' + ((this.r * 255) | 0) + ',' + ((this.g * 255) | 0) + ',' +
          ((this.b * 255) | 0) + ')';
    }

    offsetHSL(h: number, s: number, l: number): Color {

        const hsl: IHSLColor = Object();
        this.getHSL(hsl);

        hsl.h += h;
        hsl.s += s;
        hsl.l += l;
        this.setHSL(hsl.h, hsl.s, hsl.l);
        return this;
    }

    add(color: Color): Color {
        this._r += color.r;
        this._g += color.g;
        this._b += color.b;

        return this;
    }

    addColors(color1: Color, color2: Color): Color {
        this._r = color1.r + color2.r;
        this._g = color1.g + color2.g;
        this._b = color1.b + color2.b;

        return this;
    }

    addScalar(s: number): Color {
        this._r += s;
        this._g += s;
        this._b += s;

        return this;
    }

    sub(color: Color): Color {
        this._r = Math.max(0, this.r - color.r);
        this._g = Math.max(0, this.g - color.g);
        this._b = Math.max(0, this.b - color.b);

        return this;
    }

    multiply(color: Color): Color {
        this._r *= color.r;
        this._g *= color.g;
        this._b *= color.b;

        return this;
    }

    multiplyScalar(s: number): Color {
        this._r *= s;
        this._g *= s;
        this._b *= s;

        return this;
    }

    lerp(color: Color, alpha: number): Color {
        this._r += (color.r - this.r) * alpha;
        this._g += (color.g - this.g) * alpha;
        this._b += (color.b - this.b) * alpha;

        return this;
    }

    lerpHSL(color: Color, alpha: number): Color {
        const hslA: IHSLColor = { h: 0, s: 0, l: 0 };
        const hslB: IHSLColor = { h: 0, s: 0, l: 0 };
        this.getHSL(hslA);
        color.getHSL(hslB);

        const h = MathUtil.lerp(hslA.h, hslB.h, alpha);
        const s = MathUtil.lerp(hslA.s, hslB.s, alpha);
        const l = MathUtil.lerp(hslA.l, hslB.l, alpha);

        this.setHSL(h, s, l);

        return this;
    }

    equals(c: Color): boolean {
        return (c.r === this._r) && (c.g === this._g) && (c.b === this._b);
    }

    fromArray(array: number[], offset = 0): Color {
        this._r = array[offset];
        this._g = array[offset + 1];
        this._b = array[offset + 2];

        return this;
    }

    toArray(array: number[] = [], offset = 0): number[] {
        array[offset] = this.r;
        array[offset + 1] = this.g;
        array[offset + 2] = this.b;

        return array;
    }
}
