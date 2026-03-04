export const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
        v_uv = a_position * 0.5 + 0.5; 
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

export const cellularFragmentShaderSource = `
    precision mediump float;
    
    varying vec2 v_uv;
    
    uniform float u_scale;
    uniform float u_jitter;
    uniform vec3 u_color;
    uniform float u_power;
    uniform float u_invert;
    uniform float u_edgeFade;
    uniform float u_distanceType;
    uniform float u_multiColor;

    vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453);
    }

    void main() {
        vec2 st = v_uv * u_scale;
        vec2 i_st = floor(st);
        vec2 f_st = fract(st);

        float minDist1 = 1.0;
        float minDist2 = 1.0;
        vec2 closestCell; 

        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec2 neighbor = vec2(float(x), float(y));
                vec2 point = hash2(i_st + neighbor);
                point = 0.5 + 0.5 * sin(u_jitter * 6.2831 * point);
                
                vec2 diff = neighbor + point - f_st;
                
                float dist = (u_distanceType < 0.5) 
                    ? length(diff) 
                    : abs(diff.x) + abs(diff.y);

                if (dist < minDist1) {
                    minDist2 = minDist1;
                    minDist1 = dist;
                    closestCell = i_st + neighbor;
                } else if (dist < minDist2) {
                    minDist2 = dist;
                }
            }
        }

        float cellular = 1.0 - (2.0 * minDist1) / (minDist1 + minDist2);
        
        if (u_invert > 0.5) {
            cellular = 1.0 - cellular;
        }
        
        cellular = pow(cellular, u_power);

        float mask = 1.0;
        if (u_edgeFade > 0.001) {
            vec2 centerUv = v_uv * 2.0 - 1.0; 
            float distToCenter = length(centerUv);
            mask = smoothstep(1.0, 1.0 - u_edgeFade, distToCenter);
        }
        
        vec3 finalColor = u_color;
        if (u_multiColor > 0.5) {
            vec3 cellRandom = vec3(
                fract(sin(dot(closestCell, vec2(12.9898, 78.233))) * 43758.5453),
                fract(sin(dot(closestCell, vec2(39.346, 11.135))) * 43758.5453),
                fract(sin(dot(closestCell, vec2(73.156, 52.235))) * 43758.5453)
            );
            finalColor = mix(u_color, cellRandom, 0.85); 
        }
        
        float finalIntensity = cellular * mask;
        gl_FragColor = vec4(finalColor * finalIntensity, finalIntensity);
    }
`;

// A 1D separable Box Blur shader. When ping-ponged multiple times, it approximates a Gaussian blur perfectly.
export const blurFragmentShaderSource = `
    precision mediump float;
    
    varying vec2 v_uv;
    uniform sampler2D u_texture;
    uniform vec2 u_direction; // e.g., vec2(1.0/width, 0.0) for horizontal
    uniform float u_radius;

    void main() {
        if (u_radius == 0.0) {
            gl_FragColor = texture2D(u_texture, v_uv);
            return;
        }

        vec4 color = vec4(0.0);
        float totalWeight = 0.0;
        float r = floor(u_radius);
        
        // WebGL 1.0 requires loops to have constant conditions.
        // We set a max radius of 30 taps in either direction.
        for(int i = -30; i <= 30; i++) {
            float f = float(i);
            if(f >= -r && f <= r) {
                color += texture2D(u_texture, v_uv + f * u_direction);
                totalWeight += 1.0;
            }
        }
        
        gl_FragColor = color / totalWeight;
    }
`;