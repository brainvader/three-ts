import { WebGLRenderer } from './WebGLRenderer';
import { MathUtil } from '../utils/MathUtil';
import { TextureFormat, TextureType } from '../texture/constants';
import { WebGLUniforms } from './WebGL/WebGLUniforms';
import { MaterialSide } from '../materials/constants';

// TODO: Rename RendererDelegate?
export class RendererUtil {
    constructor(private _renderer: WebGLRenderer) {}

    refreshUniformsCommon(uniforms, material) {
        uniforms.opacity.value = material.opacity;

        if (material.color) {
            uniforms.diffuse.value = material.color;
        }

        if (material.emissive) {
            uniforms.emissive.value.copy(material.emissive)
                .multiplyScalar(material.emissiveIntensity);
        }

        if (material.map) {
            uniforms.map.value = material.map;
        }

        if (material.alphaMap) {
            uniforms.alphaMap.value = material.alphaMap;
        }

        if (material.specularMap) {
            uniforms.specularMap.value = material.specularMap;
        }

        if (material.envMap) {
            uniforms.envMap.value = material.envMap;

            // don't flip CubeTexture envMaps, flip everything else:
            //  WebGLRenderTargetCube will be flipped for backwards compatibility
            //  WebGLRenderTargetCube.texture will be flipped because it's a Texture
            //  and NOT a CubeTexture
            // this check must be handled differently, or removed entirely, if
            // WebGLRenderTargetCube uses a CubeTexture in the future
            uniforms.flipEnvMap.value = material.envMap.isCubeTexture ? -1 : 1;

            uniforms.reflectivity.value = material.reflectivity;
            uniforms.refractionRatio.value = material.refractionRatio;

            uniforms.maxMipLevel.value =
                this._renderer.properties.get(material.envMap).__maxMipLevel;
        }

        if (material.lightMap) {
            uniforms.lightMap.value = material.lightMap;
            uniforms.lightMapIntensity.value = material.lightMapIntensity;
        }

        if (material.aoMap) {
            uniforms.aoMap.value = material.aoMap;
            uniforms.aoMapIntensity.value = material.aoMapIntensity;
        }

        // uv repeat and offset setting priorities
        // 1. color map
        // 2. specular map
        // 3. normal map
        // 4. bump map
        // 5. alpha map
        // 6. emissive map

        let uvScaleMap;

        if (material.map) {
            uvScaleMap = material.map;
        } else if (material.specularMap) {
            uvScaleMap = material.specularMap;
        } else if (material.displacementMap) {
            uvScaleMap = material.displacementMap;
        } else if (material.normalMap) {
            uvScaleMap = material.normalMap;
        } else if (material.bumpMap) {
            uvScaleMap = material.bumpMap;
        } else if (material.roughnessMap) {
            uvScaleMap = material.roughnessMap;
        } else if (material.metalnessMap) {
            uvScaleMap = material.metalnessMap;
        } else if (material.alphaMap) {
            uvScaleMap = material.alphaMap;
        } else if (material.emissiveMap) {
            uvScaleMap = material.emissiveMap;
        }

        if (uvScaleMap !== undefined) {
            // backwards compatibility
            if (uvScaleMap.isWebGLRenderTarget) {
                uvScaleMap = uvScaleMap.texture;
            }

            if (uvScaleMap.matrixAutoUpdate === true) {
                uvScaleMap.updateMatrix();
            }

            uniforms.uvTransform.value.copy(uvScaleMap.matrix);
        }
    }

    refreshUniformsLine(uniforms, material) {
        uniforms.diffuse.value = material.color;
        uniforms.opacity.value = material.opacity;
    }

    refreshUniformsDash(uniforms, material) {
        uniforms.dashSize.value = material.dashSize;
        uniforms.totalSize.value = material.dashSize + material.gapSize;
        uniforms.scale.value = material.scale;
    }

    refreshUniformsPoints(uniforms, material) {
        uniforms.diffuse.value = material.color;
        uniforms.opacity.value = material.opacity;
        uniforms.size.value = material.size * this._renderer.pixelRatio;
        uniforms.scale.value = this._renderer.height * 0.5;

        uniforms.map.value = material.map;

        if (material.map !== null) {
            if (material.map.matrixAutoUpdate === true) {
                material.map.updateMatrix();
            }

            uniforms.uvTransform.value.copy(material.map.matrix);
        }
    }

    refreshUniformsSprites(uniforms, material) {
        uniforms.diffuse.value = material.color;
        uniforms.opacity.value = material.opacity;
        uniforms.rotation.value = material.rotation;
        uniforms.map.value = material.map;

        if (material.map !== null) {
            if (material.map.matrixAutoUpdate === true) {
                material.map.updateMatrix();
            }

            uniforms.uvTransform.value.copy(material.map.matrix);
        }
    }

    refreshUniformsFog(uniforms, fog) {
        uniforms.fogColor.value = fog.color;

        if (fog.isFog) {
            uniforms.fogNear.value = fog.near;
            uniforms.fogFar.value = fog.far;

        } else if (fog.isFogExp2) {
            uniforms.fogDensity.value = fog.density;
        }
    }

    refreshUniformsLambert(uniforms, material) {
        if (material.emissiveMap) {
            uniforms.emissiveMap.value = material.emissiveMap;
        }
    }

