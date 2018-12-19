export enum MaterialSide {
    Front = 0,
    Back,
    Double
}

export enum MaterialColor {
    NoColors = 0,
    FaceColors,
    VertexColors
}

export enum MaterialBlendingMode {
    No = 0,
    Normal,
    Additive,
    Subtractive,
    Multiply,
    Custom
}

export enum MaterialBlendingEquation {
    Add = 0,
    Subtract,
    ReverseSubtract,
    Min,
    Max
}

export enum DepthMode {
    Never = 0,
    Always,
    Less,
    LessEqual,
    Equal,
    GreaterEqual,
    Greater,
    NotEqual
}

export enum MaterialSourceFactor {
    Zero = 0,
    One,
    SrcColor,
    OneMinusSrcColor,
    SrcAlpha,
    OneMinusSrcAlpha,
    DstAlpha,
    OneMinusDstAlpha,
    DstColor,
    OneMinusDstColor,
    SrcAlphaSaturate
}

export enum MaterialPrecision {
    None = '',
    Hight = 'highp',
    Medium = 'mediump',
    Low = 'lowp'
}

// MeshBasicMaterial, MeshLambertMaterial and MeshPhongMaterial.
export enum CombineOperation {
    Multiply = 0,
    Mix,
    Add
}
