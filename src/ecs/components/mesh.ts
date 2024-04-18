import { Context } from 'engine/context';
import { Component } from 'engine/ecs';
import { Primitive } from 'engine/pipelines/model';
import { GltfAsset } from 'gltf-loader-ts';
import { TextureInfo } from 'gltf-loader-ts/lib/gltf';

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

                Promise.all([
                    this.createBuffer(ctx, asset, p.indices, GPUBufferUsage.INDEX, 'index_buffer'),
                    this.createBuffer(ctx, asset, p.attributes.POSITION, GPUBufferUsage.VERTEX, 'vertex_buffer'),
                    this.createBuffer(ctx, asset, p.attributes.TEXCOORD_0, GPUBufferUsage.VERTEX, 'tex_coord_buffer'),
                    this.createBuffer(ctx, asset, p.attributes.NORMAL, GPUBufferUsage.VERTEX, 'normal_buffer'),
                    this.createTexture(ctx, asset, material.pbrMetallicRoughness.baseColorTexture),
                ]).then(([indexBuffer, positionBuffer, normalBuffer, texCoordBuffer, baseColor]) => {
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

    async createTexture(ctx: Context, asset: GltfAsset, textureInfo?: TextureInfo) {
        const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;

        if (!textureInfo) {
            return ctx.device.createTexture({
                label: 'empty',
                size: [1, 1],
                format: 'rgba8unorm',
                usage,
            });
        }

        const texture = asset.gltf.textures[textureInfo.index];
        const image = await asset.imageData.get(texture.source);
        const gpuTexture = ctx.device.createTexture({
            size: [image.width, image.height, 1],
            format: 'rgba8unorm',
            usage,
        });

        ctx.device.queue.copyExternalImageToTexture({ source: image }, { texture: gpuTexture }, [
            image.width,
            image.height,
        ]);

        return gpuTexture;
    }

    createBuffer = async (ctx: Context, asset: GltfAsset, accessorIndex: number, usage: number, label: string) => {
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
}
