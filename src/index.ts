import { Follow } from "./ecs/components/follow";
import { Mesh } from "./ecs/components/mesh";
import { Transform } from "./ecs/components/transform";
import { FollowSystem } from "./ecs/systems/follow";
import { RenderSystem } from "./ecs/systems/render";
import { Context } from "./engine/context";
import { ECS } from "./engine/ecs";

(async () => {
    const ecs = new ECS();
    const ctx = new Context();

    await ctx.init(document.getElementById("root") as HTMLCanvasElement);

    ecs.addSystems([new FollowSystem(), new RenderSystem(ctx)]);

    ecs.addEntity([new Mesh(ctx, "Triangle"), new Transform([1, 0, 0])]);
    ecs.addEntity([new Mesh(ctx, "Triangle"), new Transform([-1, 0, 0]), new Follow()]);

    const frame = () => {
        ctx.update();
        ecs.update(ctx);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
})();
