import { Mesh } from "./ecs/components/mesh";
import { Transform } from "./ecs/components/transform";
import { RenderSystem } from "./ecs/systems/render";
import { TransformSystem } from "./ecs/systems/transform";
import { Context } from "./engine/context";
import { ECS } from "./engine/ecs";
import { fetchShader } from "./engine/util/shader";

(async () => {
    const ecs = new ECS();
    const ctx = new Context();

    await ctx.init(document.getElementById("root") as HTMLCanvasElement);

    ecs.addSystem(new TransformSystem(ctx));
    ecs.addSystem(new RenderSystem(ctx));
    ecs.addEntity([new Mesh("Triangle"), new Transform(ctx, [1, 0, 0])]);
    ecs.addEntity([new Mesh("Triangle"), new Transform(ctx, [-1, 0, 0])]);

    const frame = () => {
        ctx.update();
        ecs.update(ctx);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
})();
