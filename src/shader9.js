/*
 * Shader 9: CRT Retro Phosphor Grid & Scanlines
 * Based on The Book of Shaders (Chapter 07: Shapes & Chapter 09: Patterns)
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

vec2 curve(vec2 uv) {
  uv = (uv - 0.5) * 2.0;
  uv *= 1.1;
  uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
  uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
  uv  = (uv / 2.0) + 0.5;
  uv =  uv * 0.92 + 0.04;
  return uv;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 curvedUV = curve(uv);

  if (curvedUV.x < 0.0 || curvedUV.x > 1.0 || curvedUV.y < 0.0 || curvedUV.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float scale = uScale > 0.1 ? uScale : 180.0;
  // Scanlines
  float scanline = sin(curvedUV.y * scale + iTime * 5.0) * 0.5 + 0.5;
  scanline = pow(scanline, 1.5) * 0.4 + 0.6;

  // RGB shadow mask triad
  float triad = floor(mod(gl_FragCoord.x, 3.0));
  vec3 mask = vec3(0.3);
  if (triad < 0.5) mask.r = 1.0;
  else if (triad < 1.5) mask.g = 1.0;
  else mask.b = 1.0;

  // Dynamic beam color
  vec3 baseCol = length(uColor) > 0.01 ? uColor : vec3(0.2, 0.95, 0.4);
  vec3 col = baseCol * scanline * mask;

  // Vignette
  float vig = (16.0 * curvedUV.x * curvedUV.y * (1.0 - curvedUV.x) * (1.0 - curvedUV.y));
  col *= clamp(pow(vig, 0.25), 0.0, 1.0);

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
    gl.uniform1f(uScale, options.scale || 180.0);
    gl.uniform3fv(uColor, options.color || [0.2, 0.95, 0.4]);
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
