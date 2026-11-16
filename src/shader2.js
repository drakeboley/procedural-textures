/*
 * Shader 2: Voronoi / Worley Cellular Tessellation
 * Based on Steven Worley's Cellular Texture Basis & The Book of Shaders (Chapter 12)
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
uniform float uJitter;
uniform vec3 uColor;
uniform float uPower;
out vec4 fragColor;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

void main() {
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x / iResolution.y;

  float scale = uScale > 0.1 ? uScale : 6.0;
  float jitter = uJitter > 0.0 ? uJitter : 0.85;
  vec2 p = st * scale;
  vec2 i_p = floor(p);
  vec2 f_p = fract(p);

  float m_dist = 1.0;
  float m_dist2 = 1.0;
  vec2 m_point = vec2(0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash2(i_p + neighbor);
      point = 0.5 + 0.5 * sin(iTime * 0.8 + 6.2831 * point * jitter);
      vec2 diff = neighbor + point - f_p;
      float dist = length(diff);

      if (dist < m_dist) {
        m_dist2 = m_dist;
        m_dist = dist;
        m_point = point;
      } else if (dist < m_dist2) {
        m_dist2 = dist;
      }
    }
  }

  // F2 - F1 boundary borders
  float border = smoothstep(0.02, 0.08, m_dist2 - m_dist);
  float cellIntensity = pow(clamp(1.0 - m_dist, 0.0, 1.0), uPower > 0.1 ? uPower : 2.5);

  vec3 baseCol = length(uColor) > 0.01 ? uColor : vec3(0.18, 0.65, 0.85);
  vec3 col = baseCol * cellIntensity * border;
  col += vec3(0.08, 0.12, 0.18) * (1.0 - border);

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
  const uJitter = gl.getUniformLocation(prog, "uJitter");
  const uColor = gl.getUniformLocation(prog, "uColor");
  const uPower = gl.getUniformLocation(prog, "uPower");

  let animId = null;
  function render(time) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time * 0.001);
    gl.uniform1f(uScale, options.scale || 6.0);
    gl.uniform1f(uJitter, options.jitter || 0.85);
    gl.uniform3fv(uColor, options.color || [0.2, 0.6, 0.9]);
    gl.uniform1f(uPower, options.power || 2.2);
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
