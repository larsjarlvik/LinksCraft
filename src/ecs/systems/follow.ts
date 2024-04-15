import { Context } from "engine/context";
import { System } from "engine/ecs";
import { Entity } from "engine/ecs";
import { Follow } from "ecs/components/follow";
import { Transform } from "ecs/components/transform";

export class FollowSystem extends System {
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    componentsRequired = new Set<Function>([Follow, Transform]);

    update(entities: Set<Entity>, ctx: Context): void {
        for (const entity of entities) {
            const components = this.ecs.getComponents(entity);
            const transform = components.get(Transform);

            ctx.camera.target = transform.position;
        }
    }
}
