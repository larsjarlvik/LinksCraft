import { Context } from 'engine/context';
import { Shader } from 'engine/util/shader';
import { ShaderDataDefinitions, makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import { Mat4 } from 'wgpu-matrix';

export interface Uniforms {
    modelMatrix: Mat4;
    viewMatrix: Mat4;
    projectionMatrix: Mat4;
}

export interface Primitive {
    indexBuffer: GPUBuffer;
    positionBuffer: GPUBuffer;
    normalBuffer: GPUBuffer;
    length: number;
}

export class ModelPipeline {
    public pipeline: GPURenderPipeline;
    public defs: ShaderDataDefinitions;

    constructor(ctx: Context, shader: Shader) {
        this.defs = makeShaderDataDefinitions(shader.vert);
        this.pipeline = ctx.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: ctx.device.createShaderModule({
                    code: shader.vert,
                }),
                buffers: [
                    {
                        arrayStride: 12,
                        stepMode: 'vertex',
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: 'float32x3',
                            },
                        ],
                    },
                ],
            },
            multisample: {
                count: 4,
            },
            fragment: {
                module: ctx.device.createShaderModule({
                    code: shader.frag,
                }),
                targets: [
                    {
                        format: navigator.gpu.getPreferredCanvasFormat(),
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
        });
    }

    public updateUniforms(ctx: Context, buffer: GPUBuffer, uniforms: Uniforms) {
        const data = makeStructuredView(this.defs.uniforms.uniforms);
        data.set(uniforms);

        ctx.device.queue.writeBuffer(buffer, 0, data.arrayBuffer);
    }
}
