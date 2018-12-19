export class ProgramState {
    private _currentProgram: WebGLProgram;

    constructor(private _gl: WebGLRenderingContext) {}

    use(program: WebGLProgram): boolean {
        if (this._currentProgram !== program) {
            this._gl.useProgram(program);
            this._currentProgram = program;
            return true;
        }
        return false;
    }

    reset() {
        this._currentProgram = null;
    }
}
