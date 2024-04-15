import type { Context } from "../../engine/context";
import { System } from "../../engine/ecs";
import type { Entity } from "../../engine/ecs";
import type { Shader } from "../../engine/util/shader";
import { Mesh } from "../components/mesh";
import { Transform } from "../components/transform";

export class RenderSystem extends System {
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    componentsRequired = new Set<Function>([Mesh, Transform]);

    constructor(ctx: Context) {
        super();
    }

    update(ctx: Context, entities: Set<Entity>): void {
        const canvasTexture = ctx.context.getCurrentTexture();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: ctx.multisampleTexture.createView(),
                    resolveTarget: canvasTexture.createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: "clear",
                    storeOp: "store",
                } as GPURenderPassColorAttachment,
            ],
        };

        const commandEncoder = ctx.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(ctx.pipeline);

        for (const entity of entities) {
            const components = this.ecs.getComponents(entity);
            const transform = components.get(Transform);

            passEncoder.setBindGroup(0, transform.uniformBindGroup);
            passEncoder.draw(3);
        }

        passEncoder.end();
        ctx.device.queue.submit([commandEncoder.finish()]);
    }
}
