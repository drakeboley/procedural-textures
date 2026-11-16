/*
 * Shader 6: Truchet Labyrinth & Multi-Scale Tilings
 * Based on The Book of Shaders (Chapter 09: Patterns)
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

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 truchetPattern(vec2 _st, float _index) {
  _index = fract(((_index - 0.5) * 2.0));
  if (_index > 0.75) {
    _st = vec2(1.0) - _st;
  } else if (_index > 0.5) {
    _st = vec2(1.0 - _st.x, _st.y);
  } else if (_index > 0.25) {
    _st = 1.0 - vec2(1.0 - _st.x, _st.y);
  }
  return _st;
}

void main() {
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x / iResolution.y;

  float scale = uScale > 0.1 ? uScale : 8.0;
  vec2 ipos = floor(st * scale);
  vec2 fpos = fract(st * scale);

  vec2 tile = truchetPattern(fpos, hash21(ipos));

  float color = 0.0;
  // Maze arcs
  color = step(length(tile), 0.6) - step(length(tile), 0.4);
  color += step(length(tile - vec2(1.0)), 0.6) - step(length(tile - vec2(1.0)), 0.4);

  vec3 baseCol = length(uColor) > 0.01 ? uColor : vec3(0.92, 0.85, 0.45);
  vec3 bgCol = vec3(0.12, 0.14, 0.18);
  vec3 finalColor = mix(bgCol, baseCol, color);

  fragColor = vec4(finalColor, 1.0);
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
    gl.uniform1f(uScale, options.scale || 8.0);
    gl.uniform3fv(uColor, options.color || [0.92, 0.85, 0.45]);
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
