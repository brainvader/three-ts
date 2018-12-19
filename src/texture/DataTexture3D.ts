import { TextureMagnificationFilter, TextureMinificationFilter } from './constants';
import { Texture } from './Texture';

export class DataTexture3D extends Texture {
    private _image;
    private _isDataTexture3D: boolean;

    constructor(data?, width?, height?, depth?) {
        super(null);
        this._image = { data: data, width: width, height: height, depth: depth };

        this._magFilter = TextureMagnificationFilter.Nearest;
        this._minFilter = TextureMinificationFilter.Nearest;

        this._generateMipmaps = false;
        this._flipY = false;
    }

    get isDataTexture3D() {
        return this._isDataTexture3D;
    }
}
