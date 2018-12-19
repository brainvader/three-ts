import { Cache } from './Cache';
import { DefaultLoadingManager } from './LoadingManager';

export class ImageLoader {
    private _crossOrigin =  'anonymous';
    private _path: string;

    constructor(private _manager = DefaultLoadingManager) { }

    get manager() {
        return this._manager;
    }

    setCrossOrigin(value: string) {
        this._crossOrigin = value;
        return this;
    }

    setPath(value: string) {
        this._path = value;
        return this;
    }


    load(url: string, onLoad: (ImageLoader) => void, onProgress: (event) => void, onError: (error) => void) {
        if (url === undefined) {
            url = '';
        }

        if (this._path !== undefined) {
            url = this._path + url;
        }

        url = this._manager.resolveURL(url);

        // const scope = this;

        const cached = Cache.get(url);

        if (cached !== undefined) {
            this._manager.itemStart(url);

            setTimeout(function () {
                if (onLoad) {
                    onLoad(cached);
                }

                this._manager.itemEnd(url);
            }, 0);

            return cached;
        }

        const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img') as HTMLImageElement;

        const onImageLoad = () => {
            image.removeEventListener('load', onImageLoad, false);
            image.removeEventListener('error', onImageError, false);

            Cache.add(url, this);

            if (onLoad) {
                onLoad(this);
            }

            this._manager.itemEnd(url);
        };

        const onImageError = (event) => {
            image.removeEventListener('load', onImageLoad, false);
            image.removeEventListener('error', onImageError, false);

            if (onError) {
                onError(event);
            }

            this._manager.itemError(url);
            this._manager.itemEnd(url);
        };

        image.addEventListener('load', onImageLoad, false);
        image.addEventListener('error', onImageError, false);

        if (url.substr(0, 5) !== 'data:') {
            if (this._crossOrigin !== undefined) {
                image.crossOrigin = this._crossOrigin;
            }
        }

        this._manager.itemStart(url);

        image.src = url;

        return image;
    }
}
