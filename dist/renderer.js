var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Renderer {
    constructor() {
    }
    initializeWebGPU(canvas) {
        return __awaiter(this, void 0, void 0, function* () {
            this.canvas = canvas;
            try {
                this.entry = navigator.gpu;
                if (!this.entry)
                    throw new Error('User agent cannot use Web GPU');
                this.adapter = yield this.entry.requestAdapter();
                if (!this.adapter)
                    throw new Error('No adapter found');
                this.device = yield this.adapter.requestDevice();
                this.device.lost.then((info) => {
                    console.log(`The device cannot be found : ${info.message}`);
                    if (info.reason == 'destroyed')
                        this.initializeWebGPU(canvas);
                    return false;
                });
                this.onWebGPUInit();
                return true;
            }
            catch (error) {
                console.error(error);
                return false;
            }
        });
    }
    onWebGPUInit() {
        if (this.canvas === null || this.canvas === undefined)
            throw new Error('No canvas found!');
        this.context = this.canvas.getContext('webgpu');
        const devicePixelRatio = window.devicePixelRatio || 1;
        //const presentationSize = [this.canvas.clientWidth * devicePixelRatio, this.canvas.clientHeight * devicePixelRatio];
        const presentationFormat = this.entry.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: presentationFormat,
        });
        const vertexShader = `  @stage(vertex)
                                fn main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
                                    var pos = array<vec2<f32>, 3>(
                                        vec2<f32>(0.0,0.5),
                                        vec2<f32>(-0.5,-0.5),
                                        vec2<f32>(0.5,-0.5)
                                    );
                                    return vec4<f32>(pos[VertexIndex],0.0,1.0);
                                }`;
        const fragmentShader = `@stage(fragment)
                                fn main() -> @location(0) vec4<f32> {
                                    return vec4<f32>(1.0,0.0,0.0,1.0);
                                }
                                `;
        this.pipeline = this.device.createRenderPipeline({
            vertex: {
                module: this.device.createShaderModule({ code: vertexShader }),
                entryPoint: 'main'
            },
            fragment: {
                module: this.device.createShaderModule({ code: fragmentShader }),
                entryPoint: 'main',
                targets: [
                    { format: presentationFormat }
                ]
            },
            primitive: { topology: 'triangle-list' },
            layout: 'auto'
        });
    }
    render() {
        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();
        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store'
                }
            ]
        };
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.draw(3, 1, 0, 0);
        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(this.render);
    }
    checkState() {
        console.log('Adapter : ', this.adapter);
        console.log('Device : ', this.device);
    }
}
export default Renderer;
