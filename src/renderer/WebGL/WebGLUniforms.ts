import { ArrayUtil } from '../../core/ArrayUtils';
import { getPureArraySetter, getSingularSetter } from './WebGLUniformUtil';

class UniformContainer {
    constructor(private _seq = [], private _map = {}) { }

    get map() {
        return this._map;
    }

    get seq() {
        return this._seq;
    }
}

// --- Uniform Classes ---
class SingleUniform {
    private _cache = [];
    public setValue: (gl, v, renderer?) => void;

    constructor(private _id, private _activeInfo, private _addr) {
        this.setValue = getSingularSetter( this._activeInfo.type );
    }
}

class PureArrayUniform {
    private _size;
    private _cache: number[] | TypedArray;
    private setValue: (gl, v, renderer?) => void;

    constructor(private _id, activeInfo, private _addr) {
        this._size = activeInfo.size;
        this.setValue =  getPureArraySetter( activeInfo.type );
        this._cache = [];
    }

    updateCache(data) {
        const cache = this._cache;

        if (data instanceof Float32Array && cache.length !== data.length) {
            this._cache = new Float32Array(data.length);
        }

        ArrayUtil.copy(cache, data);
    }
}

class StructuredUniform extends UniformContainer {
    constructor(private _id) {
        super();
    }

    setValeu(gl: WebGLRenderingContext, value, renderer) {
        const seq = this.seq;
        for (let i = 0, n = seq.length; i !== n; ++i) {
            const u = seq[i];
            u.setValue(gl, value[u.id], renderer);
        }
    }
}

// --- Top-level ---

// Parser - builds up the property tree from the path strings
const RePathPart = /([\w\d_]+)(\])?(\[|\.)?/g;

// extracts
// 	- the identifier (member name or array index)
//  - followed by an optional right bracket (found when array index)
//  - followed by an optional left bracket or dot (type of subscript)
//
// Note: These portions can be read in a non-overlapping fashion and
// allow straightforward parsing of the hierarchy that WebGL encodes
// in the uniform names.
function addUniform(container, uniformObject) {
    container.seq.push(uniformObject);
    container.map[uniformObject.id] = uniformObject;
}

function parseUniform(activeInfo, addr, container: UniformContainer) {
    const path = activeInfo.name, pathLength = path.length;

    // reset RegExp object, because of the early exit of a previous run
    RePathPart.lastIndex = 0;

    while (true) {
        const match = RePathPart.exec(path), matchEnd = RePathPart.lastIndex;

        let id: string | number = match[1];
        const idIsIndex = match[2] === ']';
        const subscript = match[3];

        if (idIsIndex) {
            id = +id | 0;
        }  // convert to integer

        if (subscript === undefined ||
            subscript === '[' && matchEnd + 2 === pathLength) {
            // bare name or "pure" bottom-level array "[0]" suffix

            addUniform(
                container,
                subscript === undefined ? new SingleUniform(id, activeInfo, addr) :
                    new PureArrayUniform(id, activeInfo, addr));

            break;

        } else {
            // step into inner node / create it in case it doesn't exist

            const map = container.map;
            let next = map[id];

            if (next === undefined) {
                next = new StructuredUniform(id);
                addUniform(container, next);
            }

            container = next;
        }
    }
}

// Root Container
export class WebGLUniforms extends UniformContainer {
    static upload(gl, seq, values, renderer) {
        for (let i = 0, n = seq.length; i !== n; ++i) {
            const u = seq[i], v = values[u.id];

            if (v.needsUpdate !== false) {
                // note: always updating when .needsUpdate is undefined
                u.setValue(gl, v.value, renderer);
            }
        }
    }

    static seqWithValue(seq, values) {
        const r = [];

        for (let i = 0, n = seq.length; i !== n; ++i) {
            const u = seq[i];
            if (u.id in values) {
                r.push(u);
            }
        }

        return r;
    }

    constructor(gl, program, private _renderer) {
        super();
        const n = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS );
        for ( let i = 0; i < n; ++ i ) {
            const info = gl.getActiveUniform( program, i ),
                addr = gl.getUniformLocation( program, info.name );
            parseUniform( info, addr, this );
        }
    }

    setValue(gl, name, value) {
        const u = this.map[name];

        if (u !== undefined) {
            u.setValue(gl, value, this._renderer);
        }
    }

    setOptional(gl, object, name) {
        const v = object[name];

        if (v !== undefined) {
            this.setValue(gl, name, v);
        }
    }
}
