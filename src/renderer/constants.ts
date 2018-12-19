export type WebGLContext = WebGLRenderingContext | WebGL2RenderingContext;

export enum CullFaceMode {
    None = 0,
    Back,
    Front,
    FrontBack
}

// TODO: Rename WindingOrder
export enum FrontFaceDirection {
    CW = 0,
    CCW,
}

// TODO: Rename ShadowType
export enum ShadowMapType {
    Basic = 0,
    PCF,
    PCFSoft
}

export enum ToneMapping {
    No = 0,
    Linear,
    Reinhard,
    Uncharted2,
    Cineon,
    ACESFilmic,
}
