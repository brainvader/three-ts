import { WebGLLights } from './WebGLLights';
import { Camera } from '../../object/camera/Camera';
import { Light } from '../../object/light/Light';

interface IRenderState {
    lightsArray: Light[];
    shadowsArray: Light[];
    lights: WebGLLights;

}

// TODO: rename WebGLLightState
/** Render state for each camera */
export class WebGLRenderState {
    private _lights: WebGLLights;

    private _lightsArray: Light[];
    private _shadowsArray: Light[];

    private _state: IRenderState;

    constructor() {
        this._lights = new WebGLLights();
        this._lightsArray = [];
        this._shadowsArray = [];

        this._state = {
            lightsArray: this._lightsArray,
            shadowsArray: this._shadowsArray,
            lights: this._lights
        };
    }

    get state() {
        return this._state;
    }

    init() {
        this._lightsArray.length = 0;
        this._shadowsArray.length = 0;
    }

    pushLight(light: Light) {
        this._lightsArray.push(light);
    }

    pushShadow(shadowLight: Light) {
        this._shadowsArray.push(shadowLight);
    }

    setupLights(camera: Camera) {
        this._lights.setup(this._lightsArray, this._shadowsArray, camera);
    }


}


export class WebGLRenderStates {
    private _renderStates: {[key: number]: {[key: number]: WebGLRenderState}};

    constructor(renderStates = {}) {
        this._renderStates = renderStates;
    }

    get(scene, camera: Camera) {
        let renderState: WebGLRenderState;

        if (this._renderStates[scene.id] === undefined) {
            renderState = new WebGLRenderState();
            this._renderStates[scene.id] = {};
            this._renderStates[scene.id][camera.id] = renderState;

        } else {
            if (this._renderStates[scene.id][camera.id] === undefined) {
                renderState = new WebGLRenderState();
                this._renderStates[scene.id][camera.id] = renderState;

            } else {
                renderState = this._renderStates[scene.id][camera.id];
            }
        }

        return renderState;
    }

    dispose() {
        this._renderStates = {};
    }
}
