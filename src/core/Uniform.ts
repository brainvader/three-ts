export class Uniform {
    private _value: any;
    constructor(value: any) {
        if (typeof value === 'string') {
            console.warn('THREE.Uniform: Type parameter is no longer needed.');
            value = arguments[1];
        }

        this._value = value;
    }

    clone() {
      return new Uniform(
          this._value.clone === undefined ? this._value : this._value.clone());
    }
}
