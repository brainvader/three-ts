import { Camera } from '../object/camera/Camera';
import { WebGLRenderTarget } from './WebGLRenderTarget';
import { WebGLRenderState } from './WebGL/WebGLRenderStates';
import { WebGLRenderList } from './WebGL/WebGLRenderLists';
import { Vector4 } from '../math/Vector4';
import { Light } from '../object/light/Light';

interface IGeometryProgram {
    geometry: number;
    program: number;
    wireframe: boolean;
}

export class WebGLRenderframe {
    public renderList: WebGLRenderList = null;
    public renderState: WebGLRenderState = null;

    // cach
    public renderTarget: WebGLRenderTarget = null;
    public framebuffer: WebGLFramebuffer = null;
    public materialId = -1;

    // geometry and program caching
    public geometryProgram: IGeometryProgram;
    public geometryId: number;
    public programId: number;
    public wireframe: boolean;
    public camera: Camera;
    public arrayCamera;

    public viewport = new  Vector4();

    public scissor = new Vector4();
    public scissorTest = null;

    constructor() {
        this.geometryProgram.geometry = null;
        this.geometryProgram.program = null;
        this.geometryProgram.wireframe = null;
    }

    needsGeometryUpdate() {

    }

    get opaque() {
        return this.renderList.opaque;
    }

    get transparent() {
        return this.renderList.transparent;
    }

    pushLight(light: Light) {
        this.renderState.pushLight(light);

        if (light.castShadow) {
            this.renderState.pushShadow(light);
        }
    }

    sortRenderList() {
        this.renderList.sort();
    }

    setupLights(camera: Camera) {
        this.renderState.setupLights(camera);
    }
}
