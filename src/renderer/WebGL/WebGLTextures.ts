import { TextureFormat, TextureMinificationFilter, TextureType, TextureWrappingMode } from '../../texture/constants';
import { Texture } from '../../texture/Texture';
import { MathUtil } from '../../utils/MathUtil';
import { WebGLContext } from '../constants';

import { WebGLCapabilities } from './WebGLCapabilities';
import { WebGLExtensions } from './WebGLExtensions';
import { WebGLInfo } from './WebGLInfo';
import { WebGLProperties } from './WebGLProperties';
import { WebGLState } from './webglstate/WebGLState';
import { WebGLUtils } from './WebGLUtil';
import { WebGLRenderTarget } from '../WebGLRenderTarget';
import { WebGLRenderTargetCube } from '../WebGLRenderTargetCube';

const clampToMaxSize = (image, maxSize) => {
    if (image.width > maxSize || image.height > maxSize) {
        if ('data' in image) {
            console.warn(
                'THREE.WebGLRenderer: image in DataTexture is too big (' +
                image.width + 'x' + image.height + ').');
            return;
        }

        // Warning: Scaling through the canvas will only work with images that
        // use premultiplied alpha.

        const scale = maxSize / Math.max(image.width, image.height);

        const canvas =
            document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas') as
            HTMLCanvasElement;
        canvas.width = Math.floor(image.width * scale);
        canvas.height = Math.floor(image.height * scale);

        const context = canvas.getContext('2d');
        context.drawImage(
            image, 0, 0, image.width, image.height, 0, 0, canvas.width,
            canvas.height);

        console.warn(
            'THREE.WebGLRenderer: image is too big (' + image.width + 'x' +
            image.height + '). Resized to ' + canvas.width + 'x' + canvas.height);

        return canvas;
    }

    return image;
};

const isPowerOfTwo = (image): boolean => {
    return MathUtil.isPowerOfTwo(image.width) &&
        MathUtil.isPowerOfTwo(image.height);
};

const createCanvas = (): HTMLCanvasElement => {
    return document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas') as HTMLCanvasElement;
};

export class WebGLTextures {
    private _videoTextures = {};
    private _canvas;

    constructor(
        private _gl: WebGLContext, private _extensions: WebGLExtensions,
        private _state: WebGLState, private _properties: WebGLProperties,
        private _capabilities: WebGLCapabilities, private _utils: WebGLUtils,
        private _info: WebGLInfo) {}

    makePowerOfTwo(image) {
        if (image instanceof HTMLImageElement ||
            image instanceof HTMLCanvasElement || image instanceof ImageBitmap) {
            if (_canvas === undefined) {
                _canvas = createCanvas();
            }

            _canvas.width = MathUtil.floorPowerOfTwo(image.width);
            _canvas.height = MathUtil.floorPowerOfTwo(image.height);

            const context = _canvas.getContext('2d');
            context.drawImage(image, 0, 0, _canvas.width, _canvas.height);

            console.warn(
                'THREE.WebGLRenderer: image is not power of two (' + image.width +
                'x' + image.height + '). Resized to ' + _canvas.width + 'x' +
                _canvas.height);

            return _canvas;
        }

        return image;
    }

    textureNeedsPowerOfTwo(texture) {
        if (this._capabilities.isWebGL2) { return false; }

        return (texture.wrapS !== TextureWrappingMode.ClampToEdge ||
            texture.wrapT !== TextureWrappingMode.ClampToEdge) ||
            (texture.minFilter !== TextureMinificationFilter.Nearest &&
            texture.minFilter !==  TextureMinificationFilter.Linear);
    }

    textureNeedsGenerateMipmaps(texture: Texture, isPowerOfTwo: boolean) {
        return texture.generateMipmaps && isPowerOfTwo &&
            texture.minFilter !== TextureMinificationFilter.Nearest &&
            texture.minFilter !== TextureMinificationFilter.Linear;
    }

