import { load } from 'engine/util/model';
import { Follow } from './ecs/components/follow';
import { Mesh } from './ecs/components/mesh';
import { Transform } from './ecs/components/transform';
import { FollowSystem } from './ecs/systems/follow';
import { RenderSystem } from './ecs/systems/render';
import { Context } from './engine/context';
import { ECS } from './engine/ecs';
import { GltfLoader } from 'gltf-loader-ts';

(async () => {
    const ecs = new ECS();
    const ctx = new Context();

    const box = await load('box');

    await ctx.init(document.getElementById('root') as HTMLCanvasElement);

    ecs.addSystems([new FollowSystem(), new RenderSystem(ctx)]);

    ecs.addEntity([new Mesh(ctx, box), new Transform([0, 0, 0])]);

    const frame = () => {
        ctx.update();
        ecs.update(ctx);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
})();
