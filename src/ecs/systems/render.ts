import { Mesh } from 'ecs/components/mesh';
import { Transform } from 'ecs/components/transform';
import { Context } from 'engine/context';
import { System } from 'engine/ecs';
import { Entity } from 'engine/ecs';
import { mat3, mat4 } from 'wgpu-matrix';

export class RenderSystem extends System {
    componentsRequired = new Set<Function>([Mesh, Transform]);

    constructor(ctx: Context) {
        super();
    }

    update(entities: Set<Entity>, ctx: Context): void {
        const canvasTexture = ctx.context.getCurrentTexture();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: ctx.multisampleTexture.createView(),
                    resolveTarget: canvasTexture.createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                } as GPURenderPassColorAttachment,
            ],
            depthStencilAttachment: {
                view: ctx.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };

        const commandEncoder = ctx.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        const aspect = ctx.context.canvas.width / ctx.context.canvas.height;

        passEncoder.setPipeline(ctx.modelPipeline.pipeline);

        for (const entity of entities) {
            const components = this.ecs.getComponents(entity);
            const mesh = components.get(Mesh);
            const transform = components.get(Transform);

            ctx.modelPipeline.updateUniforms(ctx, mesh.uniformBuffer, {
                modelMatrix: mat4.rotate(
                    mat4.scale(mat4.translation(transform.position), transform.scale),
                    transform.rotation,
                    transform.angle,
                ),
                viewMatrix: mat4.lookAt(ctx.camera.eye, ctx.camera.target, [0, 1, 0]),
                projectionMatrix: mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0),
            });

            passEncoder.setBindGroup(0, mesh.uniformBindGroup);

            for (const primitive of mesh.primitives) {
                passEncoder.setVertexBuffer(0, primitive.positionBuffer);
                passEncoder.setVertexBuffer(1, primitive.normalBuffer);
                passEncoder.setIndexBuffer(primitive.indexBuffer, 'uint16');
                passEncoder.drawIndexed(primitive.length);
            }
        }

        passEncoder.end();
        ctx.device.queue.submit([commandEncoder.finish()]);
    }
}
