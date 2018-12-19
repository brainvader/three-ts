import { ArrayUtil } from '../../core/ArrayUtils';

import { CubeTexture } from '../../texture/CubeTexture';
import { Texture } from '../../texture/Texture';
import { DataTexture3D } from '../../texture/DataTexture3D';

const emptyTexture = new Texture();
const emptyTexture3d = new DataTexture3D();
const emptyCubeTexture = new CubeTexture();

// Array Caches (provide typed arrays for temporary by size)
const arrayCacheF32 = [];
const arrayCacheI32 = [];

// Float32Array caches used for uploading Matrix uniforms
const mat4array = new Float32Array(16);
const mat3array = new Float32Array(9);
const mat2array = new Float32Array(4);

// TODO: Move ArrayUtil
/**
 * Flattening for arrays of vectors and matrices
 * @param array
 * @param nBlocks
 * @param blockSize
 */
function flatten(array, nBlocks, blockSize) {
    const firstElem = array[0];

    if (firstElem <= 0 || firstElem > 0) {
        return array;
    }
    // unoptimized: ! isNaN( firstElem )
    // see http://jacksondunstan.com/articles/983

    let n = nBlocks * blockSize, r = arrayCacheF32[n];

    if (r === undefined) {
        r = new Float32Array(n);
        arrayCacheF32[n] = r;
    }

    if (nBlocks !== 0) {
        firstElem.toArray(r, 0);

        for (let i = 1, offset = 0; i !== nBlocks; ++i) {
            offset += blockSize;
            array[i].toArray(r, offset);
        }
    }

    return r;
}

// Texture unit allocation
function allocTexUnits(renderer, n) {
    let r = arrayCacheI32[n];

    if (r === undefined) {
        r = new Int32Array(n);
        arrayCacheI32[n] = r;
    }

    for (let i = 0; i !== n; ++i) { r[i] = renderer.allocTextureUnit(); }

    return r;
}

// --- Setters ---

// Note: Defining these methods externally, because they come in a bunch
// and this way their names minify.

// Single scalar

function setValue1f(gl, v) {
    const cache = this.cache;
    if (cache[0] === v) { return; }
    gl.uniform1f(this.addr, v);
    cache[0] = v;
}

function setValue1i(gl, v) {
    const cache = this.cache;
    if (cache[0] === v) { return; }
    gl.uniform1i(this.addr, v);
    cache[0] = v;
}

// Single float vector (from flat array or THREE.VectorN)

function setValue2fv(gl, v) {
    const cache = this.cache;
    if (v.x !== undefined) {
        if (cache[0] !== v.x || cache[1] !== v.y) {
            gl.uniform2f(this.addr, v.x, v.y);

            cache[0] = v.x;
            cache[1] = v.y;
        }

    } else {
        if (ArrayUtil.equal(cache, v)) { return; }

        gl.uniform2fv(this.addr, v);

        ArrayUtil.copy(cache, v);
    }
}

function setValue3fv(gl, v) {
    const cache = this.cache;

    if (v.x !== undefined) {
        if (cache[0] !== v.x || cache[1] !== v.y || cache[2] !== v.z) {
            gl.uniform3f(this.addr, v.x, v.y, v.z);

            cache[0] = v.x;
            cache[1] = v.y;
            cache[2] = v.z;
        }

    } else if (v.r !== undefined) {
        if (cache[0] !== v.r || cache[1] !== v.g || cache[2] !== v.b) {
            gl.uniform3f(this.addr, v.r, v.g, v.b);

            cache[0] = v.r;
            cache[1] = v.g;
            cache[2] = v.b;
        }

    } else {
        if (ArrayUtil.equal(cache, v)) {
            return;
        }

        gl.uniform3fv(this.addr, v);

        ArrayUtil.copy(cache, v);
    }
}

function setValue4fv(gl, v) {
    const cache = this.cache;

    if (v.x !== undefined) {
        if (cache[0] !== v.x || cache[1] !== v.y || cache[2] !== v.z ||
            cache[3] !== v.w) {
            gl.uniform4f(this.addr, v.x, v.y, v.z, v.w);

            cache[0] = v.x;
            cache[1] = v.y;
            cache[2] = v.z;
            cache[3] = v.w;
        }

    } else {
        if (ArrayUtil.equal(cache, v)) { return; }

        gl.uniform4fv(this.addr, v);

        ArrayUtil.copy(cache, v);
    }
}

