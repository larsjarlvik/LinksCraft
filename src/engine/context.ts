import { ShaderDataDefinitions, makeShaderDataDefinitions } from 'webgpu-utils';
import { fetchShader } from './util/shader';
import { Camera } from './camera';

export class Context {
    public device: GPUDevice;
    public context: GPUCanvasContext;
    public camera: Camera;
    public multisampleTexture: GPUTexture;
    public depthTexture: GPUTexture;
    public pipeline: GPURenderPipeline;
    public pipelineDefs: ShaderDataDefinitions;

    public async init(canvas: HTMLCanvasElement) {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = canvas.getContext('webgpu') as GPUCanvasContext;
        this.camera = new Camera([0, 0, 5], [0, 0, 0]);

        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;

        this.context.configure({
            device: this.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied',
        });

        const shader = await fetchShader('model');
        this.pipelineDefs = makeShaderDataDefinitions(shader.vert);
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.device.createShaderModule({
                    code: shader.vert,
                }),
                buffers: [
                    {
                        arrayStride: 12,
                        stepMode: 'vertex',
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: 'float32x3',
                            },
                        ],
                    },
                ],
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
                topology: 'triangle-list',
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
        });
    }

    public update() {
        const canvasTexture = this.context.getCurrentTexture();
        this.multisampleTexture = this.recreateTargets(this.multisampleTexture, canvasTexture.format);
        this.depthTexture = this.recreateTargets(this.depthTexture, 'depth24plus');
    }

    private recreateTargets(target: GPUTexture, format: GPUTextureFormat) {
        const canvasTexture = this.context.getCurrentTexture();

        if (!target || target.width !== canvasTexture.width || target.height !== canvasTexture.height) {
            if (target) target.destroy();
            return this.device.createTexture({
                format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
                size: [canvasTexture.width, canvasTexture.height],
                sampleCount: 4,
            });
        }

        return target;
    }
}
