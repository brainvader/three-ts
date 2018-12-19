import { Color } from '../math/Color';
import { MathUtil } from '../utils/MathUtil';
import { Matrix3 } from '../math/Matrix3';
import { Matrix4 } from '../math/Matrix4';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

import { BufferGeometry } from './BufferGeometry';
import { Box3 } from '../math/Box3';
import { Sphere } from '../math/Sphere';
import { Object3D } from './Object3D';
import { Face3 } from './Face3';
import { Mesh } from '../object/Mesh';
import { BufferGeometryType } from '../object/constatns';

export class Geometry {
    static geometryId = 0;
    private _id: number;
    private _uuid: string;

    private _name: string;
    private _type: string;

    private _vertices = [];
    private _colors = [];
    private _faces = [];
    private _faceVertexUvs = [[]];

    private _morphTargets: any[];
    private _morphNormals: any[];

    private _skinWeights = [];
    private _skinIndices = [];

    private _lineDistances = [];

    private _boundingBox = null;
    private _boundingSphere = null;

    // update flags
    private _elementsNeedUpdate: boolean;
    private _verticesNeedUpdate: boolean;
    private _uvsNeedUpdate: boolean;
    private _normalsNeedUpdate: boolean;
    private _colorsNeedUpdate: boolean;
    private _lineDistancesNeedUpdate: boolean;
    private _groupsNeedUpdate: boolean;
    private _isGeometry: boolean;

    public bufferGeometry: BufferGeometryType;

    constructor() {
        this._id = Geometry.geometryId;
        Geometry.geometryId += 2;
        this._uuid = MathUtil.generateUUID();

        this._name = '';
        this._type = 'Geometry';

        this._vertices = [];
        this._colors = [];
        this._faces = [];
        this._faceVertexUvs = [[]];

        this._morphTargets = [];
        this._morphNormals = [];

        this._skinWeights = [];
        this._skinIndices = [];

        this._lineDistances = [];

        this._boundingBox = null;
        this._boundingSphere = null;

        // update flags
        this._elementsNeedUpdate = false;
        this._verticesNeedUpdate = false;
        this._uvsNeedUpdate = false;
        this._normalsNeedUpdate = false;
        this._colorsNeedUpdate = false;
        this._lineDistancesNeedUpdate = false;
        this._groupsNeedUpdate = false;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }


    get vertices() {
        return this._vertices;
    }

    get colors() {
        return this._colors;
    }

    set faces(faces) {
        this._faces = faces;
    }

    get faceVertexUvs() {
        return this._faceVertexUvs;
    }

    get morphTargets() {
        return this._morphTargets;
    }

    get morphNormals() {
        return this._morphNormals;
    }

    get skinWeights() {
        return this._skinWeights;
    }

    get skinIndices() {
        return this._skinIndices;
    }

    get lineDistances() {
        return this._lineDistances;
    }

    get boundingBox() {
        return this._boundingBox;
    }

    get boundingSphere() {
        return this._boundingSphere;
    }

    get elementsNeedUpdate() {
        return this._elementsNeedUpdate;
    }

    get verticesNeedUpdate() {
        return this._verticesNeedUpdate;
    }

    get uvsNeedUpdate() {
        return this._uvsNeedUpdate;
    }

    get normalsNeedUpdate() {
        return this._normalsNeedUpdate;
    }

    get colorsNeedUpdate() {
        return this._colorsNeedUpdate;
    }

    get lineDistancesNeedUpdate() {
        return this._lineDistancesNeedUpdate;
    }

    get groupsNeedUpdate() {
        return this._groupsNeedUpdate;
    }

    get isGeometry() {
        return this._isGeometry;
    }

    set vertices(vertices) {
        this._vertices = vertices;
    }

