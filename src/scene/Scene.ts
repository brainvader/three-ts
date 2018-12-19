import { Object3D } from '../core/Object3D';
import { Object3DType } from '../object/Object3DType';

export class Scene extends Object3D {
    public background = null;
    public fog = null;
    public overrideMaterial = null;

    public autoUpdate = true;  // checked by the renderer
    constructor() {
        super();
        this._type = Object3DType.Scene;
    }

    copy(source: Scene, recursive?: boolean) {
        super.copy(source, recursive);
        if (source.background !== null) {
            this.background = source.background.clone();
        }
        if (source.fog !== null) {
            this.fog = source.fog.clone();
        }
        if (source.overrideMaterial !== null) {
            this.overrideMaterial = source.overrideMaterial.clone();
        }

        this.autoUpdate = source.autoUpdate;
        this._matrixAutoUpdate = source.matrixAutoUpdate;

        return this;
    }

    // toJSON(meta) {}
}
