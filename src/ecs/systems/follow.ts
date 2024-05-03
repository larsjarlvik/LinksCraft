import { Follow } from 'ecs/components/follow';
import { Transform } from 'ecs/components/transform';
import { Context } from 'engine/context';
import { System, Target } from 'engine/ecs';
import { Entity } from 'engine/ecs';

export class FollowSystem extends System {
    target = Target.Update;
    componentsRequired = new Set<Function>([Follow, Transform]);

    update(entities: Set<Entity>, ctx: Context): void {
        for (const entity of entities) {
            const components = this.ecs.getComponents(entity);
            const transform = components.get(Transform);
            ctx.camera.target = transform.position;
        }
    }
}
