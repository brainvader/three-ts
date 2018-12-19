import { Camera } from './Camera';
import { CameraType } from './constants';
import { MathUtil } from '../../utils/MathUtil';

export class PerspectiveCamera extends Camera {
    public zoom = 1;
    public focus = 10;
    public view = null;

    // width of the film (default in millimeters)
    public filmGauge = 35;
    // horizontal film offset (same unit as gauge)
    public filmOffset = 0;

    constructor(
        public fov = 50, public aspect = 1,
        public near = 0.1, public far = 2000) {
        super();
        this._type = CameraType.Perspective;
    }

    copy(source: PerspectiveCamera, recursive?: boolean): PerspectiveCamera {
        super.copy(source, recursive);

        this.fov = source.fov;
        this.zoom = source.zoom;

        this.near = source.near;
        this.far = source.far;
        this.focus = source.focus;

        this.aspect = source.aspect;
        this.view = source.view === null ? null : Object.assign({}, source.view);

        this.filmGauge = source.filmGauge;
        this.filmOffset = source.filmOffset;

        return this;
    }

    /**
	 * Sets the FOV by focal length in respect to the current .filmGauge.
	 *
	 * The default film gauge is 35, so that the focal length can be specified for
	 * a 35mm (full frame) camera.
	 *
	 * Values for focal length and film gauge must have the same unit.
     * @param focalLength
	 */
    setFocalLength(focalLength: number) {
        // see http://www.bobatkins.com/photography/technical/field_of_view.html
        const vExtentSlope = 0.5 * this.getFilmHeight() / focalLength;

        this.fov = MathUtil.RAD2DEG * 2 * Math.atan(vExtentSlope);
        this.updateProjectionMatrix();
    }

    /**
	 * Calculates the focal length from the current .fov and .filmGauge.
	 */
    getFocalLength(): number {
        const vExtentSlope = Math.tan(MathUtil.DEG2RAD * 0.5 * this.fov);
        return 0.5 * this.getFilmHeight() / vExtentSlope;
    }

    getEffectiveFOV(): number {
        return MathUtil.RAD2DEG * 2 *
            Math.atan(Math.tan(MathUtil.DEG2RAD * 0.5 * this.fov) / this.zoom);
    }

    getFilmWidth(): number {
        // film not completely covered in portrait format (aspect < 1)
        return this.filmGauge * Math.min(this.aspect, 1);
    }

    getFilmHeight(): number {
        // film not completely covered in landscape format (aspect > 1)
        return this.filmGauge / Math.max(this.aspect, 1);
    }

    /**
	 * Sets an offset in a larger frustum. This is useful for multi-window or
	 * multi-monitor/multi-machine setups.
	 *
	 * For example, if you have 3x2 monitors and each monitor is 1920x1080 and
	 * the monitors are in grid like this
	 *
	 *   +---+---+---+
	 *   | A | B | C |
	 *   +---+---+---+
	 *   | D | E | F |
	 *   +---+---+---+
	 *
	 * then for each monitor you would call it like this
	 *
	 *   var w = 1920;
	 *   var h = 1080;
	 *   var fullWidth = w * 3;
	 *   var fullHeight = h * 2;
	 *
	 *   --A--
	 *   camera.setOffset( fullWidth, fullHeight, w * 0, h * 0, w, h );
	 *   --B--
	 *   camera.setOffset( fullWidth, fullHeight, w * 1, h * 0, w, h );
	 *   --C--
	 *   camera.setOffset( fullWidth, fullHeight, w * 2, h * 0, w, h );
	 *   --D--
	 *   camera.setOffset( fullWidth, fullHeight, w * 0, h * 1, w, h );
	 *   --E--
	 *   camera.setOffset( fullWidth, fullHeight, w * 1, h * 1, w, h );
	 *   --F--
	 *   camera.setOffset( fullWidth, fullHeight, w * 2, h * 1, w, h );
	 *
	 *   Note there is no reason monitors have to be the same size or in a grid.
	 */
    // setViewOffset(fullWidth: number, fullHeight: number, x: number, y: number, width: number, height: number) {
    //     this.aspect = fullWidth / fullHeight;

    //     if (this.view === null) {
    //         this.view = {
    //             enabled: true,
    //             fullWidth: 1,
    //             fullHeight: 1,
    //             offsetX: 0,
    //             offsetY: 0,
    //             width: 1,
    //             height: 1
    //         };
    //     }

    //     this.view.enabled = true;
    //     this.view.fullWidth = fullWidth;
    //     this.view.fullHeight = fullHeight;
    //     this.view.offsetX = x;
    //     this.view.offsetY = y;
    //     this.view.width = width;
    //     this.view.height = height;

    //     this.updateProjectionMatrix();
    // }

    // clearViewOffset() {
    //     if (this.view !== null) {
    //         this.view.enabled = false;
    //     }

    //     this.updateProjectionMatrix();
    // }

    updateProjectionMatrix() {
        const near = this.near;
        let top = near * Math.tan(MathUtil.DEG2RAD * 0.5 * this.fov) / this.zoom;
        let height = 2 * top, width = this.aspect * height, left = -0.5 * width;
        const view = this.view;

        if (this.view !== null && this.view.enabled) {
            const fullWidth = view.fullWidth, fullHeight = view.fullHeight;

            left += view.offsetX * width / fullWidth;
            top -= view.offsetY * height / fullHeight;
            width *= view.width / fullWidth;
            height *= view.height / fullHeight;
        }

        const skew = this.filmOffset;
        if (skew !== 0) {
            left += near * skew / this.getFilmWidth();
        }

        this.projectionMatrix.makePerspective(
            left, left + width, top, top - height, near, this.far);

        this.projectionMatrixInverse.getInverse(this.projectionMatrix);
    }
}
