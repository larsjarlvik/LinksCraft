import { Spin } from 'ecs/components/spin';
import { SpinSystem } from 'ecs/systems/spin';
import { load } from 'engine/util/model';
import { GltfLoader } from 'gltf-loader-ts';
import { Follow } from './ecs/components/follow';
import { Mesh } from './ecs/components/mesh';
import { Transform } from './ecs/components/transform';
import { FollowSystem } from './ecs/systems/follow';
import { RenderSystem } from './ecs/systems/render';
import { Context } from './engine/context';
import { ECS } from './engine/ecs';

(async () => {
    const ecs = new ECS();
    const ctx = new Context();

    const box = await load('box');
    const avocado = await load('avocado');

    await ctx.init(document.getElementById('root') as HTMLCanvasElement);

    ecs.addSystems([new FollowSystem(), new SpinSystem(), new RenderSystem(ctx)]);

    // ecs.addEntity([new Mesh(ctx, box), new Spin(), Transform.fromPosition([2.0, 0, 0])]);
    ecs.addEntity([new Mesh(ctx, avocado), new Spin(), Transform.fromPositionScale([-2.0, 0, 0], 25.0)]);

    const frame = () => {
        ctx.update();
        ecs.update(ctx);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
})();
