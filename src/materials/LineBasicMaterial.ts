import { MaterialType } from './MaterialType';
import { Color } from '../math/Color';
import { Material } from './Material';

export class LineBasicMaterial extends Material {
    public color: Color;
    public linewidth: number;

    public linecap: string;
    public linejoin: string;

    // TODO: use specific types
    constructor(...args: any) {
        super();
        this._type = MaterialType.LineBasic;
        this.setAll(args);
    }

    // TODO: use a property type
    copy(source: LineBasicMaterial): LineBasicMaterial {
        this.color.copy(source.color);
        this.linewidth = source.linewidth;
        this.linecap = source.linecap;
        this.linejoin = source.linejoin;
        return this;
    }
}
