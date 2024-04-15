import { Vec3 } from "wgpu-matrix";

export class Camera {
    public eye: Vec3;
    public target: Vec3;

    constructor(eye: Vec3, target: Vec3) {
        this.eye = eye;
        this.target = target;
    }
}
