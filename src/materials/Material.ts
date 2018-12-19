import { MathUtil } from '../utils/MathUtil';
import { Plane } from '../math/Plane';

import {
    DepthMode, MaterialBlendingEquation, MaterialBlendingMode,
    MaterialColor, MaterialPrecision, MaterialSourceFactor, MaterialSide } from './constants';
import { MaterialType } from './MaterialType';

export class Material {
    static materialId = 0;

    protected _id: number;
    protected _uuid: string;
    protected _name: string;
    protected _type: MaterialType;

    protected _fog: boolean;
    protected _lights: boolean;
    protected _flatShading: boolean;
    protected _colorWrite: boolean;

    protected _visible: boolean;
    protected _dithering: boolean;

    protected _side: MaterialSide;
    protected _shadowSide?: MaterialSide;

    // override the renderer's default precision for this material
    protected _precision?: MaterialPrecision;
    // vertex color
    protected _vertexColors: MaterialColor;

    protected _blending: MaterialBlendingMode;
    protected _blendSrc: MaterialSourceFactor;
    protected _blendSrcAlpha: MaterialSourceFactor;
    protected _blendDst: MaterialSourceFactor;
    protected _blendDstAlpha: MaterialSourceFactor;
    protected _blendEquation: MaterialBlendingEquation;
    protected _blendEquationAlpha?: MaterialBlendingEquation;

    protected _opacity: number;
    protected _transparent: boolean;
    protected _alphaTest: number;
    protected _premultipliedAlpha: boolean;

    // depth
    protected _depthFunc: DepthMode;
    protected _depthTest: boolean;
    protected _depthWrite: boolean;

    // clipping
    protected _clippingPlanes?: Plane[];
    protected _clipIntersection: boolean;
    protected _clipShadows: boolean;

    protected _polygonOffset: boolean;
    protected _polygonOffsetFactor: number;
    protected _polygonOffsetUnits: number;

    protected _needsUpdate: boolean;

    protected _onBeforeCompile: () => void;

    protected _userData: any;

    constructor() {
        this._id = Material.materialId++;

        this._uuid = MathUtil.generateUUID();
        this._name = '';
        this._type = MaterialType.Basic;

        // boolean values default to be true
        this._visible = true;
        this._fog = true;
        this._lights = true;
        this._colorWrite = true;

        // boolean values default to be false
        this._flatShading = false;
        this._dithering = false;

        this._side = MaterialSide.Front;
        this._shadowSide = null;

        this._precision = null;

        this._vertexColors = MaterialColor.NoColors;

        this._blending = MaterialBlendingMode.Normal;
        this._blendSrc = MaterialSourceFactor.SrcAlpha;
        this._blendSrcAlpha = null;
        this._blendDst = MaterialSourceFactor.OneMinusSrcAlpha;
        this._blendDstAlpha = null;
        this._blendEquation = MaterialBlendingEquation.Add;
        this._blendEquationAlpha = null;

        this._opacity = 1.0; // 0.0 ~ 1.0
        this._transparent = false;
        this._alphaTest = 0.0; // 0.0 ~ 1.0
        this._premultipliedAlpha = false;

        this._depthFunc = DepthMode.LessEqual;
        this._depthTest = true;
        this._depthWrite = true;

        this._clippingPlanes = null;
        this._clipIntersection = false;
        this._clipShadows = false;

        this._polygonOffset = false;
        this._polygonOffsetFactor = 0;
        this._polygonOffsetUnits = 0;

        this._userData = {};

        this._needsUpdate = true;
    }

    get name(): string {
        return this._name;
    }

    get type(): MaterialType {
        return this._type;
    }

    get fog(): boolean {
        return this._fog;
    }

    get lights(): boolean {
        return this._lights;
    }

    get flatShading(): boolean {
        return this._flatShading;
    }

    get colorWrite(): boolean {
        return this._colorWrite;
    }

    get visible(): boolean {
        return this._visible;
    }

    get dithering(): boolean {
        return this._dithering;
    }

    get side(): MaterialSide {
        return this._side;
    }

    get shadowSide(): MaterialSide {
        return this._shadowSide;
    }

    get precision(): MaterialPrecision {
        return this._precision;
    }

    get vertexColors(): MaterialColor {
        return this._vertexColors;
    }

    get blending(): MaterialBlendingMode {
        return this._blending;
    }

    get blendSrc(): MaterialSourceFactor {
        return this._blendSrc;
    }

    get blendSrcAlpha(): MaterialSourceFactor {
        return this._blendSrcAlpha;
    }

    get blendDst(): MaterialSourceFactor {
        return this._blendDst;
    }

