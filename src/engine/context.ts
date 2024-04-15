import { ShaderDataDefinitions, makeShaderDataDefinitions } from "webgpu-utils";
import { fetchShader } from "./util/shader";
import { Camera } from "./camera";

export class Context {
    public device: GPUDevice;
    public context: GPUCanvasContext;
    public camera: Camera;
    public multisampleTexture: GPUTexture;
    public pipeline: GPURenderPipeline;
    public pipelineDefs: ShaderDataDefinitions;

    public async init(canvas: HTMLCanvasElement) {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = canvas.getContext("webgpu") as GPUCanvasContext;
        this.camera = new Camera([0, 0, 5], [0, 0, 0]);

        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;

        this.context.configure({
            device: this.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: "premultiplied",
        });

        const shader = await fetchShader("triangle");
        this.pipelineDefs = makeShaderDataDefinitions(shader.vert);
        this.pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.device.createShaderModule({
                    code: shader.vert,
                }),
            },
            multisample: {
                count: 4,
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: shader.frag,
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
    }

    public update() {
        const canvasTexture = this.context.getCurrentTexture();

        if (
            !this.multisampleTexture ||
            this.multisampleTexture.width !== canvasTexture.width ||
            this.multisampleTexture.height !== canvasTexture.height
        ) {
            if (this.multisampleTexture) {
                this.multisampleTexture.destroy();
            }

            this.multisampleTexture = this.device.createTexture({
                format: canvasTexture.format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
                size: [canvasTexture.width, canvasTexture.height],
                sampleCount: 4,
            });
        }
    }
}
