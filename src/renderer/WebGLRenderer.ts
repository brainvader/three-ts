import { Camera } from '../object/camera/Camera';
import { Line } from '../object/Line';
import { BufferRenderer } from './BufferRenderer';
import { Material } from '../materials/Material';
import { TextureType, TextureFormat } from '../texture/constants';
import { Fog } from '../scene/Fog';
import { BasicRenderer } from './BasicRenderer';
import { RendererUtil } from './RendererUtil';
import { cloneUniforms } from './shader/UniformUtil';
import { WebGLUniforms } from './WebGL/WebGLUniforms';
import { MathUtil } from '../utils/MathUtil';
import { WebGLPrograms } from './shader/WebGLPrograms';
import { BufferGeometry } from '../core/BufferGeometry';
import { InstancedBufferGeometry } from '../core/InstancedBufferGeometry';
import { LineSegments } from '../object/LineSegments';
import { DataTexture } from '../texture/DataTexture';
import { DrawMode, BufferGeometryType } from '../object/constatns';
import { Mesh } from '../object/Mesh';
import { DrawableType } from '../object/constatns';
import { WebGLRenderTarget } from './WebGLRenderTarget';
import { WebGLRenderTargetCube } from './WebGLRenderTargetCube';
import { WebGLRenderframe } from './WebGLRenderframe';
import { Points } from '../object/Points';
import { ShaderProgram } from './shader/ShaderProgram';
import { Object3D } from '../core/Object3D';
import { Light } from '../object/light/Light';
import { SkinnedMesh } from '../object/SkinnedMesh';
import { IRenderItem } from './WebGL/WebGLRenderLists';
import { LineLoop } from '../object/LineLoop';
import { Sprite } from '../object/Sprite';
import { VertexBuffer } from './WebGL/VertexBuffer';
import { MeshMaterial, RawMaterial } from '../materials/MaterialType';
import { ShaderMaterial } from '../materials/ShaderMaterial';
import { RawShaderMaterial } from '../materials/RawShaderMaterial';
import { Scene } from '../scene/Scene';

export interface IShaderSource {
    name: string;
    uniforms: any;
    vertexShader: string;
    fragmentShader: string;
}


export class WebGLRenderer extends BasicRenderer {
    public domElement: HTMLCanvasElement;

    // Current fram data
    private _currentFrame = new WebGLRenderframe();

    private _bufferRenderer: BufferRenderer;
    private _indexedBufferRenderer;

    private _rendererUtil: RendererUtil;

    // FIXME: The thrid parameters is not WebGLContextAttributes
    constructor(canvas: HTMLCanvasElement, contextType: string, attributes: WebGLContextAttributes) {
        super(canvas, contextType, attributes);
        this._initGLContext();
        this._rendererUtil = new RendererUtil(this);
    }

    get targetPixelRatio() {
        return this._currentFrame.renderTarget === null ? this._pixelRatio : 1;
    }

    get renderStates() {
        return this._renderStates;
    }

    get currentRenderState() {
        return this._currentFrame.renderState;
    }

    get currentMaterialId() {
        return this._currentFrame.materialId;
    }

    set currentMaterialId(value) {
        this._currentFrame.materialId = value;
    }

    get currentCamera() {
        return this._currentFrame.camera;
    }

    set currentCamera(value) {
        this._currentFrame.camera = value;
    }


    set pixelRatio(value: number) {
        if (value === undefined) { return; }
        this._pixelRatio = value;
        this.setSize(this._width, this._height, false);
    }


    setSize(width: number, height: number, updateStyle: boolean) {
        // if (vr.isPresenting()) {
        //     console.warn(
        //         'THREE.WebGLRenderer: Can\'t change size while VR device is presenting.');
        //     return;
        // }

        this._width = width;
        this._height = height;

        this._canvas.width = width * this._pixelRatio;
        this._canvas.height = height * this._pixelRatio;

        if (updateStyle !== false) {
            this._canvas.style.width = width + 'px';
            this._canvas.style.height = height + 'px';
        }

        this.setViewport(0, 0, width, height);
    }

    setDrawingBufferSize(width: number, height: number, pixelRatio: number) {
        this._width = width;
        this._height = height;
        this._pixelRatio = pixelRatio;
        this._canvas.width = width * pixelRatio;
        this._canvas.height = height * pixelRatio;
        this.setViewport(0, 0, width, height);
    }

    getCurrentViewport() {
        return this._currentFrame.viewport;
    }

    setViewport(x: number, y: number, width: number, height: number) {
        this._viewport.setAll( x, this._height - y - height, width, height );
        this._state.viewport( this._currentFrame.viewport.copy( this._viewport ).multiplyScalar( this._pixelRatio ));
    }

    setScissor(x: number, y: number, width: number, height: number) {
        this._scissor.setAll(x, this._height - y - height, width, height);
        this._state.scissor(this._currentFrame.scissor.copy(this._scissor).multiplyScalar(this._pixelRatio));
    }

    get renderTarget() {
        return this._currentFrame.renderTarget;
    }