// Single matrix (from flat array or MatrixN)
function setValue2fm(gl, v) {
    const cache = this.cache;
    const elements = v.elements;

    if (elements === undefined) {
        if (ArrayUtil.equal(cache, v)) { return; }

        gl.uniformMatrix2fv(this.addr, false, v);

        ArrayUtil.copy(cache, v);

    } else {
        if (ArrayUtil.equal(cache, elements)) { return; }

        mat2array.set(elements);

        gl.uniformMatrix2fv(this.addr, false, mat2array);

        ArrayUtil.copy(cache, elements);
    }
}

function setValue3fm(gl, v) {
    const cache = this.cache;
    const elements = v.elements;

    if (elements === undefined) {
        if (ArrayUtil.equal(cache, v)) { return; }

        gl.uniformMatrix3fv(this.addr, false, v);

        ArrayUtil.copy(cache, v);

    } else {
        if (ArrayUtil.equal(cache, elements)) { return; }

        mat3array.set(elements);

        gl.uniformMatrix3fv(this.addr, false, mat3array);

        ArrayUtil.copy(cache, elements);
    }
}

function setValue4fm(gl, v) {
    const cache = this.cache;
    const elements = v.elements;

    if (elements === undefined) {
        if (ArrayUtil.equal(cache, v)) {
            return;
        }

        gl.uniformMatrix4fv(this.addr, false, v);

        ArrayUtil.copy(cache, v);

    } else {
        if (ArrayUtil.equal(cache, elements)) {
            return;
        }

        mat4array.set(elements);

        gl.uniformMatrix4fv(this.addr, false, mat4array);

        ArrayUtil.copy(cache, elements);
    }
}

// Single texture (2D / Cube)
function setValueT1(gl, v, renderer) {
    const cache = this.cache;
    const unit = renderer.allocTextureUnit();

    if (cache[0] !== unit) {
        gl.uniform1i(this.addr, unit);
        cache[0] = unit;
    }

    renderer.setTexture2D(v || emptyTexture, unit);
}

function setValueT3D1(gl, v, renderer) {
    const cache = this.cache;
    const unit = renderer.allocTextureUnit();

    if (cache[0] !== unit) {
        gl.uniform1i(this.addr, unit);
        cache[0] = unit;
    }

    renderer.setTexture3D(v || emptyTexture3d, unit);
}

function setValueT6(gl, v, renderer) {
    const cache = this.cache;
    const unit = renderer.allocTextureUnit();

    if (cache[0] !== unit) {
        gl.uniform1i(this.addr, unit);
        cache[0] = unit;
    }

    renderer.setTextureCube(v || emptyCubeTexture, unit);
}

// Integer / Boolean vectors or arrays thereof (always flat arrays)
function setValue2iv(gl, v) {
    const cache = this.cache;
    if (ArrayUtil.equal(cache, v)) { return; }
    gl.uniform2iv(this.addr, v);
    ArrayUtil.copy(cache, v);
}

function setValue3iv(gl, v) {
    const cache = this.cache;

    if (ArrayUtil.equal(cache, v)) { return; }

    gl.uniform3iv(this.addr, v);

    ArrayUtil.copy(cache, v);
}

function setValue4iv(gl, v) {
    const cache = this.cache;

    if (ArrayUtil.equal(cache, v)) { return; }

    gl.uniform4iv(this.addr, v);

    ArrayUtil.copy(cache, v);
}

export function getSingularSetter(type) {

    switch (type) {

        case 0x1406: return setValue1f; // FLOAT
        case 0x8b50: return setValue2fv; // _VEC2
        case 0x8b51: return setValue3fv; // _VEC3
        case 0x8b52: return setValue4fv; // _VEC4

        case 0x8b5a: return setValue2fm; // _MAT2
        case 0x8b5b: return setValue3fm; // _MAT3
        case 0x8b5c: return setValue4fm; // _MAT4

        case 0x8b5e: case 0x8d66: return setValueT1; // SAMPLER_2D, SAMPLER_EXTERNAL_OES
        case 0x8B5F: return setValueT3D1; // SAMPLER_3D
        case 0x8b60: return setValueT6; // SAMPLER_CUBE

        case 0x1404: case 0x8b56: return setValue1i; // INT, BOOL
        case 0x8b53: case 0x8b57: return setValue2iv; // _VEC2
        case 0x8b54: case 0x8b58: return setValue3iv; // _VEC3
        case 0x8b55: case 0x8b59: return setValue4iv; // _VEC4

    }

}

