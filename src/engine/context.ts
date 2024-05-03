import { ShaderDataDefinitions, makeShaderDataDefinitions } from 'webgpu-utils';
import { Camera } from './camera';
import { ModelPipeline } from './pipelines/model';
import { fetchShader } from './util/shader';

// 50 updates per second
export const TIME_STEP = 20;
// Catch up with max 50 ticks per frame
export const MAX_TICKS = 50;

export class Context {
    public device: GPUDevice;
    public context: GPUCanvasContext;
    public camera: Camera;
    public multisampleTexture: GPUTexture;
    public depthTexture: GPUTexture;
    public modelPipeline: ModelPipeline;
    public accumulator: number;

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
        this.accumulator = 0;
    }

    public update(tick: () => void) {
        const canvasTexture = this.context.getCurrentTexture();
        this.multisampleTexture = this.recreateTargets(this.multisampleTexture, canvasTexture.format);
        this.depthTexture = this.recreateTargets(this.depthTexture, 'depth24plus');

        let tickCount = 0;
        while (this.accumulator < performance.now() - TIME_STEP && tickCount < MAX_TICKS) {
            this.accumulator += TIME_STEP;
            tick();
            tickCount++;
        }
    }

    /** Returns the time between previous and current frame */
    public getFrameAlpha() {
        return Math.max(Math.min(1.0, 1.0 - (performance.now() - this.accumulator) / TIME_STEP), 0.0);
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
