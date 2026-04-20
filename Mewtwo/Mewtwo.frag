// Mewtwo.frag
// Mewtwo inspired psychic-energy sphere:
// - 4-color Mewtwo palette cycle (body/tail/psy/aura)
// - diagonal psychic stripes with stable per-band jitter
// - soft center aura glow layered over transition colors
// - metallic/specular tuning for energized surface response
// MAIN-only, no custom uniforms.

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
    float t = fract((vPhaseData.y / 2.0 + uTime) / 240.0);

    float seg  = t * 4.0;          // 4 segments
    float fraq = fract(seg);       // position inside the segment [0,1)
    int   idx  = int(floor(seg));  // segment index (0..3)

    // ===== Mewtwo palette =====
    // Light lavender body
    vec4 body   = vec4(0.890, 0.878, 0.949, 1.0); // #e3e0f2
    // Purple tail
    vec4 tail   = vec4(0.482, 0.173, 0.659, 1.0); // #7b2ca8
    // Magenta psychic glow
    vec4 psy    = vec4(1.0,   0.4,   1.0,   1.0); // #ff66ff
    // Deep purple aura
    vec4 aura   = vec4(0.235, 0.0,   0.427, 1.0); // #3c006d

    // Transition cycle:
    // body -> tail -> psy -> aura -> body ...
    vec4 c0, c1;
    if      (idx == 0) { c0 = body; c1 = tail; }
    else if (idx == 1) { c0 = tail; c1 = psy;  }
    else if (idx == 2) { c0 = psy;  c1 = aura; }
    else               { c0 = aura; c1 = body; }

    // Monotonic easing with zero derivative at the edges
    float w = 0.5 - 0.5 * cos(3.14159265 * fraq);
    vec4 mixColor = mix(c0, c1, w);

    vec2 vUV = UV0;

    // ====== Psychic stripes with jitter ======
    const float stripes   = 10.0;          // slightly fewer stripes than before for a more "fluid" look
    const float phase     = uTime / 240.0; // same long phase
    const float gap       = 0.06;          // gap width
    const float jitterAmp = 0.20;          // subtle jitter

    // diagonal stripes, like crossing psychic waves
    float diagCoord = (vUV.x + vUV.y) * 0.5;
    float baseCoord = diagCoord * stripes + phase;

    float jitter = jitterAmp * stripe_jitter(baseCoord);
    float stripe = step(gap, fract(baseCoord + jitter));

    // ===== Central psychic aura =====
    // Assuming UV in [0,1], create a soft center glow
    float d = distance(vUV, vec2(0.5, 0.5));
    // the closer to the center, the stronger the glow
    float auraFactor = smoothstep(0.7, 0.0, d); // 0 outside, ~1 at the center

    // blend in some "psy" color based on auraFactor
    vec4 auraColor = mix(mixColor, psy, 0.35 * auraFactor);

    // base material intensity, with stripes dimming it slightly
    float stripeBrightness = mix(0.45, 1.0, stripe);

    BASE_COLOR = auraColor * stripeBrightness;

    METALNESS        = 0.6;  // slightly less metallic than the original green
    SPECULAR_AMOUNT  = 0.8;  // strong shine, psychic-energy feel
    ROUGHNESS        = 0.25; // slightly smoother
}
