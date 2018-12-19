enum TextureEncoding {
    Linear = 0,
    sRGB,
    Gamma,
    RGBE,
    LogLuv,
    RGBM7,
    RGBM16,
    RGBD,
    BasicDepthPacking,
    RGBADepthPacking
}

enum TextureWrappingMode {
    Repeat = 0,
    ClampToEdge,
    MirroredRepeat,
}

enum TextureMappingMode {
    UV = 0,
    CubeReflection,
    CubeRefraction,
    EquirectangularReflection,
    EquirectangularRefraction,
    SphericalReflection,
    CubeUVReflection,
    CubeUVRefraction
}

// TODO: Rename TextureMagFilter
enum TextureMagnificationFilter {
    Nearest = 0,
    Linear,
}

// TODO: Rename TextureMinFilter
enum TextureMinificationFilter {
    Nearest = 0,
    NearestMipMapNearest,
    NearestMipMapLinear,
    Linear,
    LinearMipMapNearest,
    LinearMipMapLinear,
}

enum TextureType {
    UnsignedByte = 0,
    Byte,
    Short,
    UnsignedShort,
    Int,
    UnsignedInt,
    Float,
    HalfFloat,
    UnsignedShort4444,
    UnsignedShort5551,
    UnsignedShort565,
    UnsignedInt248
}

enum TextureFormat {
    Alpha = 0,
    RGB,
    RGBA,
    Luminance,
    LuminanceAlpha,
    RGBE,
    Depth,
    DepthStencil
}

// TODO: DXTFormat
enum CompressedTextureFormat {
    RGB_S3TC_DXT1 = 0,
    RGBA_S3TC_DXT1,
    RGBA_S3TC_DXT3,
    RGBA_S3TC_DXT5,
}

enum PVRTCFormat {
    RGB_4BPPV1 = 0,
    RGB_2BPPV1,
    RGBA_4BPPV1,
    RGBA_2BPPV1
}

enum ETCFormat {
    RGB_ETC1 = 0,
}

enum ASTCFormat {
    RGBA_4x4 = 0,
    RGBA_5x4,
    RGBA_5x5,
    RGBA_6x5,
    RGBA_6x6,
    RGBA_8x5,
    RGBA_8x6,
    RGBA_8x8,
    RGBA_10x5,
    RGBA_10x6,
    RGBA_10x8,
    RGBA_10x10,
    RGBA_12x10,
    RGBA_12x12
}

export {
    TextureEncoding,
    TextureWrappingMode,
    TextureMappingMode,
    TextureMagnificationFilter,
    TextureMinificationFilter,
    TextureType,
    TextureFormat,
    CompressedTextureFormat,
    PVRTCFormat,
    ETCFormat,
    ASTCFormat
};
