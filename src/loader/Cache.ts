interface ICache {
    enabled: boolean;
    files: {
        [key: string]: any
    };
    add(key: string, value: any);
    get(key);
    remove(key);
    clear(key);
}

export const Cache: ICache = {
    enabled: false,
    files: {},

    add: function (key, file) {
        if (this.enabled === false) {
            return;
        }

        // console.log( 'THREE.Cache', 'Adding key:', key );

        this.files[key] = file;
    },

    get: function (key) {
        if (this.enabled === false) {
            return;
        }

        // console.log( 'THREE.Cache', 'Checking key:', key );

        return this.files[key];
    },

    remove: function (key) {
        delete this.files[key];
    },

    clear: function () {
        this.files = {};
    }

};
