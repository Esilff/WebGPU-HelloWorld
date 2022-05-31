import Renderer from "./renderer.js";

main();

async function main() {
    const renderer = new Renderer();
    await renderer.initializeWebGPU(document.querySelector('#gfx'));
    renderer.render();

}



