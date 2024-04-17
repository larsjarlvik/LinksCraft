import { Component } from 'engine/ecs';
import { Vec3 } from 'wgpu-matrix';

export class Transform extends Component {
    public position: Vec3 = [0, 0, 0];
    public rotation: Vec3 = [0, 1, 0];
    public angle = 0.0;
    public scale: Vec3 = [1, 1, 1];

    static fromPosition(position: Vec3) {
        const transform = new Transform();
        transform.position = position;
        return transform;
    }

    static fromPositionScale(position: Vec3, scale: number) {
        const transform = new Transform();
        transform.position = position;
        transform.scale = [scale, scale, scale];
        return transform;
    }
}