    set renderTarget(renderTarget: WebGLRenderTarget | WebGLRenderTargetCube) {
        this._currentFrame.renderTarget = renderTarget;
        const properties = this._properties;

        if (renderTarget &&
            properties.get(renderTarget).__webglFramebuffer === undefined) {
            this._textures.setupRenderTarget(renderTarget);
        }

        let framebuffer = this._frameBuffer;
        let isCube = false;

        if (renderTarget) {
            const __webglFramebuffer =
                properties.get(renderTarget).__webglFramebuffer;

            if (renderTarget instanceof WebGLRenderTargetCube) {
                framebuffer = __webglFramebuffer[renderTarget.activeCubeFace];
                isCube = true;
            } else {
                framebuffer = __webglFramebuffer;
            }

            this._currentFrame.viewport.copy(renderTarget.viewport);
            this._currentFrame.scissor.copy(renderTarget.scissor);
            this._currentFrame.scissorTest = renderTarget.scissorTest;
        } else {
            this._currentFrame.viewport.copy(this._viewport).multiplyScalar(this._pixelRatio);
            this._currentFrame.scissor.copy(this._scissor).multiplyScalar(this._pixelRatio);
            this._currentFrame.scissorTest = this._scissorTest;
        }

        const _gl = this._gl;
        if (this._currentFrame.framebuffer !== framebuffer) {
            _gl.bindFramebuffer(_gl.FRAMEBUFFER, framebuffer);
            this._currentFrame.framebuffer = framebuffer;
        }

        const state = this._state;
        state.viewport(this._currentFrame.viewport);
        state.scissor(this._currentFrame.scissor);
        state.setScissorTest(this._currentFrame.scissorTest);

        if (isCube) {
            const cubeTrget = renderTarget as WebGLRenderTargetCube;
            const textureProperties = properties.get(cubeTrget.texture);
            _gl.framebufferTexture2D(
                _gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0,
                _gl.TEXTURE_CUBE_MAP_POSITIVE_X + cubeTrget.activeCubeFace,
                textureProperties.__webglTexture, cubeTrget.activeMipMapLevel);
        }
    }

