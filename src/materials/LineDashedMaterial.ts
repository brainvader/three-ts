import { LineBasicMaterial } from './LineBasicMaterial';
import { MaterialType } from './MaterialType';

export class LineDashedMaterial extends LineBasicMaterial {
    public scale = 1;
    public dashSize = 3;
    public gapSize = 1;

    constructor(parameters) {
        super();
        this._type = MaterialType.LineDashed;
        this.setAll(parameters);
    }

    copy(source: LineDashedMaterial) {
        super.copy(source);
        this.scale = source.scale;
        this.dashSize = source.dashSize;
        this.gapSize = source.gapSize;
        return this;
    }
}
