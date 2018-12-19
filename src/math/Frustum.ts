import { Object3D } from '../core/Object3D';

import { Matrix4 } from './Matrix4';
import { Plane } from './Plane';
import { Sphere } from './Sphere';
import { Box3 } from './Box3';
import { Vector3 } from './Vector3';
import { DrawableType } from '../object/constatns';

export class Frustum {
    private _planes: Plane[];

    constructor(
        p0 = new Plane(),
        p1 = new Plane(),
        p2 = new Plane(),
        p3 = new Plane(),
        p4 = new Plane(),
        p5 = new Plane(),
    ) {
        this._planes = [p0, p1, p2, p3, p4, p5];
    }

    setAll(p0: Plane, p1: Plane, p2: Plane, p3: Plane, p4: Plane, p5: Plane):
        Frustum {
        const planes = this._planes;

        planes[0].copy(p0);
        planes[1].copy(p1);
        planes[2].copy(p2);
        planes[3].copy(p3);
        planes[4].copy(p4);
        planes[5].copy(p5);
        return this;
    }

    get planes(): Plane[] {
        return this._planes;
    }

    clone(): Frustum {
        return new Frustum().copy(this);
    }

    copy(frustum: Frustum) {
        const planes = this._planes;
        for (let i = 0; i < 6; i++) {
            planes[i].copy(frustum.planes[i]);
        }
        return this;
    }

    setFromMatrix(m: Matrix4): Frustum {
        const planes = this.planes;
        const me = m.elements;
        const me0 = me[0], me1 = me[1], me2 = me[2], me3 = me[3];
        const me4 = me[4], me5 = me[5], me6 = me[6], me7 = me[7];
        const me8 = me[8], me9 = me[9], me10 = me[10], me11 = me[11];
        const me12 = me[12], me13 = me[13], me14 = me[14], me15 = me[15];

        planes[0]
            .setComponents(me3 - me0, me7 - me4, me11 - me8, me15 - me12)
            .normalize();
        planes[1]
            .setComponents(me3 + me0, me7 + me4, me11 + me8, me15 + me12)
            .normalize();
        planes[2]
            .setComponents(me3 + me1, me7 + me5, me11 + me9, me15 + me13)
            .normalize();
        planes[3]
            .setComponents(me3 - me1, me7 - me5, me11 - me9, me15 - me13)
            .normalize();
        planes[4]
            .setComponents(me3 - me2, me7 - me6, me11 - me10, me15 - me14)
            .normalize();
        planes[5]
            .setComponents(me3 + me2, me7 + me6, me11 + me10, me15 + me14)
            .normalize();

        return this;
    }

    intersectsObject(object: DrawableType): boolean {
        const sphere = new Sphere();
        const geometry = object.geometry;

        if (geometry.boundingSphere === null) {
            geometry.computeBoundingSphere();
        }

        sphere.copy(geometry.boundingSphere).applyMatrix4(object.matrixWorld);

        return this.intersectsSphere(sphere);
    }

    intersectsSprite(sprite): boolean {
        const sphere = new Sphere();
        sphere.center.setXYZ(0, 0, 0);
        sphere.radius = 0.7071067811865476;
        sphere.applyMatrix4(sprite.matrixWorld);

        return this.intersectsSphere(sphere);
    }

    intersectsSphere(sphere: Sphere): boolean {
        const planes = this._planes;
        const center = sphere.center;
        const negRadius = -sphere.radius;

        for (let i = 0; i < 6; i++) {
            const distance = planes[i].distanceToPoint(center);
            if (distance < negRadius) {
                return false;
            }
        }
        return true;
    }

    intersectsBox(box: Box3) {
        const p = new Vector3();
        const planes = this._planes;
        for (let i = 0; i < 6; i++) {
            const plane = planes[i];
            // corner at max distance
            p.x = plane.normal.x > 0 ? box.max.x : box.min.x;
            p.y = plane.normal.y > 0 ? box.max.y : box.min.y;
            p.z = plane.normal.z > 0 ? box.max.z : box.min.z;
            if (plane.distanceToPoint(p) < 0) {
                return false;
            }
        }
        return true;
    }

    containsPoint(point: Vector3): boolean {
        const planes = this._planes;
        for (let i = 0; i < 6; i++) {
            if (planes[i].distanceToPoint(point) < 0) {
                return false;
            }
        }
        return true;
    }
}
