import { WebGLExtensions } from './WebGL/WebGLExtensions';
import { WebGLCapabilities } from './WebGL/WebGLCapabilities';
import { getWebGLContext, WebGLUtils } from './WebGL/WebGLUtil';
import { WebGLContext, ToneMapping } from './constants';
import { WebGLState } from './WebGL/webglstate/WebGLState';
import { WebGLProperties } from './WebGL/WebGLProperties';
import { WebGLInfo } from './WebGL/WebGLInfo';
import { WebGLTextures } from './WebGL/WebGLTextures';
import { WebGLAttributes } from './WebGL/WebGLAttributes';
import { WebGLGeometries } from './WebGL/WebGLGeometries';
import { WebGLObjects } from './WebGL/WebGLObjects';
import { WebGLPrograms } from './shader/WebGLPrograms';
import { WebGLRenderLists } from './WebGL/WebGLRenderLists';
import { WebGLRenderStates } from './WebGL/WebGLRenderStates';
import { Vector4 } from '../math/Vector4';
import { WebGLAnimation } from './WebGL/WebGLAnimation';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { Frustum } from '../math/Frustum';
import { Plane } from '../math/Plane';
import { Texture } from '../texture/Texture';
import { WebGLRenderTarget } from './WebGLRenderTarget';
import { WebGLBackground } from './WebGL/WebGLBackground';
import { WebGLClipping } from './WebGL/WebGLClipping';
import { WebGLMorphtargets } from './WebGL/WebGLMorphtargets';
import { WebGLShadowMap } from './WebGL/WebGLShadowMap';

export class BasicRenderer {
    protected _extensions: WebGLExtensions;
    protected _capabilities: WebGLCapabilities;
    protected _state: WebGLState;

    protected _info: WebGLInfo;
    protected _utils: WebGLUtils;

    // sub objets properties
    protected _properties: WebGLProperties;
    protected _attributes: WebGLAttributes;
    protected _objects: WebGLObjects;
    protected _geometries: WebGLGeometries;
    protected _textures: WebGLTextures;
    protected _programCache: WebGLPrograms;

    protected _shadowMap: WebGLShadowMap;
    protected _morphtargets: WebGLMorphtargets;
    protected _background: WebGLBackground;
    protected _frameBuffer: WebGLFramebuffer = null;

    protected _renderLists: WebGLRenderLists;
    protected _renderStates: WebGLRenderStates;

    // clipping plane
    public clippingPlanes: Plane[];
    public localClippingEnabled = false;
    protected _clippingEnabled = false;
    protected _clipping = new WebGLClipping();

    public autoClear =  true;
    public autoClearColor =  true;
    public autoClearDepth =  true;
    public autoClearStencil =  true;

    // physically based shading
    public gammaFactor = 2.0;	// for backwards compatibility
    public gammaInput = false;
    public gammaOutput = false;

    // physical lights
    public physicallyCorrectLights = false;

    // tone mapping
    public toneMapping = ToneMapping.Linear;
    public toneMappingExposure = 1.0;
    public toneMappingWhitePoint = 1.0;

    // scene graph
    public sortObjects =  true;

    // morphs
    public maxMorphTargets = 8;
    public maxMorphNormals = 4;

    protected _contextAttributes: WebGLContextAttributes;
    protected _gl: WebGLContext;
    protected _canvas: HTMLCanvasElement;

    protected _isContextLost = false;
    private _animation = new WebGLAnimation();
    private _onAnimationFrameCallback = null;

    // Canvas Context
    protected _width: number;
    protected _height: number;
    protected _pixelRatio: number;
    protected _viewport: Vector4;


    protected _scissor: Vector4;
    protected _scissorTest = false;
    protected _frustum = new Frustum();

    protected _usedTextureUnits = 0;
    protected _projScreenMatrix = new Matrix4();
    protected _vector3 = new Vector3();

    constructor(canvas: HTMLCanvasElement, contextType: string, attributes) {
        this._gl = getWebGLContext(canvas, contextType, attributes);
        // TODO: folowing function would lose this
        canvas.addEventListener('webglcontextlost', this.onContextLost, false);
        canvas.addEventListener('webglcontextrestored', this.onContextRestore, false);
        this._canvas = canvas;
        this._width = canvas.width;
        this._height = canvas.height;
        this._viewport = new Vector4( 0, 0, canvas.width, canvas.height );
        this._scissor = new Vector4( 0, 0, canvas.width, canvas.height );

        // window.devicePixelRatio?
        this._pixelRatio = 1;
        this._shadowMap = new WebGLShadowMap(this, this._objects, this._capabilities.maxTextureSize );

        if ( typeof window !== 'undefined' ) { this._animation.context = window; }
        this._animation.setAnimationLoop( this.onAnimationFrame );
    }


