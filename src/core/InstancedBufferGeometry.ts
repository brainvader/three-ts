import { BufferGeometry } from './BufferGeometry';

export class InstancedBufferGeometry extends BufferGeometry {
    private _maxInstancedCount = undefined;

    constructor() {
        super();
    }

    get maxInstancedCount() {
        return this._maxInstancedCount;
    }

    copy(source: InstancedBufferGeometry): InstancedBufferGeometry {
        super.copy(source);
        this._maxInstancedCount = source.maxInstancedCount;
        return this;
    }

    clone() {
        return new InstancedBufferGeometry().copy(this);
    }
}
