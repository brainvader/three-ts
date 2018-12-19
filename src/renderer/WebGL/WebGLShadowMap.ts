import { MaterialSide } from '../../materials/constants';
import { MeshDepthMaterial } from '../../materials/MeshDepthMaterial';
import { Frustum } from '../../math/Frustum';
import { Matrix4 } from '../../math/Matrix4';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { TextureEncoding, TextureFormat, TextureMagnificationFilter, TextureMinificationFilter } from '../../texture/constants';
import { ShadowMapType } from '../constants';
import { WebGLRenderTarget } from '../WebGLRenderTarget';
import { MeshDistanceMaterial } from '../../materials/MeshDistanceMaterial';

export class WebGLShadowMap {
    private _frustum = new Frustum();
    private _projScreenMatrix = new Matrix4();

    private _shadowMapSize = new Vector2();
    private _maxShadowMapSize;

    private _lookTarget = new Vector3();
    private _lightPositionWorld = new Vector3();

    private _MorphingFlag = 1;
    private _SkinningFlag = 2;

    private _NumberOfMaterialVariants: number;

    private _depthMaterials: MeshDepthMaterial[];
    private _distanceMaterials: any[];

    private _materialCache = {};

    private _shadowSide = {
        0: MaterialSide.Back,
        1: MaterialSide.Front,
        2: MaterialSide.Double
    };

    private _cubeDirections = [
        new Vector3(1, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1),
        new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(0, -1, 0)
    ];