    get blendDstAlpha(): MaterialSourceFactor {
        return this._blendDstAlpha;
    }

    get blendEquation(): MaterialBlendingEquation {
        return this._blendEquation;
    }

    get blendEquationAlpha(): MaterialBlendingEquation {
        return this._blendEquationAlpha;
    }

    get opacity(): number {
        return this._opacity;
    }

    get transparent(): boolean {
        return this._transparent;
    }

    get alphaTest(): number {
        return this._alphaTest;
    }

    get premultipliedAlpha(): boolean {
        return this._premultipliedAlpha;
    }

    get depthFunc(): DepthMode {
        return this._depthFunc;
    }

    get depthTest(): boolean {
        return this._depthTest;
    }

    get depthWrite(): boolean {
        return this._depthWrite;
    }

    get clippingPlanes(): Plane[] {
        return this._clippingPlanes;
    }

    get clipIntersection(): boolean {
        return this._clipIntersection;
    }

    get clipShadows(): boolean {
        return this._clipShadows;
    }

    get polygonOffset(): boolean {
        return this._polygonOffset;
    }

    get polygonOffsetFactor(): number {
        return this._polygonOffsetFactor;
    }

    get polygonOffsetUnits(): number {
        return this._polygonOffsetUnits;
    }

    get needsUpdate(): boolean {
        return this._needsUpdate;
    }

    get userData(): any {
        return this._userData;
    }


    setAll(values: any) {
        if (values === undefined) {
            return;
        }

        for (const key of Object.keys(values)) {
            const newValue = values[key];

            if (newValue === undefined) {
                console.warn('THREE.Material: \'' + key + '\' parameter is undefined.');
                continue;
            }

            // for backward compatability if shading is set in the constructor
            if (key === 'shading') {
                const matType = MaterialType[this._type];
                console.warn('THREE.' + matType + ': .shading has been removed. Use the boolean .flatShading instead.');
                // TODO: Check FlatShading or 'FlatShading'
                this._flatShading = (newValue === 'FlatShading') ? true : false;
                continue;
            }

            const currentValue = this[key];

            if (currentValue === undefined) {
                const matType = MaterialType[this._type];
                console.warn(
                    'THREE.' + matType + ': \'' + key +
                    '\' is not a property of this material.');
                continue;
            }

            if (currentValue && currentValue.isColor) {
                currentValue.set(newValue);

            } else if (
                (currentValue && currentValue.isVector3) &&
                (newValue && newValue.isVector3)) {
                currentValue.copy(newValue);
            } else {
                this[key] = newValue;
            }
        }
    }

    // TODO: Copy the original toJSON implementation
    toJson() {}

    clone(): Material {
        return new Material().copy(this);
    }

    copy(source: Material): Material {
        this._name = source.name;

        this._fog = source.fog;
        this._lights = source.lights;

        this._blending = source.blending;
        this._side = source.side;
        this._flatShading = source.flatShading;
        this._vertexColors = source.vertexColors;

        this._opacity = source.opacity;
        this._transparent = source.transparent;

        this._blendSrc = source.blendSrc;
        this._blendDst = source.blendDst;
        this._blendEquation = source.blendEquation;
        this._blendSrcAlpha = source.blendSrcAlpha;
        this._blendDstAlpha = source.blendDstAlpha;
        this._blendEquationAlpha = source.blendEquationAlpha;

        this._depthFunc = source.depthFunc;
        this._depthTest = source.depthTest;
        this._depthWrite = source.depthWrite;

        this._colorWrite = source.colorWrite;

        this._precision = source.precision;

        this._polygonOffset = source.polygonOffset;
        this._polygonOffsetFactor = source.polygonOffsetFactor;
        this._polygonOffsetUnits = source.polygonOffsetUnits;

        this._dithering = source.dithering;

        this._alphaTest = source.alphaTest;
        this._premultipliedAlpha = source.premultipliedAlpha;

        this._visible = source.visible;
        this._userData = JSON.parse(JSON.stringify(source.userData));

        this._clipShadows = source.clipShadows;
        this._clipIntersection = source.clipIntersection;

        let srcPlanes = source.clippingPlanes, dstPlanes = null;

        if (srcPlanes !== null) {
            const n = srcPlanes.length;
            dstPlanes = new Array(n);

            for (let i = 0; i !== n; ++i) {
                dstPlanes[i] = srcPlanes[i].clone();
            }
        }

        this._clippingPlanes = dstPlanes;

        this._shadowSide = source.shadowSide;

        return this;
    }

    // TODO: implement an original dispose method
    dispose() { }
}
