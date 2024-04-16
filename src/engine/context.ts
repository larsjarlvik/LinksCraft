import { ShaderDataDefinitions, makeShaderDataDefinitions } from 'webgpu-utils';
import { fetchShader } from './util/shader';
import { Camera } from './camera';
import { ModelPipeline } from './pipelines/model';

export class Context {
    public device: GPUDevice;
    public context: GPUCanvasContext;
    public camera: Camera;
    public multisampleTexture: GPUTexture;
    public depthTexture: GPUTexture;
    public modelPipeline: ModelPipeline;

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

        this.modelPipeline = new ModelPipeline(this, await fetchShader('model'));
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
