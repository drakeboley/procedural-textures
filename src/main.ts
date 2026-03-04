import { state, hexToRgb } from './Config';
import { TextureEngine } from './TextureEngine';

const canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
const engine = new TextureEngine(canvas);

const widthInput = document.getElementById('width') as HTMLInputElement;
const heightInput = document.getElementById('height') as HTMLInputElement;

const scaleInput = document.getElementById('scale') as HTMLInputElement;
const scaleVal = document.getElementById('scale-val') as HTMLSpanElement;

const jitterInput = document.getElementById('jitter') as HTMLInputElement;
const jitterVal = document.getElementById('jitter-val') as HTMLSpanElement;

const powerInput = document.getElementById('power') as HTMLInputElement;
const powerVal = document.getElementById('power-val') as HTMLSpanElement;

const edgeFadeInput = document.getElementById('edgeFade') as HTMLInputElement;
const edgeFadeVal = document.getElementById('edgeFade-val') as HTMLSpanElement;

const blurRadiusInput = document.getElementById('blurRadius') as HTMLInputElement;
const blurRadiusVal = document.getElementById('blurRadius-val') as HTMLSpanElement;

const blurPassesInput = document.getElementById('blurPasses') as HTMLInputElement;
const blurPassesVal = document.getElementById('blurPasses-val') as HTMLSpanElement;

const colorInput = document.getElementById('color') as HTMLInputElement;
const distanceTypeInput = document.getElementById('distanceType') as HTMLSelectElement;
const invertInput = document.getElementById('invert') as HTMLInputElement;
const multiColorInput = document.getElementById('multiColor') as HTMLInputElement;

const jsonOutput = document.getElementById('json-output') as HTMLTextAreaElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;

function update() {
    state.width = parseInt(widthInput.value, 10);
    state.height = parseInt(heightInput.value, 10);
    state.scale = parseFloat(scaleInput.value);
    state.jitter = parseFloat(jitterInput.value);
    state.color = hexToRgb(colorInput.value);
    state.power = parseFloat(powerInput.value);
    state.edgeFade = parseFloat(edgeFadeInput.value);
    state.blurRadius = parseInt(blurRadiusInput.value, 10);
    state.blurPasses = parseInt(blurPassesInput.value, 10);
    state.distanceType = parseInt(distanceTypeInput.value);
    state.invert = invertInput.checked;
    state.multiColor = multiColorInput.checked;

    scaleVal.innerText = state.scale.toFixed(1);
    jitterVal.innerText = state.jitter.toFixed(2);
    powerVal.innerText = state.power.toFixed(1);
    edgeFadeVal.innerText = state.edgeFade.toFixed(2);
    blurRadiusVal.innerText = state.blurRadius.toString();
    blurPassesVal.innerText = state.blurPasses.toString();

    jsonOutput.value = JSON.stringify(state, null, 2);
    engine.render(state);
}

widthInput.addEventListener('change', update);
heightInput.addEventListener('change', update);
scaleInput.addEventListener('input', update);
jitterInput.addEventListener('input', update);
powerInput.addEventListener('input', update);
edgeFadeInput.addEventListener('input', update);
blurRadiusInput.addEventListener('input', update);
blurPassesInput.addEventListener('input', update);
colorInput.addEventListener('input', update);
distanceTypeInput.addEventListener('change', update);
invertInput.addEventListener('change', update);
multiColorInput.addEventListener('change', update);

copyBtn.addEventListener('click', () => {
    jsonOutput.select();
    document.execCommand('copy');
    copyBtn.innerText = "Copied!";
    setTimeout(() => copyBtn.innerText = "Copy to Clipboard", 2000);
});

update();