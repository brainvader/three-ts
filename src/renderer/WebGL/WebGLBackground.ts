import { Color } from '../../math/Color';
import { Mesh } from '../../object/Mesh';
import { cloneUniforms } from '../shader/UniformUtil';
import { WebGLRenderer } from '../WebGLRenderer';

import { WebGLObjects } from './WebGLObjects';
import { WebGLState } from './webglstate/WebGLState';
import { BasicRenderer } from '../BasicRenderer';
import { MaterialSide } from '../../materials/constants';

export class WebGLBackground {
    private _clearColor = new Color(0x000000);
    private _clearAlpha = 0;

    private _planeMesh;
    private _boxMesh;

    // Store the current background texture and its `version`
    // so we can recompile the material accordingly.
    private _currentBackground = null;
    private _currentBackgroundVersion = 0;

    constructor(
        private _renderer: BasicRenderer, private _state: WebGLState,
        private _objects: WebGLObjects, private _premultipliedAlpha: boolean) { }

    render(renderList, scene, camera, forceClear) {
        const background = scene.background;

        if (background === null) {
            this.setClear(this._clearColor, this._clearAlpha);
            this._currentBackground = null;
            this._currentBackgroundVersion = 0;

        } else if (background && background.isColor) {
            this.setClear(background, 1);
            forceClear = true;
            this._currentBackground = null;
            this._currentBackgroundVersion = 0;
        }

        if (this._renderer.autoClear || forceClear) {
            this._renderer.clear(
                this._renderer.autoClearColor, this._renderer.autoClearDepth,
                this._renderer.autoClearStencil);
        }

        if (background &&
            (background.isCubeTexture || background.isWebGLRenderTargetCube)) {
            if (this._boxMesh === undefined) {
                this._boxMesh =
                    new Mesh(new BoxBufferGeometry(1, 1, 1), new ShaderMaterial({
                        type: 'BackgroundCubeMaterial',
                        uniforms: cloneUniforms(ShaderLib.cube.uniforms),
                        vertexShader: ShaderLib.cube.vertexShader,
                        fragmentShader: ShaderLib.cube.fragmentShader,
                        side: MaterialSide.Back,
                        depthTest: true,
                        depthWrite: false,
                        fog: false
                    }));

                this._boxMesh.geometry.removeAttribute('normal');
                this._boxMesh.geometry.removeAttribute('uv');

                this._boxMesh.onBeforeRender = function (renderer, scene, camera) {
                    this.matrixWorld.copyPosition(camera.matrixWorld);
                };

                // enable code injection for non-built-in material
                Object.defineProperty(this._boxMesh.material, 'map', {

                    get: function () {
                        return this.uniforms.tCube.value;
                    }

                });

                this._objects.update(this._boxMesh);
            }

            const texture =
                background.isWebGLRenderTargetCube ? background.texture : background;
            this._boxMesh.material.uniforms.tCube.value = texture;
            this._boxMesh.material.uniforms.tFlip.value =
                (background.isWebGLRenderTargetCube) ? 1 : -1;

            if (this._currentBackground !== background ||
                this._currentBackgroundVersion !== texture.version) {
                this._boxMesh.material.needsUpdate = true;

                this._currentBackground = background;
                this._currentBackgroundVersion = texture.version;
            }

            // push to the pre-sorted opaque render list
            renderList.unshift(
                this._boxMesh, this._boxMesh.geometry, this._boxMesh.material, 0,
                null);

        } else if (background && background.isTexture) {
            if (this._planeMesh === undefined) {
                this._planeMesh =
                    new Mesh(new PlaneBufferGeometry(2, 2), new ShaderMaterial({
                        type: 'BackgroundMaterial',
                        uniforms: cloneUniforms(ShaderLib.background.uniforms),
                        vertexShader: ShaderLib.background.vertexShader,
                        fragmentShader: ShaderLib.background.fragmentShader,
                        side: MaterialSide.Front,
                        depthTest: false,
                        depthWrite: false,
                        fog: false
                    }));

                this._planeMesh.geometry.removeAttribute('normal');

                // enable code injection for non-built-in material
                Object.defineProperty(this._planeMesh.material, 'map', {

                    get: function () {
                        return this.uniforms.t2D.value;
                    }

                });

                this._objects.update(this._planeMesh);
            }

            this._planeMesh.material.uniforms.t2D.value = background;

            if (background.matrixAutoUpdate === true) {
                background.updateMatrix();
            }

            this._planeMesh.material.uniforms.uvTransform.value.copy(
                background.matrix);

            if (this._currentBackground !== background ||
                this._currentBackgroundVersion !== background.version) {
                this._planeMesh.material.needsUpdate = true;

                this._currentBackground = background;
                this._currentBackgroundVersion = background.version;
            }


            // push to the pre-sorted opaque render list
            renderList.unshift(
                this._planeMesh, this._planeMesh.geometry, this._planeMesh.material,
                0, null);
        }
    }

    private setClear(color, alpha) {
        this._state.buffers.color.setClear(
            color.r, color.g, color.b, alpha, this._premultipliedAlpha);
    }

    getClearColor() {
        return this._clearColor;
    }

    setClearColor(color, alpha) {
        this._clearColor.set( color );
        this._clearAlpha = alpha !== undefined ? alpha : 1;
        this.setClear( this._clearColor, this._clearAlpha );
    }

    getClearAlpha() {
        return this._clearAlpha;
    }

    setClearAlpha(alpha) {
        this._clearAlpha = alpha;
        this.setClear(this._clearColor, this._clearAlpha);
    }
}
