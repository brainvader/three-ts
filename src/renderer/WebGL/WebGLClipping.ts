import { Plane } from '../../math/Plane';
import { Camera } from '../../object/camera/Camera';
import { Matrix3 } from '../../math/Matrix3';

export class WebGLClipping {
    private _globalState = null;

    private _uniform;
    private _numPlanes = 0;
    private _numIntersection = 0;
    private _numGlobalPlanes = 0;
    private _localClippingEnabled = false;
    private _renderingShadows = false;

    private _viewNormalMatrix = new Matrix3();
    private _plane = new Plane();

    constructor() {
        this._uniform = {
            value: null,
            needsUpdate: false
        };
    }

    get numPlanes() {
        return this._numPlanes;
    }

    get numIntersection() {
        return this._numIntersection;
    }

    init(planes: Plane[], enableLocalClipping: boolean, camera: Camera) {
        // enable state of previous frame - the clipping code has to
        // run another frame in order to reset the state:
        const enabled = planes.length !== 0 || enableLocalClipping ||
            this._numGlobalPlanes !== 0 || this._localClippingEnabled;

      this._localClippingEnabled = enableLocalClipping;

      this._globalState = this.projectPlanes(planes, camera, 0);
      this._numGlobalPlanes = planes.length;
      return enabled;
    }

    beginShadows() {
        this._renderingShadows = true;
        this.projectPlanes(null);
    }

    endShadows() {
        this._renderingShadows = false;
        this.resetGlobalState();
    }

    setState(planes, clipIntersection, clipShadows, camera, cache, fromCache) {
        if (!this._localClippingEnabled || planes === null || planes.length === 0 ||
            this._renderingShadows && !clipShadows) {
            // there's no local clipping

            if (this._renderingShadows) {
                // there's no global clipping

                this.projectPlanes(null);

            } else {
                this.resetGlobalState();
            }
        } else {
            const nGlobal = this._renderingShadows ? 0 : this._numGlobalPlanes;
            const lGlobal = nGlobal * 4;

            let dstArray = cache.clippingState || null;

            this._uniform.value = dstArray;  // ensure unique state

            dstArray = this.projectPlanes(planes, camera, lGlobal, fromCache);

            for (let i = 0; i !== lGlobal; ++i) {
                dstArray[i] = this._globalState[i];
            }

            cache.clippingState = dstArray;
            this._numIntersection = clipIntersection ? this._numPlanes : 0;
            this._numPlanes += nGlobal;
        }
    }

    resetGlobalState() {
        if (this._uniform.value !== this._globalState) {
            this._uniform.value = this._globalState;
            this._uniform.needsUpdate = this._numGlobalPlanes > 0;
        }

        this._numPlanes = this._numGlobalPlanes;
        this._numIntersection = 0;
    }

    projectPlanes(planes?, camera?, dstOffset?, skipTransform?) {
        const nPlanes = planes !== null ? planes.length : 0;
        let dstArray = null;

        if (nPlanes !== 0) {
            dstArray = this._uniform.value;

            if (skipTransform !== true || dstArray === null) {
                const flatSize = dstOffset + nPlanes * 4;
                const viewMatrix = camera.matrixWorldInverse;
                this._viewNormalMatrix.getNormalMatrix(viewMatrix);

                if (dstArray === null || dstArray.length < flatSize) {
                    dstArray = new Float32Array(flatSize);
                }

                for (let i = 0, i4 = dstOffset; i !== nPlanes; ++i, i4 += 4) {
                    this._plane.copy(planes[i]).applyMatrix4(
                        viewMatrix, this._viewNormalMatrix);

                    this._plane.normal.toArray(dstArray, i4);
                    dstArray[i4 + 3] = this._plane.constant;
                }
            }

            this._uniform.value = dstArray;
            this._uniform.needsUpdate = true;
        }

        this._numPlanes = nPlanes;

        return dstArray;
    }
}
