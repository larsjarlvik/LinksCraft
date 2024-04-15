import { Mat4 } from "wgpu-matrix";
import { Context } from "engine/context";
import { Component } from "engine/ecs";
import { makeStructuredView } from "webgpu-utils";

interface Uniforms {
    modelMatrix: Mat4;
    viewMatrix: Mat4;
    projectionMatrix: Mat4;
}

export class Mesh extends Component {
    public name: string;
    public uniformBuffer: GPUBuffer;
    public uniformBindGroup: GPUBindGroup;

    constructor(ctx: Context, name: string) {
        super();
        this.name = name;

        this.uniformBuffer = ctx.device.createBuffer({
            size: ctx.pipelineDefs.uniforms.uniforms.size,
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
        const data = makeStructuredView(ctx.pipelineDefs.uniforms.uniforms);
        data.set(uniforms);

        ctx.device.queue.writeBuffer(this.uniformBuffer, 0, data.arrayBuffer);
    }
}
