# WebGL Procedural Texture Generator
A lightning-fast, GPU-accelerated procedural texture generator built with TypeScript and WebGL. 

This tool is designed specifically for game developers and VFX artists who need to generate highly customizable, seamless, and performant textures for particle systems, shields, terrain foundations, and UI elements. Instead of saving massive image files, this tool outputs a lightweight JSON configuration that your game engine can use to reproduce the texture procedurally at runtime.

### Warning: THIS IS A ONE-HOUR AI SLOP!

## 🚀 Features

* **Real-Time GPU Generation:** Harnesses WebGL fragment shaders to calculate per-pixel noise instantly, providing a buttery-smooth UI experience.
* **Cellular / Voronoi Noise:** Generates organic, cell-like structures perfect for cracked earth, scales, water caustics, and magic bubbles.
* **Shape Metrics:** Swap between Euclidean (circular/organic) and Manhattan (diamond/crystalline) distance algorithms. 
* **Advanced Masking:** Built-in edge fading (vignetting) to create perfect alpha-masked particle billboards.
* **Multi-Pass Ping-Pong Blurring:** Implements a highly optimized FBO ping-pong rendering technique to achieve smooth, large-radius blurs without tanking performance. 
* **JSON Export:** Instantly copy the exact mathematical state of your texture to the clipboard for ingestion into your game engine.

## 🧠 Technical Details

This project is inspired by the highly optimized software-rendering techniques used in the demoscene (e.g., Farbrausch's Werkkzeug), but adapted for modern GPU architecture.

Instead of relying on CPU-bound spatial subdivision grids or tree-traversals to find neighboring cells, this generator evaluates the 2nd-order Voronoi diagram completely in parallel within a WebGL Fragment Shader. 

To achieve smooth gradients (approximating a Gaussian blur) without the quadratic cost of a massive 2D convolution kernel, the engine uses **Ping-Pong Framebuffers (FBOs)**. The crisp noise is rendered to an off-screen texture, which is then bounced back and forth between two FBOs—blurring horizontally in one pass, and vertically in the next. Multiple passes result in a buttery-smooth blur at a fraction of the computational cost.

## 💻 Installation & Setup

This project uses **Vite** as its build tool for instant server start and lightning-fast Hot Module Replacement (HMR).

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher recommended)
* NPM or Yarn

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/romland/procedural-textures.git](https://github.com/romland/procedural-textures.git)
   cd procedural-textures

```

2. **Install dependencies:**
```bash
npm install

```


3. **Start the development server:**
```bash
npm run dev

```


*The console will output a local URL (usually `http://localhost:5173`). Open this in your browser to use the tool.*
4. **Build for production:**
```bash
npm run build

```


*This compiles the TypeScript and minifies the assets into the `dist/` folder, ready to be hosted on any static web server.*

## 🎮 How to Use (For Users & Artists)

1. **Tweak the Knobs:** Use the right-hand panel to adjust the resolution and noise parameters.
* **Jitter:** Controls how uniform the grid is. `0` is a perfect grid, `1.0` is highly chaotic.
* **Sharpness (Power):** Increases the contrast of the cell edges.
* **Multi-Color:** Assigns a pseudo-random hash to each cell to generate stained glass or cobblestone variations.


2. **Smooth it Out:** Increase the **Blur Radius** and **Blur Passes** to soften hard edges. This is excellent for creating volumetric smoke or soft magic glows.
3. **Export to Game:** Once you have the perfect texture, click **Copy to Clipboard**.

### Game Engine Integration

This tool is designed to bypass the need to download `.png` files. In your game engine (whether it's a custom WebGL engine, Three.js, or Babylon.js), simply parse the exported JSON:

```json
{
  "width": 512,
  "height": 512,
  "scale": 5.0,
  "jitter": 0.8,
  "color": [0.2, 0.6, 1.0],
  "power": 3.5,
  "invert": false,
  "edgeFade": 0.5,
  "distanceType": 0,
  "multiColor": false,
  "blurRadius": 4,
  "blurPasses": 2
}

```

You can port the `Shaders.ts` and `TextureEngine.ts` classes directly into your engine. Feed this JSON object into the `render()` method during your game's loading screen to generate the texture asset entirely on the player's GPU in milliseconds!

```
