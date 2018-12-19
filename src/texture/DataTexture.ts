import { TextureEncoding, TextureFormat, TextureMagnificationFilter, TextureMappingMode,
    TextureMinificationFilter, TextureType, TextureWrappingMode } from './constants';
import {Texture} from './Texture';

export class DataTexture extends Texture {
    private _isDataTexture = true;

    constructor(
        data?: TypedArray, width?: number, height?: number,
        format?: TextureFormat, type?: TextureType, mapping?: TextureMappingMode,
        wrapS?: TextureWrappingMode, wrapT?: TextureWrappingMode,
        magFilter = TextureMagnificationFilter.Nearest,
        minFilter = TextureMinificationFilter.Nearest,
        anisotropy?: number, encoding?: TextureEncoding) {
      super(
          null, mapping, wrapS, wrapT, magFilter, minFilter, format, type,
          anisotropy, encoding);

      this.image = {data: data, width: width, height: height};
      this._generateMipmaps = false;
      this._flipY = false;
      this._unpackAlignment = 1;
    }

    get isDataTexture() {
        return this._isDataTexture;
    }
}
