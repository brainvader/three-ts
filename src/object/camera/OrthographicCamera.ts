import { Camera } from './Camera';
import { CameraType } from './constants';

export class OrthographicCamera extends Camera {
    public zoom = 1;
    public view = null;

    constructor(
        public left = -1, public right = 1, public top = 1,
        public bottom = -1, public near = 0.1, public far = 2000) {
        super();
        this._type = CameraType.Orthographic;
        this.updateProjectionMatrix();
    }

    copy(source: OrthographicCamera, recursive?: boolean) {
        super.copy(source, recursive);

        this.left = source.left;
        this.right = source.right;
        this.top = source.top;
        this.bottom = source.bottom;
        this.near = source.near;
        this.far = source.far;

        this.zoom = source.zoom;
        this.view = source.view === null ? null : Object.assign({}, source.view);

        return this;
    }

    // setViewOffset(
    //     fullWidth: number, fullHeight: number, x: number, y: number,
    //     width: number, height: number) {

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
        const dx = (this.right - this.left) / (2 * this.zoom);
        const dy = (this.top - this.bottom) / (2 * this.zoom);
        const cx = (this.right + this.left) / 2;
        const cy = (this.top + this.bottom) / 2;

        let left = cx - dx;
        let right = cx + dx;
        let top = cy + dy;
        let bottom = cy - dy;

        if (this.view !== null && this.view.enabled) {
            const zoomW = this.zoom / (this.view.width / this.view.fullWidth);
            const zoomH = this.zoom / (this.view.height / this.view.fullHeight);
            const scaleW = (this.right - this.left) / this.view.width;
            const scaleH = (this.top - this.bottom) / this.view.height;

            left += scaleW * (this.view.offsetX / zoomW);
            right = left + scaleW * (this.view.width / zoomW);
            top -= scaleH * (this.view.offsetY / zoomH);
            bottom = top - scaleH * (this.view.height / zoomH);
        }

        this.projectionMatrix.makeOrthographic(
            left, right, top, bottom, this.near, this.far);

        this.projectionMatrixInverse.getInverse(this.projectionMatrix);
    }
}
