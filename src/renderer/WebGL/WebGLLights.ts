import { Color } from '../../math/Color';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Matrix4 } from '../../math/Matrix4';

import { Texture } from '../../texture/Texture';

import { Light } from '../../object/light/light';
import { LightType } from '../../object/light/constatns';
import { DirectionalLight } from '../../object/light/DirectionalLight';
import { AmbientLight } from '../../object/light/AmbientLight';
import { SpotLight } from '../../object/light/SpotLight';
import { RectAreaLight } from '../../object/light/RectAreaLight';
import { PointLight } from '../../object/light/PointLight';
import { HemisphereLight } from '../../object/light/HemisphereLight';

import { Camera } from '../../object/camera/Camera';
import { PerspectiveCamera } from '../../object/camera/PerspectiveCamera';
import { OrthographicCamera } from '../../object/camera/OrthographicCamera';

interface ILightsState {
    id: number;

    hash: {
        stateID: number;
        directionalLength: number;
        pointLength: number;
        spotLength: number;
        rectAreaLength: number;
        hemiLength: number;
        shadowsLength: number;
    };

    ambient: number[];
    directional: any[];
    directionalShadowMap: Texture[];
    directionalShadowMatrix: Matrix4[];
    spot: any[];
    spotShadowMap: Texture[];
    spotShadowMatrix: Matrix4[];
    rectArea: any[];
    point: any[];
    pointShadowMap: Texture[];
    pointShadowMatrix: Matrix4[];
    hemi: any[];
}

// TODO: Use state pattern
interface IDirectionalLightUniform {
    direction: Vector3;
    color: Color;
    shadow: boolean;
    shadowBias: number;
    shadowRadius: number;
    shadowMapSize: Vector2;
}

interface ISpotLightUniform {
    position: Vector3;
    direction: Vector3;
    color: Color;
    distance: number;
    coneCos: number;
    penumbraCos: number;
    decay: number;

    shadow: boolean;
    shadowBias: number;
    shadowRadius: number;
    shadowMapSize: Vector2;
}

interface IPointLIghtUniform {
    position: Vector3;
    color: Color;
    distance: number;
    decay: number;
    shadow: boolean;
    shadowBias: number;
    shadowRadius: number;
    shadowMapSize: Vector2;
    shadowCameraNear: number;
    shadowCameraFar: number;
}

interface IRectAreaLightUniform {
    color: Color;
    position: Vector3;
    halfWidth: Vector3;
    halfHeight: Vector3;
}

interface IHemisphereLightUniform {
    direction: Vector3;
    skyColor: Color;
    groundColor: Color;
}

type LightUniform = IDirectionalLightUniform | ISpotLightUniform |
    IPointLIghtUniform | IRectAreaLightUniform | IHemisphereLightUniform;

class UniformsCache {
    constructor(private _lights?: LightUniform[]) {}

    get(light: Light): LightUniform {
        if (this._lights[light.id] !== undefined) {
            return this._lights[light.id];
        }

        let uniforms: LightUniform;

        switch (light.lightType) {
            case LightType.Directional:
                uniforms = {
                    direction: new Vector3(),
                    color: new Color(),

                    shadow: false,
                    shadowBias: 0,
                    shadowRadius: 1,
                    shadowMapSize: new Vector2()
                } as IDirectionalLightUniform;
                break;

            case LightType.Spot:
                uniforms = {
                    position: new Vector3(),
                    direction: new Vector3(),
                    color: new Color(),
                    distance: 0,
                    coneCos: 0,
                    penumbraCos: 0,
                    decay: 0,

                    shadow: false,
                    shadowBias: 0,
                    shadowRadius: 1,
                    shadowMapSize: new Vector2()
                } as ISpotLightUniform;
                break;

            case LightType.Point:
                uniforms = {
                    position: new Vector3(),
                    color: new Color(),
                    distance: 0,
                    decay: 0,

                    shadow: false,
                    shadowBias: 0,
                    shadowRadius: 1,
                    shadowMapSize: new Vector2(),
                    shadowCameraNear: 1,
                    shadowCameraFar: 1000
                } as IPointLIghtUniform;
                break;

            case LightType.Hemisphere:
                uniforms = {
                    direction: new Vector3(),
                    skyColor: new Color(),
                    groundColor: new Color()
                } as IHemisphereLightUniform;
                break;

            case LightType.RectArea:
                uniforms = {
                    color: new Color(),
                    position: new Vector3(),
                    halfWidth: new Vector3(),
                    halfHeight: new Vector3()
                    // TODO (abelnation): set RectAreaLight shadow uniforms
                } as IRectAreaLightUniform;
                break;
        }

        this._lights[light.id] = uniforms;

        return uniforms;
    }
}