    refreshUniformsPhong(uniforms, material) {
        uniforms.specular.value = material.specular;
        uniforms.shininess.value =
            Math.max(material.shininess, 1e-4);  // to prevent pow( 0.0, 0.0 )

        if (material.emissiveMap) {
            uniforms.emissiveMap.value = material.emissiveMap;
        }

        if (material.bumpMap) {
            uniforms.bumpMap.value = material.bumpMap;
            uniforms.bumpScale.value = material.bumpScale;
            if (material.side === MaterialSide.Back) { uniforms.bumpScale.value *= -1; }
        }

        if (material.normalMap) {
            uniforms.normalMap.value = material.normalMap;
            uniforms.normalScale.value.copy(material.normalScale);
            if (material.side === MaterialSide.Back) { uniforms.normalScale.value.negate(); }
        }

        if (material.displacementMap) {
            uniforms.displacementMap.value = material.displacementMap;
            uniforms.displacementScale.value = material.displacementScale;
            uniforms.displacementBias.value = material.displacementBias;
        }
    }

    refreshUniformsToon(uniforms, material) {
        this.refreshUniformsPhong(uniforms, material);

        if (material.gradientMap) {
            uniforms.gradientMap.value = material.gradientMap;
        }
    }

    refreshUniformsStandard(uniforms, material) {
        uniforms.roughness.value = material.roughness;
        uniforms.metalness.value = material.metalness;

        if (material.roughnessMap) {
            uniforms.roughnessMap.value = material.roughnessMap;
        }

        if (material.metalnessMap) {
            uniforms.metalnessMap.value = material.metalnessMap;
        }

        if (material.emissiveMap) {
            uniforms.emissiveMap.value = material.emissiveMap;
        }

        if (material.bumpMap) {
            uniforms.bumpMap.value = material.bumpMap;
            uniforms.bumpScale.value = material.bumpScale;
            if (material.side === MaterialSide.Back) { uniforms.bumpScale.value *= -1; }
        }

        if (material.normalMap) {
            uniforms.normalMap.value = material.normalMap;
            uniforms.normalScale.value.copy(material.normalScale);
            if (material.side === MaterialSide.Back) { uniforms.normalScale.value.negate(); }
        }

        if (material.displacementMap) {
            uniforms.displacementMap.value = material.displacementMap;
            uniforms.displacementScale.value = material.displacementScale;
            uniforms.displacementBias.value = material.displacementBias;
        }

        if (material.envMap) {
            // uniforms.envMap.value = material.envMap; // part of uniforms common
            uniforms.envMapIntensity.value = material.envMapIntensity;
        }
    }

    refreshUniformsPhysical(uniforms, material) {
        this.refreshUniformsStandard(uniforms, material);

        uniforms.reflectivity.value =
            material.reflectivity;  // also part of uniforms common

        uniforms.clearCoat.value = material.clearCoat;
        uniforms.clearCoatRoughness.value = material.clearCoatRoughness;
    }

    refreshUniformsMatcap(uniforms, material) {
        if (material.matcap) {
            uniforms.matcap.value = material.matcap;
        }

        if (material.bumpMap) {
            uniforms.bumpMap.value = material.bumpMap;
            uniforms.bumpScale.value = material.bumpScale;
            if (material.side === MaterialSide.Back) {
                uniforms.bumpScale.value *= -1;
            }
        }

        if (material.normalMap) {
            uniforms.normalMap.value = material.normalMap;
            uniforms.normalScale.value.copy(material.normalScale);
            if (material.side === MaterialSide.Back) {
                uniforms.normalScale.value.negate();
            }
        }

        if (material.displacementMap) {
            uniforms.displacementMap.value = material.displacementMap;
            uniforms.displacementScale.value = material.displacementScale;
            uniforms.displacementBias.value = material.displacementBias;
        }
    }

    refreshUniformsDepth(uniforms, material) {
        if (material.displacementMap) {
            uniforms.displacementMap.value = material.displacementMap;
            uniforms.displacementScale.value = material.displacementScale;
            uniforms.displacementBias.value = material.displacementBias;
        }
    }

    refreshUniformsDistance(uniforms, material) {
        if (material.displacementMap) {
            uniforms.displacementMap.value = material.displacementMap;
            uniforms.displacementScale.value = material.displacementScale;
            uniforms.displacementBias.value = material.displacementBias;
        }

        uniforms.referencePosition.value.copy(material.referencePosition);
        uniforms.nearDistance.value = material.nearDistance;
        uniforms.farDistance.value = material.farDistance;
    }

    refreshUniformsNormal(uniforms, material) {
        if (material.bumpMap) {
            uniforms.bumpMap.value = material.bumpMap;
            uniforms.bumpScale.value = material.bumpScale;
            if (material.side === MaterialSide.Back) { uniforms.bumpScale.value *= -1; }
        }

        if (material.normalMap) {
            uniforms.normalMap.value = material.normalMap;
            uniforms.normalScale.value.copy(material.normalScale);
            if (material.side === MaterialSide.Back) { uniforms.normalScale.value.negate(); }
        }

        if (material.displacementMap) {
            uniforms.displacementMap.value = material.displacementMap;
            uniforms.displacementScale.value = material.displacementScale;
            uniforms.displacementBias.value = material.displacementBias;
        }
    }
}
