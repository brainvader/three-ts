class LoadingManager {
    private _isLoading = false;
    private _itemsLoaded = 0;
    private _itemsTotal = 0;
    private _urlModifier = undefined;

    private _onStart = undefined;

    constructor(
        private _onLoad?,
        private _onProgress?,
        private _onError?: (error) => void) {}

    itemStart(url: string) {
        this._itemsTotal++;

        if (this._isLoading === false) {
            if (this._onStart !== undefined) {
                this._onStart(url, this._itemsLoaded, this._itemsTotal);
            }
        }

        this._isLoading = true;
    }

    itemEnd(url: string) {
        this._itemsLoaded++;

        if (this._onProgress !== undefined) {
            this._onProgress(url, this._itemsLoaded, this._itemsTotal);
        }

        if (this._itemsLoaded === this._itemsTotal) {
            this._isLoading = false;

            if (this._onLoad !== undefined) {
                this._onLoad();
            }
        }
    }

    itemError(url: string) {
        if (this._onError !== undefined) {
            this._onError(url);
        }
    }

    resolveURL(url: string) {
        if (this._urlModifier) {
            return this._urlModifier(url);
        }
        return url;
    }

    setURLModifier(transform: (url: string) => void): LoadingManager {
        this._urlModifier = transform;
        return this;
    }
}

const DefaultLoadingManager = new LoadingManager();

export {
    LoadingManager,
    DefaultLoadingManager
};
