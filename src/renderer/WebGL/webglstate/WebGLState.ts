
import { WebGLCapabilities } from '../WebGLCapabilities';
import { WebGLExtensions } from '../WebGLExtensions';
import { WebGLUtils } from '../WebGLUtil';
import { ColorBufferState } from './ColorBufferState';
import { StencilBufferState } from './StencilBufferState';
import { DepthBufferState } from './DepthBufferState';
import { Vector4 } from 'src/app/cglib/math/Vector4';
import { DepthMode, MaterialBlendingMode, MaterialSide } from 'src/app/cglib/materials/constants';
import { CullFaceMode } from '../../constants';
import { Material } from 'src/app/cglib/materials/Material';
import { VertexAttributeState } from './VertexAttributeState';
import { TextureState } from './TextureState';
import { ProgramState } from './ProgtamState';
import { PolygonOffsetState } from './PolygonOffsetState';
import { LineWidthState } from './LineWidthState';
import { ScissorBox, ScissorState } from './ScissorState';
import { ViewPortState } from './ViewPortState';
import { FraceState } from './FraceState';
import { CompressedTextureState } from './CompressedTextureState';

/**
 * Keep WebGLRenderer.context state
 */
export class WebGLState {
    private _colorBuffer: ColorBufferState;
    private _stencilBuffer: StencilBufferState;
    private _depthBuffer: DepthBufferState;

    private _attribute: VertexAttributeState;
    private _texture: TextureState;
    private _compressdTexture: CompressedTextureState;
    private _program: ProgramState;

    private _polygonOffset: PolygonOffsetState;
    private _lineWidth: LineWidthState;

    private _scissor: ScissorState;
    private _viewPort: ViewPortState;
    private _face: FraceState;

    constructor(
        private _gl: WebGLRenderingContext, private _extensions: WebGLExtensions, private _utils: WebGLUtils,
        private _capabilities: WebGLCapabilities) {
            this._colorBuffer = new ColorBufferState(this._gl);
            this._colorBuffer.setClear( 0, 0, 0, 1 );
            this._stencilBuffer = new StencilBufferState(this._gl, this._capabilities);
            this._stencilBuffer.setClear( 0 );
            this._depthBuffer = new DepthBufferState(this._gl, this._capabilities);
            this._depthBuffer.setClear( 1 );
            this._capabilities.enable(this._gl.DEPTH_TEST );
            this._depthBuffer.setFunc(DepthMode.LessEqual);

            this._attribute = new VertexAttributeState(this._gl, this._extensions, this._capabilities);
            this._texture = new TextureState(this._gl, this._capabilities);
            this._texture.setBlending(MaterialBlendingMode.No);
            this._compressdTexture = new CompressedTextureState(this._gl, this._extensions);

            this._program = new ProgramState(this._gl);
            this._polygonOffset = new PolygonOffsetState(this._gl, this._capabilities);
            this._lineWidth = new LineWidthState(this._gl);
            this._scissor = new ScissorState(this._gl, this._capabilities);
            this._viewPort = new ViewPortState(this._gl);

            this._face = new FraceState(this._gl, this._capabilities);
            this._face.setWinding(false);
            this._face.setCulling(CullFaceMode.Back);
            this._capabilities.enable(this._gl.CULL_FACE);
    }

    get attribute(): VertexAttributeState {
        return this._attribute;
    }

    get texture(): TextureState {
        return this._texture;
    }

    get buffers() {
        return {
            color: this._colorBuffer,
            depth: this._depthBuffer,
            stencil: this._stencilBuffer,
        };
    }

    get polygonOffset() {
        return this._polygonOffset;
    }

    get program() {
        return this._program;
    }

    getCompressedTextureFormats() {
        return this._compressdTexture.getCompressedTextureFormats();
    }

    useProgram(program: WebGLProgram): boolean {
        return this._program.use(program);
    }

    setMaterial(material: Material, frontFaceCW: boolean) {
        material.side === MaterialSide.Double ? this._capabilities.disable(this._gl.CULL_FACE) :
            this._capabilities.enable(this._gl.CULL_FACE);

        let flipSided = (material.side === MaterialSide.Back);
        if (frontFaceCW) { flipSided = !flipSided; }

        this._face.setWinding(flipSided);

        (material.blending === MaterialBlendingMode.Normal && material.transparent === false) ?
            this._texture.setBlending(MaterialBlendingMode.No) :
            this._texture.setBlending(
                material.blending, material.blendEquation, material.blendSrc,
                material.blendDst, material.blendEquationAlpha,
                material.blendSrcAlpha, material.blendDstAlpha,
                material.premultipliedAlpha);

        this._depthBuffer.setFunc(material.depthFunc);
        this._depthBuffer.setTest(material.depthTest);
        this._depthBuffer.setMask(material.depthWrite);
        this._colorBuffer.setMask(material.colorWrite);

        this._polygonOffset.set(
            material.polygonOffset, material.polygonOffsetFactor,
            material.polygonOffsetUnits);
    }

    setFlipSided(flipSided: boolean) {
        this._face.setWinding(flipSided);
    }

    setCullFace(cullMode: CullFaceMode) {
        this._face.setCulling(cullMode);
    }

    setLineWidth(width: number) {
        this._lineWidth.set(width);
    }

    scissor(scissor: ScissorBox) {
        this._scissor.setScissorBox(scissor);
    }

    setScissorTest(scissorTest: boolean) {
        this._scissor.setScissorTest(scissorTest);
    }

    compressedTexImage2D(...args) {
        try {
            this._gl.compressedTexImage2D.apply(this._gl, args);
        } catch (error) {
            console.error('THREE.WebGLState:', error);
        }
    }

    texImage2D(...args) {
        try {
            this._gl.texImage2D.apply(this._gl, args);

        } catch (error) {
            console.error('THREE.WebGLState:', error);
        }
    }

    texImage3D(...args) {
        const context = this._gl as WebGL2RenderingContext;
        try {
            context.texImage3D.apply(context, args);

        } catch (error) {
            console.error('THREE.WebGLState:', error);
        }
    }

    viewport(viewport: Vector4) {
        this._viewPort.viewport = viewport;
    }

    reset() {
        this._attribute.reset();
        this._texture.reset();
        this._capabilities.resetEnables();

        this._compressdTexture.reset();
        this._program.reset();
        this._face.reset();

        // Reset buffer states
        this._colorBuffer.reset();
        this._depthBuffer.reset();
        this._stencilBuffer.reset();
    }
}
