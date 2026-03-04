import { vertexShaderSource, cellularFragmentShaderSource, blurFragmentShaderSource } from './Shaders';
import type { TextureConfig } from './Config';

interface FBO {
    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
    width: number;
    height: number;
}

export class TextureEngine {
    private gl: WebGLRenderingContext;
    private quadBuffer: WebGLBuffer;
    
    private cellularProgram: WebGLProgram;
    private blurProgram: WebGLProgram;
    
    private cellUniforms: Record<string, WebGLUniformLocation | null> = {};
    private blurUniforms: Record<string, WebGLUniformLocation | null> = {};

    private fboA: FBO | null = null;
    private fboB: FBO | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.gl = canvas.getContext('webgl', { premultipliedAlpha: false })!;
        if (!this.gl) throw new Error("WebGL not supported");

        this.cellularProgram = this.createProgram(vertexShaderSource, cellularFragmentShaderSource);
        this.blurProgram = this.createProgram(vertexShaderSource, blurFragmentShaderSource);
        
        this.quadBuffer = this.setupQuad();
        this.getUniformLocations();
    }

    private compileShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error("Shader compilation failed: " + info);
        }
        return shader;
    }

    private createProgram(vs: string, fs: string): WebGLProgram {
        const program = this.gl.createProgram()!;
        this.gl.attachShader(program, this.compileShader(this.gl.VERTEX_SHADER, vs));
        this.gl.attachShader(program, this.compileShader(this.gl.FRAGMENT_SHADER, fs));
        this.gl.linkProgram(program);
        return program;
    }

    private setupQuad(): WebGLBuffer {
        const vertices = new Float32Array([
            -1, -1,   1, -1,  -1,  1,
            -1,  1,   1, -1,   1,  1
        ]);
        const buffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        return buffer;
    }

    private getUniformLocations() {
        const cellNames = ["u_scale", "u_jitter", "u_color", "u_power", "u_invert", "u_edgeFade", "u_distanceType", "u_multiColor"];
        cellNames.forEach(name => {
            this.cellUniforms[name] = this.gl.getUniformLocation(this.cellularProgram, name);
        });

        const blurNames = ["u_texture", "u_direction", "u_radius"];
        blurNames.forEach(name => {
            this.blurUniforms[name] = this.gl.getUniformLocation(this.blurProgram, name);
        });
    }

    private createFBO(width: number, height: number): FBO {
        const texture = this.gl.createTexture()!;
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

        const framebuffer = this.gl.createFramebuffer()!;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

        return { framebuffer, texture, width, height };
    }

    private resizeFBOs(width: number, height: number) {
        if (this.fboA) {
            this.gl.deleteFramebuffer(this.fboA.framebuffer);
            this.gl.deleteTexture(this.fboA.texture);
        }
        if (this.fboB) {
            this.gl.deleteFramebuffer(this.fboB.framebuffer);
            this.gl.deleteTexture(this.fboB.texture);
        }
        this.fboA = this.createFBO(width, height);
        this.fboB = this.createFBO(width, height);
    }

    private drawQuad(program: WebGLProgram) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
        const positionLoc = this.gl.getAttribLocation(program, "a_position");
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    public render(config: TextureConfig) {
        const { width, height } = config;

        // Ensure canvas and FBOs match requested resolution
        if (this.gl.canvas.width !== width || this.gl.canvas.height !== height) {
            this.gl.canvas.width = width;
            this.gl.canvas.height = height;
            this.resizeFBOs(width, height);
        } else if (!this.fboA || !this.fboB) {
            this.resizeFBOs(width, height);
        }

        this.gl.viewport(0, 0, width, height);

        // --- PASS 1: Generate Cellular Noise into FBO A ---
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fboA!.framebuffer);
        this.gl.useProgram(this.cellularProgram);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.uniform1f(this.cellUniforms["u_scale"], config.scale);
        this.gl.uniform1f(this.cellUniforms["u_jitter"], config.jitter);
        this.gl.uniform3f(this.cellUniforms["u_color"], config.color[0], config.color[1], config.color[2]);
        this.gl.uniform1f(this.cellUniforms["u_power"], config.power);
        this.gl.uniform1f(this.cellUniforms["u_invert"], config.invert ? 1.0 : 0.0);
        this.gl.uniform1f(this.cellUniforms["u_edgeFade"], config.edgeFade);
        this.gl.uniform1f(this.cellUniforms["u_distanceType"], config.distanceType);
        this.gl.uniform1f(this.cellUniforms["u_multiColor"], config.multiColor ? 1.0 : 0.0);

        this.drawQuad(this.cellularProgram);

        // --- PASS 2..N: Ping-Pong Box Blurring ---
        this.gl.useProgram(this.blurProgram);
        this.gl.uniform1i(this.blurUniforms["u_texture"], 0);
        this.gl.uniform1f(this.blurUniforms["u_radius"], config.blurRadius);

        if (config.blurRadius > 0) {
            for (let i = 0; i < config.blurPasses; i++) {
                // Horizontal Pass: Read FBO A, Write FBO B
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fboB!.framebuffer);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.fboA!.texture);
                this.gl.uniform2f(this.blurUniforms["u_direction"], 1.0 / width, 0.0);
                this.drawQuad(this.blurProgram);

                // Vertical Pass: Read FBO B, Write FBO A
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fboA!.framebuffer);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.fboB!.texture);
                this.gl.uniform2f(this.blurUniforms["u_direction"], 0.0, 1.0 / height);
                this.drawQuad(this.blurProgram);
            }
        }

        // --- FINAL PASS: Draw FBO A to the Screen Canvas ---
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); // Unbind FBO (targets canvas)
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.fboA!.texture);
        // Radius 0 bypasses the blur logic entirely, acting as a direct copy shader
        this.gl.uniform1f(this.blurUniforms["u_radius"], 0.0); 
        this.drawQuad(this.blurProgram);
    }
}