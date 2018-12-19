class LightsHash {
    public stateID;
    public directionalLength;
    public pointLength;
    public spotLength;
    public rectAreaLength;
    public hemiLength;
    public shadowsLength;
}

class MaterialProperties {
    private _hash: LightsHash;
    private _shader = {
        name: null,
        uniforms: null,
        vertexShader: null,
        fragmentShader: null
    };
    private _program;
    private _uniformsList;
    private _numClippingPlanes;
    private _numIntersection;
    private _fog;

    constructor() {}
}


export class WebGLProperties {
    private _properties: WeakMap<any, any>;

    constructor() {
        this._properties = new WeakMap();
    }

    get(object: any): any {
        let map: any = this._properties.get(object);

        if (map === undefined) {
            map = {};
            this._properties.set(object, map);
        }
        return map;
    }

    remove(object: any): any {
        this._properties.delete(object);
    }

    update(object: any, key: any, value: any) {
        this._properties.get(object)[key] = value;
    }

    /** Reinitialize */
    dispose() {
        this._properties = new WeakMap();
    }
}

