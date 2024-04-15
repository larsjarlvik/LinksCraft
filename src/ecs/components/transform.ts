import { mat4, type Vec3 } from "wgpu-matrix";
import { Component } from "../../engine/ecs";
import type { Context } from "../../engine/context";

export class Transform extends Component {
    public position: Vec3;
    public uniformBuffer: GPUBuffer;
    public uniformBindGroup: GPUBindGroup;

    constructor(ctx: Context, position: Vec3) {
        super();
        this.position = position;

        const uniformBufferSize = 4 * 16; // 4x4 matrix
        this.uniformBuffer = ctx.device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.uniformBindGroup = ctx.device.createBindGroup({
            layout: ctx.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer,
                    },
                },
            ],
        });
    }

    public updateMatrix(ctx: Context) {
        const matrix = mat4.translation(this.position) as Float32Array;
        ctx.device.queue.writeBuffer(this.uniformBuffer, 0, matrix.buffer, matrix.byteOffset, matrix.byteLength);
    }
}
