import { Vector2 } from '../math/Vector2';
import { Geometry } from './Geometry';

export class DirectGeometry {
    // private _vertices = [];
    // private _normals = [];
    // private _colors = [];
    // private _uvs = [];
    // private _uvs2 = [];

    // private _groups = [];

    // private _morphTargets = {};

    // private _skinWeights = [];
    // private _skinIndices = [];

    // private _boundingBox = null;
    // private _boundingSphere = null;

    // // update flags
    // private _verticesNeedUpdate = false;
    // private _normalsNeedUpdate = false;
    // private _colorsNeedUpdate = false;
    // private _uvsNeedUpdate = false;
    // private _groupsNeedUpdate = false;


    // constructor() {
    //     this._vertices = [];
    //     this._normals = [];
    //     this._colors = [];
    //     this._uvs = [];
    //     this._uvs2 = [];

    //     this._groups = [];

    //     this._morphTargets = {};

    //     this._skinWeights = [];
    //     this._skinIndices = [];

    //     // this._lineDistances = [];

    //     this._boundingBox = null;
    //     this._boundingSphere = null;

    //     // update flags
    //     this._verticesNeedUpdate = false;
    //     this._normalsNeedUpdate = false;
    //     this._colorsNeedUpdate = false;
    //     this._uvsNeedUpdate = false;
    //     this._groupsNeedUpdate = false;
    // }

    // computeGroups(geometry: Geometry) {
    //     let group;
    //     const groups = [];
    //     let materialIndex;

    //     const faces = geometry.faces;

    //     for (let i = 0; i < faces.length; i++) {
    //         const face = faces[i];

    //         // materials

    //         if (face.materialIndex !== materialIndex) {
    //             materialIndex = face.materialIndex;

    //             if (group !== undefined) {
    //                 group.count = (i * 3) - group.start;
    //                 groups.push(group);
    //             }

    //             group = { start: i * 3, materialIndex: materialIndex };
    //         }
    //     }

    //     if (group !== undefined) {
    //         group.count = (i * 3) - group.start;
    //         groups.push(group);
    //     }

    //     this._groups = groups;
    // }

    // fromGeometry(geometry: Geometry) {
    //     const faces = geometry.faces;
    //     const vertices = geometry.vertices;
    //     const faceVertexUvs = geometry.faceVertexUvs;

    //     const hasFaceVertexUv = faceVertexUvs[0] && faceVertexUvs[0].length > 0;
    //     const hasFaceVertexUv2 = faceVertexUvs[1] && faceVertexUvs[1].length > 0;

    //     // morphs
    //     const morphTargets = geometry.morphTargets;
    //     const morphTargetsLength = morphTargets.length;

    //     let morphTargetsPosition;

    //     if (morphTargetsLength > 0) {
    //         morphTargetsPosition = [];

    //         for (let i = 0; i < morphTargetsLength; i++) {
    //             morphTargetsPosition[i] = { name: morphTargets[i].name, data: [] };
    //         }

    //         this._morphTargets.position = morphTargetsPosition;
    //     }

    //     const morphNormals = geometry.morphNormals;
    //     const morphNormalsLength = morphNormals.length;

    //     let morphTargetsNormal;

    //     if (morphNormalsLength > 0) {
    //         morphTargetsNormal = [];

    //         for (let i = 0; i < morphNormalsLength; i++) {
    //             morphTargetsNormal[i] = { name: morphNormals[i].name, data: [] };
    //         }

    //         this._morphTargets.normal = morphTargetsNormal;
    //     }

    //     // skins

    //     const skinIndices = geometry.skinIndices;
    //     const skinWeights = geometry.skinWeights;

    //     const hasSkinIndices = skinIndices.length === vertices.length;
    //     const hasSkinWeights = skinWeights.length === vertices.length;

    //     //

    //     if (vertices.length > 0 && faces.length === 0) {
    //         console.error(
    //             'THREE.DirectGeometry: Faceless geometries are not supported.');
    //     }

    //     for (let i = 0; i < faces.length; i++) {
    //         const face = faces[i];

    //         this._vertices.push(vertices[face.a], vertices[face.b], vertices[face.c]);

    //         const vertexNormals = face.vertexNormals;

    //         if (vertexNormals.length === 3) {
    //             this._normals.push(vertexNormals[0], vertexNormals[1], vertexNormals[2]);

    //         } else {
    //             const normal = face.normal;

    //             this._normals.push(normal, normal, normal);
    //         }

    //         const vertexColors = face.vertexColors;

    //         if (vertexColors.length === 3) {
    //             this._colors.push(vertexColors[0], vertexColors[1], vertexColors[2]);

    //         } else {
    //             const color = face.color;

    //             this._colors.push(color, color, color);
    //         }

    //         if (hasFaceVertexUv === true) {
    //             const vertexUvs = faceVertexUvs[0][i];

    //             if (vertexUvs !== undefined) {
    //                 this._uvs.push(vertexUvs[0], vertexUvs[1], vertexUvs[2]);

    //             } else {
    //                 console.warn(
    //                     'THREE.DirectGeometry.fromGeometry(): Undefined vertexUv ', i);

    //                 this._uvs.push(new Vector2(), new Vector2(), new Vector2());
    //             }
    //         }

    //         if (hasFaceVertexUv2 === true) {
    //             const vertexUvs = faceVertexUvs[1][i];

    //             if (vertexUvs !== undefined) {
    //                 this._uvs2.push(vertexUvs[0], vertexUvs[1], vertexUvs[2]);

    //             } else {
    //                 console.warn(
    //                     'THREE.DirectGeometry.fromGeometry(): Undefined vertexUv2 ', i);

    //                 this._uvs2.push(new Vector2(), new Vector2(), new Vector2());
    //             }
    //         }

    //         // morphs

    //         for (let j = 0; j < morphTargetsLength; j++) {
    //             const morphTarget = morphTargets[j].vertices;

    //             morphTargetsPosition[j].data.push(
    //                 morphTarget[face.a], morphTarget[face.b], morphTarget[face.c]);
    //         }

    //         for (let j = 0; j < morphNormalsLength; j++) {
    //             const morphNormal = morphNormals[j].vertexNormals[i];

    //             morphTargetsNormal[j].data.push(
    //                 morphNormal.a, morphNormal.b, morphNormal.c);
    //         }

    //         // skins

    //         if (hasSkinIndices) {
    //             this._skinIndices.push(
    //                 skinIndices[face.a], skinIndices[face.b], skinIndices[face.c]);
    //         }

    //         if (hasSkinWeights) {
    //             this._skinWeights.push(
    //                 skinWeights[face.a], skinWeights[face.b], skinWeights[face.c]);
    //         }
    //     }

    //     this.computeGroups(geometry);

    //     this._verticesNeedUpdate = geometry.verticesNeedUpdate;
    //     this._normalsNeedUpdate = geometry.normalsNeedUpdate;
    //     this._colorsNeedUpdate = geometry.colorsNeedUpdate;
    //     this._uvsNeedUpdate = geometry.uvsNeedUpdate;
    //     this._groupsNeedUpdate = geometry.groupsNeedUpdate;

    //     return this;
    // }
}