    readRenderTargetPixels(renderTarget, x, y, width, height, buffer) {
        if (!(renderTarget && renderTarget.isWebGLRenderTarget)) {
            console.error(
                'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.');
            return;
        }
        const properties = this._properties;
        const _gl = this._gl;
        const capabilities = this._capabilities;
        const extensions = this._extensions;
        const framebuffer = properties.get(renderTarget).__webglFramebuffer;

        if (framebuffer) {
            let restore = false;

            if (framebuffer !== this._currentFrame.framebuffer) {
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, framebuffer);

                restore = true;
            }

            try {
                const texture = renderTarget.texture;
                const textureFormat = texture.format;
                const textureType = texture.type;

                if (textureFormat !== TextureFormat.RGBA &&
                    this._utils.convert(textureFormat) !==
                    _gl.getParameter(_gl.IMPLEMENTATION_COLOR_READ_FORMAT)) {
                    console.error(
                        'THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.');
                    return;
                }

                if (textureType !== TextureType.UnsignedByte &&
                    this._utils.convert(textureType) !==
                    _gl.getParameter(
                        _gl.IMPLEMENTATION_COLOR_READ_TYPE) &&  // IE11, Edge and
                    // Chrome Mac < 52
                    // (#9513)
                    !(textureType === TextureType.Float &&
                        (capabilities.isWebGL2 || extensions.get('OES_texture_float') ||
                            extensions.get(
                                'WEBGL_color_buffer_float'))) &&  // Chrome Mac >= 52 and
                    // Firefox
                    !(textureType === TextureType.HalfFloat &&
                        (capabilities.isWebGL2 ?
                            extensions.get('EXT_color_buffer_float') :
                            extensions.get('EXT_color_buffer_half_float')))) {
                    console.error(
                        `THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType
                        or implementation defined type.`);
                    return;
                }

                if (_gl.checkFramebufferStatus(_gl.FRAMEBUFFER) ===
                    _gl.FRAMEBUFFER_COMPLETE) {
                    // the following if statement ensures valid read requests (no
                    // out-of-bounds pixels, see #8604)

                    if ((x >= 0 && x <= (renderTarget.width - width)) &&
                        (y >= 0 && y <= (renderTarget.height - height))) {
                        _gl.readPixels(
                            x, y, width, height, this._utils.convert(textureFormat),
                            this._utils.convert(textureType), buffer);
                    }

                } else {
                    console.error(
                        'THREE.WebGLRenderer.readRenderTargetPixels: readPixels from renderTarget failed. Framebuffer not complete.');
                }

            } finally {
                if (restore) {
                    _gl.bindFramebuffer(_gl.FRAMEBUFFER, this._currentFrame.framebuffer);
                }
            }
        }
    }

    onMaterialDispose() {
        super.onMaterialDispose();
    }

    // Buffer rendering
    // private renderObjectImmediate(object, program) {
    //     object.render((object) => {
    //         this.renderBufferImmediate(object, program);
    //     });
    // }

    // public renderBufferImmediate(object, program) {
    //     const _gl = this._gl;
    //     const state = this._state;
    //     const properties = this._properties;
    //     const buffers = properties.get( object );

    //     state.attribute.init();
    //     if (object.hasPositions && !buffers.position) { buffers.position = _gl.createBuffer(); }
    //     if (object.hasNormals && !buffers.normal) { buffers.normal = _gl.createBuffer(); }
    //     if (object.hasUvs && !buffers.uv) { buffers.uv = _gl.createBuffer(); }
    //     if (object.hasColors && !buffers.color) { buffers.color = _gl.createBuffer(); }

    //     const programAttributes = program.getAttributes();

    //     if (object.hasPositions) {
    //         _gl.bindBuffer(_gl.ARRAY_BUFFER, buffers.position);
    //         _gl.bufferData(
    //             _gl.ARRAY_BUFFER, object.positionArray, _gl.DYNAMIC_DRAW);

    //         state.attribute.enable(programAttributes.position);
    //         _gl.vertexAttribPointer(
    //             programAttributes.position, 3, _gl.FLOAT, false, 0, 0);
    //     }

    //     if (object.hasNormals) {
    //         _gl.bindBuffer(_gl.ARRAY_BUFFER, buffers.normal);
    //         _gl.bufferData(
    //             _gl.ARRAY_BUFFER, object.normalArray, _gl.DYNAMIC_DRAW);

    //         state.attribute.enable(programAttributes.normal);
    //         _gl.vertexAttribPointer(
    //             programAttributes.normal, 3, _gl.FLOAT, false, 0, 0);
    //     }

    //     if (object.hasUvs) {
    //         _gl.bindBuffer(_gl.ARRAY_BUFFER, buffers.uv);
    //         _gl.bufferData(_gl.ARRAY_BUFFER, object.uvArray, _gl.DYNAMIC_DRAW);

    //         state.attribute.enable(programAttributes.uv);
    //         _gl.vertexAttribPointer(
    //             programAttributes.uv, 2, _gl.FLOAT, false, 0, 0);
    //     }

    //     if (object.hasColors) {
    //         _gl.bindBuffer(_gl.ARRAY_BUFFER, buffers.color);
    //         _gl.bufferData(_gl.ARRAY_BUFFER, object.colorArray, _gl.DYNAMIC_DRAW);

    //         state.attribute.enable(programAttributes.color);
    //         _gl.vertexAttribPointer(
    //             programAttributes.color, 3, _gl.FLOAT, false, 0, 0);
    //     }

    //     state.attribute.disable();

    //     _gl.drawArrays(_gl.TRIANGLES, 0, object.count);

    //     object.count = 0;
    // }

    private _setMeshRenderMode(material, object: Mesh) {
        const renderer = this._bufferRenderer;
        const gl = this._gl;
        if (material.wireframe === true) {
            this._state.setLineWidth(material.wireframeLinewidth * this.targetPixelRatio);
            this._bufferRenderer.mode = this._gl.LINES;

          } else {
            switch (object.drawMode) {
              case DrawMode.Triangles:
                renderer.mode = gl.TRIANGLES;
                break;

              case DrawMode.TriangleStrip:
                renderer.mode = gl.TRIANGLE_STRIP;
                break;

              case DrawMode.TriangleFan:
                renderer.mode = gl.TRIANGLE_FAN;
                break;
            }
          }
    }

    private _setLineRenderMode(material, object: Line) {
        const renderer = this._bufferRenderer;
        const gl = this._gl;
        let lineWidth = material.linewidth;

        if (lineWidth === undefined) {
          lineWidth = 1;
        }  // Not using Line*Material

        this._state.setLineWidth(lineWidth * this.targetPixelRatio);

        if (object instanceof LineSegments) {
          renderer.mode = gl.LINES;
        } else if (object instanceof LineLoop) {
          renderer.mode = gl.LINE_LOOP;
        } else {
          renderer.mode = gl.LINE_STRIP;
        }
    }

    renderBufferDirect(
        camera: Camera, fog: Fog, geometry: BufferGeometryType,
        material: Material, object: DrawableType, group) {
      const state = this._state;

      // check face culling
      const frontFaceCW = (object instanceof Mesh && object.normalMatrix.determinant() < 0);
      state.setMaterial(material, frontFaceCW);
      const program = this.setProgram(camera, fog, material, object);
      let updateBuffers = false;

      const currentFrame = this._currentFrame;
    //   const _currentGeometryProgram = this._currentFrame.geometryProgram;
      const morphtargets = this._morphtargets;

      let wireframe: boolean;
      if (material.hasOwnProperty('wireframe')) {
          const meshMaterial = material as MeshMaterial;
          wireframe = meshMaterial.wireframe;
      }

      // Check update
      if (currentFrame.geometryId !== geometry.id ||
          currentFrame.programId !== program.id ||
          currentFrame.wireframe !== (wireframe === true)) {
        currentFrame.geometryId = geometry.id;
        currentFrame.programId = program.id;
        currentFrame.wireframe = wireframe === true;
        updateBuffers = true;
      }

      if (object instanceof Mesh && object.morphTargetInfluences) {
        morphtargets.update(object, geometry, material, program);
        updateBuffers = true;
      }

      let index = geometry.index;
      const position = geometry.attributes.position;
      let rangeFactor = 1;

      if (wireframe === true) {
        index = this._geometries.getWireframeAttribute(geometry as BufferGeometry);
        rangeFactor = 2;
      }

      let vertexBuffer: VertexBuffer;
      let renderer = this._bufferRenderer;
      const _gl = this._gl;

      if (index !== null) {
        vertexBuffer = this._attributes.get(index);
        renderer = this._indexedBufferRenderer;
        renderer.setIndex(vertexBuffer);
      }

      if (updateBuffers) {
        this.setupVertexAttributes(material, program, geometry);
        if (index !== null) {
          _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, vertexBuffer.webglBuffer);
        }
      }

      // setRenderMode for several kinds of object
      if (object instanceof Mesh) {
          this._setMeshRenderMode(material, object);
      } else if (object instanceof Line) {
          this._setLineRenderMode(material, object);
      } else if (object instanceof Points) {
          renderer.mode = _gl.POINTS;
      } else if (object instanceof Sprite) {
          renderer.mode = _gl.TRIANGLES;
      }

      let dataCount = Infinity;

      if (index !== null) {
        dataCount = index.count;
      } else if (position !== undefined) {
        dataCount = position.count;
      }

      const rangeStart = geometry.drawRange.start * rangeFactor;
      const rangeCount = geometry.drawRange.count * rangeFactor;

      const groupStart = group !== null ? group.start * rangeFactor : 0;
      const groupCount = group !== null ? group.count * rangeFactor : Infinity;

      const drawStart = Math.max(rangeStart, groupStart);
      const drawEnd =
          Math.min(
              dataCount, rangeStart + rangeCount, groupStart + groupCount) -
          1;
      const drawCount = Math.max(0, drawEnd - drawStart + 1);
      if (drawCount === 0) {
        return;
      }

      if (geometry && geometry instanceof InstancedBufferGeometry) {
          if (geometry.maxInstancedCount > 0) {
              renderer.renderInstances(geometry, drawStart, drawCount);
          }
      } else {
          renderer.render(drawStart, drawCount);
      }
    }

    _initGLContext() {
        super._initGLContext();
        this._programCache = new WebGLPrograms(this, this._extensions, this._capabilities );
        this._info.programs = this._programCache.programs;
        this._bufferRenderer = new BufferRenderer(this._gl, this._extensions, this._info, this._capabilities);
        this._state.scissor(this._currentFrame.scissor.copy(this._scissor)
            .multiplyScalar(this._pixelRatio));
        this._state.viewport(this._currentFrame.viewport.copy(this._viewport)
            .multiplyScalar(this._pixelRatio));
    }

    // initialize shader source string
    private _initShader(material: Material, shaderID: string): IShaderSource {
        if (shaderID) {
            // for a predefined shader
            const shader = ShaderLib[shaderID];

            return {
                name: material.type,
                uniforms: cloneUniforms(shader.uniforms),
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader
            };

        } else {
            // for ShaderMaterial?
            const rawMaterial = material as RawMaterial;
            return {
                name: material.type,
                uniforms: rawMaterial.uniforms,
                vertexShader: rawMaterial.vertexShader,
                fragmentShader: rawMaterial.fragmentShader
            };
        }
    }

    private _initClipping(materialProperties, material: RawMaterial) {
        const uniforms: string = materialProperties.shader.uniforms;

        if (!(material instanceof ShaderMaterial) &&
            !(material instanceof RawShaderMaterial) ||
            material.clipping === true) {
            const clipping = this._clipping;
            materialProperties.numClippingPlanes = clipping.numPlanes;
            materialProperties.numIntersection = clipping.numIntersection;
            uniforms.clippingPlanes = clipping.uniform;
        }
        return uniforms;
    }

    initMaterial(material: Material, fog: Fog, object: Object3D) {
        const materialProperties = this._getMaterialPrperties(material);
        let lightsHash = materialProperties.lightsHash;

        let program: ShaderProgram = materialProperties.program;
        let programChange = true;

        // Current rederer state
        const lights = this._currentFrame.renderState.state.lights;
        const shadowsArray = this._currentFrame.renderState.state.shadowsArray;
        const lightsStateHash = lights.state.hash;
        const lightsState = lights.state;

        const parameters = this._programCache.getParameters(
            material, lightsState, shadowsArray, fog, this._clipping.numPlanes,
            this._clipping.numIntersection, object);

        let code = this._programCache.getProgramCode(material, parameters);


        if (program === undefined) {
            // new material
            material.addEventListener('dispose', this.onMaterialDispose);
        } else if (program.code !== code) {
            // changed glsl or parameters
            this._releaseMaterialProgramReference(material);
        } else if (
            lightsHash.stateID !== lightsStateHash.stateID ||
            lightsHash.directionalLength !==
            lightsStateHash.directionalLength ||
            lightsHash.pointLength !== lightsStateHash.pointLength ||
            lightsHash.spotLength !== lightsStateHash.spotLength ||
            lightsHash.rectAreaLength !== lightsStateHash.rectAreaLength ||
            lightsHash.hemiLength !== lightsStateHash.hemiLength ||
            lightsHash.shadowsLength !== lightsStateHash.shadowsLength) {
            lightsHash.stateID = lightsStateHash.stateID;
            lightsHash.directionalLength = lightsStateHash.directionalLength;
            lightsHash.pointLength = lightsStateHash.pointLength;
            lightsHash.spotLength = lightsStateHash.spotLength;
            lightsHash.rectAreaLength = lightsStateHash.rectAreaLength;
            lightsHash.hemiLength = lightsStateHash.hemiLength;
            lightsHash.shadowsLength = lightsStateHash.shadowsLength;

            programChange = false;

        } else if (parameters.shaderID !== undefined) {
            // same glsl and uniform list
            return;

        } else {
            // only rebuild uniform list
            programChange = false;
        }

        if (programChange) {
            materialProperties.shader = this._initShader(material, parameters.shaderID );

            material.onBeforeCompile(materialProperties.shader, this);

            // Computing code again as onBeforeCompile may have changed the
            // shaders
            code = this._programCache.getProgramCode(material, parameters);

            program = this._programCache.acquireProgram(
                material, materialProperties.shader, parameters, code);

            materialProperties.program = program;
            material.program = program;
        }

        const programAttributes = program.attributes;

        // if (material.morphTargets) {
        //     material.numSupportedMorphTargets = 0;
        //     for (let i = 0; i < this._maxMorphTargets; i++) {
        //         if (programAttributes['morphTarget' + i] >= 0) {
        //             material.numSupportedMorphTargets++;
        //         }
        //     }
        // }

        // if (material.morphNormals) {
        //     material.numSupportedMorphNormals = 0;

        //     for (let i = 0; i < this._maxMorphNormals; i++) {
        //         if (programAttributes['morphNormal' + i] >= 0) {
        //             material.numSupportedMorphNormals++;
        //         }
        //     }
        // }

        const uniforms = this._initClipping(materialProperties, material as RawMaterial);

        materialProperties.fog = fog;

        // store the light setup it was created for
        if (lightsHash === undefined) {
            materialProperties.lightsHash = lightsHash = {};
        }

        lightsHash.stateID = lightsStateHash.stateID;
        lightsHash.directionalLength = lightsStateHash.directionalLength;
        lightsHash.pointLength = lightsStateHash.pointLength;
        lightsHash.spotLength = lightsStateHash.spotLength;
        lightsHash.rectAreaLength = lightsStateHash.rectAreaLength;
        lightsHash.hemiLength = lightsStateHash.hemiLength;
        lightsHash.shadowsLength = lightsStateHash.shadowsLength;

        if (material.lights) {
            // wire up the material to this renderer's lighting state
            uniforms.ambientLightColor.value = lights.state.ambient;
            uniforms.directionalLights.value = lights.state.directional;
            uniforms.spotLights.value = lights.state.spot;
            uniforms.rectAreaLights.value = lights.state.rectArea;
            uniforms.pointLights.value = lights.state.point;
            uniforms.hemisphereLights.value = lights.state.hemi;

            uniforms.directionalShadowMap.value =
                lights.state.directionalShadowMap;
            uniforms.directionalShadowMatrix.value =
                lights.state.directionalShadowMatrix;
            uniforms.spotShadowMap.value = lights.state.spotShadowMap;
            uniforms.spotShadowMatrix.value = lights.state.spotShadowMatrix;
            uniforms.pointShadowMap.value = lights.state.pointShadowMap;
            uniforms.pointShadowMatrix.value = lights.state.pointShadowMatrix;
            // TODO (abelnation): add area lights shadow info to uniforms
        }

        const progUniforms = materialProperties.program.getUniforms();
        const uniformsList = WebGLUniforms.seqWithValue(progUniforms.seq, uniforms);
        materialProperties.uniformsList = uniformsList;
    }

    // NOTE: No need at the moment
    // compile(scene, camera) {
    //     let currentRenderState = this._currentRenderState;
    //     currentRenderState = this._renderStates.get(scene, camera);
    //     currentRenderState.init();

    //     scene.traverse((object) => {
    //         if (object.isLight) {
    //             currentRenderState.pushLight(object);

    //             if (object.castShadow) {
    //                 currentRenderState.pushShadow(object);
    //             }
    //         }
    //     });

    //     currentRenderState.setupLights( camera );
    //     scene.traverse((object) => {
    //         if (object.material) {
    //             if (Array.isArray(object.material)) {
    //                 for (let i = 0; i < object.material.length; i++) {
    //                     this.initMaterial(object.material[i], scene.fog, object);
    //                 }

    //             } else {
    //                 this.initMaterial(object.material, scene.fog, object);
    //             }
    //         }
    //     });
    // }

    private _updateMipmap(renderTarget: WebGLRenderTarget) {
        // Generate mipmap if we're using any kind of mipmap filtering
        this._textures.updateRenderTargetMipmap(renderTarget);
    }

    render(scene: Scene, camera: Camera, renderTarget: WebGLRenderTarget, forceClear: boolean) {
        if (!(camera && camera instanceof Camera)) {
            console.error( 'THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.');
            return;
        }
        if (this._isContextLost) { return; }

        // init inner properties
        this._currentFrame.geometryId = null;
        this._currentFrame.programId = null;
        this._currentFrame.wireframe = false;
        // this._currentFrame.geometryProgram.geometry = null;
        // this._currentFrame.geometryProgram.program = null;
        // this._currentFrame.geometryProgram.wireframe = false;
        this._currentFrame.materialId = -1;
        this._currentFrame.camera = null;

        if (scene.autoUpdate === true) { scene.updateMatrixWorld(); }
        if (camera.parent === null) { camera.updateMatrixWorld(); }

        this._currentFrame.renderState = this._renderStates.get(scene, camera);
        this._currentFrame.renderState.init();

        scene.onBeforeRender(this, scene, camera, renderTarget);

        this._projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this._frustum.setFromMatrix(this._projScreenMatrix);

        this.localClippingEnabled = this.localClippingEnabled;
        this._clippingEnabled = this._clipping.init( this.clippingPlanes, this.localClippingEnabled, camera );

        this._currentFrame.renderList = this._renderLists.get(scene.id, camera.id);
        this._currentFrame.renderList.init();

        this._projectObject( scene, camera, this.sortObjects );

        if (this.sortObjects === true) { this._currentFrame.sortRenderList(); }

        // if ( _clippingEnabled ) _clipping.beginShadows();

        // const shadowsArray = currentRenderState.state.shadowsArray;
        // shadowMap.render(shadowsArray, scene, camera);

        this._currentFrame.setupLights(camera);

        // if (_clippingEnabled) { _clipping.endShadows(); }

        // if ( this.info.autoReset ) { this.info.reset(); }

        if (renderTarget === undefined) { renderTarget = null; }
        this.renderTarget = renderTarget;
        this._background.render(this._currentFrame.renderList, scene, camera, forceClear);

        // render scene
        this._renderScene(scene, camera);

        if (renderTarget) { this._updateMipmap(renderTarget); }

        // Ensure depth buffer writing is enabled so it can be cleared on next render
        this._state.buffers.depth.setTest(true);
        this._state.buffers.depth.setMask(true);
        this._state.buffers.color.setMask(true);
        this._state.polygonOffset.set(false);

        scene.onAfterRender(this, scene, camera);

        // if (vr.enabled) { vr.submitFrame(); }

        // _gl.finish();

        this._currentFrame.renderList = null;
        this._currentFrame.renderState = null;
    }

    private _renderScene(scene: Scene, camera: Camera) {
        const opaqueObjects = this._currentFrame.opaque;
        const transparentObjects = this._currentFrame.transparent;
        if (scene.overrideMaterial) {
            const overrideMaterial = scene.overrideMaterial;
            if (opaqueObjects.length) {
                this._renderObjects(opaqueObjects, scene, camera, overrideMaterial);
            }
            if (transparentObjects.length) {
                this._renderObjects(transparentObjects, scene, camera, overrideMaterial);
            }
        } else {
            // opaque pass (front-to-back order)
            if (opaqueObjects.length) {
                this._renderObjects(opaqueObjects, scene, camera);
            }
            // transparent pass (back-to-front order)
            if (transparentObjects.length) {
                this._renderObjects(transparentObjects, scene, camera);
            }
        }
    }

    private _storeLight(light: Light) {
        this._currentFrame.pushLight(light);
    }

    private _projectObject(object: Object3D, camera: Camera, sortObjects: boolean) {
        if (object.visible === false) { return; }

        const visible = object.layers.test(camera.layers);

        if (visible) {
            if (object instanceof Light) {
                this._storeLight(object);

            // TODO: no need for the time being
            // else if (object.isSprite) {
            //     if (!object.frustumCulled || this._frustum.intersectsSprite(object)) {
            //         if (sortObjects) {
            //           this._vector3.setFromMatrixPosition(object.matrixWorld)
            //               .applyMatrix4(this._projScreenMatrix);
            //         }

            //         const geometry = objects.update(object);
            //         const material = object.material;

            //         this._currentRenderList.push(object, geometry, material, this._vector3.z, null);
            //     }

            // } else if (object.isImmediateRenderObject) {
            //     if (sortObjects) {
            //         this._vector3.setFromMatrixPosition(object.matrixWorld)
            //             .applyMatrix4(this._projScreenMatrix);
            //     }

            //     this._currentRenderList.push(
            //         object, null, object.material, this._vector3.z, null);

            // }

            } else if (object instanceof Mesh || object instanceof Line || object instanceof Points) {
                if (object instanceof SkinnedMesh) {
                    object.skeleton.update();
                }

                if (!object.frustumCulled || this._frustum.intersectsObject(object)) {
                    if (sortObjects) {
                        this._vector3.setFromMatrixPosition(object.matrixWorld)
                            .applyMatrix4(this._projScreenMatrix);
                    }

                    const geometry = this._objects.update(object);
                    const material = object.material;

                    if (Array.isArray(material)) {
                        const groups = geometry.groups;

                        for (let i = 0, l = groups.length; i < l; i++) {
                            const group = groups[i];
                            const groupMaterial = material[group.materialIndex];

                            if (groupMaterial && groupMaterial.visible) {
                                this._currentFrame.renderList.push(
                                    object, geometry, groupMaterial, this._vector3.z, group);
                            }
                        }

                    } else if (material.visible) {
                        this._currentFrame.renderList.push(object, geometry, material, this._vector3.z, null);
                    }
                }
            }
        }

        const children = object.children;
        for (let i = 0, l = children.length; i < l; i++) {
            this._projectObject(children[i], camera, sortObjects);
        }
    }

    private _updateRenderState(scene: Scene, camera: Camera) {
        // Update render state
        this._currentFrame.renderState = this._renderStates.get(scene, this._currentFrame.arrayCamera || camera);
    }

    private _renderObjects(renderList: IRenderItem[], scene: Scene, camera: Camera, overrideMaterial?: Material) {
        for (let i = 0, l = renderList.length; i < l; i++) {
            const renderItem = renderList[i];

            const object = renderItem.object;
            const geometry = renderItem.geometry;
            const material = overrideMaterial === undefined ?
                renderItem.material : overrideMaterial;
            const group = renderItem.group;

            // NOTE: No support for array camera at the  moment
            this._currentFrame.arrayCamera = null;
            this._renderObject(object, scene, camera, geometry, material, group);

            // TODO: Comment out the following code after implmenting ArrayCamera
            // if (camera.isArrayCamera) {
                // _currentArrayCamera = camera;

                // const cameras = camera.cameras;

                // for (let j = 0, jl = cameras.length; j < jl; j++) {
                //     const camera2 = cameras[j];

                //     if (object.layers.test(camera2.layers)) {
                //         if ('viewport' in camera2) {  // XR

                //             state.viewport(_currentViewport.copy(camera2.viewport));

                //         } else {
                //             const bounds = camera2.bounds;

                //             const x = bounds.x * _width;
                //             const y = bounds.y * _height;
                //             const width = bounds.z * _width;
                //             const height = bounds.w * _height;

                //             state.viewport(_currentViewport.set(x, y, width, height)
                //                 .multiplyScalar(_pixelRatio));
                //         }

                //         currentRenderState.setupLights(camera2);

                //         renderObject(object, scene, camera2, geometry, material, group);
                //     }
                // }

            // } else {
            //     this._currentArrayCamera = null;
            //     this._renderObject(object, scene, camera, geometry, material, group);
            // }


        }
    }

    private _renderObject(
        object: DrawableType, scene: Scene, camera: Camera,
        geometry: BufferGeometry, material: Material, group) {
      object.onBeforeRender(this, scene, camera, geometry, material, group);
      this._currentFrame.renderState = this._renderStates.get(
          scene, this._currentFrame.arrayCamera || camera);

      object.modelViewMatrix.multiplyMatrices(
          camera.matrixWorldInverse, object.matrixWorld);
      object.normalMatrix.getNormalMatrix(object.modelViewMatrix);

      // NOTE: No support ImmediateRenderObject
      this.renderBufferDirect(
          camera, scene.fog, geometry, material, object, group);

      // TODO: Comment out after implementing ImmediateRenderObject
      // if (object.isImmediateRenderObject) {
      // state.setMaterial(material);

      // const program = setProgram(camera, scene.fog, material, object);

      // this._currentGeometryProgram.geometry = null;
      // this._currentGeometryProgram.program = null;
      // this._currentGeometryProgram.wireframe = false;

      // renderObjectImmediate(object, program);

      // } else {
      //     this._renderBufferDirect(camera, scene.fog, geometry, material,
      //     object, group);
      // }

      object.onAfterRender(this, scene, camera, geometry, material, group);

      this._updateRenderState(scene, camera);
    }

    private _getMaterialPrperties(material) {
        return this._properties.get(material);
    }

    private  _checkMaterialNeedsUpdate(material, fog, object) {
        const materialProperties = this._getMaterialPrperties(material);
        const lights = this._currentFrame.renderState.state.lights;

        const lightsHash = materialProperties.lightsHash;
        const lightsStateHash = lights.state.hash;

        if (material.needsUpdate === false) {
            if (materialProperties.program === undefined) {
                material.needsUpdate = true;
            } else if (material.fog && materialProperties.fog !== fog) {
                material.needsUpdate = true;
            } else if (material.lights &&
                (lightsHash.stateID !== lightsStateHash.stateID ||
                    lightsHash.directionalLength !==
                    lightsStateHash.directionalLength ||
                    lightsHash.pointLength !== lightsStateHash.pointLength ||
                    lightsHash.spotLength !== lightsStateHash.spotLength ||
                    lightsHash.rectAreaLength !== lightsStateHash.rectAreaLength ||
                    lightsHash.hemiLength !== lightsStateHash.hemiLength ||
                    lightsHash.shadowsLength !== lightsStateHash.shadowsLength)) {
                material.needsUpdate = true;

            } else if (
                materialProperties.numClippingPlanes !== undefined &&
                (materialProperties.numClippingPlanes !== this._clipping.numPlanes ||
                    materialProperties.numIntersection !==
                    this._clipping.numIntersection)) {
                material.needsUpdate = true;
            }
        }

        if (material.needsUpdate) {
            this.initMaterial(material, fog, object);
            material.needsUpdate = false;
        }

        return materialProperties;
    }

     setProgram(camera, fog: Fog, material, object ) {
        this._usedTextureUnits = 0;

        const materialProperties = this._checkMaterialNeedsUpdate(material, fog, object);

        let refreshProgram = false;
        let refreshMaterial = false;
        let refreshLights = false;

        const program: ShaderProgram = materialProperties.program;
        const webglProgram: WebGLProgram = program.program;

        // program is updated
        if (this._state.program.use(webglProgram)) {
            refreshProgram = true;
            refreshMaterial = true;
            refreshLights = true;
        }

        // material is changed
        if (material.id !== this._currentFrame.materialId) {
            this._currentFrame.materialId = material.id;
            refreshMaterial = true;
        }

        // program uniforms
        const p_uniforms = program.uniforms;
        // material uniforms
        const m_uniforms = materialProperties.shader.uniforms;

        const gl = this._gl;
        if (refreshProgram || this._currentFrame.camera !== camera) {
            p_uniforms.setValue(gl, 'projectionMatrix', camera.projectionMatrix);

            if (this._capabilities.logarithmicDepthBuffer) {
                p_uniforms.setValue(
                    gl, 'logDepthBufFC',
                    2.0 / (Math.log(camera.far + 1.0) / Math.LN2));
            }

            if (this._currentFrame.camera !== camera) {
                this._currentFrame.camera = camera;
                // lighting uniforms depend on the camera so enforce an update
                // now, in case this material supports lights - or later, when
                // the next material that does gets activated:
                refreshMaterial = true;  // set to true on material change
                refreshLights = true;    // remains set until update done
            }

            // load material specific uniforms
            // (shader material also gets them for the sake of genericity)
            if (material.isShaderMaterial ||
                material.isMeshPhongMaterial ||
                material.isMeshStandardMaterial ||
                material.envMap) {
                const uCamPos = p_uniforms.map.cameraPosition;

                if (uCamPos !== undefined) {
                    uCamPos.setValue(
                        gl,
                        this._vector3.setFromMatrixPosition(camera.matrixWorld));
                }
            }

            if (material.isMeshPhongMaterial ||
                material.isMeshLambertMaterial ||
                material.isMeshBasicMaterial ||
                material.isMeshStandardMaterial ||
                material.isShaderMaterial ||
                material.skinning) {
                p_uniforms.setValue(gl, 'viewMatrix', camera.matrixWorldInverse);
            }
        }

        if (material.skinning) {
            p_uniforms.setOptional(gl, object, 'bindMatrix');
            p_uniforms.setOptional(gl, object, 'bindMatrixInverse');

            const skeleton = object.skeleton;
            const refresher = this._rendererUtil;

            if (skeleton) {
                const bones = skeleton.bones;

                if (this._capabilities.floatVertexTextures) {
                    if (skeleton.boneTexture === undefined) {
                        // layout (1 matrix = 4 pixels)
                        //      RGBA RGBA RGBA RGBA (=> column1, column2, column3,
                        //      column4)
                        //  with  8x8  pixel texture max   16 bones * 4 pixels =  (8 *
                        //  8)
                        //       16x16 pixel texture max   64 bones * 4 pixels = (16 *
                        //       16) 32x32 pixel texture max  256 bones * 4 pixels = (32
                        //       * 32) 64x64 pixel texture max 1024 bones * 4 pixels =
                        //       (64 * 64)

                        // 4 pixels needed for 1 matrix
                        let size = Math.sqrt(bones.length * 4);
                        size = MathUtil.ceilPowerOfTwo(size);
                        size = Math.max(size, 4);

                        // 4 floats per RGBA pixel
                        const boneMatrices = new Float32Array(size * size * 4);
                        boneMatrices.set(skeleton.boneMatrices);  // copy current values

                        const boneTexture = new DataTexture(boneMatrices, size, size, TextureFormat.RGBA, TextureType.Float);
                        boneTexture.needsUpdate = true;

                        skeleton.boneMatrices = boneMatrices;
                        skeleton.boneTexture = boneTexture;
                        skeleton.boneTextureSize = size;
                    }

                    p_uniforms.setValue(gl, 'boneTexture', skeleton.boneTexture);
                    p_uniforms.setValue(gl, 'boneTextureSize', skeleton.boneTextureSize);

                } else {
                    p_uniforms.setOptional(gl, skeleton, 'boneMatrices');
                }
            }

            if (refreshMaterial) {
                p_uniforms.setValue(gl, 'toneMappingExposure', this.toneMappingExposure);
                p_uniforms.setValue(gl, 'toneMappingWhitePoint', this.toneMappingWhitePoint);

                if (material.lights) {
                    // the current material requires lighting info

                    // note: all lighting uniforms are always set correctly
                    // they simply reference the renderer's state for their
                    // values
                    //
                    // use the current material's .needsUpdate flags to set
                    // the GL state when required

                    this.markUniformsLightsNeedsUpdate(m_uniforms, refreshLights);
                }

                // refresh uniforms common to several materials
                if (fog && material.fog) {
                    refresher.refreshUniformsFog(m_uniforms, fog);
                }

                if (material.isMeshBasicMaterial) {
                    refresher.refreshUniformsCommon(m_uniforms, material);

                } else if (material.isMeshLambertMaterial) {
                    refresher.refreshUniformsCommon(m_uniforms, material);
                    refresher.refreshUniformsLambert(m_uniforms, material);

                } else if (material.isMeshPhongMaterial) {
                    refresher.refreshUniformsCommon(m_uniforms, material);

                    if (material.isMeshToonMaterial) {
                        refresher.refreshUniformsToon(m_uniforms, material);

                    } else {
                        refresher.refreshUniformsPhong(m_uniforms, material);
                    }

                } else if (material.isMeshStandardMaterial) {
                    refresher.refreshUniformsCommon(m_uniforms, material);

                    if (material.isMeshPhysicalMaterial) {
                        refresher.refreshUniformsPhysical(m_uniforms, material);

                    } else {
                        refresher.refreshUniformsStandard(m_uniforms, material);
                    }

                } else if (material.isMeshMatcapMaterial) {
                    refresher.refreshUniformsCommon(m_uniforms, material);

                    refresher.refreshUniformsMatcap(m_uniforms, material);

                } else if (material.isMeshDepthMaterial) {
                    refresher.refreshUniformsCommon(m_uniforms, material);
                    refresher.refreshUniformsDepth(m_uniforms, material);

                } else if (material.isMeshDistanceMaterial) {
                    refresher.refreshUniformsCommon(m_uniforms, material);
                    refresher.refreshUniformsDistance(m_uniforms, material);

                } else if (material.isMeshNormalMaterial) {
                    refresher.refreshUniformsCommon(m_uniforms, material);
                    refresher.refreshUniformsNormal(m_uniforms, material);

                } else if (material.isLineBasicMaterial) {
                    refresher.refreshUniformsLine(m_uniforms, material);

                    if (material.isLineDashedMaterial) {
                        refresher.refreshUniformsDash(m_uniforms, material);
                    }

                } else if (material.isPointsMaterial) {
                    refresher.refreshUniformsPoints(m_uniforms, material);

                } else if (material.isSpriteMaterial) {
                    refresher.refreshUniformsSprites(m_uniforms, material);

                } else if (material.isShadowMaterial) {
                    m_uniforms.color.value = material.color;
                    m_uniforms.opacity.value = material.opacity;
                }

                // RectAreaLight Texture
                // TODO (mrdoob): Find a nicer implementation

                if (m_uniforms.ltc_1 !== undefined) {
                    m_uniforms.ltc_1.value = UniformsLib.LTC_1;
                }
                if (m_uniforms.ltc_2 !== undefined) {
                    m_uniforms.ltc_2.value = UniformsLib.LTC_2;
                }

                WebGLUniforms.upload(gl, materialProperties.uniformsList, m_uniforms, this);
            }

            if (material.isShaderMaterial &&
                material.uniformsNeedUpdate === true) {
                WebGLUniforms.upload(gl, materialProperties.uniformsList, m_uniforms, this);
                material.uniformsNeedUpdate = false;
            }

            if (material.isSpriteMaterial) {
                p_uniforms.setValue(gl, 'center', object.center);
            }

            p_uniforms.setValue(gl, 'modelViewMatrix', object.modelViewMatrix);
            p_uniforms.setValue(gl, 'normalMatrix', object.normalMatrix);
            p_uniforms.setValue(gl, 'modelMatrix', object.matrixWorld);

            return program;
        }
    }
}
