import { MathUtil } from '../utils/MathUtil';
import { TextureWrappingMode, TextureMagnificationFilter, TextureMinificationFilter,
    TextureFormat, TextureType, TextureEncoding, TextureMappingMode } from './constants';
import { Vector2 } from '../math/Vector2';
import { Matrix3 } from '../math/Matrix3';

enum ImageType {
    DEFAULT = 0,
    DEFAULT_MAPPING
}

export class Texture {
    static textureId = 0;
    static DEFAULT_IMAGE = null;
    static DEFAULT_MAPPING = TextureMappingMode.UV;

    private _id = Texture.textureId++;
    private _uuid = MathUtil.generateUUID();
    private _name = '';

    private _mipmaps = [];

    private _offset = new Vector2(0, 0);
    private _repeat = new Vector2(1, 1);
    private _center = new Vector2(0, 0);
    private _rotation = 0;

    private _matrixAutoUpdate = true;
    private _matrix = new Matrix3();

    protected _generateMipmaps = true;
    private _premultiplyAlpha = false;
    protected _flipY = true;
    // valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)
    protected _unpackAlignment = 4;

    public version = 0;
    private _onUpdate = null;

    private _needsUpdate = true;

    constructor(
        public image = Texture.DEFAULT_IMAGE,
        private _mapping = Texture.DEFAULT_MAPPING,
        private _wrapS = TextureWrappingMode.ClampToEdge,
        private _wrapT = TextureWrappingMode.ClampToEdge,
        protected _magFilter = TextureMagnificationFilter.Linear,
        protected _minFilter = TextureMinificationFilter.LinearMipMapLinear,
        public format = TextureFormat.RGBA,
        private _type = TextureType.UnsignedByte,
        private _anisotropy = 1,
        private _encoding = TextureEncoding.Linear) {
    }

    get name() {
        return this._name;
    }

    get mipmaps() {
        return this._mipmaps;
    }

    get mapping() {
        return this._mapping;
    }

    get wrapS() {
        return this._wrapS;
    }

    get wrapT() {
        return this._wrapT;
    }

    get magFilter() {
        return this._magFilter;
    }

    get minFilter() {
        return this._minFilter;
    }

    set minFilter(filter) {
        this._minFilter = filter;
    }

    get anisotropy() {
        return this._anisotropy;
    }

    get type() {
        return this._type;
    }

    get offset() {
        return this._offset;
    }

    get repeat() {
        return this._repeat;
    }

    get center() {
        return this._center;
    }

    get rotation() {
        return this._rotation;
    }

    get matrixAutoUpdate() {
        return this._matrixAutoUpdate;
    }

    get matrix() {
        return this._matrix;
    }

    get generateMipmaps() {
        return this._generateMipmaps;
    }

    set generateMipmaps(value) {
        this._generateMipmaps = value;
    }

    get premultiplyAlpha() {
        return this._premultiplyAlpha;
    }

    get flipY() {
        return this._flipY;
    }

    get unpackAlignment() {
        return this._unpackAlignment;
    }

    get encoding() {
        return this._encoding;
    }

    set needsUpdate(value: boolean) {
        if (value) {
            this.version++;
        }
    }

    updateMatrix() {
        this._matrix.setUvTransform(
            this._offset.x, this._offset.y,
            this._repeat.x, this._repeat.y,
            this._rotation,
            this._center.x, this._center.y );
    }

    clone() {
        return new Texture().copy(this);
    }

    copy(source: Texture): Texture {
        this._name = source.name;

        this.image = source.image;
        this._mipmaps = source.mipmaps.slice(0);

        this._mapping = source.mapping;

        this._wrapS = source.wrapS;
        this._wrapT = source.wrapT;

        this._magFilter = source.magFilter;
        this._minFilter = source.minFilter;

        this._anisotropy = source.anisotropy;

        this.format = source.format;
        this._type = source.type;

        this._offset.copy(source.offset);
        this._repeat.copy(source.repeat);
        this._center.copy(source.center);
        this._rotation = source.rotation;

        this._matrixAutoUpdate = source.matrixAutoUpdate;
        this._matrix.copy(source.matrix);

        this._generateMipmaps = source.generateMipmaps;
        this._premultiplyAlpha = source.premultiplyAlpha;
        this._flipY = source.flipY;
        this._unpackAlignment = source.unpackAlignment;
        this._encoding = source.encoding;

        return this;
    }

    toJSON(meta) {
        const isRootObject = (meta === undefined || typeof meta === 'string');

        if (!isRootObject && meta.textures[this._uuid] !== undefined) {
            return meta.textures[this._uuid];
        }

        const output = {

            metadata: { version: 4.5, type: 'Texture', generator: 'Texture.toJSON' },

            uuid: this._uuid,
            name: this._name,

            mapping: this._mapping,

            repeat: [this._repeat.x, this._repeat.y],
            offset: [this._offset.x, this._offset.y],
            center: [this._center.x, this._center.y],
            rotation: this._rotation,

            wrap: [this._wrapS, this._wrapT],

            format: this.format,
            minFilter: this._minFilter,
            magFilter: this._magFilter,
            anisotropy: this._anisotropy,

            flipY: this._flipY,
            image: null
        };

        if (this.image !== undefined) {
            // TODO: Move to THREE.Image

            const image = this.image;

            if (image.uuid === undefined) {
                image.uuid = MathUtil.generateUUID();  // UGH
            }

            if (!isRootObject && meta.images[image.uuid] === undefined) {
                let url;

                if (Array.isArray(image)) {
                    // process array of images e.g. CubeTexture
                    url = [];

                    for (let i = 0, l = image.length; i < l; i++) {
                        url.push(ImageUtils.getDataURL(image[i]));
                    }

                } else {
                    // process single image
                    url = ImageUtils.getDataURL(image);
                }

                meta.images[image.uuid] = { uuid: image.uuid, url: url };
            }

            output.image = image.uuid;
        }

        if (!isRootObject) {
            meta.textures[this._uuid] = output;
        }

        return output;
    }

    // dispose() {
    //     this.dispatchEvent({ type: 'dispose' });
    // }

    transformUv(uv: Vector2): Vector2 {
        if (this._mapping !== TextureMappingMode.UV) { return uv; }

        uv.applyMatrix3(this._matrix);

        if (uv.x < 0 || uv.x > 1) {
            switch (this.wrapS) {
                case TextureWrappingMode.Repeat:
                    uv.x = uv.x - Math.floor(uv.x);
                    break;
                case TextureWrappingMode.ClampToEdge:
                    uv.x = uv.x < 0 ? 0 : 1;
                    break;
                case TextureWrappingMode.MirroredRepeat:
                    if (Math.abs(Math.floor(uv.x) % 2) === 1) {
                        uv.x = Math.ceil(uv.x) - uv.x;
                    } else {
                        uv.x = uv.x - Math.floor(uv.x);
                    }
                    break;
            }
        }

        if (uv.y < 0 || uv.y > 1) {
            switch (this.wrapT) {
                case TextureWrappingMode.Repeat:
                    uv.y = uv.y - Math.floor(uv.y);
                    break;
                case TextureWrappingMode.ClampToEdge:
                    uv.y = uv.y < 0 ? 0 : 1;
                    break;
                case TextureWrappingMode.MirroredRepeat:
                    if (Math.abs(Math.floor(uv.y) % 2) === 1) {
                        uv.y = Math.ceil(uv.y) - uv.y;
                    } else {
                        uv.y = uv.y - Math.floor(uv.y);
                    }
                    break;
            }
        }

        if (this.flipY) {
            uv.y = 1 - uv.y;
        }
        return uv;
    }
}
