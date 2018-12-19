import { MeshBasicMaterial } from './MeshBasicMaterial';
import { LineBasicMaterial } from './LineBasicMaterial';
import { MeshDepthMaterial } from './MeshDepthMaterial';
import { MeshLambertMaterial } from './MeshLambertMaterial';
import { MeshNormalMaterial } from './MeshNormalMaterial';
import { MeshPhongMaterial } from './MeshPhongMaterial';
import { ShaderMaterial } from './ShaderMaterial';
import { ShadowMaterial } from './ShadowMaterial';
import { RawShaderMaterial } from './RawShaderMaterial';
import { LineDashedMaterial } from './LineDashedMaterial';
import { PointsMaterial } from './PointsMaterial';
import { SpriteMaterial } from './SpriteMaterial';

// FIXME: Remove
export enum MaterialType {
    Basic = 'Basic',
    Depth = 'MeshDepthMaterial',
    Lambert = 'MeshLambertMaterial',
    Normal = 'MeshNormalMaterial',
    Phong = 'MeshPhongMaterial',
    LineBasic = 'LineBasic',
    LineDashed = 'LineDashedMaterial',
    Points = 'PointsMaterial ',
    Sprite= 'SpriteMaterial',
    Shader = 'ShaderMaterial',
    RawShader = 'RawShaderMaterial',
    Shadow = 'ShadowMaterial',
}

export enum NormalMapType {
    TangentSpace = 0,
    ObjectSpace = 1
}

export type LineMaterial = LineBasicMaterial | LineDashedMaterial;

export type MeshMaterial = MeshBasicMaterial | MeshDepthMaterial |
    MeshLambertMaterial | MeshNormalMaterial | MeshPhongMaterial;

export type RawMaterial = ShaderMaterial | ShadowMaterial | RawShaderMaterial;

export type Material2D = PointsMaterial | SpriteMaterial;
