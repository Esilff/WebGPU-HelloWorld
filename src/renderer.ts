class Renderer {
    private canvas : HTMLCanvasElement;
    
    private entry: GPU;
    
    private adapter: GPUAdapter;
    private device: GPUDevice;

    private pipeline :GPURenderPipeline;
    
    private context: GPUCanvasContext;

    constructor() {
        
    }

    public async initializeWebGPU(canvas: HTMLCanvasElement) {
        this.canvas = canvas; 
        try {
            this.entry = navigator.gpu;
            if (!this.entry) throw new Error('User agent cannot use Web GPU');
            this.adapter = await this.entry.requestAdapter();
            if (!this.adapter) throw new Error('No adapter found');
            this.device = await this.adapter.requestDevice();
            this.device.lost.then((info) => {
                console.log(`The device cannot be found : ${info.message}`);
                if (info.reason == 'destroyed') this.initializeWebGPU(canvas);
                return false;
            });
            this.onWebGPUInit();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }      
    }   

    private onWebGPUInit() {
        if (this.canvas === null || this.canvas === undefined) throw new Error('No canvas found!');
        
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
                module: this.device.createShaderModule({code: vertexShader}),
                entryPoint: 'main'
            },
            fragment: {
                module: this.device.createShaderModule({code: fragmentShader}),
                entryPoint: 'main',
                targets: [
                    {format: presentationFormat}
                ]
            },
            primitive: {topology: 'triangle-list'},
            layout: 'auto'
        });

    }

    public render() {
        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
               {
                   view: textureView,
                   clearValue: {r:0.0, g:0.0, b:0.0, a:1.0},
                   loadOp: 'clear',
                   storeOp: 'store'
               }
            ]
        }
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.draw(3,1,0,0);
        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(this.render);
    }



    public checkState() {
        console.log('Adapter : ',this.adapter);
        console.log('Device : ',this.device);
    }
}

export default Renderer;