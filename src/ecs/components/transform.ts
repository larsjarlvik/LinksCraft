import { Component } from 'engine/ecs';
import { Vec3 } from 'wgpu-matrix';

export class Transform extends Component {
    public position: Vec3;
    public rotation: Vec3;
    public angle: number;
    public scale: Vec3;

    static fromPosition(position: Vec3) {
        const transform = new Transform();
        transform.position = position;
        transform.rotation = [0, 1, 0];
        transform.scale = [1, 1, 1];
        transform.angle = 0.0;
        return transform;
    }

    static fromPositionScale(position: Vec3, scale: number) {
        const transform = new Transform();
        transform.position = position;
        transform.rotation = [0, 1, 0];
        transform.scale = [scale, scale, scale];
        transform.angle = 0.0;
        return transform;
    }
}