// Array of scalars

function setValue1fv(gl, v) {
    const cache = this.cache;

    if (ArrayUtil.equal(cache, v)) { return; }

    gl.uniform1fv(this.addr, v);

    ArrayUtil.copy(cache, v);
}
function setValue1iv(gl, v) {
    const cache = this.cache;

    if (ArrayUtil.equal(cache, v)) { return; }

    gl.uniform1iv(this.addr, v);

    ArrayUtil.copy(cache, v);
}


// Array of vectors (flat or from THREE classes)
function setValueV2a(gl, v) {
    const cache = this.cache;
    const data = flatten(v, this.size, 2);

    if (ArrayUtil.equal(cache, data)) {
        return;
    }

    gl.uniform2fv(this.addr, data);

    this.updateCache(data);
}

function setValueV3a(gl, v) {
    const cache = this.cache;
    const data = flatten(v, this.size, 3);

    if (ArrayUtil.equal(cache, data)) {
        return;
    }

    gl.uniform3fv(this.addr, data);

    this.updateCache(data);
}

function setValueV4a(gl, v) {
    const cache = this.cache;
    const data = flatten(v, this.size, 4);

    if (ArrayUtil.equal(cache, data)) {
        return;
    }

    gl.uniform4fv(this.addr, data);

    this.updateCache(data);
}


// Array of matrices (flat or from THREE clases)
function setValueM2a(gl, v) {
    const cache = this.cache;
    const data = flatten(v, this.size, 4);

    if (ArrayUtil.equal(cache, data)) {
        return;
    }

    gl.uniformMatrix2fv(this.addr, false, data);

    this.updateCache(data);
}

function setValueM3a(gl, v) {
    const cache = this.cache;
    const data = flatten(v, this.size, 9);

    if (ArrayUtil.equal(cache, data)) {
        return;
    }

    gl.uniformMatrix3fv(this.addr, false, data);

    this.updateCache(data);
}

function setValueM4a(gl, v) {
    const cache = this.cache;
    const data = flatten(v, this.size, 16);

    if (ArrayUtil.equal(cache, data)) {
        return;
    }

    gl.uniformMatrix4fv(this.addr, false, data);

    this.updateCache(data);
}

// Array of textures (2D / Cube)
function setValueT1a(gl, v, renderer) {
    const cache = this.cache;
    const n = v.length;

    const units = allocTexUnits(renderer, n);

    if (ArrayUtil.equal(cache, units) === false) {
        gl.uniform1iv(this.addr, units);
        ArrayUtil.copy(cache, units);
    }

    for (let i = 0; i !== n; ++i) {
        renderer.setTexture2D(v[i] || emptyTexture, units[i]);
    }
}

function setValueT6a(gl, v, renderer) {
    const cache = this.cache;
    const n = v.length;

    const units = allocTexUnits(renderer, n);

    if (ArrayUtil.equal(cache, units) === false) {
        gl.uniform1iv(this.addr, units);
        ArrayUtil.copy(cache, units);
    }

    for (let i = 0; i !== n; ++i) {
        renderer.setTextureCube(v[i] || emptyCubeTexture, units[i]);
    }
}


// Helper to pick the right setter for a pure (bottom-level) array
export function getPureArraySetter(type) {

    switch (type) {

        case 0x1406: return setValue1fv; // FLOAT
        case 0x8b50: return setValueV2a; // _VEC2
        case 0x8b51: return setValueV3a; // _VEC3
        case 0x8b52: return setValueV4a; // _VEC4

        case 0x8b5a: return setValueM2a; // _MAT2
        case 0x8b5b: return setValueM3a; // _MAT3
        case 0x8b5c: return setValueM4a; // _MAT4

        case 0x8b5e: return setValueT1a; // SAMPLER_2D
        case 0x8b60: return setValueT6a; // SAMPLER_CUBE

        case 0x1404: case 0x8b56: return setValue1iv; // INT, BOOL
        case 0x8b53: case 0x8b57: return setValue2iv; // _VEC2
        case 0x8b54: case 0x8b58: return setValue3iv; // _VEC3
        case 0x8b55: case 0x8b59: return setValue4iv; // _VEC4

    }
}
