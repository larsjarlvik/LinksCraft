import { Component } from 'engine/ecs';
import { Mat4, Vec3, mat4, vec3, utils } from 'wgpu-matrix';

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

    /** Returns a Mat4 representing the interpolated transform */
    public getMatrix(time: number): Mat4 {
        const ps = this.prevState as Transform;
        const t = Math.max(Math.min(1, time), 0);

        if (!ps) {
            return mat4.rotate(
                mat4.scale(mat4.translation(this.position), this.scale),
                this.rotation,
                this.angle,
            );
        }

        return mat4.rotate(
            mat4.scale(mat4.translation(vec3.lerp(this.position, ps.position, t)), vec3.lerp(this.scale, ps.scale, t)),
            vec3.lerp(this.rotation, ps.rotation, t),
            utils.lerp(this.angle, ps.angle, t),
        )
    }

    public clone(): void {
        const clone = new Transform();
        clone.angle = this.angle;
        clone.position = this.position;
        clone.rotation = this.rotation;
        clone.scale = this.scale;
        this.prevState = clone;
    }
}
