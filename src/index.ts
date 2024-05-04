import { Spin } from 'ecs/components/spin';
import { SpinSystem } from 'ecs/systems/spin';
import { load } from 'engine/util/model';
import { Mesh } from './ecs/components/mesh';
import { Transform } from './ecs/components/transform';
import { FollowSystem } from './ecs/systems/follow';
import { RenderSystem } from './ecs/systems/render';
import { Context } from './engine/context';
import { ECS, Target } from './engine/ecs';

(async () => {
    const ecs = new ECS();
    const ctx = new Context();

    try {
        await ctx.init(document.getElementById('root') as HTMLCanvasElement);
    } catch (err) {
        document.writeln(`ERROR: ${err.message}`);
        console.error(err.message);
        return;
    }

    ecs.addSystems([new FollowSystem(), new SpinSystem(), new RenderSystem(ctx)]);

    load('box').then(box => {
        ecs.addEntity([new Mesh(ctx, box), new Spin(), Transform.fromPosition([2.0, 0, 0])]);
    });

    load('avocado').then(avocado => {
        ecs.addEntity([new Mesh(ctx, avocado), new Spin(), Transform.fromPositionScale([-2.0, 0, 0], 25.0)]);
    });

    const frame = () => {
        ctx.update(() => {
            ecs.store();
            ecs.update(ctx, Target.Update);
        });

        ecs.update(ctx, Target.Render);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
})();