    generateMipmap(target: number, texture: Texture, width: number, height: number) {
        this._gl.generateMipmap(target);
        const textureProperties = this._properties.get(texture);

        // Note: Math.log( x ) * Math.LOG2E used instead of Math.log2( x ) which
        // is not supported by IE11
        textureProperties.__maxMipLevel =
            Math.log(Math.max(width, height)) * Math.LOG2E;
    }

    getInternalFormat(glFormat, glType) {
        if (!this._capabilities.isWebGL2) {
            return glFormat;
        }

        const _gl = this._gl as WebGL2RenderingContext;
        if (glFormat === _gl.RED) {
            if (glType === _gl.FLOAT) {
                return _gl.R32F;
            }
            if (glType === _gl.HALF_FLOAT) {
                return _gl.R16F;
            }
            if (glType === _gl.UNSIGNED_BYTE) {
                return _gl.R8;
            }
        }

        if (glFormat === _gl.RGB) {
            if (glType === _gl.FLOAT) {
                return _gl.RGB32F;
            }
            if (glType === _gl.HALF_FLOAT) {
                return _gl.RGB16F;
            }
            if (glType === _gl.UNSIGNED_BYTE) {
                return _gl.RGB8;
            }
        }

        if (glFormat === _gl.RGBA) {
            if (glType === _gl.FLOAT) {
                return _gl.RGBA32F;
            }
            if (glType === _gl.HALF_FLOAT) {
                return _gl.RGBA16F;
            }
            if (glType === _gl.UNSIGNED_BYTE) {
                return _gl.RGBA8;
            }
        }

        return glFormat;
    }

    filterFallback(f) {
        if (f === TextureMinificationFilter.Nearest ||
            f === TextureMinificationFilter.NearestMipMapNearest ||
            f === TextureMinificationFilter.NearestMipMapLinear) {
            return this._gl.NEAREST;
        }
        return this._gl.LINEAR;
    }

    onTextureDispose(event) {
        const texture = event.target;

        texture.removeEventListener('dispose', (event) => {
            this.onTextureDispose(event);
        });

        this.deallocateTexture(texture);

        if (texture.isVideoTexture) {
            delete this._videoTextures[texture.id];
        }

        this._info.memory.textures--;
    }

    onRenderTargetDispose(event) {
        const renderTarget = event.target;

        renderTarget.removeEventListener('dispose', (event) => {
            this.onRenderTargetDispose(event);
        });

        this.deallocateRenderTarget(renderTarget);

        this._info.memory.textures--;
    }

    deallocateTexture(texture: Texture) {
        const textureProperties = this._properties.get(texture);

        if (texture.image && textureProperties.__image__webglTextureCube) {
            // cube texture
            this._gl.deleteTexture(textureProperties.__image__webglTextureCube);
        } else {
            // 2D texture
            if (textureProperties.__webglInit === undefined) { return; }
            this._gl.deleteTexture(textureProperties.__webglTexture);
        }

        // remove all webgl properties
        this._properties.remove(texture);
    }

    deallocateRenderTarget(renderTarget) {
        const renderTargetProperties = this._properties.get(renderTarget);
        const textureProperties = this._properties.get(renderTarget.texture);

        if (!renderTarget) { return; }

        if (textureProperties.__webglTexture !== undefined) {
            this._gl.deleteTexture(textureProperties.__webglTexture);
        }

        if (renderTarget.depthTexture) {
            renderTarget.depthTexture.dispose();
        }

        if (renderTarget.isWebGLRenderTargetCube) {
            for (let i = 0; i < 6; i++) {
                this._gl.deleteFramebuffer(renderTargetProperties.__webglFramebuffer[i]);
                if (renderTargetProperties.__webglDepthbuffer) {
                    this._gl.deleteRenderbuffer(
                        renderTargetProperties.__webglDepthbuffer[i]);
                }
            }

        } else {
            this._gl.deleteFramebuffer(renderTargetProperties.__webglFramebuffer);
            if (renderTargetProperties.__webglDepthbuffer) {
                this._gl.deleteRenderbuffer(renderTargetProperties.__webglDepthbuffer);
            }
        }

        this._properties.remove(renderTarget.texture);
        this._properties.remove(renderTarget);
    }

