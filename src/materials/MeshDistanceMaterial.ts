import { Vector3 } from '../math/Vector3';

import { Material } from './Material';

export class MeshDistanceMaterial extends Material {
    public referencePosition = new Vector3();
    public nearDistance = 1;
    public farDistance = 1000;

    public skinning = false;
    public morphTargets = false;

    public map = null;

    public alphaMap = null;

    public displacementMap = null;
    public displacementScale = 1;
    public displacementBias = 0;

    constructor(parameters?) {
        super();
        this._fog = false;
        this._lights = false;
        this.setAll(parameters);
    }

    copy(source: MeshDistanceMaterial) {
        super.copy(source);

        this.referencePosition.copy(source.referencePosition);
        this.nearDistance = source.nearDistance;
        this.farDistance = source.farDistance;

        this.skinning = source.skinning;
        this.morphTargets = source.morphTargets;

        this.map = source.map;

        this.alphaMap = source.alphaMap;

        this.displacementMap = source.displacementMap;
        this.displacementScale = source.displacementScale;
        this.displacementBias = source.displacementBias;

        return this;
    }
}
