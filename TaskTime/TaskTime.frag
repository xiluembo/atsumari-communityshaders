// TaskTime.frag
// Task Time palette sphere:
// - 4-color primary cycle (red, green, blue, yellow)
// - smooth 60-second transitions over a 240-second loop
// - metallic specular response held constant
// MAIN-only, no custom uniforms.

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

void MAIN()
{
    // full 240s cycle => ~60s per transition
    float t = fract(uTime / 240.0);

    float seg  = t * 4.0;          // 4 segments
    float fraq = fract(seg);       // position inside the segment [0,1)
    int   idx  = int(floor(seg));  // segment index (0..3)

    vec4 arm     = vec4(1, 0, 0, 1.0);
    vec4 legs    = vec4(0, 1, 0, 1.0);
    vec4 corex   = vec4(0, 0, 1, 1.0);
    vec4 balance = vec4(1, 1, 0, 1.0);

    vec4 c0, c1;
    if      (idx == 0) { c0 = arm;     c1 = legs;    }
    else if (idx == 1) { c0 = legs;    c1 = corex;   }
    else if (idx == 2) { c0 = corex;   c1 = balance; }
    else               { c0 = balance; c1 = arm;     }

    // Monotonic easing with zero derivative at the edges
    // w = 0 -> c0 | w = 1 -> c1
    float w = 0.5 - 0.5 * cos(3.14159265 * fraq);
    // alternative: float w = smoothstep(0.0, 1.0, fraq);

    vec4 mixColor = mix(c0, c1, w);

    BASE_COLOR = mixColor;
    METALNESS = 0.6;
    SPECULAR_AMOUNT = 0.4;
    ROUGHNESS = 0.4;
}
