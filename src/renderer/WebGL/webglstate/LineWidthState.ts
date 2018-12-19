export class LineWidthState {
    private _currentLineWidth = null;
    private _lineWidthAvailable = false;

    private _version = 0;
    private _glVersion: string;

    constructor(private _gl: WebGLRenderingContext) {
        this._glVersion = this._gl.getParameter(this._gl.VERSION);

        if (this._glVersion.indexOf('WebGL') !== -1) {
            this._version =
                parseFloat(/^WebGL\ ([0-9])/.exec(this._glVersion)[1]);
            this._lineWidthAvailable = (this._version >= 1.0);

        } else if (this._glVersion.indexOf('OpenGL ES') !== -1) {
            this._version =
                parseFloat(/^OpenGL\ ES\ ([0-9])/.exec(this._glVersion)[1]);
            this._lineWidthAvailable = (this._version >= 2.0);
        }
    }

    set(width: number) {
        if (width !== this._currentLineWidth) {
            if (this._lineWidthAvailable) {
                this._gl.lineWidth(width);
            }
            this._currentLineWidth = width;
        }
    }
}