    applyMatrix(matrix: Matrix4): Geometry {
        const normalMatrix = new Matrix3().getNormalMatrix(matrix);

        for (let i = 0, il = this._vertices.length; i < il; i++) {
            const vertex = this._vertices[i];
            vertex.applyMatrix4(matrix);
        }

        for (let i = 0, il = this._faces.length; i < il; i++) {
            const face = this._faces[i];
            face.normal.applyMatrix3(normalMatrix).normalize();

            for (let j = 0, jl = face.vertexNormals.length; j < jl; j++) {
                face.vertexNormals[j].applyMatrix3(normalMatrix).normalize();
            }
        }

        if (this._boundingBox !== null) {
            this.computeBoundingBox();
        }

        if (this._boundingSphere !== null) {
            this.computeBoundingSphere();
        }

        this._verticesNeedUpdate = true;
        this._normalsNeedUpdate = true;

        return this;
    }

    rotateX(angle: number): Geometry {
        // rotate geometry around world x-axis
        const m1 = new Matrix4();
        m1.makeRotationX(angle);
        this.applyMatrix(m1);
        return this;
    }

    rotateY(angle: number): Geometry {
        // rotate geometry around world y-axis
        const m1 = new Matrix4();
        m1.makeRotationX(angle);
        this.applyMatrix(m1);
        return this;
    }

    rotateZ(angle: number): Geometry {
        // rotate geometry around world z-axis
        const m1 = new Matrix4();
        m1.makeRotationX(angle);
        this.applyMatrix(m1);
        return this;
    }

    translate(x: number, y: number, z: number): Geometry {
        // translate geometry
        const m1 = new Matrix4();
        m1.makeTranslation(x, y, z);
        this.applyMatrix(m1);
        return this;
    }

    scale(sx: number, sy: number, sz: number): Geometry {
        // scale geometry
        const m1 = new Matrix4();
        m1.makeScale(sx, sy, sz);
        this.applyMatrix(m1);
        return this;
    }

    lookAt(vector: Vector3): Geometry {
        const obj = new Object3D();
        obj.lookAt(vector);
        obj.updateMatrix();
        this.applyMatrix(obj.matrix);
        return this;
    }

    fromBufferGeometry(geometry: BufferGeometry): Geometry {
        // const scope = this;

        const index = geometry.index;
        const attributes = geometry.attributes;
        const position = attributes.position;
        const normal = attributes.normal;
        const color = attributes.color;
        const uv = attributes.uv;
        const uv2 = attributes.uv2;

        const positions = position.array;
        const indices = index !== null ? index.array : undefined;
        const normals = normal !== undefined ? normal.array : undefined;
        const colors = color !== undefined ? color.array : undefined;
        const uvs = uv !== undefined ? uv.array : undefined;
        const uvs2 = uv2 !== undefined ? uv2.array : undefined;

        if (uvs2 !== undefined) {
            this._faceVertexUvs[1] = [];
        }

        for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
            this._vertices.push(new Vector3().fromArray(positions, i));

            if (colors !== undefined) {
                this._colors.push(new Color().fromArray(Array.from(colors), i));
            }
        }

        const addFace = (a, b, c, materialIndex?) =>  {
            const vertexColors = (colors === undefined) ? [] : [
                this._colors[a].clone(),
                this._colors[b].clone(),
                this._colors[c].clone()
            ];

            const vertexNormals = (normals === undefined) ? [] : [
                new Vector3().fromArray(normals, a * 3),
                new Vector3().fromArray(normals, b * 3),
                new Vector3().fromArray(normals, c * 3)
            ];

            const face = new Face3(a, b, c, vertexNormals, vertexColors, materialIndex);

            this._faces.push(face);

            if (uvs !== undefined) {
                this._faceVertexUvs[0].push([
                    new Vector2().fromArray(Array.from(uvs), a * 2),
                    new Vector2().fromArray(Array.from(uvs), b * 2),
                    new Vector2().fromArray(Array.from(uvs), c * 2)
                ]);
            }

            if (uvs2 !== undefined) {
                this._faceVertexUvs[1].push([
                    new Vector2().fromArray(Array.from(uvs2), a * 2),
                    new Vector2().fromArray(Array.from(uvs2), b * 2),
                    new Vector2().fromArray(Array.from(uvs2), c * 2)
                ]);
            }
        };

