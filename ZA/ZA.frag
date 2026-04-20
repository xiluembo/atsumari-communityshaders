VARYING vec2 vPhaseData;

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

// Stable per-band jitter (anchored to the stripe integer index)
float stripe_jitter(float coord)
{
    // 'coord' is the continuous coordinate before fract; the integer identifies the stripe
    float k = floor(coord);
    // hash in [-0.5, +0.5]
    return hash(vec2(k, 91.32)) - 0.5;
}

void MAIN()
{
    // full 240s cycle => ~60s per transition
    float t = fract((vPhaseData.y / 2 + uTime) / 240.0);

    float seg  = t * 4.0;          // 4 segments
    float fraq = fract(seg);       // position inside the segment [0,1)
    int   idx  = int(floor(seg));  // segment index (0..3)

    vec4 arm     = vec4(0.22, 0.867, 0.106, 1.0);
    vec4 legs    = vec4(0.051, 0.89, 0.376, 1.0);
    vec4 corex   = vec4(0.871, 0.965, 0.0, 1.0);
    vec4 balance = vec4(0.149, 0.796, 0.569, 1.0);

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
 
    vec2 vUV = UV0;

    // ====== Stripes with minimal jitter ======
    const float stripes   = 12.0;          // stripe density
    const float phase     = uTime / 240.0; // same phase used before
    const float gap       = 0.05;          // gap width (step threshold)
    const float jitterAmp = 0.25;          // jitter amplitude as cycle fraction (0.0-0.05 is "minimal")

    // base stripe coordinate (same as your original logic)
    float baseCoord = min(vUV.x, vUV.y) * stripes + phase;

    // subtle per-band offset (time-stable for each band)
    float jitter = jitterAmp * stripe_jitter(baseCoord);

    // apply jitter to phase before fract
    float stripe = step(gap, fract(baseCoord + jitter));

    BASE_COLOR = mixColor * max(stripe, 0.4);

    // BASE_COLOR = mixColor;
    METALNESS = 0.8;
    SPECULAR_AMOUNT = 0.7;
    ROUGHNESS = 0.3;
}

