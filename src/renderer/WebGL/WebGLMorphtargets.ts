import { absNumericalSort } from './WebGLUtil';
import { ShaderProgram } from '../shader/ShaderProgram';
import { Material } from '../../materials/Material';
import { GeometryType, BufferGeometryType } from '../../object/constatns';
import { Object3D } from '../../core/Object3D';
import { Mesh } from '../../object/Mesh';
import { MeshMaterial } from '../../materials/MaterialType';

export class WebGLMorphtargets {
    private _influencesList = {};
    private _morphInfluences = new Float32Array(8);

    constructor(private _gl: WebGLRenderingContext) {}

    update(object: Mesh, geometry, material, program: ShaderProgram) {
      const objectInfluences = object.morphTargetInfluences;

      const length = objectInfluences.length;

      let influences = this._influencesList[geometry.id];

      if (influences === undefined) {
        // initialise list

        influences = [];

        for (let i = 0; i < length; i++) {
          influences[i] = [i, 0];
        }

        this._influencesList[geometry.id] = influences;
      }

      const morphTargets =
          material.morphTargets && geometry.morphAttributes.position;
      const morphNormals =
          material.morphNormals && geometry.morphAttributes.normal;

      // Remove current morphAttributes

      for (let i = 0; i < length; i++) {
        const influence = influences[i];

        if (influence[1] !== 0) {
          if (morphTargets) {
            geometry.removeAttribute('morphTarget' + i);
          }
          if (morphNormals) {
            geometry.removeAttribute('morphNormal' + i);
          }
        }
      }

      // Collect influences

      for (let i = 0; i < length; i++) {
        const influence = influences[i];

        influence[0] = i;
        influence[1] = objectInfluences[i];
      }

      influences.sort(absNumericalSort);

      // Add morphAttributes

      for (let i = 0; i < 8; i++) {
        const influence = influences[i];

        if (influence) {
          const index = influence[0];
          const value = influence[1];

          if (value) {
            if (morphTargets) {
              geometry.addAttribute('morphTarget' + i, morphTargets[index]);
            }
            if (morphNormals) {
              geometry.addAttribute('morphNormal' + i, morphNormals[index]);
            }

            this._morphInfluences[i] = value;
            continue;
          }
        }

        this._morphInfluences[i] = 0;
      }

      program.uniforms.setValue(
          this._gl, 'morphTargetInfluences', this._morphInfluences);
    }
}