export class WebGLLights {
    static count = 0;
    private _cache: UniformsCache;
    private _state: ILightsState;

    private _vector3: Vector3;
    private _matrix4: Matrix4;
    private _matrix42: Matrix4;

    constructor() {
        this._cache = new UniformsCache();
        this._state = {

            id: WebGLLights.count++,

            hash: {
                stateID: - 1,
                directionalLength: - 1,
                pointLength: - 1,
                spotLength: - 1,
                rectAreaLength: - 1,
                hemiLength: - 1,
                shadowsLength: - 1
            },

            ambient: [ 0, 0, 0 ],
            directional: null,
            directionalShadowMap: [],
            directionalShadowMatrix: [],
            spot: null,
            spotShadowMap: [],
            spotShadowMatrix: [],
            rectArea: null,
            point: null,
            pointShadowMap: [],
            pointShadowMatrix: [],
            hemi: null

        };

        this._vector3 = new Vector3();
        this._matrix4 = new Matrix4();
        this._matrix42 = new Matrix4();
    }

    get state(): ILightsState {
        return this._state;
    }

    // TODO: Need type annotation
    getShadowMap(light): Texture {
        return (light.shadow && light.shadow.map) ? light.shadow.map.texture : null;
    }

    setup(lights: Light[], shadows: Light[], camera: Camera) {
        let r = 0, g = 0, b = 0;

        let directionalLength = 0;
        let pointLength = 0;
        let spotLength = 0;
        let rectAreaLength = 0;
        let hemiLength = 0;

        const viewMatrix = camera.matrixWorldInverse;

        for (let i = 0, l = lights.length; i < l; i++) {
            const light = lights[i];

            const color = light.color;
            const intensity = light.intensity;
            // const distance = light.distance;

            if (light instanceof AmbientLight) {
                r += color.r * intensity;
                g += color.g * intensity;
                b += color.b * intensity;

            } else if (light instanceof DirectionalLight) {
                const uniforms = this._cache.get(light) as IDirectionalLightUniform;

                uniforms.color.copy(light.color).multiplyScalar(light.intensity);
                uniforms.direction.setFromMatrixPosition(light.matrixWorld);
                this._vector3.setFromMatrixPosition(light.target.matrixWorld);
                uniforms.direction.sub(this._vector3);
                uniforms.direction.transformDirection(viewMatrix);

                uniforms.shadow = light.castShadow;

                if (light.castShadow) {
                    const shadow = light.shadow;

                    uniforms.shadowBias = shadow.bias;
                    uniforms.shadowRadius = shadow.radius;
                    uniforms.shadowMapSize = shadow.mapSize;
                }

                // this._state.directionalShadowMap[directionalLength] = shadowMap;
                this._state.directionalShadowMap[directionalLength] = this.getShadowMap(light);
                this._state.directionalShadowMatrix[directionalLength] =
                    light.shadow.matrix;
                this._state.directional[directionalLength] = uniforms;

                directionalLength++;

            } else if (light instanceof SpotLight) {
                const uniforms = this._cache.get(light) as ISpotLightUniform;

                uniforms.position.setFromMatrixPosition(light.matrixWorld);
                uniforms.position.applyMatrix4(viewMatrix);

                uniforms.color.copy(color).multiplyScalar(intensity);
                uniforms.distance = light.distance;
                // uniforms.distance = (<SpotLight>light).distance;

                uniforms.direction.setFromMatrixPosition(light.matrixWorld);
                this._vector3.setFromMatrixPosition(light.target.matrixWorld);
                uniforms.direction.sub(this._vector3);
                uniforms.direction.transformDirection(viewMatrix);

                uniforms.coneCos = Math.cos(light.angle);
                uniforms.penumbraCos = Math.cos(light.angle * (1 - light.penumbra));
                uniforms.decay = light.decay;

                uniforms.shadow = light.castShadow;

                if (light.castShadow) {
                    const shadow = light.shadow;

                    uniforms.shadowBias = shadow.bias;
                    uniforms.shadowRadius = shadow.radius;
                    uniforms.shadowMapSize = shadow.mapSize;
                }

                this._state.spotShadowMap[spotLength] = this.getShadowMap(light);
                this._state.spotShadowMatrix[spotLength] = light.shadow.matrix;
                this._state.spot[spotLength] = uniforms;

                spotLength++;

            } else if (light instanceof RectAreaLight) {
                const uniforms = this._cache.get(light) as IRectAreaLightUniform;

                // (a) intensity is the total visible light emitted
                // uniforms.color.copy( color ).multiplyScalar( intensity / (
                // light.width * light.height * Math.PI ) );

                // (b) intensity is the brightness of the light
                uniforms.color.copy(color).multiplyScalar(intensity);

                uniforms.position.setFromMatrixPosition(light.matrixWorld);
                uniforms.position.applyMatrix4(viewMatrix);

                // extract local rotation of light to derive width/height half vectors
                this._matrix42.identity();
                this._matrix4.copy(light.matrixWorld);
                this._matrix4.premultiply(viewMatrix);
                this._matrix42.extractRotation(this._matrix4);

                uniforms.halfWidth.setXYZ(light.width * 0.5, 0.0, 0.0);
                uniforms.halfHeight.setXYZ(0.0, light.height * 0.5, 0.0);

                uniforms.halfWidth.applyMatrix4(this._matrix42);
                uniforms.halfHeight.applyMatrix4(this._matrix42);

                // TODO (abelnation): RectAreaLight distance?
                // uniforms.distance = distance;

                this._state.rectArea[rectAreaLength] = uniforms;

                rectAreaLength++;

            } else if (light instanceof PointLight) {
                const uniforms = this._cache.get(light) as IPointLIghtUniform;

                uniforms.position.setFromMatrixPosition(light.matrixWorld);
                uniforms.position.applyMatrix4(viewMatrix);

                uniforms.color.copy(light.color).multiplyScalar(light.intensity);
                uniforms.distance = light.distance;
                uniforms.decay = light.decay;

                uniforms.shadow = light.castShadow;

                if (light.castShadow) {
                    const shadow = light.shadow;

                    uniforms.shadowBias = shadow.bias;
                    uniforms.shadowRadius = shadow.radius;
                    uniforms.shadowMapSize = shadow.mapSize;

                    if (shadow.camera instanceof PerspectiveCamera ||
                        shadow.camera instanceof OrthographicCamera) {
                            uniforms.shadowCameraNear = shadow.camera.near;
                            uniforms.shadowCameraFar = shadow.camera.far;
                    }
                }

                this._state.pointShadowMap[pointLength] = this.getShadowMap(light);
                this._state.pointShadowMatrix[pointLength] = light.shadow.matrix;
                this._state.point[pointLength] = uniforms;

                pointLength++;

            } else if (light instanceof HemisphereLight) {
                const uniforms = this._cache.get(light) as IHemisphereLightUniform;

                uniforms.direction.setFromMatrixPosition(light.matrixWorld);
                uniforms.direction.transformDirection(viewMatrix);
                uniforms.direction.normalize();

                uniforms.skyColor.copy(light.color).multiplyScalar(intensity);
                uniforms.groundColor.copy(light.groundColor)
                    .multiplyScalar(intensity);

                this._state.hemi[hemiLength] = uniforms;

                hemiLength++;
            }
        }

        this._state.ambient[0] = r;
        this._state.ambient[1] = g;
        this._state.ambient[2] = b;

        this._state.directional.length = directionalLength;
        this._state.spot.length = spotLength;
        this._state.rectArea.length = rectAreaLength;
        this._state.point.length = pointLength;
        this._state.hemi.length = hemiLength;

        this._state.hash.stateID = this._state.id;
        this._state.hash.directionalLength = directionalLength;
        this._state.hash.pointLength = pointLength;
        this._state.hash.spotLength = spotLength;
        this._state.hash.rectAreaLength = rectAreaLength;
        this._state.hash.hemiLength = hemiLength;
        this._state.hash.shadowsLength = shadows.length;
    }
}
