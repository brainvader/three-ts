import { TextureMappingMode } from './constants';
import { Texture } from './Texture';

export class CubeTexture extends Texture {
    private _isCubeTexture = true;

    constructor(
        images = [], mapping = TextureMappingMode.CubeReflection, wrapS?, wrapT?,
        magFilter?, minFilter?, format?, type?, anisotropy?, encoding?) {
        super(
            images, mapping, wrapS, wrapT, magFilter, minFilter, format, type,
            anisotropy, encoding);
        this._flipY = false;
    }

    get isCubeTexture() {
        return this._isCubeTexture;
    }
}
