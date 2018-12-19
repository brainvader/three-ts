import { BufferGeometry } from '../../core/BufferGeometry';
import { WebGLAttributes } from './WebGLAttributes';
import { ArrayUtil } from '../../core/ArrayUtils';
import { Uint32BufferAttribute, Uint16BufferAttribute, BufferAttribute } from '../../core/BufferAttribute';
import { BufferGeometryType, GeometryType, DrawableType } from '../../object/constatns';
import { Geometry } from '../../core/Geometry';

interface IGeometriesState {
    [id: number]: BufferGeometryType | GeometryType;
}

interface IWireframeState {
    [id: number]: BufferAttribute;
}

/** Store and manage geometries and their vertex attributes */
export class WebGLGeometries {
    private _geometries: IGeometriesState = {};
    private _wireframeAttributes: IWireframeState = {};

    constructor(
        private _gl: WebGLRenderingContext,
        private _attributes: WebGLAttributes,
        private _info
    ) { }

    /** get buffer geometry */
    public get(object: DrawableType, geometry: BufferGeometryType | GeometryType): BufferGeometryType | GeometryType {
        let buffergeometry = this._geometries[geometry.id];

        if (buffergeometry) {
            return buffergeometry;
        }

        // geometry.addEventListener('dispose', onGeometryDispose);

        if (geometry instanceof BufferGeometry) {
            buffergeometry = geometry;

        } else if (geometry instanceof Geometry) {
            if (geometry.bufferGeometry === undefined) {
                geometry.bufferGeometry = new BufferGeometry().setFromObject(object);
            }

            buffergeometry = geometry.bufferGeometry;
        }

        buffergeometry = geometry;

        this._geometries[geometry.id] = buffergeometry;
        this._info.memory.geometries++;
        return buffergeometry;
    }

    /** update a WebGLAttributes */
    public update(geometry: BufferGeometryType) {
        const index = geometry.index;
        const geometryAttributes = geometry.attributes;
        // morph targets
        const morphAttributes = geometry.morphAttributes;

        if (index !== null) {
            this._attributes.update(index, this._gl.ELEMENT_ARRAY_BUFFER);
        }

        for (const name of Object.keys(geometryAttributes)) {
            this._attributes.update(geometryAttributes[name], this._gl.ARRAY_BUFFER);
        }



        for (const name of Object.keys(morphAttributes)) {
            const array = morphAttributes[name];

            for (let i = 0, l = array.length; i < l; i++) {
                this._attributes.update(array[i], this._gl.ARRAY_BUFFER);
            }
        }
    }

    /**
     * get or create an index buffer
     * @param geometry source buffer
     */
    public getWireframeAttribute(geometry: BufferGeometryType): BufferAttribute {
        let attribute = this._wireframeAttributes[geometry.id];

        if (attribute) { return attribute; }

        const indices: number[] = [];

        const geometryIndex = geometry.index;
        const geometryAttributes = geometry.attributes;

        // console.time( 'wireframe' );

        if (geometryIndex !== null) {
            const array = geometryIndex.array;

            for (let i = 0, l = array.length; i < l; i += 3) {
                const a = array[i + 0];
                const b = array[i + 1];
                const c = array[i + 2];

                indices.push(a, b, b, c, c, a);
            }

        } else {
            const array = geometryAttributes.position.array;

            for (let i = 0, l = (array.length / 3) - 1; i < l; i += 3) {
                const a = i + 0;
                const b = i + 1;
                const c = i + 2;

                indices.push(a, b, b, c, c, a);
            }
        }

        // console.timeEnd( 'wireframe' );

        if (ArrayUtil.max(indices) > 65535) {
            attribute = new Uint32BufferAttribute(new Uint32Array(indices), 1);
        } else {
            attribute =  new Uint16BufferAttribute(new Uint16Array(indices), 1);
        }

        this._attributes.update(attribute, this._gl.ELEMENT_ARRAY_BUFFER);
        this._wireframeAttributes[geometry.id] = attribute;

        return attribute;
    }
}
