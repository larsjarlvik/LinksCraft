import { Context } from 'engine/context';
import { Component } from 'engine/ecs';
import { Primitive } from 'engine/pipelines/model';
import { GltfAsset } from 'gltf-loader-ts';

export const createBuffer = async (
    ctx: Context,
    asset: GltfAsset,
    accessorIndex: number,
    usage: number,
    label: string,
) => {
    const accessor = asset.gltf.accessors[accessorIndex];
    const data = await asset.bufferViewData(accessor.bufferView);

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
    public primitives: Primitive[] = [];

    constructor(ctx: Context, asset: GltfAsset) {
        super();

        const sampler = ctx.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });

        for (const mesh of asset.gltf.meshes) {
            for (const p of mesh.primitives) {
                const material = asset.gltf.materials[p.material];
                const baseColor = material.pbrMetallicRoughness.baseColorTexture
                    ? asset.gltf.textures[material.pbrMetallicRoughness.baseColorTexture.index]
                    : null;

                Promise.all([
                    createBuffer(ctx, asset, p.indices, GPUBufferUsage.INDEX, 'index_buffer'),
                    createBuffer(ctx, asset, p.attributes.POSITION, GPUBufferUsage.VERTEX, 'vertex_buffer'),
                    createBuffer(ctx, asset, p.attributes.TEXCOORD_0, GPUBufferUsage.VERTEX, 'tex_coord_buffer'),
                    createBuffer(ctx, asset, p.attributes.NORMAL, GPUBufferUsage.VERTEX, 'normal_buffer'),
                    baseColor ? asset.imageData.get(baseColor.source) : null,
                ]).then(([indexBuffer, positionBuffer, normalBuffer, texCoordBuffer, image]) => {
                    const baseColor = ctx.device.createTexture({
                        size: [image.width, image.height, 1],
                        format: 'rgba8unorm',
                        usage:
                            GPUTextureUsage.TEXTURE_BINDING |
                            GPUTextureUsage.COPY_DST |
                            GPUTextureUsage.RENDER_ATTACHMENT,
                    });
                    ctx.device.queue.copyExternalImageToTexture({ source: image }, { texture: baseColor }, [
                        image.width,
                        image.height,
                    ]);

                    const uniformBuffer = ctx.device.createBuffer({
                        size: ctx.modelPipeline.defs.uniforms.uniforms.size,
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    });

                    const uniformBindGroup = ctx.device.createBindGroup({
                        layout: ctx.modelPipeline.pipeline.getBindGroupLayout(0),
                        entries: [
                            {
                                binding: 0,
                                resource: {
                                    buffer: uniformBuffer,
                                },
                            },
                            {
                                binding: 1,
                                resource: sampler,
                            },
                            {
                                binding: 2,
                                resource: baseColor.createView(),
                            },
                        ],
                    });

                    this.primitives.push({
                        indexBuffer,
                        positionBuffer,
                        normalBuffer,
                        texCoordBuffer,
                        baseColor,
                        uniformBuffer,
                        uniformBindGroup,
                        length: asset.gltf.accessors[p.indices].count,
                    } as Primitive);
                });
            }
        }
    }
}
