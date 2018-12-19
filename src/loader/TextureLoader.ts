import { Texture } from '../texture/Texture';
import { ImageLoader } from './ImageLoader';
import { TextureFormat } from '../texture/constants';
import { DefaultLoadingManager } from './LoadingManager';

export class TextureLoader {
    private _crossOrigin = 'anonymous';
    private _path: string;

    constructor(private _manager = DefaultLoadingManager) {}

    load(
        url: string, onLoad: (Texture) => void, onProgress: (event) => void, onError: (event) => void) {
        const texture = new Texture();

        const loader = new ImageLoader(this._manager);
        loader.setCrossOrigin(this._crossOrigin);
        loader.setPath(this._path);

        loader.load(url, (image) => {
            texture.image = image;

            // JPEGs can't have an alpha channel, so memory can be saved by storing
            // them as RGB.
            const isJPEG = url.search(/\.jpe?g($|\?)/i) > 0 ||
                url.search(/^data\:image\/jpeg/) === 0;

            texture.format = isJPEG ? TextureFormat.RGB : TextureFormat.RGBA;
            texture.needsUpdate = true;

            if (onLoad !== undefined) {
                onLoad(texture);
            }
        }, onProgress, onError);

        return texture;
    }
}