        const groups = geometry.groups;

        if (groups.length > 0) {
            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];

                const start = group.start;
                const count = group.count;

                for (let j = start, jl = start + count; j < jl; j += 3) {
                    if (indices !== undefined) {
                        addFace(
                            indices[j], indices[j + 1], indices[j + 2],
                            group.materialIndex);

                    } else {
                        addFace(j, j + 1, j + 2, group.materialIndex);
                    }
                }
            }

        } else {
            if (indices !== undefined) {
                for (let i = 0; i < indices.length; i += 3) {
                    addFace(indices[i], indices[i + 1], indices[i + 2]);
                }

            } else {
                for (let i = 0; i < positions.length / 3; i += 3) {
                    addFace(i, i + 1, i + 2);
                }
            }
        }

        this.computeFaceNormals();

        const boundingBox = geometry['boundingBox'];
        if (boundingBox !== null) {
            this._boundingBox = boundingBox.clone();
        }

        const boundingSphere = geometry['boundingSphere'];
        if (boundingSphere !== null) {
            this._boundingSphere = boundingSphere.clone();
        }

        return this;
    }

    center() {
        const offset = new Vector3();
        this.computeBoundingBox();
        this._boundingBox.getCenter(offset).negate();
        this.translate(offset.x, offset.y, offset.z);
        return this;
    }

    normalize(): Geometry {
        this.computeBoundingSphere();
        const center = this._boundingSphere.center;
        const radius = this._boundingSphere.radius;
        const s = radius === 0 ? 1 : 1.0 / radius;
        const matrix = new Matrix4();
        matrix.setAll(
            s, 0, 0, -s * center.x, 0, s, 0, -s * center.y, 0, 0, s, -s * center.z,
            0, 0, 0, 1);

        this.applyMatrix(matrix);
        return this;
    }

    computeFaceNormals() {
        const cb = new Vector3(), ab = new Vector3();

        for (let f = 0, fl = this._faces.length; f < fl; f++) {
            const face = this._faces[f];

            const vA = this._vertices[face.a];
            const vB = this._vertices[face.b];
            const vC = this._vertices[face.c];

            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab);

            cb.normalize();

            face.normal.copy(cb);
        }
    }

    computeVertexNormals(areaWeighted = true) {
        let v, vl, f, fl, face, vertices;

        vertices = new Array(this._vertices.length);

        for (v = 0, vl = this._vertices.length; v < vl; v++) {
            vertices[v] = new Vector3();
        }

        if (areaWeighted) {
            // vertex normals weighted by triangle areas
            // http://www.iquilezles.org/www/articles/normals/normals.htm

            let vA, vB, vC;
            const cb = new Vector3(), ab = new Vector3();

            for (f = 0, fl = this._faces.length; f < fl; f++) {
                face = this._faces[f];

                vA = this._vertices[face.a];
                vB = this._vertices[face.b];
                vC = this._vertices[face.c];

                cb.subVectors(vC, vB);
                ab.subVectors(vA, vB);
                cb.cross(ab);

                vertices[face.a].add(cb);
                vertices[face.b].add(cb);
                vertices[face.c].add(cb);
            }

        } else {
            this.computeFaceNormals();

            for (f = 0, fl = this._faces.length; f < fl; f++) {
                face = this._faces[f];

                vertices[face.a].add(face.normal);
                vertices[face.b].add(face.normal);
                vertices[face.c].add(face.normal);
            }
        }

        for (v = 0, vl = this._vertices.length; v < vl; v++) {
            vertices[v].normalize();
        }

        for (f = 0, fl = this._faces.length; f < fl; f++) {
            face = this._faces[f];

            const vertexNormals = face.vertexNormals;

            if (vertexNormals.length === 3) {
                vertexNormals[0].copy(vertices[face.a]);
                vertexNormals[1].copy(vertices[face.b]);
                vertexNormals[2].copy(vertices[face.c]);

            } else {
                vertexNormals[0] = vertices[face.a].clone();
                vertexNormals[1] = vertices[face.b].clone();
                vertexNormals[2] = vertices[face.c].clone();
            }
        }

        if (this._faces.length > 0) {
            this._normalsNeedUpdate = true;
        }
    }

    computeFlatVertexNormals() {
        let f;
        let fl;
        let face;

        this.computeFaceNormals();

        for (f = 0, fl = this._faces.length; f < fl; f++) {
            face = this._faces[f];

            const vertexNormals = face.vertexNormals;

            if (vertexNormals.length === 3) {
                vertexNormals[0].copy(face.normal);
                vertexNormals[1].copy(face.normal);
                vertexNormals[2].copy(face.normal);

            } else {
                vertexNormals[0] = face.normal.clone();
                vertexNormals[1] = face.normal.clone();
                vertexNormals[2] = face.normal.clone();
            }
        }

        if (this._faces.length > 0) {
            this._normalsNeedUpdate = true;
        }
    }

    computeMorphNormals() {
        let i, il, f, fl, face;

        // save original normals
        // - create temp variables on first access
        //   otherwise just copy (for faster repeated calls)

        for (f = 0, fl = this._faces.length; f < fl; f++) {
            face = this._faces[f];

            if (!face.__originalFaceNormal) {
                face.__originalFaceNormal = face.normal.clone();

            } else {
                face.__originalFaceNormal.copy(face.normal);
            }

            if (!face.__originalVertexNormals) {
                face.__originalVertexNormals = [];
            }

            for (i = 0, il = face.vertexNormals.length; i < il; i++) {
                if (!face.__originalVertexNormals[i]) {
                    face.__originalVertexNormals[i] = face.vertexNormals[i].clone();

                } else {
                    face.__originalVertexNormals[i].copy(face.vertexNormals[i]);
                }
            }
        }

        // use temp geometry to compute face and vertex normals for each morph

        const tmpGeo = new Geometry();
        tmpGeo.faces = this._faces;

        for (i = 0, il = this._morphTargets.length; i < il; i++) {
            // create on first access

            if (!this._morphNormals[i]) {
                this._morphNormals[i] = {};
                this._morphNormals[i].faceNormals = [];
                this._morphNormals[i].vertexNormals = [];

                const dstNormalsFace = this._morphNormals[i].faceNormals;
                const dstNormalsVertex = this._morphNormals[i].vertexNormals;

                let faceNormal;
                let vertexNormals;

                for (f = 0, fl = this._faces.length; f < fl; f++) {
                    faceNormal = new Vector3();
                    vertexNormals = {
                        a: new Vector3(),
                        b: new Vector3(),
                        c: new Vector3()
                    };

                    dstNormalsFace.push(faceNormal);
                    dstNormalsVertex.push(vertexNormals);
                }
            }

            const morphNormals = this._morphNormals[i];

            // set vertices to morph target

            tmpGeo.vertices = this._morphTargets[i].vertices;

            // compute morph normals

            tmpGeo.computeFaceNormals();
            tmpGeo.computeVertexNormals();

            // store morph normals

            let faceNormal, vertexNormals;

            for (f = 0, fl = this._faces.length; f < fl; f++) {
                face = this._faces[f];

                faceNormal = morphNormals.faceNormals[f];
                vertexNormals = morphNormals.vertexNormals[f];

                faceNormal.copy(face.normal);

                vertexNormals.a.copy(face.vertexNormals[0]);
                vertexNormals.b.copy(face.vertexNormals[1]);
                vertexNormals.c.copy(face.vertexNormals[2]);
            }
        }

        // restore original normals
        for (f = 0, fl = this._faces.length; f < fl; f++) {
            face = this._faces[f];
            face.normal = face.__originalFaceNormal;
            face.vertexNormals = face.__originalVertexNormals;
        }
    }

    computeBoundingBox() {
        if (this._boundingBox === null) {
            this._boundingBox = new Box3();
        }

        this._boundingBox.setFromPoints(this._vertices);
    }

    computeBoundingSphere() {
        if (this._boundingSphere === null) {
            this._boundingSphere = new Sphere();
        }

        this._boundingSphere.setFromPoints(this._vertices);
    }

    merge(geometry: Geometry, matrix: Matrix4, materialIndexOffset = 0) {
        let normalMatrix;
        const vertexOffset = this._vertices.length;
        const vertices1 = this._vertices;
        const vertices2 = geometry.vertices;
        const faces1 = this._faces;
        const faces2 = geometry.faces;
        const uvs1 = this._faceVertexUvs[0];
        const uvs2 = geometry.faceVertexUvs[0];
        const colors1 = this._colors;
        const colors2 = geometry.colors;

        if (matrix !== undefined) {
            normalMatrix = new Matrix3().getNormalMatrix(matrix);
        }

        let i, il;
        // vertices
        for (i = 0, il = vertices2.length; i < il; i++) {
            const vertex = vertices2[i];
            const vertexCopy = vertex.clone();
            if (matrix !== undefined) {
                vertexCopy.applyMatrix4(matrix);
            }
            vertices1.push(vertexCopy);
        }

        // colors
        for (i = 0, il = colors2.length; i < il; i++) {
            colors1.push(colors2[i].clone());
        }

        // faces
        for (i = 0, il = faces2.length; i < il; i++) {
            const face = faces2[i];
            const faceVertexNormals = face.vertexNormals;
            const faceVertexColors = face.vertexColors;

            const faceCopy = new Face3(
                face.a + vertexOffset,
                face.b + vertexOffset,
                face.c + vertexOffset);
            faceCopy.normal.copy(face.normal);

            let normal: Vector3;
            if (normalMatrix !== undefined) {
                faceCopy.normal.applyMatrix3(normalMatrix).normalize();
            }

            for (let j = 0, jl = faceVertexNormals.length; j < jl; j++) {
                normal = faceVertexNormals[j].clone();

                if (normalMatrix !== undefined) {
                    normal.applyMatrix3(normalMatrix).normalize();
                }

                faceCopy.vertexNormals.push(normal);
            }

            let color: Color;
            faceCopy.color.copy(face.color);
            for (let j = 0, jl = faceVertexColors.length; j < jl; j++) {
                color = faceVertexColors[j];
                faceCopy.vertexColors.push(color.clone());
            }

            faceCopy.materialIndex = face.materialIndex + materialIndexOffset;

            faces1.push(faceCopy);
        }

        // uvs
        for (i = 0, il = uvs2.length; i < il; i++) {
            const uv = uvs2[i], uvCopy = [];

            if (uv === undefined) {
                continue;
            }

            for (let j = 0, jl = uv.length; j < jl; j++) {
                uvCopy.push(uv[j].clone());
            }

            uvs1.push(uvCopy);
        }
    }

    mergeMesh(mesh: Mesh) {
        if (!(mesh && mesh instanceof Mesh)) {
            console.error(
                'THREE.Geometry.mergeMesh(): mesh not an instance of THREE.Mesh.',
                mesh);
            return;
        }

        if (mesh.matrixAutoUpdate) {
            mesh.updateMatrix();
        }

        let geometry = mesh.geometry;
        if (geometry instanceof BufferGeometry) {
            const geo = new Geometry();
            geometry = geo.fromBufferGeometry(geometry);
        }

        this.merge(geometry, mesh.matrix);
    }

    /*
	 * Checks for duplicate vertices with hashmap.
	 * Duplicated vertices are removed
	 * and faces' vertices are updated.
	 */

    mergeVertices() {
        const verticesMap = {};  // Hashmap for looking up vertices by position
        // coordinates (and making sure they are unique)
        const unique = [], changes = [];

        let v, key;
        const precisionPoints =
            4;  // number of decimal points, e.g. 4 for epsilon of 0.0001
        const precision = Math.pow(10, precisionPoints);
        let i, il, face;
        let indices, j, jl;

        for (i = 0, il = this.vertices.length; i < il; i++) {
            v = this.vertices[i];
            key = Math.round(v.x * precision) + '_' + Math.round(v.y * precision) +
                '_' + Math.round(v.z * precision);

            if (verticesMap[key] === undefined) {
                verticesMap[key] = i;
                unique.push(this.vertices[i]);
                changes[i] = unique.length - 1;

            } else {
                // console.log('Duplicate vertex found. ', i, ' could be using ',
                // verticesMap[key]);
                changes[i] = changes[verticesMap[key]];
            }
        }


        // if faces are completely degenerate after merging vertices, we
        // have to remove them from the geometry.
        const faceIndicesToRemove = [];

        for (i = 0, il = this.faces.length; i < il; i++) {
            face = this.faces[i];

            face.a = changes[face.a];
            face.b = changes[face.b];
            face.c = changes[face.c];

            indices = [face.a, face.b, face.c];

            // if any duplicate vertices are found in a Face3
            // we have to remove the face as nothing can be saved
            for (let n = 0; n < 3; n++) {
                if (indices[n] === indices[(n + 1) % 3]) {
                    faceIndicesToRemove.push(i);
                    break;
                }
            }
        }

        for (i = faceIndicesToRemove.length - 1; i >= 0; i--) {
            const idx = faceIndicesToRemove[i];

            this.faces.splice(idx, 1);

            for (j = 0, jl = this.faceVertexUvs.length; j < jl; j++) {
                this.faceVertexUvs[j].splice(idx, 1);
            }
        }

        // Use unique set of vertices

        const diff = this.vertices.length - unique.length;
        this.vertices = unique;
        return diff;
    }

    setFromPoints(points) {
        this.vertices = [];

        for (let i = 0, l = points.length; i < l; i++) {
            const point = points[i];
            this.vertices.push(new Vector3(point.x, point.y, point.z || 0));
        }

        return this;
    }

    sortFacesByMaterialIndex() {
        const faces = this.faces;
        const length = faces.length;

        // tag faces

        for (let i = 0; i < length; i++) {
            faces[i]._id = i;
        }

        // sort faces

        function materialIndexSort(a, b) {
            return a.materialIndex - b.materialIndex;
        }

        faces.sort(materialIndexSort);

        // sort uvs

        const uvs1 = this.faceVertexUvs[0];
        const uvs2 = this.faceVertexUvs[1];

        let newUvs1, newUvs2;

        if (uvs1 && uvs1.length === length) {
            newUvs1 = [];
        }
        if (uvs2 && uvs2.length === length) { newUvs2 = []; }

        for (let i = 0; i < length; i++) {
            const id = faces[i]._id;

            if (newUvs1) {
                newUvs1.push(uvs1[id]);
            }
            if (newUvs2) {
                newUvs2.push(uvs2[id]);
            }
        }

        if (newUvs1) {
            this.faceVertexUvs[0] = newUvs1;
        }
        if (newUvs2) {
            this.faceVertexUvs[1] = newUvs2;
        }
    }

    toJSON() {}

    clone() {
        return new Geometry().copy( this );
    }

    copy(source: Geometry) {
        let i, il, j, jl, k, kl;

        // reset

        this._vertices = [];
        this._colors = [];
        this._faces = [];
        this._faceVertexUvs = [[]];
        this._morphTargets = [];
        this._morphNormals = [];
        this._skinWeights = [];
        this._skinIndices = [];
        this._lineDistances = [];
        this._boundingBox = null;
        this._boundingSphere = null;

        // name

        this._name = source.name;

        // vertices

        const vertices = source.vertices;

        for (i = 0, il = vertices.length; i < il; i++) {
            this.vertices.push(vertices[i].clone());
        }

        // colors

        const colors = source.colors;

        for (i = 0, il = colors.length; i < il; i++) {
            this.colors.push(colors[i].clone());
        }

        // faces

        const faces = source.faces;

        for (i = 0, il = faces.length; i < il; i++) {
            this.faces.push(faces[i].clone());
        }

        // face vertex uvs

        for (i = 0, il = source.faceVertexUvs.length; i < il; i++) {
            const faceVertexUvs = source.faceVertexUvs[i];

            if (this.faceVertexUvs[i] === undefined) {
                this.faceVertexUvs[i] = [];
            }

            for (j = 0, jl = faceVertexUvs.length; j < jl; j++) {
                const uvs = faceVertexUvs[j], uvsCopy = [];

                for (k = 0, kl = uvs.length; k < kl; k++) {
                    const uv = uvs[k];

                    uvsCopy.push(uv.clone());
                }

                this.faceVertexUvs[i].push(uvsCopy);
            }
        }

        // morph targets

        const morphTargets = source.morphTargets;

        for (i = 0, il = morphTargets.length; i < il; i++) {
            const morphTarget: any = {};
            morphTarget.name = morphTargets[i].name;

            // vertices

            if (morphTargets[i].vertices !== undefined) {
                morphTarget.vertices = [];

                for (j = 0, jl = morphTargets[i].vertices.length; j < jl; j++) {
                    morphTarget.vertices.push(morphTargets[i].vertices[j].clone());
                }
            }

            // normals

            if (morphTargets[i].normals !== undefined) {
                morphTarget.normals = [];

                for (j = 0, jl = morphTargets[i].normals.length; j < jl; j++) {
                    morphTarget.normals.push(morphTargets[i].normals[j].clone());
                }
            }
            this._morphTargets.push(morphTarget);
        }

        // morph normals

        const morphNormals = source.morphNormals;

        for (i = 0, il = morphNormals.length; i < il; i++) {
            const morphNormal: any = {};

            // vertex normals

            if (morphNormals[i].vertexNormals !== undefined) {
                morphNormal.vertexNormals = [];

                for (j = 0, jl = morphNormals[i].vertexNormals.length; j < jl; j++) {
                    const srcVertexNormal = morphNormals[i].vertexNormals[j];
                    const destVertexNormal: any = {};

                    destVertexNormal.a = srcVertexNormal.a.clone();
                    destVertexNormal.b = srcVertexNormal.b.clone();
                    destVertexNormal.c = srcVertexNormal.c.clone();

                    morphNormal.vertexNormals.push(destVertexNormal);
                }
            }

            // face normals

            if (morphNormals[i].faceNormals !== undefined) {
                morphNormal.faceNormals = [];

                for (j = 0, jl = morphNormals[i].faceNormals.length; j < jl; j++) {
                    morphNormal.faceNormals.push(
                        morphNormals[i].faceNormals[j].clone());
                }
            }

            this._morphNormals.push(morphNormal);
        }

        // skin weights

        const skinWeights = source.skinWeights;

        for (i = 0, il = skinWeights.length; i < il; i++) {
            this._skinWeights.push(skinWeights[i].clone());
        }

        // skin indices

        const skinIndices = source.skinIndices;

        for (i = 0, il = skinIndices.length; i < il; i++) {
            this._skinIndices.push(skinIndices[i].clone());
        }

        // line distances

        const lineDistances = source.lineDistances;

        for (i = 0, il = lineDistances.length; i < il; i++) {
            this._lineDistances.push(lineDistances[i]);
        }

        // bounding box

        const boundingBox = source.boundingBox;

        if (boundingBox !== null) {
            this._boundingBox = boundingBox.clone();
        }

        // bounding sphere

        const boundingSphere = source.boundingSphere;

        if (boundingSphere !== null) {
            this._boundingSphere = boundingSphere.clone();
        }

        // update flags

        this._elementsNeedUpdate = source.elementsNeedUpdate;
        this._verticesNeedUpdate = source.verticesNeedUpdate;
        this._uvsNeedUpdate = source.uvsNeedUpdate;
        this._normalsNeedUpdate = source.normalsNeedUpdate;
        this._colorsNeedUpdate = source.colorsNeedUpdate;
        this._lineDistancesNeedUpdate = source.lineDistancesNeedUpdate;
        this._groupsNeedUpdate = source.groupsNeedUpdate;

        return this;
    }
}
