import { Spin } from 'ecs/components/spin';
import { Transform } from 'ecs/components/transform';
import { Context } from 'engine/context';
import { System } from 'engine/ecs';
import { Entity } from 'engine/ecs';

export class SpinSystem extends System {
    componentsRequired = new Set<Function>([Transform, Spin]);

    update(entities: Set<Entity>, ctx: Context): void {
        for (const entity of entities) {
            const components = this.ecs.getComponents(entity);
            const transform = components.get(Transform);
            transform.angle += 0.05;
        }
    }
}
