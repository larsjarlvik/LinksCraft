import type { Context } from "../../engine/context";
import { System } from "../../engine/ecs";
import type { Entity } from "../../engine/ecs";
import type { Shader } from "../../engine/util/shader";
import { Mesh } from "../components/mesh";
import { Transform } from "../components/transform";

export class TransformSystem extends System {
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    componentsRequired = new Set<Function>([Transform]);

    constructor(ctx: Context) {
        super();
    }

    update(ctx: Context, entities: Set<Entity>): void {
        for (const entity of entities) {
            const components = this.ecs.getComponents(entity);
            const transform = components.get(Transform);
            transform.updateMatrix(ctx);
        }
    }
}
