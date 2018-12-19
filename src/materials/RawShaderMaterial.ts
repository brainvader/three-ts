import { ShaderMaterial } from './ShaderMaterial';
import { MaterialType } from './MaterialType';

export class RawShaderMaterial extends ShaderMaterial {
    constructor(parameters: any) {
        super(parameters);
        this._type = MaterialType.RawShader;
    }
}
