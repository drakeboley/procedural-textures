/*
 * Shader 3: Fractal Brownian Motion (FBM) & Harmonic Noise
 * Based on The Book of Shaders (Chapter 13)
 * WebGL2 · JavaScript module
 */

export const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const FIELD_SHADER = `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform float uScale;
uniform vec3 uColor;
uniform float uPower;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

#define NUM_OCTAVES 5

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < NUM_OCTAVES; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x / iResolution.y;

  float scale = uScale > 0.1 ? uScale : 4.5;
  vec2 p = st * scale;

  float t = iTime * 0.25;
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + t), fbm(p + vec2(5.2, 1.3) + t));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2)), fbm(p + 4.0 * q + vec2(8.3, 2.8)));

  float f = fbm(p + 4.0 * r);
  f = pow(clamp(f, 0.0, 1.0), uPower > 0.1 ? uPower : 1.8);

  vec3 baseCol = length(uColor) > 0.01 ? uColor : vec3(0.85, 0.35, 0.15);
  vec3 col = mix(vec3(0.05, 0.02, 0.08), baseCol, clamp(f * f * 4.0, 0.0, 1.0));
  col = mix(col, vec3(1.0, 0.85, 0.6), clamp(length(q), 0.0, 1.0) * 0.4);
  col = mix(col, vec3(0.9, 0.2, 0.1), clamp(r.x, 0.0, 1.0) * 0.5);

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export function createShader(canvas, options = {}) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
  if (!gl) throw new Error("WebGL2 is not available");

  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, FIELD_SHADER);
  gl.compileShader(fs);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  const uRes = gl.getUniformLocation(prog, "iResolution");
  const uTime = gl.getUniformLocation(prog, "iTime");
  const uScale = gl.getUniformLocation(prog, "uScale");
  const uColor = gl.getUniformLocation(prog, "uColor");
  const uPower = gl.getUniformLocation(prog, "uPower");

  let animId = null;
  function render(time) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time * 0.001);
    gl.uniform1f(uScale, options.scale || 4.5);
    gl.uniform3fv(uColor, options.color || [0.85, 0.35, 0.15]);
    gl.uniform1f(uPower, options.power || 1.8);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    animId = requestAnimationFrame(render);
  }
  animId = requestAnimationFrame(render);

  return {
    destroy: () => {
      if (animId) cancelAnimationFrame(animId);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    }
  };
}