    private _cubeUps = [
        new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0),
        new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(0, 0, -1)
    ];

    private _cube2DViewPorts = [
        new Vector4(), new Vector4(), new Vector4(), new Vector4(), new Vector4(),
        new Vector4()
    ];

    private _enabled = false;

    private _autoUpdate = true;
    private _needsUpdate = false;

    private _type = ShadowMapType.PCF;


    constructor(private _renderer, private _objects, maxTextureSize) {
        this._maxShadowMapSize = new Vector2(maxTextureSize, maxTextureSize);

        // init
        for (let i = 0; i !== this._NumberOfMaterialVariants; ++i) {
            this._NumberOfMaterialVariants = (this._MorphingFlag | this._SkinningFlag) + 1;

            this._depthMaterials = new Array(this._NumberOfMaterialVariants);
            this._distanceMaterials = new Array(this._NumberOfMaterialVariants);
            const useMorphing = (i & this._MorphingFlag) !== 0;
            const useSkinning = (i & this._SkinningFlag) !== 0;

            const depthMaterial = new MeshDepthMaterial({
                depthPacking: TextureEncoding.RGBADepthPacking,
                morphTargets: useMorphing,
                skinning: useSkinning
            });

            this._depthMaterials[i] = depthMaterial;

            //
            const distanceMaterial = new MeshDistanceMaterial(
                { morphTargets: useMorphing, skinning: useSkinning });

            this._distanceMaterials[i] = distanceMaterial;
        }
    }

    render(lights, scene, camera) {
        if (this._enabled === false) {
            return;
        }
        if (this._autoUpdate === false && this._needsUpdate === false) {
            return;
        }

        if (lights.length === 0) {
            return;
        }

        // TODO Clean up (needed in case of contextlost)
        const _gl = this._renderer.context;
        const _state = this._renderer.state;

        // Set GL state for depth map.
        _state.disable(_gl.BLEND);
        _state.buffers.color.setClear(1, 1, 1, 1);
        _state.buffers.depth.setTest(true);
        _state.setScissorTest(false);

        // render depth map

        let faceCount;

        for (let i = 0, il = lights.length; i < il; i++) {
            const light = lights[i];
            const shadow = light.shadow;
            const isPointLight = light && light.isPointLight;

            if (shadow === undefined) {
                console.warn('THREE.WebGLShadowMap:', light, 'has no shadow.');
                continue;
            }

            const shadowCamera = shadow.camera;

            this._shadowMapSize.copy(shadow.mapSize);
            this._shadowMapSize.min(this._maxShadowMapSize);

            if (isPointLight) {
                const vpWidth = this._shadowMapSize.x;
                const vpHeight = this._shadowMapSize.y;

                // These viewports map a cube-map onto a 2D texture with the
                // following orientation:
                //
                //  xzXZ
                //   y Y
                //
                // X - Positive x direction
                // x - Negative x direction
                // Y - Positive y direction
                // y - Negative y direction
                // Z - Positive z direction
                // z - Negative z direction

                // positive X
                this._cube2DViewPorts[0].setAll(
                    vpWidth * 2, vpHeight, vpWidth, vpHeight);
                // negative X
                this._cube2DViewPorts[1].setAll(0, vpHeight, vpWidth, vpHeight);
                // positive Z
                this._cube2DViewPorts[2].setAll(
                    vpWidth * 3, vpHeight, vpWidth, vpHeight);
                // negative Z
                this._cube2DViewPorts[3].setAll(vpWidth, vpHeight, vpWidth, vpHeight);
                // positive Y
                this._cube2DViewPorts[4].setAll(vpWidth * 3, 0, vpWidth, vpHeight);
                // negative Y
                this._cube2DViewPorts[5].setAll(vpWidth, 0, vpWidth, vpHeight);

                this._shadowMapSize.x *= 4.0;
                this._shadowMapSize.y *= 2.0;
            }

            if (shadow.map === null) {
                const pars = {
                    minFilter: TextureMinificationFilter.Nearest,
                    magFilter: TextureMagnificationFilter.Nearest,
                    format: TextureFormat.RGBA
                };

                shadow.map = new WebGLRenderTarget(
                    this._shadowMapSize.x, this._shadowMapSize.y, pars);
                shadow.map.texture.name = light.name + '.shadowMap';

                shadowCamera.updateProjectionMatrix();
            }

            if (shadow.isSpotLightShadow) {
                shadow.update(light);
            }

            const shadowMap = shadow.map;
            const shadowMatrix = shadow.matrix;

            this._lightPositionWorld.setFromMatrixPosition(light.matrixWorld);
            shadowCamera.position.copy(this._lightPositionWorld);

            if (isPointLight) {
                faceCount = 6;

                // for point lights we set the shadow matrix to be a translation-only
                // matrix equal to inverse of the light's position

                shadowMatrix.makeTranslation(
                    -this._lightPositionWorld.x, -this._lightPositionWorld.y,
                    -this._lightPositionWorld.z);

            } else {
                faceCount = 1;

                this._lookTarget.setFromMatrixPosition(light.target.matrixWorld);
                shadowCamera.lookAt(this._lookTarget);
                shadowCamera.updateMatrixWorld();

                // compute shadow matrix

                shadowMatrix.set(
                    0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0,
                    0.0, 0.0, 1.0);

                shadowMatrix.multiply(shadowCamera.projectionMatrix);
                shadowMatrix.multiply(shadowCamera.matrixWorldInverse);
            }

            this._renderer.setRenderTarget(shadowMap);
            this._renderer.clear();

            // render shadow map for each cube face (if omni-directional) or
            // run a single pass if not

            for (let face = 0; face < faceCount; face++) {
                if (isPointLight) {
                    this._lookTarget.copy(shadowCamera.position);
                    this._lookTarget.add(this._cubeDirections[face]);
                    shadowCamera.up.copy(this._cubeUps[face]);
                    shadowCamera.lookAt(this._lookTarget);
                    shadowCamera.updateMatrixWorld();

                    const vpDimensions = this._cube2DViewPorts[face];
                    _state.viewport(vpDimensions);
                }

                // update camera matrices and frustum

                this._projScreenMatrix.multiplyMatrices(
                    shadowCamera.projectionMatrix, shadowCamera.matrixWorldInverse);
                this._frustum.setFromMatrix(this._projScreenMatrix);

                // set object matrices & frustum culling

                this.renderObject(scene, camera, shadowCamera, isPointLight);
            }
        }

        this._needsUpdate = false;
    }

    getDepthMaterial(
        object, material, isPointLight, lightPositionWorld, shadowCameraNear,
        shadowCameraFar) {
        const geometry = object.geometry;

        let result = null;

        let materialVariants = this._depthMaterials;
        let customMaterial = object.customDepthMaterial;

        if (isPointLight) {
            materialVariants = this._distanceMaterials;
            customMaterial = object.customDistanceMaterial;
        }

        if (!customMaterial) {
            let useMorphing = false;

            if (material.morphTargets) {
                if (geometry && geometry.isBufferGeometry) {
                    useMorphing = geometry.morphAttributes &&
                        geometry.morphAttributes.position &&
                        geometry.morphAttributes.position.length > 0;

                } else if (geometry && geometry.isGeometry) {
                    useMorphing =
                        geometry.morphTargets && geometry.morphTargets.length > 0;
                }
            }

            if (object.isSkinnedMesh && material.skinning === false) {
                console.warn(
                    'THREE.WebGLShadowMap: THREE.SkinnedMesh with material.skinning set to false:',
                    object);
            }

            const useSkinning = object.isSkinnedMesh && material.skinning;

            let variantIndex = 0;

            if (useMorphing) {
                variantIndex |= this._MorphingFlag;
            }
            if (useSkinning) {
                variantIndex |= this._SkinningFlag;
            }

            result = materialVariants[variantIndex];

        } else {
            result = customMaterial;
        }

        if (this._renderer.localClippingEnabled && material.clipShadows === true &&
            material.clippingPlanes.length !== 0) {
            // in this case we need a unique material instance reflecting the
            // appropriate state

            const keyA = result.uuid, keyB = material.uuid;

            let materialsForVariant = this._materialCache[keyA];

            if (materialsForVariant === undefined) {
                materialsForVariant = {};
                this._materialCache[keyA] = materialsForVariant;
            }

            let cachedMaterial = materialsForVariant[keyB];

            if (cachedMaterial === undefined) {
                cachedMaterial = result.clone();
                materialsForVariant[keyB] = cachedMaterial;
            }

            result = cachedMaterial;
        }

        result.visible = material.visible;
        result.wireframe = material.wireframe;

        result.side = (material.shadowSide != null) ? material.shadowSide :
            this._shadowSide[material.side];

        result.clipShadows = material.clipShadows;
        result.clippingPlanes = material.clippingPlanes;
        result.clipIntersection = material.clipIntersection;

        result.wireframeLinewidth = material.wireframeLinewidth;
        result.linewidth = material.linewidth;

        if (isPointLight && result.isMeshDistanceMaterial) {
            result.referencePosition.copy(lightPositionWorld);
            result.nearDistance = shadowCameraNear;
            result.farDistance = shadowCameraFar;
        }

        return result;
    }

    renderObject(object, camera, shadowCamera, isPointLight) {
        if (object.visible === false) {
            return;
        }

        const visible = object.layers.test(camera.layers);

        if (visible && (object.isMesh || object.isLine || object.isPoints)) {
            if (object.castShadow &&
                (!object.frustumCulled || this._frustum.intersectsObject(object))) {
                object.modelViewMatrix.multiplyMatrices(
                    shadowCamera.matrixWorldInverse, object.matrixWorld);

                const geometry = this._objects.update(object);
                const material = object.material;

                if (Array.isArray(material)) {
                    const groups = geometry.groups;

                    for (let k = 0, kl = groups.length; k < kl; k++) {
                        const group = groups[k];
                        const groupMaterial = material[group.materialIndex];

                        if (groupMaterial && groupMaterial.visible) {
                            const depthMaterial = this.getDepthMaterial(
                                object, groupMaterial, isPointLight, this._lightPositionWorld,
                                shadowCamera.near, shadowCamera.far);
                            this._renderer.renderBufferDirect(
                                shadowCamera, null, geometry, depthMaterial, object, group);
                        }
                    }

                } else if (material.visible) {
                    const depthMaterial = this.getDepthMaterial(
                        object, material, isPointLight, this._lightPositionWorld,
                        shadowCamera.near, shadowCamera.far);
                    this._renderer.renderBufferDirect(
                        shadowCamera, null, geometry, depthMaterial, object, null);
                }
            }
        }

        const children = object.children;

        for (let i = 0, l = children.length; i < l; i++) {
            this.renderObject(children[i], camera, shadowCamera, isPointLight);
        }
    }
}
