/*
 * Shader 7: Domain Warping Multi-Frequency Fluid
 * Based on Inigo Quilez & The Book of Shaders (Chapter 14: Domain Warping)
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
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec2(1.7, 3.2);
    a *= 0.5;
  }
  return v;
}

float pattern(vec2 p, out vec2 q, out vec2 r, float t) {
  q.x = fbm(p + vec2(0.0, 0.0) + t * 0.1);
  q.y = fbm(p + vec2(5.2, 1.3) + t * 0.12);

  r.x = fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.15);
  r.y = fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.18);

  return fbm(p + 4.0 * r);
}

void main() {
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x / iResolution.y;

  float scale = uScale > 0.1 ? uScale : 3.5;
  vec2 q, r;
  float f = pattern(st * scale, q, r, iTime);

  vec3 baseCol = length(uColor) > 0.01 ? uColor : vec3(0.15, 0.75, 0.65);
  vec3 col = mix(vec3(0.08, 0.05, 0.12), baseCol, clamp(f * f * 3.5, 0.0, 1.0));
  col = mix(col, vec3(0.9, 0.95, 1.0), clamp(length(q), 0.0, 1.0) * 0.35);
  col = mix(col, vec3(0.2, 0.1, 0.4), clamp(length(r.x), 0.0, 1.0) * 0.5);

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

  let animId = null;
  function render(time) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time * 0.001);
    gl.uniform1f(uScale, options.scale || 3.5);
    gl.uniform3fv(uColor, options.color || [0.15, 0.75, 0.65]);
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
