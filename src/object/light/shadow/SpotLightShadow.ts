import { LightShadow } from './LightShadow';
import { SpotLight } from '../SpotLight';
import { PerspectiveCamera } from '../../camera/PerspectiveCamera';
import { MathUtil } from 'src/app/cglib/utils/MathUtil';

export class SpotLightShadow extends LightShadow {
    constructor() {
        super(new PerspectiveCamera( 50, 1, 0.5, 500 ));
    }

    update(light: SpotLight) {
        const camera = this.camera as PerspectiveCamera;

        const fov = MathUtil.RAD2DEG * 2 * light.angle;
        const aspect = this.mapSize.width / this.mapSize.height;
        const far = light.distance || camera.far;

        if (fov !== camera.fov ||
            aspect !== camera.aspect ||
            far !== camera.far) {
            camera.fov = fov;
            camera.aspect = aspect;
            camera.far = far;
            camera.updateProjectionMatrix();
        }
    }
}
