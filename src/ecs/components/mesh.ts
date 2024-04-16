import { Mat4 } from 'wgpu-matrix';
import { Context } from 'engine/context';
import { Component } from 'engine/ecs';
import { makeStructuredView } from 'webgpu-utils';
import { GltfAsset } from 'gltf-loader-ts';

// TODO: Move to pipeline
interface Uniforms {
    modelMatrix: Mat4;
    viewMatrix: Mat4;
    projectionMatrix: Mat4;
}

// TODO: Move to pipeline
interface Primitive {
    indexBuffer: GPUBuffer;
    positionBuffer: GPUBuffer;
    normalBuffer: GPUBuffer;
    length: number;
    status: 'loading' | 'ready';
}

export const createBuffer = async (
    ctx: Context,
    asset: GltfAsset,
    accessorIndex: number,
    usage: number,
    label: string,
) => {
    const accessor = asset.gltf.accessors[accessorIndex];
    const data = await asset.bufferViewData(accessor.bufferView);
    console.log(label, data);

    const buffer = ctx.device.createBuffer({
        size: data.byteLength,
        mappedAtCreation: true,
        usage: usage | GPUBufferUsage.COPY_DST,
        label,
    });

    buffer.unmap();
    ctx.device.queue.writeBuffer(buffer, 0, data);
    return buffer;
};

export class Mesh extends Component {
    public uniformBuffer: GPUBuffer;
    public uniformBindGroup: GPUBindGroup;
    public primitives: Primitive[] = [];

    constructor(ctx: Context, asset: GltfAsset) {
        super();

        for (const mesh of asset.gltf.meshes) {
            for (const p of mesh.primitives) {
                console.log(asset.gltf.accessors[p.indices].count);
                Promise.all([
                    createBuffer(ctx, asset, p.indices, GPUBufferUsage.INDEX, 'index_buffer'),
                    createBuffer(ctx, asset, p.attributes.POSITION, GPUBufferUsage.VERTEX, 'vertex_buffer'),
                    createBuffer(ctx, asset, p.attributes.NORMAL, GPUBufferUsage.VERTEX, 'normal_buffer'),
                ]).then(([indexBuffer, positionBuffer, normalBuffer]) => {
                    this.primitives.push({
                        indexBuffer,
                        positionBuffer,
                        normalBuffer,
                        length: asset.gltf.accessors[p.indices].count,
                    } as Primitive);
                });
            }
        }

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

    // TODO: Move to pipeline
    public updateUniforms(ctx: Context, uniforms: Uniforms) {
        const data = makeStructuredView(ctx.pipelineDefs.uniforms.uniforms);
        data.set(uniforms);

        ctx.device.queue.writeBuffer(this.uniformBuffer, 0, data.arrayBuffer);
    }
}