    getContext() {
        return this._gl;
    }

    getContextAttributes(): WebGLContextAttributes {
        return this._gl.getContextAttributes();
    }

    /** Get a pixel ratio */
    getPixelRatio() {
        return this._pixelRatio;
    }

    /** Get canvas size */
    getSize() {
        return {
            width: this._width,
            height: this._height
        };
    }

    getDrawingBufferSize() {
        return {
            width: this._width * this._pixelRatio,
            height: this._height * this._pixelRatio
        };
    }

    get state() {
        return this._state;
    }

    get extensions() {
        return this._extensions;
    }

    get capabilities() {
        return this._capabilities;
    }

    get properties() {
        return this._properties;
    }

    get clipping() {
        return this._clipping;
    }

    get vector3() {
        return this._vector3;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    // Clearing
    getClearColor() {
        return this._background.getClearColor();
    }

    setClearColor(...args) {
        return this._background.setClearColor.apply( this._background, args );
    }

    getClearAlpha() {
        return this._background.getClearAlpha();
    }

    setClearAlpha(...args) {
        this._background.setClearAlpha.apply(this._background, args);
    }

    clear(color?: boolean, depth?: boolean, stencil?: boolean) {
        let bits = 0;
        if (color === undefined || color) { bits |= this._gl.COLOR_BUFFER_BIT; }
        if (depth === undefined || depth) { bits |= this._gl.DEPTH_BUFFER_BIT; }
        if (stencil === undefined || stencil) { bits |= this._gl.STENCIL_BUFFER_BIT; }
        this._gl.clear(bits);
    }

    clearColor() {
        this.clear( true, false, false );
    }

    clearDepth() {
        this.clear( false, true, false );
    }

    clearStencil() {
        this.clear( false, false, true );
    }

    set framebuffer(value: WebGLFramebuffer) {
        this._frameBuffer = value;
    }

    /** Set a texture unit number */
    setTextureUnits(value: number) {
        this._usedTextureUnits = value;
    }

    protected setScissorTest(value: boolean) {
        this._state.setScissorTest(value);
    }

    // event
    onContextLost(event: WebGLContextEvent) {
        event.preventDefault();
        console.log('THREE.WebGLRenderer: Context Lost.');
        this._isContextLost = true;
    }

    onContextRestore(/* event */) {
        console.log('THREE.WebGLRenderer: Context Restored.');
        this._isContextLost = false;
        this._initGLContext();
    }

    forceContextLoss() {
        const extension = this._extensions.get( 'WEBGL_lose_context' );
        if (extension) { extension.loseContext(); }
    }

    forceContextRestore() {
        const extension = this._extensions.get('WEBGL_lose_context');
        if (extension) { extension.restoreContext(); }
    }

    onAnimationFrame(time) {
        // if ( vr.isPresenting() ) return;
        if (this._onAnimationFrameCallback) { this._onAnimationFrameCallback(time); }
    }

    setAnimationLoop(callback) {
        this._onAnimationFrameCallback = callback;
        // vr.setAnimationLoop( callback );
        this._animation.start();
    }

    protected onMaterialDispose() {
        const material = event.target;
        material.removeEventListener( 'dispose', this.onMaterialDispose );
        this._deallocateMaterial(material);
    }

    protected _releaseMaterialProgramReference(material) {
        const programInfo = this._properties.get(material).program;
        material.program = undefined;
        if (programInfo !== undefined) {
            this._programCache.releaseProgram(programInfo);
        }
    }

    // Buffer deallocation
    protected _deallocateMaterial(material) {
        this._releaseMaterialProgramReference(material);
        this._properties.remove(material);
    }

    dispose() {
        this._canvas.removeEventListener('webglcontextlost', this.onContextLost, false);
        this._canvas.removeEventListener('webglcontextrestored', this.onContextRestore, false);

        this._renderLists.dispose();
        this._renderStates.dispose();
        this._properties.dispose();
        this._objects.dispose();

        // vr.dispose();
        this._animation.stop();
    }

    protected _initGLContext() {
        this._extensions = new WebGLExtensions(this._gl);

        this._capabilities =
            new WebGLCapabilities(this._gl, this._extensions, this._contextAttributes);

        if (!this._capabilities.isWebGL2) {
            this._extensions.get('WEBGL_depth_texture');
            this._extensions.get('OES_texture_float');
            this._extensions.get('OES_texture_half_float');
            this._extensions.get('OES_texture_half_float_linear');
            this._extensions.get('OES_standard_derivatives');
            this._extensions.get('OES_element_index_uint');
            this._extensions.get('ANGLE_instanced_arrays');
        }

        this._extensions.get('OES_texture_float_linear');
        this._utils = new WebGLUtils(this._gl, this._extensions, this._capabilities);

        this._state = new WebGLState(
            this._gl, this._extensions, this._utils, this._capabilities);

        this._info = new WebGLInfo(this._gl);
        this._properties = new WebGLProperties();
        this._textures = new WebGLTextures(
            this._gl, this._extensions, this._state, this._properties,
            this._capabilities, this._utils, this._info);
        this._attributes = new WebGLAttributes(this._gl);
        this._geometries = new WebGLGeometries(this._gl, this._attributes, this._info);
        this._objects = new WebGLObjects(this._geometries, this._info);
        this._renderLists = new WebGLRenderLists();
        this._renderStates = new WebGLRenderStates();

        this._background = new WebGLBackground(
            this, this._state, this._objects,
            this._contextAttributes.premultipliedAlpha);
    }

    setupVertexAttributes(material, program, geometry) {
        const extensions = this._extensions;
        const capabilities = this._capabilities;

        const state = this._state;

        if (geometry &&
            geometry.isInstancedBufferGeometry & +!this._capabilities.isWebGL2) {
          if (extensions.get('ANGLE_instanced_arrays') === null) {
            console.error(
                `THREE.WebGLRenderer.setupVertexAttributes: using THREE.InstancedBufferGeometry
                    but hardware does not support extension ANGLE_instanced_arrays.`);
            return;
          }
        }

        state.attribute.init();
        const _gl = this._gl;
        const attributes = this._attributes;
        const geometryAttributes = geometry.attributes;
        const programAttributes = program.getAttributes();
        const materialDefaultAttributeValues = material.defaultAttributeValues;

        for (const name of Object.keys(programAttributes)) {
            const programAttribute = programAttributes[name];

            if (programAttribute >= 0) {
                const geometryAttribute = geometryAttributes[name];

                if (geometryAttribute !== undefined) {
                    const normalized = geometryAttribute.normalized;
                    const size = geometryAttribute.itemSize;

                    const attribute = attributes.get(geometryAttribute);

                    // TODO Attribute may not be available on context restore

                    if (attribute === undefined) { continue; }

                    const buffer = attribute.webglBuffer;
                    const type = attribute.type;
                    const bytesPerElement = attribute.bytesPerElement;

                    if (geometryAttribute.isInterleavedBufferAttribute) {
                        const data = geometryAttribute.data;
                        const stride = data.stride;
                        const offset = geometryAttribute.offset;

                        if (data && data.isInstancedInterleavedBuffer) {
                            state.attribute.enableAndDivisor(
                                programAttribute, data.meshPerAttribute);

                            if (geometry.maxInstancedCount === undefined) {
                                geometry.maxInstancedCount =
                                    data.meshPerAttribute * data.count;
                            }

                        } else {
                            state.attribute.enable(programAttribute);
                        }

                        _gl.bindBuffer(_gl.ARRAY_BUFFER, buffer);
                        _gl.vertexAttribPointer(
                            programAttribute, size, type, normalized,
                            stride * bytesPerElement, offset * bytesPerElement);

                    } else {
                        if (geometryAttribute.isInstancedBufferAttribute) {
                            state.attribute.enableAndDivisor(
                                programAttribute, geometryAttribute.meshPerAttribute);

                            if (geometry.maxInstancedCount === undefined) {
                                geometry.maxInstancedCount =
                                    geometryAttribute.meshPerAttribute *
                                    geometryAttribute.count;
                            }

                        } else {
                            state.attribute.enable(programAttribute);
                        }

                        _gl.bindBuffer(_gl.ARRAY_BUFFER, buffer);
                        _gl.vertexAttribPointer(
                            programAttribute, size, type, normalized, 0, 0);
                    }

                } else if (materialDefaultAttributeValues !== undefined) {
                    const value = materialDefaultAttributeValues[name];

                    if (value !== undefined) {
                        switch (value.length) {
                            case 2:
                                _gl.vertexAttrib2fv(programAttribute, value);
                                break;

                            case 3:
                                _gl.vertexAttrib3fv(programAttribute, value);
                                break;

                            case 4:
                                _gl.vertexAttrib4fv(programAttribute, value);
                                break;

                            default:
                                _gl.vertexAttrib1fv(programAttribute, value);
                        }
                    }
                }
            }
        }

        state.attribute.disable();
    }

    markUniformsLightsNeedsUpdate(uniforms, value) {
        uniforms.ambientLightColor.needsUpdate = value;

        uniforms.directionalLights.needsUpdate = value;
        uniforms.pointLights.needsUpdate = value;
        uniforms.spotLights.needsUpdate = value;
        uniforms.rectAreaLights.needsUpdate = value;
        uniforms.hemisphereLights.needsUpdate = value;
    }


    /** Allocate a texture unit number to use */
    allocTextureUnit() {
        const textureUnit = this._usedTextureUnits;

        if (textureUnit >= this._capabilities.maxTextures) {
            console.warn(
                'THREE.WebGLRenderer: Trying to use ' + textureUnit +
                ' texture units while this GPU supports only ' +
                this._capabilities.maxTextures);
        }

        this._usedTextureUnits += 1;

        return textureUnit;
    }

    setTexture2D(texture: Texture | WebGLRenderTarget, slot) {
        let warned = false;
        let newTexture: Texture;
        if (texture && texture instanceof WebGLRenderTarget) {
            if (!warned) {
                console.warn(
                    'THREE.WebGLRenderer.setTexture2D: don\'t use render targets as textures. Use their .texture property instead.');
                warned = true;
            }

            newTexture = texture.texture;
        }
        newTexture = texture as Texture;

        this._textures.setTexture2D(newTexture, slot);
    }

    setTexture3D( texture, slot) {
        this._textures.setTexture3D( texture, slot );
    }

    setTexture( texture, slot ) {
        let warned = false;
        if (!warned) {
            console.warn(
                'THREE.WebGLRenderer: .setTexture is deprecated, use setTexture2D instead.');
            warned = true;
        }

        this._textures.setTexture2D(texture, slot);
    }

    setTextureCube(texture, slot ) {
        let warned = false;
        // backwards compatibility: peel texture.texture
        if (texture && texture.isWebGLRenderTargetCube) {
            if (!warned) {
                console.warn(
                    `THREE.WebGLRenderer.setTextureCube: don\'t use cube render targets as textures.
                    Use their .texture property instead.`);
                warned = true;
            }

            texture = texture.texture;
        }

        // currently relying on the fact that WebGLRenderTargetCube.texture is a
        // Texture and NOT a CubeTexture
        // TODO: unify these code paths
        if ((texture && texture.isCubeTexture) ||
            (Array.isArray(texture.image) && texture.image.length === 6)) {
            // CompressedTexture can have Array in image :/

            // this function alone should take care of cube textures
            this._textures.setTextureCube(texture, slot);

        } else {
            // assumed: texture property of THREE.WebGLRenderTargetCube
            this._textures.setTextureCubeDynamic(texture, slot);
        }
    }

    copyFramebufferToTexture(position, texture, level) {
        const width = texture.image.width;
        const height = texture.image.height;
        const glFormat = this._utils.convert(texture.format);
        this.setTexture2D(texture, 0);

        this._gl.copyTexImage2D(
            this._gl.TEXTURE_2D, level || 0, glFormat, position.x, position.y,
            width, height, 0);
    }

    copyTextureToTexture(position, srcTexture, dstTexture, level) {
        const width = srcTexture.image.width;
        const height = srcTexture.image.height;
        const glFormat = this._utils.convert(dstTexture.format);
        const glType = this._utils.convert(dstTexture.type);
        const _gl = this._gl;

        this.setTexture2D(dstTexture, 0);

        if (srcTexture.isDataTexture) {
            _gl.texSubImage2D(
                _gl.TEXTURE_2D, level || 0, position.x, position.y, width, height,
                glFormat, glType, srcTexture.image.data);

        } else {
            _gl.texSubImage2D(
                _gl.TEXTURE_2D, level || 0, position.x, position.y, glFormat,
                glType, srcTexture.image);
        }
    }
}
