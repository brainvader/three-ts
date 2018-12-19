import { WebGLExtensions } from '../WebGLExtensions';
import { WebGLCapabilities } from '../WebGLCapabilities';

export class PolygonOffsetState {
    private _currentPolygonOffsetFactor = null;
    private _currentPolygonOffsetUnits = null;

    constructor(private _gl: WebGLRenderingContext, private _capabilities: WebGLCapabilities) {}

    /**
     *  Set or update polygon offset
     * @param polygonOffset availability of polygon offset
     * @param factor scale factor for polygon offset
     * @param units ???
     */
    set(polygonOffset: boolean, factor?: GLfloat, units?: GLfloat) {
        if (polygonOffset) {
            this._capabilities.enable(this._gl.POLYGON_OFFSET_FILL);

            if (this._currentPolygonOffsetFactor !== factor ||
                this._currentPolygonOffsetUnits !== units) {
                this._gl.polygonOffset(factor, units);

                this._currentPolygonOffsetFactor = factor;
                this._currentPolygonOffsetUnits = units;
            }

        } else {
            this._capabilities.disable(this._gl.POLYGON_OFFSET_FILL);
        }
    }
}
