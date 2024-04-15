const fetchShader = async (name: string) => {
    const response = await fetch(`/shaders/${name}.wgsl`);
    const shader = await response.text();

    const vert = shader.substring(0, shader.indexOf("@fragment"));
    const frag = shader.substring(shader.indexOf("@fragment"));
    return { vert, frag };
};

(async () => {
    const canvas = document.getElementById("root") as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu") as GPUCanvasContext;

    context.configure({
        device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied",
    });

    const triangle = await fetchShader("triangle");
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: triangle.vert,
            }),
        },
        multisample: {
            count: 4,
        },
        fragment: {
            module: device.createShaderModule({
                code: triangle.frag,
            }),
            targets: [
                {
                    format: navigator.gpu.getPreferredCanvasFormat(),
                },
            ],
        },
        primitive: {
            topology: "triangle-list",
        },
    });

    let multisampleTexture: GPUTexture;
    const frame = () => {
        const commandEncoder = device.createCommandEncoder();
        const canvasTexture = context.getCurrentTexture();

        if (
            !multisampleTexture ||
            multisampleTexture.width !== canvasTexture.width ||
            multisampleTexture.height !== canvasTexture.height
        ) {
            if (multisampleTexture) {
                multisampleTexture.destroy();
            }

            multisampleTexture = device.createTexture({
                format: canvasTexture.format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
                size: [canvasTexture.width, canvasTexture.height],
                sampleCount: 4,
            });
        }

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: multisampleTexture.createView(),
                    resolveTarget: canvasTexture.createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: "clear",
                    storeOp: "store",
                } as GPURenderPassColorAttachment,
            ],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.draw(3);
        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
})();
