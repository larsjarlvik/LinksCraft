import { Vec3 } from 'wgpu-matrix';
import { Component } from 'engine/ecs';

export class Transform extends Component {
    public position: Vec3;
    public rotation: Vec3;

    constructor(position: Vec3) {
        super();
        this.position = position;
        this.rotation = [0, 0, 0];
    }
}
