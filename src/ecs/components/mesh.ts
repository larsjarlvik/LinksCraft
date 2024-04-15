import { Mat4 } from "wgpu-matrix";
import { Context } from "../../engine/context";
import { Component } from "../../engine/ecs";

interface Uniforms {
    modelViewMatrix: Mat4;
}

export class Mesh extends Component {
    public name: string;
    public uniformBuffer: GPUBuffer;
    public uniformBindGroup: GPUBindGroup;

    constructor(ctx: Context, name: string) {
        super();
        this.name = name;

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

    public updateUniforms(ctx: Context, uniforms: Uniforms) {
        const matrix = uniforms.modelViewMatrix as Float32Array;
        ctx.device.queue.writeBuffer(this.uniformBuffer, 0, matrix.buffer, matrix.byteOffset, matrix.byteLength);
    }
}
