import { DrawableType } from '../../object/constatns';
import { BufferGeometry } from '../../core/BufferGeometry';
import { Material } from '../../materials/Material';
import { ShaderProgram } from '../shader/ShaderProgram';
import { Object3D } from '../../core/Object3D';

function painterSortStable(a, b) {
    if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;

    } else if (a.program && b.program && a.program !== b.program) {
        return a.program.id - b.program.id;

    } else if (a.material.id !== b.material.id) {
        return a.material.id - b.material.id;

    } else if (a.z !== b.z) {
        return a.z - b.z;

    } else {
        return a.id - b.id;
    }
}

function reversePainterSortStable(a, b) {
    if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
    }
    if (a.z !== b.z) {
        return b.z - a.z;

    } else {
        return a.id - b.id;
    }
}

export interface IRenderItem {
    id: number;
    object: DrawableType;
    geometry: BufferGeometry;
    material: Material;
    program: ShaderProgram;
    renderOrder: number;
    z: number;
    group: any;
}


export class WebGLRenderList {
    private _renderItems: {[key: number]: IRenderItem} = {};
    private _renderItemsIndex = 1;

    private _opaque: IRenderItem[] = [];
    private _transparent: IRenderItem[] = [];

    get opaque() {
        return this._opaque;
    }

    get transparent() {
        return this._transparent;
    }

    init() {
        this._renderItemsIndex = 0;
        this._opaque.length = 0;
        this._transparent.length = 0;
    }

    push(object: DrawableType, geometry: BufferGeometry, material: Material, z: number, group) {
      const renderItem = this._getNextRenderItem(object, geometry, material, z, group);
      (material.transparent === true ? this._transparent : this._opaque).push(renderItem);
    }

    unshift(object: Object3D, geometry: BufferGeometry, material, z: number, group) {
        const renderItem = this._getNextRenderItem(object, geometry, material, z, group);

        (material.transparent === true ? this._transparent : this._opaque).unshift(renderItem);
    }

    sort() {
        if (this._opaque.length > 1) { this._opaque.sort(painterSortStable); }
        if (this._transparent.length > 1) { this._transparent.sort(reversePainterSortStable); }
    }

    private _getNextRenderItem(object, geometry, material, z, group) {
        let renderItem: IRenderItem = this._renderItems[this._renderItemsIndex];

        if (renderItem === undefined) {
            renderItem = {
                id: object.id,
                object: object,
                geometry: geometry,
                material: material,
                program: material.program,
                renderOrder: object.renderOrder,
                z: z,
                group: group
            };

            this._renderItems[this._renderItemsIndex] = renderItem;

        } else {
            renderItem.id = object.id;
            renderItem.object = object;
            renderItem.geometry = geometry;
            renderItem.material = material;
            renderItem.program = material.program;
            renderItem.renderOrder = object.renderOrder;
            renderItem.z = z;
            renderItem.group = group;
        }

        this._renderItemsIndex++;

        return renderItem;
    }
}

export class WebGLRenderLists {
    // TODO: Define data structure
    private _lists: {[key: number]: {[key: number]: WebGLRenderList}} = {};

    /**
     *  Get a list of object to render
     * @param id scene id
     * @param camera camera object
     */
    get(sceneId: number, cameraId: number): WebGLRenderList {
        const cameras = this._lists[sceneId];
        let list: WebGLRenderList;
        if (cameras === undefined) {
            list = new WebGLRenderList();
            this._lists[sceneId] = {};
            this._lists[sceneId][cameraId] = list;

        } else {
            list = cameras[cameraId];
            if (list === undefined) {
                list = new WebGLRenderList();
                cameras[cameraId] = list;
            }
        }

        return list;
    }

    dispose() {
        this._lists = {};
    }
}
