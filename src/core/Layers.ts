export class Layers {
    private _mask: number;
    constructor() {
        this._mask =  1 | 0;
    }

    get mask(): number {
        return this._mask;
    }

    set mask(value: number) {
        this._mask = 1 << value | 0;
    }

    enable(channel: number) {
        this._mask |= 1 << channel | 0;
    }

    disable(channel: number) {
        this._mask &= ~ ( 1 << channel | 0 );
    }

    toggle(channel: number) {
        this._mask ^= 1 << channel | 0;
    }

    test(layers: Layers): boolean {
        return ( this._mask & layers.mask ) !== 0;
    }
}
