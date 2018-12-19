export class WebGLAnimation {
    private _context = null;
    private _isAnimating = false;
    private _animationLoop = null;

    private _onAnimationFrame(time: number, frame: number) {
        if (this._isAnimating === false) {
            return;
        }
        this._animationLoop(time, frame);

        // loop until stop is called
        this._context.requestAnimationFrame(this._onAnimationFrame);
    }

    start() {
        if (this._isAnimating === true) {
            return;
        }
        if (this._animationLoop === null) {
            return;
        }

        this._context.requestAnimationFrame(this._onAnimationFrame);

        this._isAnimating = true;
    }

    stop() {
        this._isAnimating = false;
    }

    setAnimationLoop(callback) {
        this._animationLoop = callback;
    }

    set context(value) {
        this._context = value;
    }
}