    setTexture2D(texture: Texture, slot) {
        const textureProperties = this._properties.get(texture);

        // if (texture.isVideoTexture) { this.updateVideoTexture(texture); }

        if (texture.version > 0 &&
            textureProperties.__version !== texture.version) {
            const image = texture.image;

            if (image === undefined) {
                console.warn(
                    'THREE.WebGLRenderer: Texture marked for update but image is undefined');

            } else if (image.complete === false) {
                console.warn(
                    'THREE.WebGLRenderer: Texture marked for update but image is incomplete');

            } else {
                this.uploadTexture(textureProperties, texture, slot);
                return;
            }
        }

        this._state.texture.active(this._gl.TEXTURE0 + slot);
        this._state.texture.bind(this._gl.TEXTURE_2D, textureProperties.__webglTexture);
    }

    setTexture3D(texture, slot) {
        const gl = this._gl as WebGL2RenderingContext;
        const textureProperties = this._properties.get(texture);

        if (texture.version > 0 &&
            textureProperties.__version !== texture.version) {
            this.uploadTexture(textureProperties, texture, slot);
            return;
        }

        this._state.texture.active(gl.TEXTURE0 + slot);
        this._state.texture.bind(gl.TEXTURE_3D, textureProperties.__webglTexture);
    }

    setTextureCube(texture, slot) {
        const textureProperties = this._properties.get(texture);

        if (texture.image.length === 6) {
            if (texture.version > 0 &&
                textureProperties.__version !== texture.version) {
                if (!textureProperties.__image__webglTextureCube) {
                    texture.addEventListener('dispose', (event) => {
                        this.onTextureDispose(event);
                    });

                    textureProperties.__image__webglTextureCube = this._gl.createTexture();

                    this._info.memory.textures++;
                }

                this._state.texture.active(this._gl.TEXTURE0 + slot);
                this._state.texture.bind(
                    this._gl.TEXTURE_CUBE_MAP,
                    textureProperties.__image__webglTextureCube);

                this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);

                const isCompressed = (texture && texture.isCompressedTexture);
                const isDataTexture =
                    (texture.image[0] && texture.image[0].isDataTexture);

                const cubeImage = [];

                for (let i = 0; i < 6; i++) {
                    if (!isCompressed && !isDataTexture) {
                        cubeImage[i] =
                            clampToMaxSize(texture.image[i], this._capabilities.maxCubemapSize);

                    } else {
                        cubeImage[i] =
                            isDataTexture ? texture.image[i].image : texture.image[i];
                    }
                }

                const image = cubeImage[0], isPowerOfTwoImage = isPowerOfTwo(image);
                const glFormat = this._utils.convert(texture.format);
                const glType = this._utils.convert(texture.type);
                const glInternalFormat = this.getInternalFormat(glFormat, glType);
                let mipmap, mipmaps;

                this.setTextureParameters(
                    this._gl.TEXTURE_CUBE_MAP, texture, isPowerOfTwoImage);

                for (let i = 0; i < 6; i++) {
                    if (!isCompressed) {
                        if (isDataTexture) {
                            this._state.texImage2D(
                                this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glInternalFormat,
                                cubeImage[i].width, cubeImage[i].height, 0, glFormat,
                                glType, cubeImage[i].data);

                        } else {
                            this._state.texImage2D(
                                this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, glInternalFormat,
                                glFormat, glType, cubeImage[i]);
                        }

                    } else {
                        mipmaps = cubeImage[i].mipmaps;
                        for (let j = 0, jl = mipmaps.length; j < jl; j++) {

                            mipmap = mipmaps[j];

                            if (texture.format !== TextureFormat.RGBA &&
                                texture.format !== TextureFormat.RGB) {
                                if (this._state.getCompressedTextureFormats().indexOf(glFormat) > -1) {
                                    this._state.compressedTexImage2D(
                                        this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j,
                                        glInternalFormat, mipmap.width, mipmap.height, 0,
                                        mipmap.data);

                                } else {
                                    console.warn(
                                        'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()');
                                }

                            } else {
                                this._state.texImage2D(
                                    this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, j, glInternalFormat,
                                    mipmap.width, mipmap.height, 0, glFormat, glType,
                                    mipmap.data);
                            }
                        }
                    }
                }

                if (!isCompressed) {
                    textureProperties.__maxMipLevel = 0;

                } else {
                    textureProperties.__maxMipLevel = mipmaps.length - 1;
                }

                if (this.textureNeedsGenerateMipmaps(texture, isPowerOfTwoImage)) {
                    // We assume images for cube map have the same size.
                    this.generateMipmap(
                        this._gl.TEXTURE_CUBE_MAP, texture, image.width, image.height);
                }

                textureProperties.__version = texture.version;

                if (texture.onUpdate) {
                    texture.onUpdate(texture);
                }

            } else {
                this._state.texture.active(this._gl.TEXTURE0 + slot);
                this._state.texture.bind(
                    this._gl.TEXTURE_CUBE_MAP,
                    textureProperties.__image__webglTextureCube);
            }
        }
    }

    setTextureCubeDynamic(texture, slot) {
        this._state.texture.active(this._gl.TEXTURE0 + slot);
        this._state.texture.bind(
            this._gl.TEXTURE_CUBE_MAP, this._properties.get(texture).__webglTexture);
    }

    setTextureParameters(textureType, texture, isPowerOfTwoImage) {
        let extension;

        if (isPowerOfTwoImage) {
            this._gl.texParameteri(
                textureType, this._gl.TEXTURE_WRAP_S, this._utils.convert(texture.wrapS));
            this._gl.texParameteri(
                textureType, this._gl.TEXTURE_WRAP_T, this._utils.convert(texture.wrapT));

            this._gl.texParameteri(
                textureType, this._gl.TEXTURE_MAG_FILTER,
                this._utils.convert(texture.magFilter));
            this._gl.texParameteri(
                textureType, this._gl.TEXTURE_MIN_FILTER,
                this._utils.convert(texture.minFilter));

        } else {
            this._gl.texParameteri(textureType, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
            this._gl.texParameteri(textureType, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

            if (texture.wrapS !== TextureWrappingMode.ClampToEdge ||
                texture.wrapT !== TextureWrappingMode.ClampToEdge) {
                console.warn(
                    `THREE.WebGLRenderer: Texture is not power of two.
                    Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping.`);
            }

            this._gl.texParameteri(
                textureType, this._gl.TEXTURE_MAG_FILTER,
                this.filterFallback(texture.magFilter));
            this._gl.texParameteri(
                textureType, this._gl.TEXTURE_MIN_FILTER,
                this.filterFallback(texture.minFilter));

            if (texture.minFilter !== TextureMinificationFilter.Nearest &&
                texture.minFilter !== TextureMinificationFilter.Linear) {
                console.warn(
                    `THREE.WebGLRenderer: Texture is not power of two.
                    Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.`);
            }
        }

        extension = this._extensions.get('EXT_texture_filter_anisotropic');

        if (extension) {
            if (texture.type === TextureType.Float &&
                this._extensions.get('OES_texture_float_linear') === null) {
                return;
            }
            if (texture.type === TextureType.HalfFloat &&
                (this._capabilities.isWebGL2 ||
                    this._extensions.get('OES_texture_half_float_linear')) === null) {
                return;
            }

            if (texture.anisotropy > 1 ||
                this._properties.get(texture).__currentAnisotropy) {
                this._gl.texParameterf(
                    textureType, extension.TEXTURE_MAX_ANISOTROPY_EXT,
                    Math.min(
                        texture.anisotropy,
                        this._capabilities.getMaxAnisotropy()));
                this._properties.get(texture).__currentAnisotropy =
                    texture.anisotropy;
            }
        }
    }

    uploadTexture(textureProperties, texture, slot) {
        let textureType;

        if (texture.isDataTexture3D) {
            textureType = (<WebGL2RenderingContext>this._gl).TEXTURE_3D;

        } else {
            textureType = this._gl.TEXTURE_2D;
        }


        if (textureProperties.__webglInit === undefined) {
            textureProperties.__webglInit = true;

            texture.addEventListener('dispose', (event) => {
                this.onTextureDispose(event);
            });

            textureProperties.__webglTexture = this._gl.createTexture();

            this._info.memory.textures++;
        }
        this._state.texture.active(this._gl.TEXTURE0 + slot);
        this._state.texture.bind(textureType, textureProperties.__webglTexture);

        this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);
        this._gl.pixelStorei(
            this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha);
        this._gl.pixelStorei(
            this._gl.UNPACK_ALIGNMENT, texture.unpackAlignment);

        let image = clampToMaxSize(texture.image, this._capabilities.maxTextureSize);

        if (this.textureNeedsPowerOfTwo(texture) && isPowerOfTwo(image) === false) {
            image = this.makePowerOfTwo(image);
        }

        const isPowerOfTwoImage = isPowerOfTwo(image);
        const glFormat = this._utils.convert(texture.format);
        let glType = this._utils.convert(texture.type);
        let glInternalFormat = this.getInternalFormat(glFormat, glType);

        this.setTextureParameters(textureType, texture, isPowerOfTwoImage);

        let mipmap;
        const mipmaps = texture.mipmaps;

        if (texture.isDepthTexture) {
            // populate depth texture with dummy data
            glInternalFormat = this._gl.DEPTH_COMPONENT;

            if (texture.type === TextureType.Float) {
                if (!this._capabilities.isWebGL2) {
                    throw new Error('Float Depth Texture only supported in WebGL2.0');
                }
                glInternalFormat = (<WebGL2RenderingContext>this._gl).DEPTH_COMPONENT32F;

            } else if (this._capabilities.isWebGL2) {
                // WebGL 2.0 requires signed internalformat for glTexImage2D
                glInternalFormat = this._gl.DEPTH_COMPONENT16;
            }

            if (texture.format === TextureFormat.Depth &&
                glInternalFormat === this._gl.DEPTH_COMPONENT) {
                // The error INVALID_OPERATION is generated by texImage2D if format
                // and internalformat are DEPTH_COMPONENT and type is not
                // UNSIGNED_SHORT or UNSIGNED_INT
                // (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
                if (texture.type !== TextureType.UnsignedShort &&
                    texture.type !== TextureType.UnsignedInt) {
                    console.warn(
                        'THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture.');

                    texture.type = TextureType.UnsignedShort;
                    glType = this._utils.convert(texture.type);
                }
            }

            // Depth stencil textures need the DEPTH_STENCIL internal format
            // (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
            if (texture.format === TextureFormat.DepthStencil) {
                glInternalFormat = this._gl.DEPTH_STENCIL;

                // The error INVALID_OPERATION is generated by texImage2D if format
                // and internalformat are DEPTH_STENCIL and type is not
                // UNSIGNED_INT_24_8_WEBGL.
                // (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
                if (texture.type !== TextureType.UnsignedInt248) {
                    console.warn(
                        'THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture.');

                    texture.type = TextureType.UnsignedInt248;
                    glType = this._utils.convert(texture.type);
                }
            }

            this._state.texImage2D(
                this._gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0,
                glFormat, glType, null);

        } else if (texture.isDataTexture) {
            // use manually created mipmaps if available
            // if there are no manual mipmaps
            // set 0 level mipmap and then use GL to generate other mipmap levels

            if (mipmaps.length > 0 && isPowerOfTwoImage) {
                for (let i = 0, il = mipmaps.length; i < il; i++) {
                    mipmap = mipmaps[i];
                    this._state.texImage2D(
                        this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width,
                        mipmap.height, 0, glFormat, glType, mipmap.data);
                }

                texture.generateMipmaps = false;
                textureProperties.__maxMipLevel = mipmaps.length - 1;

            } else {
                this._state.texImage2D(
                    this._gl.TEXTURE_2D, 0, glInternalFormat, image.width, image.height, 0,
                    glFormat, glType, image.data);
                textureProperties.__maxMipLevel = 0;
            }

        } else if (texture.isCompressedTexture) {
            for (let i = 0, il = mipmaps.length; i < il; i++) {
                mipmap = mipmaps[i];

                if (texture.format !== TextureFormat.RGBA && texture.format !== TextureFormat.RGB) {
                    if (this._state.getCompressedTextureFormats().indexOf(glFormat) > -1) {
                        this._state.compressedTexImage2D(
                            this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width,
                            mipmap.height, 0, mipmap.data);
                    } else {
                        console.warn(
                            'THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()');
                    }
                } else {
                    this._state.texImage2D(
                        this._gl.TEXTURE_2D, i, glInternalFormat, mipmap.width,
                        mipmap.height, 0, glFormat, glType, mipmap.data);
                }
            }

            textureProperties.__maxMipLevel = mipmaps.length - 1;

        } else if (texture.isDataTexture3D) {
            this._state.texImage3D(
                (<WebGL2RenderingContext>this._gl).TEXTURE_3D, 0, glInternalFormat, image.width,
                image.height, image.depth, 0, glFormat, glType, image.data);
            textureProperties.__maxMipLevel = 0;
        } else {
            // regular Texture (image, video, canvas)

            // use manually created mipmaps if available
            // if there are no manual mipmaps
            // set 0 level mipmap and then use GL to generate other mipmap levels
            if (mipmaps.length > 0 && isPowerOfTwoImage) {
                for (let i = 0, il = mipmaps.length; i < il; i++) {
                    mipmap = mipmaps[i];
                    this._state.texImage2D(
                        this._gl.TEXTURE_2D, i, glInternalFormat, glFormat, glType, mipmap);
                }

                texture.generateMipmaps = false;
                textureProperties.__maxMipLevel = mipmaps.length - 1;

            } else {
                this._state.texImage2D(
                    this._gl.TEXTURE_2D, 0, glInternalFormat, glFormat, glType, image);
                textureProperties.__maxMipLevel = 0;
            }
        }

        if (this.textureNeedsGenerateMipmaps(texture, isPowerOfTwoImage)) {
            this.generateMipmap(this._gl.TEXTURE_2D, texture, image.width, image.height);
        }

        textureProperties.__version = texture.version;

        if (texture.onUpdate) {
            texture.onUpdate(texture);
        }
    }

    setupFrameBufferTexture(
        framebuffer, renderTarget, attachment, textureTarget) {
        const glFormat = this._utils.convert(renderTarget.texture.format);
        const glType = this._utils.convert(renderTarget.texture.type);
        const glInternalFormat = this.getInternalFormat(glFormat, glType);
        this._state.texImage2D(
            textureTarget, 0, glInternalFormat, renderTarget.width,
            renderTarget.height, 0, glFormat, glType, null);
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
        this._gl.framebufferTexture2D(
            this._gl.FRAMEBUFFER, attachment, textureTarget,
            this._properties.get(renderTarget.texture).__webglTexture, 0);
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }

    setupRenderBufferStorage(renderbuffer, renderTarget) {
        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, renderbuffer);

        if (renderTarget.depthBuffer && !renderTarget.stencilBuffer) {
            this._gl.renderbufferStorage(
                this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16,
                renderTarget.width, renderTarget.height);
            this._gl.framebufferRenderbuffer(
                this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT,
                this._gl.RENDERBUFFER, renderbuffer);

        } else if (renderTarget.depthBuffer && renderTarget.stencilBuffer) {
            this._gl.renderbufferStorage(
                this._gl.RENDERBUFFER, this._gl.DEPTH_STENCIL, renderTarget.width,
                renderTarget.height);
            this._gl.framebufferRenderbuffer(
                this._gl.FRAMEBUFFER, this._gl.DEPTH_STENCIL_ATTACHMENT,
                this._gl.RENDERBUFFER, renderbuffer);

        } else {
            // FIXME: We don't support !depth !stencil
            this._gl.renderbufferStorage(
                this._gl.RENDERBUFFER, this._gl.RGBA4, renderTarget.width,
                renderTarget.height);
        }

        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, null);
    }

    setupDepthTexture(framebuffer, renderTarget) {
        const isCube = (renderTarget && renderTarget.isWebGLRenderTargetCube);
        if (isCube) {
            throw new Error(
                'Depth Texture with cube render targets is not supported');
        }

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);

        if (!(renderTarget.depthTexture &&
            renderTarget.depthTexture.isDepthTexture)) {
            throw new Error(
                'renderTarget.depthTexture must be an instance of THREE.DepthTexture');
        }

        // upload an empty depth texture with framebuffer size
        if (!this._properties.get(renderTarget.depthTexture).__webglTexture ||
            renderTarget.depthTexture.image.width !== renderTarget.width ||
            renderTarget.depthTexture.image.height !== renderTarget.height) {
            renderTarget.depthTexture.image.width = renderTarget.width;
            renderTarget.depthTexture.image.height = renderTarget.height;
            renderTarget.depthTexture.needsUpdate = true;
        }

        this.setTexture2D(renderTarget.depthTexture, 0);

        const webglDepthTexture = this._properties.get(renderTarget.depthTexture).__webglTexture;

        if (renderTarget.depthTexture.format === TextureFormat.Depth) {
            this._gl.framebufferTexture2D(
                this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT,
                this._gl.TEXTURE_2D, webglDepthTexture, 0);
        } else if (renderTarget.depthTexture.format === TextureFormat.DepthStencil) {
            this._gl.framebufferTexture2D(
                this._gl.FRAMEBUFFER, this._gl.DEPTH_STENCIL_ATTACHMENT,
                this._gl.TEXTURE_2D, webglDepthTexture, 0);

        } else {
            throw new Error('Unknown depthTexture format');
        }
    }

    setupDepthRenderbuffer(renderTarget) {
        const renderTargetProperties = this._properties.get(renderTarget);

        const isCube = (renderTarget.isWebGLRenderTargetCube === true);

        if (renderTarget.depthTexture) {
            if (isCube) {
                throw new Error(
                    'target.depthTexture not supported in Cube render targets');
            }

            this.setupDepthTexture(
                renderTargetProperties.__webglFramebuffer, renderTarget);

        } else {
            if (isCube) {
                renderTargetProperties.__webglDepthbuffer = [];

                for (let i = 0; i < 6; i++) {
                    this._gl.bindFramebuffer(
                        this._gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer[i]);
                    renderTargetProperties.__webglDepthbuffer[i] =
                        this._gl.createRenderbuffer();
                    this.setupRenderBufferStorage(
                        renderTargetProperties.__webglDepthbuffer[i], renderTarget);
                }

            } else {
                this._gl.bindFramebuffer(
                    this._gl.FRAMEBUFFER, renderTargetProperties.__webglFramebuffer);
                renderTargetProperties.__webglDepthbuffer = this._gl.createRenderbuffer();
                this.setupRenderBufferStorage(
                    renderTargetProperties.__webglDepthbuffer, renderTarget);
            }
        }

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }

    setupRenderTarget(renderTarget) {
        const renderTargetProperties = this._properties.get(renderTarget);
        const textureProperties = this._properties.get(renderTarget.texture);

        renderTarget.addEventListener('dispose', (event) => {
            this.onRenderTargetDispose(event);
        });

        textureProperties.__webglTexture = this._gl.createTexture();

        this._info.memory.textures++;

        const isCube = (renderTarget.isWebGLRenderTargetCube === true);
        const isTargetPowerOfTwo = isPowerOfTwo(renderTarget);

        // Setup framebuffer

        if (isCube) {
            renderTargetProperties.__webglFramebuffer = [];

            for (let i = 0; i < 6; i++) {
                renderTargetProperties.__webglFramebuffer[i] =
                    this._gl.createFramebuffer();
            }

        } else {
            renderTargetProperties.__webglFramebuffer = this._gl.createFramebuffer();
        }

        // Setup color buffer

        if (isCube) {
            this._state.texture.bind(this._gl.TEXTURE_CUBE_MAP, textureProperties.__webglTexture);
            this.setTextureParameters(
                this._gl.TEXTURE_CUBE_MAP, renderTarget.texture, isTargetPowerOfTwo);

            for (let i = 0; i < 6; i++) {
                this.setupFrameBufferTexture(
                    renderTargetProperties.__webglFramebuffer[i], renderTarget,
                    this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + i);
            }

            if (this.textureNeedsGenerateMipmaps(
                renderTarget.texture, isTargetPowerOfTwo)) {
                this.generateMipmap(
                    this._gl.TEXTURE_CUBE_MAP, renderTarget.texture, renderTarget.width,
                    renderTarget.height);
            }

            this._state.texture.bind(this._gl.TEXTURE_CUBE_MAP, null);

        } else {
            this._state.texture.bind(this._gl.TEXTURE_2D, textureProperties.__webglTexture);
            this.setTextureParameters(
                this._gl.TEXTURE_2D, renderTarget.texture, isTargetPowerOfTwo);
            this.setupFrameBufferTexture(
                renderTargetProperties.__webglFramebuffer, renderTarget,
                this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D);

            if (this.textureNeedsGenerateMipmaps(
                renderTarget.texture, isTargetPowerOfTwo)) {
                this.generateMipmap(
                    this._gl.TEXTURE_2D, renderTarget.texture, renderTarget.width,
                    renderTarget.height);
            }

            this._state.texture.bind(this._gl.TEXTURE_2D, null);
        }

        // Setup depth and stencil buffers

        if (renderTarget.depthBuffer) {
            this.setupDepthRenderbuffer(renderTarget);
        }
    }

    updateRenderTargetMipmap(renderTarget: WebGLRenderTarget) {
        const texture = renderTarget.texture;
        const isTargetPowerOfTwo = isPowerOfTwo(renderTarget);

        if (this.textureNeedsGenerateMipmaps(texture, isTargetPowerOfTwo)) {
            const target = renderTarget instanceof WebGLRenderTargetCube ?
                this._gl.TEXTURE_CUBE_MAP :
                this._gl.TEXTURE_2D;
            const webglTexture = this._properties.get(texture).__webglTexture;

            this._state.texture.bind(target, webglTexture);
            this.generateMipmap(
                target, texture, renderTarget.width, renderTarget.height);
            this._state.texture.bind(target, null);
        }
    }

    updateVideoTexture(texture) {
        const id = texture.id;
        const frame = this._info.render.frame;

        // Check the last frame we updated the VideoTexture
        if (this._videoTextures[id] !== frame) {
            this._videoTextures[id] = frame;
            texture.update();
        }
    }
}
