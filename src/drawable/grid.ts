import { BufferGeometry } from '../core/BufferGeometry';
import { Color } from '../math/Color';
import { Float32BufferAttribute } from '../core/BufferAttribute';
import { LineBasicMaterial } from '../materials/LineBasicMaterial';
import { MaterialColor } from '../materials/constants';
import { LineSegments } from '../object/LineSegments';

export class Grid extends LineSegments {
    private _size: number;
    private _division: number;
    private _colorCenterLine: Color;
    private _colorGrid: Color;

    constructor(size = 10, divisions = 10, color1: Color, color2: Color) {
        const center = divisions / 2;
        const step = size / divisions;
        const halfSize = size / 2;

        const vertices: number[] = [];
        const colors: number[] = [];

        for (let i = 0, j = 0, k = -halfSize; i <= divisions; i++ , k += step) {
            vertices.push(-halfSize, 0, k, halfSize, 0, k);
            vertices.push(k, 0, -halfSize, k, 0, halfSize);

            const color = i === center ? color1 : color2;

            color.toArray(colors, j);
            j += 3;
            color.toArray(colors, j);
            j += 3;
            color.toArray(colors, j);
            j += 3;
            color.toArray(colors, j);
            j += 3;
        }

        const geometry = new BufferGeometry();
        geometry.addAttribute(
            'position',
            new Float32BufferAttribute(new Float32Array(vertices), 3));
        geometry.addAttribute(
            'color',
            new Float32BufferAttribute(new Float32Array(colors), 3));

        const material = new LineBasicMaterial( { vertexColors: MaterialColor.VertexColors } );

        super(geometry, material);

        this._size = size;
        this._division = divisions;
        this._colorCenterLine = color1;
        this._colorGrid = color2;
    }
}
