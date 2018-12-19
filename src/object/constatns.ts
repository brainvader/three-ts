import { Line } from '../object/Line';
import { LineSegments } from '../object/LineSegments';
import { Mesh } from '../object/Mesh';
import { BufferGeometry } from '../core/BufferGeometry';
import { Geometry } from '../core/Geometry';
import { Points } from './Points';
import { Sprite } from './Sprite';

export enum DrawMode {
    Triangles = 0,
    TriangleStrip,
    TriangleFan,
}

export type DrawableType = Line | LineSegments | Points | Mesh | Sprite;

export type BufferGeometryType = BufferGeometry;

export type GeometryType = Geometry;
